"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

type DeezerResult = {
  title: string;
  preview: string;
  artist: { name: string };
  album: { title: string; cover_small: string };
};

type State =
  | { kind: "idle" }
  | { kind: "loading"; artistName: string }
  | { kind: "ready"; artistName: string; track: DeezerResult }
  | { kind: "no-match"; artistName: string }
  | { kind: "error"; artistName: string };

// Simple in-memory cache so we don't hit Deezer twice for the same artist.
const cache = new Map<number, State>();

export function AudioPlayer() {
  const selectedArtistId = useStore((s) => s.selectedArtistId);
  const setSelectedArtist = useStore((s) => s.setSelectedArtist);
  const data = useStore((s) => s.data);
  const [state, setState] = useState<State>({ kind: "idle" });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (selectedArtistId == null || !data) {
      setState({ kind: "idle" });
      return;
    }
    const artist = data.artists.find((a) => a.id === selectedArtistId);
    if (!artist) return;

    const hit = cache.get(selectedArtistId);
    if (hit) {
      setState(hit);
      return;
    }

    setState({ kind: "loading", artistName: artist.name });
    // Plain query (no `artist:` filter): Deezer's `artist:"foo"` filter is
    // broken for short common-word artists like "The Who" and returns junk.
    // Fetching 10 results lets us pick the right one by post-filtering on
    // exact artist name match.
    const url =
      `https://api.deezer.com/search?q=${encodeURIComponent(
        artist.name,
      )}&limit=10&output=jsonp&callback=deezerCallback_${selectedArtistId}`;

    // Deezer's public API doesn't send CORS headers, so we use JSONP.
    const cbName = `deezerCallback_${selectedArtistId}`;
    const cleanup = () => {
      delete (window as unknown as Record<string, unknown>)[cbName];
      const s = document.getElementById(`deezer-${selectedArtistId}`);
      s?.remove();
    };

    (window as unknown as Record<string, (resp: { data: DeezerResult[] }) => void>)[cbName] =
      (resp) => {
        const wanted = artist.name.toLowerCase().trim();
        // Prefer an exact artist-name match; only fall back to the first
        // result if nothing matches exactly.
        const exact = resp.data?.find(
          (t) => t.artist?.name?.toLowerCase().trim() === wanted && t.preview,
        );
        const track = exact ?? resp.data?.find((t) => t.preview);
        let next: State;
        if (track?.preview) {
          next = { kind: "ready", artistName: artist.name, track };
        } else {
          next = { kind: "no-match", artistName: artist.name };
        }
        cache.set(selectedArtistId, next);
        setState(next);
        cleanup();
      };

    const script = document.createElement("script");
    script.id = `deezer-${selectedArtistId}`;
    script.src = url;
    script.onerror = () => {
      const next: State = { kind: "error", artistName: artist.name };
      cache.set(selectedArtistId, next);
      setState(next);
      cleanup();
    };
    document.head.appendChild(script);
    return cleanup;
  }, [selectedArtistId, data]);

  // Auto-play whenever a new track is loaded.
  useEffect(() => {
    if (state.kind === "ready" && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Browsers can block autoplay before user interaction — that's fine,
        // the play button still works.
      });
    }
  }, [state]);

  if (state.kind === "idle") return null;

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 w-[440px] max-w-[90vw] -translate-x-1/2 rounded-xl border border-white/10 bg-neutral-900/95 p-3 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3">
        {state.kind === "ready" && state.track.album.cover_small ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.track.album.cover_small}
            alt=""
            className="size-12 rounded-md"
          />
        ) : (
          <div className="size-12 shrink-0 rounded-md bg-white/5" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-neutral-100">
            {state.artistName}
          </div>
          {state.kind === "ready" && (
            <div className="truncate text-xs text-neutral-400">
              {state.track.title} · {state.track.album.title}
            </div>
          )}
          {state.kind === "loading" && (
            <div className="text-xs text-neutral-500">Looking up preview…</div>
          )}
          {state.kind === "no-match" && (
            <div className="text-xs text-amber-400/80">
              No 30s preview on Deezer
            </div>
          )}
          {state.kind === "error" && (
            <div className="text-xs text-red-400/80">Deezer request failed</div>
          )}
        </div>
        <button
          onClick={() => setSelectedArtist(null)}
          className="rounded-md px-2 py-1 text-neutral-400 hover:bg-white/5"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      {state.kind === "ready" && (
        <audio
          ref={audioRef}
          src={state.track.preview}
          controls
          className="mt-2 h-9 w-full"
        />
      )}
    </div>
  );
}
