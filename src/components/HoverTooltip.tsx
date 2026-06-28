"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function HoverTooltip() {
  const hoveredId = useStore((s) => s.hoveredArtistId);
  const data = useStore((s) => s.data);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!data || hoveredId == null) return null;
  const a = data.artists.find((x) => x.id === hoveredId);
  if (!a) return null;
  const cluster = a.cluster >= 0 ? data.clusters[a.cluster] : null;

  return (
    <div
      className="pointer-events-none fixed z-50 min-w-[180px] rounded-lg border border-white/10 bg-neutral-900/95 px-3 py-2 text-xs text-neutral-100 shadow-xl backdrop-blur"
      style={{ left: pos.x + 14, top: pos.y + 14 }}
    >
      <div className="text-sm font-semibold">{a.name}</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {a.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-neutral-300"
          >
            {t}
          </span>
        ))}
      </div>
      {cluster && (
        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-400">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: cluster.color }}
          />
          {cluster.label}
        </div>
      )}
      <div className="mt-1 text-[10px] tabular-nums text-neutral-500">
        {a.playcount.toLocaleString()} plays
      </div>
    </div>
  );
}
