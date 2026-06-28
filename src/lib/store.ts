"use client";

import { create } from "zustand";
import type { Dataset, MapView } from "./types";

type State = {
  data: Dataset | null;
  selectedUserId: number | null;
  selectedModel: string;
  hoveredArtistId: number | null;
  selectedArtistId: number | null;
  view: MapView;

  setData: (d: Dataset) => void;
  setUser: (id: number | null) => void;
  setModel: (m: string) => void;
  setHovered: (id: number | null) => void;
  setSelectedArtist: (id: number | null) => void;
  setView: (v: MapView) => void;
};

export const useStore = create<State>((set) => ({
  data: null,
  selectedUserId: null,
  selectedModel: "hybrid",
  hoveredArtistId: null,
  selectedArtistId: null,
  view: "behaviour",
  setData: (d) =>
    set({
      data: d,
      // Pick the first user by default so the map is never empty.
      selectedUserId: d.users[0]?.id ?? null,
    }),
  setUser: (id) => set({ selectedUserId: id, selectedArtistId: null }),
  setModel: (m) => set({ selectedModel: m }),
  setHovered: (id) => set({ hoveredArtistId: id }),
  setSelectedArtist: (id) => set({ selectedArtistId: id }),
  setView: (v) => set({ view: v }),
}));
