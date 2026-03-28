import { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import Fuse from 'fuse.js';

// ─── Global data cache ───
const cache = {};

const BASE = import.meta.env.BASE_URL || '/';

async function fetchJSON(path) {
  const fullPath = path.startsWith('/') ? BASE + path.slice(1) : path;
  if (cache[fullPath]) return cache[fullPath];
  const res = await fetch(fullPath);
  if (!res.ok) throw new Error(`Failed to fetch ${fullPath}`);
  const data = await res.json();
  cache[fullPath] = data;
  return data;
}

// ─── Search Index + Fuse ───
let fuseInstance = null;
let searchData = null;

export async function getSearchIndex() {
  if (searchData) return { fuse: fuseInstance, data: searchData };
  searchData = await fetchJSON('/data/search_index.json');
  fuseInstance = new Fuse(searchData, {
    keys: [
      { name: 'n', weight: 0.7 },
      { name: 'id', weight: 0.3 },
    ],
    threshold: 0.4,
    distance: 200,
    minMatchCharLength: 1,
  });
  return { fuse: fuseInstance, data: searchData };
}

// ─── Scholar detail loader ───
const scholarCache = {};

function getChunkKey(id) {
  if (!id) return null;
  const [prefix, rest] = id.split(':');
  if (prefix === 'dia') return `dia_${(rest || '')[0]?.toLowerCase() || 'a'}`;
  if (prefix === 'alam') return `alam_${(rest || '')[0]?.toLowerCase() || '1'}`;
  if (prefix === 'atlas') return 'atlas';
  if (prefix === 'ei1') return 'ei1';
  if (prefix === 'tab') return 'tab';
  return null;
}

export async function getScholar(id) {
  if (scholarCache[id]) return scholarCache[id];
  const key = getChunkKey(id);
  if (!key) return null;
  const chunk = await fetchJSON(`/data/scholars/${key}.json`);
  Object.assign(scholarCache, chunk);
  return scholarCache[id] || null;
}

// ─── Edges loader ───
let edgesData = null;
let edgeIndex = null;

export async function getEdges() {
  if (edgesData) return edgesData;
  edgesData = await fetchJSON('/data/edges_merged.json');
  return edgesData;
}

export async function getEdgesForScholar(scholarId) {
  const edges = await getEdges();
  if (!edgeIndex) {
    edgeIndex = {};
    for (const e of edges) {
      if (!edgeIndex[e.source]) edgeIndex[e.source] = [];
      if (!edgeIndex[e.target]) edgeIndex[e.target] = [];
      edgeIndex[e.source].push(e);
      edgeIndex[e.target].push(e);
    }
  }
  return edgeIndex[scholarId] || [];
}

// ─── GeoJSON loader ───
export async function getGeoJSON() {
  return fetchJSON('/data/scholars_geo.geojson');
}

// ─── Stats loader ───
export async function getStats() {
  return fetchJSON('/data/stats.json');
}

// ─── Supporting data loaders ───
export async function getCities() { return fetchJSON('/data/cities.json'); }
export async function getDynasties() { return fetchJSON('/data/dynasties.json'); }
export async function getRulers() { return fetchJSON('/data/rulers.json'); }
export async function getBooks() { return fetchJSON('/data/book_metadata.json'); }
export async function getMadrasas() { return fetchJSON('/data/madrasas.json'); }
export async function getMonuments() { return fetchJSON('/data/monuments.json'); }
export async function getBattles() { return fetchJSON('/data/battles.json'); }
export async function getEvents() { return fetchJSON('/data/events.json'); }
export async function getTradeRoutes() { return fetchJSON('/data/trade_routes.json'); }
export async function getWaqfs() { return fetchJSON('/data/waqfs.json'); }
export async function getSilsileEdges() { return fetchJSON('/data/silsile_edges.json'); }

// ─── React hooks ───

export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));
    asyncFn().then(data => {
      if (!cancelled) setState({ data, loading: false, error: null });
    }).catch(error => {
      if (!cancelled) setState({ data: null, loading: false, error });
    });
    return () => { cancelled = true; };
  }, deps);
  return state;
}

export function useSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getSearchIndex().then(({ fuse }) => {
      if (cancelled) return;
      const res = fuse.search(query, { limit: 50 });
      setResults(res.map(r => r.item));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [query]);

  return { results, loading };
}

// ─── Language Context ───
const LangContext = createContext('tr');

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tabakat-lang') || 'tr';
    }
    return 'tr';
  });

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next = prev === 'tr' ? 'en' : prev === 'en' ? 'ar' : 'tr';
      localStorage.setItem('tabakat-lang', next);
      return next;
    });
  }, []);

  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

// ─── Theme Context ───
const ThemeContext = createContext('light');

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tabakat-theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tabakat-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
