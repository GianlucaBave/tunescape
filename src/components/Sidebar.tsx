"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { MODEL_LABELS, type Artist } from "@/lib/types";

export function Sidebar() {
  const data = useStore((s) => s.data);
  const selectedUserId = useStore((s) => s.selectedUserId);
  const selectedModel = useStore((s) => s.selectedModel);
  const view = useStore((s) => s.view);
  const setUser = useStore((s) => s.setUser);
  const setModel = useStore((s) => s.setModel);
  const setView = useStore((s) => s.setView);
  const setSelectedArtist = useStore((s) => s.setSelectedArtist);
  const selectedArtistId = useStore((s) => s.selectedArtistId);

  const [listenedQuery, setListenedQuery] = useState("");

  const user = useMemo(
    () => data?.users.find((u) => u.id === selectedUserId) ?? null,
    [data, selectedUserId],
  );

  const artistById = useMemo(() => {
    if (!data) return new Map<number, Artist>();
    return new Map(data.artists.map((a) => [a.id, a]));
  }, [data]);

  if (!data) {
    return (
      <aside className="w-80 shrink-0 border-r border-white/10 bg-neutral-950 p-6 text-sm text-neutral-300">
        Loading…
      </aside>
    );
  }

  const listenedArtists =
    user?.listened
      .map((id) => artistById.get(id))
      .filter((a): a is NonNullable<typeof a> => Boolean(a))
      .sort((a, b) => b.playcount - a.playcount) ?? [];

  const recs = (user?.recs[selectedModel] ?? [])
    .map((id) => artistById.get(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const filteredListened = listenedQuery
    ? listenedArtists.filter((a) =>
        a.name.toLowerCase().includes(listenedQuery.toLowerCase()),
      )
    : listenedArtists;

  return (
    <aside className="z-10 flex h-screen w-[360px] shrink-0 flex-col gap-4 border-r border-white/10 bg-neutral-950 p-5 text-neutral-100">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Tunescape</h1>
        <p className="text-xs text-neutral-400">
          Music recommender atlas · Recommender Systems
        </p>
      </header>

      {/* View toggle */}
      <div className="flex rounded-lg border border-white/10 p-1 text-xs">
        <button
          className={`flex-1 rounded-md px-3 py-1.5 transition ${
            view === "behaviour"
              ? "bg-white text-neutral-900"
              : "text-neutral-300 hover:bg-white/5"
          }`}
          onClick={() => setView("behaviour")}
        >
          Behavioural map
        </button>
        <button
          className={`flex-1 rounded-md px-3 py-1.5 transition ${
            view === "content"
              ? "bg-white text-neutral-900"
              : "text-neutral-300 hover:bg-white/5"
          }`}
          onClick={() => setView("content")}
        >
          Content map
        </button>
      </div>
      <p className="-mt-2 text-[11px] leading-snug text-neutral-500">
        {view === "behaviour"
          ? "UMAP of MF item factors — co-listened artists end up close."
          : "UMAP of TF-IDF on tags — artists with similar genres end up close."}
      </p>

      {/* User dropdown */}
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          User
        </label>
        <select
          value={selectedUserId ?? ""}
          onChange={(e) => setUser(Number(e.target.value))}
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-sm focus:border-white/30 focus:outline-none"
        >
          {data.users.map((u) => (
            <option key={u.id} value={u.id}>
              User #{u.id} · {u.n_listened} artists
            </option>
          ))}
        </select>
      </div>

      {/* Algorithm dropdown */}
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Algorithm
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-sm focus:border-white/30 focus:outline-none"
        >
          {data.meta.models.map((m) => (
            <option key={m} value={m}>
              {MODEL_LABELS[m] ?? m}
            </option>
          ))}
        </select>
      </div>

      {/* Recommendations */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Top-10 recommendations
          </h2>
          <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-[10px] font-medium text-pink-300">
            ★ pink dots
          </span>
        </div>
        <ol className="space-y-1 text-sm">
          {recs.map((a, i) => (
            <li key={a.id}>
              <button
                onClick={() => setSelectedArtist(a.id)}
                className={`flex w-full items-baseline gap-2 rounded-md px-2 py-1 text-left transition hover:bg-white/5 ${
                  selectedArtistId === a.id ? "bg-pink-500/10" : ""
                }`}
              >
                <span className="w-5 text-right text-xs tabular-nums text-neutral-500">
                  {i + 1}.
                </span>
                <span className="flex-1 truncate">{a.name}</span>
                {a.tags[0] && (
                  <span className="shrink-0 text-[10px] text-neutral-500">
                    {a.tags[0]}
                  </span>
                )}
              </button>
            </li>
          ))}
          {recs.length === 0 && (
            <li className="text-xs text-neutral-500">No recommendations.</li>
          )}
        </ol>
      </section>

      {/* Listened */}
      <section className="flex min-h-0 flex-1 flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Listening history ({listenedArtists.length})
          </h2>
          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-300">
            blue dots
          </span>
        </div>
        <input
          value={listenedQuery}
          onChange={(e) => setListenedQuery(e.target.value)}
          placeholder="Filter…"
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-1.5 text-xs focus:border-white/30 focus:outline-none"
        />
        <ul className="min-h-0 flex-1 overflow-y-auto pr-1 text-sm">
          {filteredListened.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => setSelectedArtist(a.id)}
                className={`flex w-full items-baseline gap-2 rounded-md px-2 py-1 text-left text-neutral-300 transition hover:bg-white/5 ${
                  selectedArtistId === a.id ? "bg-blue-500/10" : ""
                }`}
              >
                <span className="flex-1 truncate">{a.name}</span>
                <span className="shrink-0 text-[10px] tabular-nums text-neutral-500">
                  {a.playcount.toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
