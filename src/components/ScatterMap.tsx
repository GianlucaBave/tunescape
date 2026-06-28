"use client";

import { useMemo, useEffect, useState } from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import { OrthographicView, type OrthographicViewState } from "@deck.gl/core";
import { useStore } from "@/lib/store";
import type { Artist } from "@/lib/types";

const BG_COLOR: [number, number, number] = [60, 60, 70];           // catalog dot
const LISTENED_COLOR: [number, number, number] = [96, 165, 250];   // user history (blue)
const REC_COLOR: [number, number, number] = [251, 113, 133];       // recommendations (pink/red)
const HIGHLIGHT_LINE: [number, number, number, number] = [251, 113, 133, 180];

// Convert "#rrggbb" → [r, g, b].
function hexToRgb(h: string): [number, number, number] {
  const v = parseInt(h.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function ScatterMap() {
  const data = useStore((s) => s.data);
  const view = useStore((s) => s.view);
  const selectedUserId = useStore((s) => s.selectedUserId);
  const selectedModel = useStore((s) => s.selectedModel);
  const setHovered = useStore((s) => s.setHovered);
  const setSelectedArtist = useStore((s) => s.setSelectedArtist);

  const [viewState, setViewState] = useState<OrthographicViewState>({
    target: [0, 0, 0],
    zoom: 4,
  });

  // Re-centre the camera when projection, user or model changes. We always
  // try to fit the bounding box of (listened ∪ recommendations) so the
  // user-relevant action stays in frame. If no user is selected, fall back
  // to the full-catalog bounding box.
  useEffect(() => {
    if (!data) return;
    const key = view === "behaviour" ? "xy_b" : "xy_c";
    const user = data.users.find((u) => u.id === selectedUserId) ?? null;
    const recs = user?.recs[selectedModel] ?? [];
    const focusIds = new Set<number>([...(user?.listened ?? []), ...recs]);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const accumulate = (xy: [number | null, number | null]) => {
      if (xy[0] == null || xy[1] == null) return;
      if (xy[0] < minX) minX = xy[0];
      if (xy[0] > maxX) maxX = xy[0];
      if (xy[1] < minY) minY = xy[1];
      if (xy[1] > maxY) maxY = xy[1];
    };
    if (focusIds.size > 0) {
      for (const a of data.artists) {
        if (focusIds.has(a.id)) accumulate(a[key] as [number | null, number | null]);
      }
    }
    if (!Number.isFinite(minX)) {
      // Either no user or no valid focus points — fit the whole catalog.
      for (const a of data.artists) accumulate(a[key] as [number | null, number | null]);
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const span = Math.max(maxX - minX, maxY - minY, 1);
    // Zoom heuristic: ScatterMap uses an orthographic view; zoom z fits
    // ~2^(8-z) world units across the viewport. Pick z so the focus box
    // occupies ~60% of the viewport.
    const zoom = Math.max(3, Math.min(8, Math.log2(60 / span) + 5));
    setViewState((s) => ({ ...s, target: [cx, cy, 0], zoom }));
  }, [data, view, selectedUserId, selectedModel]);

  const layers = useMemo(() => {
    if (!data) return [];
    const key = view === "behaviour" ? "xy_b" : "xy_c";
    const user = data.users.find((u) => u.id === selectedUserId) ?? null;
    const listenedSet = new Set(user?.listened ?? []);
    const recs = user?.recs[selectedModel] ?? [];
    const recSet = new Set(recs);
    const clusterColor = (cId: number): [number, number, number] => {
      if (cId < 0) return BG_COLOR;
      const c = data.clusters[cId];
      return c ? hexToRgb(c.color) : BG_COLOR;
    };

    // Skip artists with no coords in the active projection.
    const visible = data.artists.filter((a) => {
      const xy = a[key] as [number | null, number | null];
      return xy[0] != null && xy[1] != null;
    });

    // 1) Catalog: all artists, dim, coloured by cluster.
    const catalogLayer = new ScatterplotLayer<Artist>({
      id: `catalog-${view}`,
      data: visible,
      getPosition: (a) => {
        const xy = a[key] as [number, number];
        return [xy[0], xy[1], 0];
      },
      getFillColor: (a) => {
        const base = clusterColor(a.cluster);
        const isListened = listenedSet.has(a.id);
        const isRec = recSet.has(a.id);
        if (isRec || isListened) return [40, 40, 50]; // hide under the highlights
        return base;
      },
      getRadius: 1.6,
      radiusUnits: "pixels",
      opacity: 0.45,
      pickable: true,
      onHover: (info) => setHovered(info.object ? (info.object as Artist).id : null),
      onClick: (info) => {
        if (info.object) setSelectedArtist((info.object as Artist).id);
      },
      updateTriggers: {
        getFillColor: [selectedUserId, selectedModel],
      },
    });

    // 2) Listened artists: bright blue, larger.
    const listenedArtists = visible.filter((a) => listenedSet.has(a.id) && !recSet.has(a.id));
    const listenedLayer = new ScatterplotLayer<Artist>({
      id: `listened-${view}`,
      data: listenedArtists,
      getPosition: (a) => {
        const xy = a[key] as [number, number];
        return [xy[0], xy[1], 0];
      },
      getFillColor: () => LISTENED_COLOR,
      getRadius: 3.5,
      radiusUnits: "pixels",
      stroked: true,
      getLineColor: [200, 220, 255, 200],
      lineWidthUnits: "pixels",
      getLineWidth: 0.5,
      pickable: true,
      onHover: (info) => setHovered(info.object ? (info.object as Artist).id : null),
      onClick: (info) => {
        if (info.object) setSelectedArtist((info.object as Artist).id);
      },
    });

    // 3) Recommendations: pink/red, even larger, with outline + lines from centroid.
    const recArtists = visible.filter((a) => recSet.has(a.id));
    const recLayer = new ScatterplotLayer<Artist>({
      id: `recs-${view}`,
      data: recArtists,
      getPosition: (a) => {
        const xy = a[key] as [number, number];
        return [xy[0], xy[1], 0];
      },
      getFillColor: () => REC_COLOR,
      getRadius: 5,
      radiusUnits: "pixels",
      stroked: true,
      getLineColor: [255, 255, 255, 230],
      lineWidthUnits: "pixels",
      getLineWidth: 1,
      pickable: true,
      onHover: (info) => setHovered(info.object ? (info.object as Artist).id : null),
      onClick: (info) => {
        if (info.object) setSelectedArtist((info.object as Artist).id);
      },
    });

    const result: (ScatterplotLayer | LineLayer)[] = [catalogLayer, listenedLayer, recLayer];

    // 4) Lines from user centroid → each rec (only if user is selected).
    if (user) {
      const centroid = (view === "behaviour" ? user.centroid_b : user.centroid_c) as
        [number | null, number | null];
      if (centroid[0] != null && centroid[1] != null) {
        const validRecs = recArtists.filter((a) => {
          const xy = a[key] as [number | null, number | null];
          return xy[0] != null && xy[1] != null;
        });
        const lineLayer = new LineLayer<Artist>({
          id: `rec-lines-${view}`,
          data: validRecs,
          getSourcePosition: () => [centroid[0]!, centroid[1]!, 0],
          getTargetPosition: (a) => {
            const xy = a[key] as [number, number];
            return [xy[0], xy[1], 0];
          },
          getColor: HIGHLIGHT_LINE,
          getWidth: 1,
          widthUnits: "pixels",
        });
        result.push(lineLayer);
      }
    }
    return result;
  }, [data, view, selectedUserId, selectedModel, setHovered, setSelectedArtist]);

  if (!data) return null;
  return (
    <DeckGL
      views={new OrthographicView({ id: "ortho", controller: true })}
      viewState={viewState}
      onViewStateChange={({ viewState: vs }) =>
        setViewState(vs as OrthographicViewState)
      }
      controller
      layers={layers}
      style={{ position: "absolute", inset: "0" }}
      getCursor={({ isDragging }) => (isDragging ? "grabbing" : "grab")}
    />
  );
}
