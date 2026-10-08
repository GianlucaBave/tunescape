# Tunescape

**Live demo: [tunescape.vercel.app](https://tunescape.vercel.app)**

An interactive atlas for exploring how different recommender algorithms see the same music taste.
Individual project on recommender systems.

## What it does

- Plots **15,350 Last.fm artists** on a 2D map, grouped into **10 genre clusters**.
- Two map views: **behaviour** (artists placed by who listens to them) and **content** (artists placed by their tags).
- Pick one of **200 users** to see what they listened to and where it sits on the map.
- Compare the recommendations of **8 algorithms** for that user, side by side on the map:

| Family | Algorithms |
|---|---|
| Baselines | Most Popular, Highest Average |
| Collaborative filtering | User-User CF, Item-Item CF |
| Latent factors | Matrix Factorization, Biased MF |
| Content | Content-Based (tags) |
| Ensemble | Hybrid |

- Hover an artist to play a 30-second audio preview from the Deezer API.

## How it is built

- **Modelling (Python, offline):** algorithms trained on Last.fm listening data; the 2D layouts, clusters and per-user recommendations are exported to a single JSON file (`public/lastfm_data.json`).
- **Front end:** Next.js 15, React 19, TypeScript, deck.gl for the scatter map, Zustand for state, Tailwind CSS, Framer Motion.
- **Hosting:** Vercel.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.
