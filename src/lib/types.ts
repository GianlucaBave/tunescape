export type Cluster = {
  id: number;
  label: string;
  color: string;
};

export type Artist = {
  id: number;
  name: string;
  tags: string[];
  playcount: number;
  cluster: number;
  xy_b: [number, number];
  xy_c: [number, number] | [null, null];
};

export type User = {
  id: number;
  n_listened: number;
  listened: number[];
  centroid_b: [number, number];
  centroid_c: [number, number] | [null, null];
  recs: Record<string, number[]>;
};

export type Dataset = {
  meta: {
    generated_at: string;
    n_artists: number;
    n_users: number;
    models: string[];
  };
  clusters: Cluster[];
  artists: Artist[];
  users: User[];
};

export type MapView = "behaviour" | "content";

export const MODEL_LABELS: Record<string, string> = {
  hybrid: "Hybrid ensemble",
  user_user_cf: "User-User CF",
  item_item_cf: "Item-Item CF",
  matrix_factorization: "Matrix Factorization",
  biased_mf: "Biased MF",
  content_based: "Content-Based",
  most_popular: "Most Popular",
  highest_average: "Highest Average",
};
