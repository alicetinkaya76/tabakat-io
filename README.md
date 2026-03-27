# tabakat.io — Islamic Civilization Scholars Atlas

**23,000+ scholars** — biographies, relationship networks, education routes, silsile chains, maps, and timelines in one research platform.

![Version](https://img.shields.io/badge/version-7.0-gold)
![React](https://img.shields.io/badge/React-18-blue)

## Live Demo

🌐 **[alicetinkaya76.github.io/tabakat-io](https://alicetinkaya76.github.io/tabakat-io/)**

## Features

- **Browse & Search**: Fuse.js fuzzy search across 23K+ scholars with advanced filters
- **Interactive Map**: Leaflet map with 4 overlay layers (dynasties, trade routes, waqf, monuments)
- **Network Visualization**: D3 force graph with community detection, centrality highlighting, in-network search
- **Timeline**: Zoomable SVG timeline with dynasty bands, field filtering, era backgrounds
- **Scholar Comparison**: Side-by-side (up to 3) with SVG radar chart and shareable URLs
- **Silsile Tree**: Chain-of-transmission tree with pinch-to-zoom and zoom controls
- **Dynasties Browser**: Filterable grid of 186 dynasties
- **16 Pages** — lazy-loaded routes
- **Bilingual** (TR/EN) · **Dark Mode** · **PWA** · **Accessible** · **Cmd+K Search**

## Tech Stack

React 18 · Vite · Tailwind CSS · D3 · Recharts · Leaflet · Fuse.js
Fonts: Cormorant Garamond, Source Sans 3, Amiri, JetBrains Mono

## Development

```bash
npm install
npm run dev     # localhost:5173
npm run build   # dist/ (25 chunks, ~13s)
```

## Deployment (GitHub Pages)

Automated via GitHub Actions on push to `main`.

First-time setup:
1. **Settings → Pages → Build and deployment → GitHub Actions**
2. Push to `main` — `.github/workflows/deploy.yml` handles the rest

## Authors

Dr. Ali Çetinkaya & Dr. Hüseyin Gökalp — Selçuk University, Konya
