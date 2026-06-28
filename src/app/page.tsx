"use client";

import { useEffect } from "react";
import { ScatterMap } from "@/components/ScatterMap";
import { Sidebar } from "@/components/Sidebar";
import { HoverTooltip } from "@/components/HoverTooltip";
import { Legend } from "@/components/Legend";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useStore } from "@/lib/store";
import type { Dataset } from "@/lib/types";

export default function Home() {
  const setData = useStore((s) => s.setData);
  const data = useStore((s) => s.data);

  useEffect(() => {
    fetch("/lastfm_data.json")
      .then((r) => r.json())
      .then((d: Dataset) => setData(d));
  }, [setData]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-950">
      <Sidebar />
      <main className="relative flex-1">
        {data ? (
          <>
            <ScatterMap />
            <Legend />
            <HoverTooltip />
            <AudioPlayer />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            Loading {(3.1).toFixed(1)} MB of artist embeddings…
          </div>
        )}
      </main>
    </div>
  );
}
