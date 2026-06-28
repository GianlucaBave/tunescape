"use client";

import { useStore } from "@/lib/store";

export function Legend() {
  const data = useStore((s) => s.data);
  if (!data) return null;
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 max-w-[220px] rounded-lg border border-white/10 bg-neutral-950/80 p-3 text-xs text-neutral-200 backdrop-blur">
      <div className="mb-2 font-medium uppercase tracking-wider text-neutral-400">
        Genre clusters
      </div>
      <ul className="space-y-1">
        {data.clusters.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: c.color }}
            />
            <span className="capitalize">{c.label.replace(/_/g, " ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
