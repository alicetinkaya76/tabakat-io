import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync, getSilsileEdges, getEdges, getSearchIndex, useLang } from '../utils/data';
import { getLabel, FIELD_LABELS, EDGE_LABELS } from '../utils/i18n';
import { parseName, debounce } from '../utils/helpers';
import Loading from '../components/Loading';

// Simple Louvain-style community detection
function detectCommunities(nodes, links) {
  const adj = {};
  for (const n of nodes) adj[n.id] = new Set();
  for (const l of links) {
    const s = typeof l.source === 'object' ? l.source.id : l.source;
    const t = typeof l.target === 'object' ? l.target.id : l.target;
    if (adj[s]) adj[s].add(t);
    if (adj[t]) adj[t].add(s);
  }
  // Initialize each node in its own community
  const comm = {};
  nodes.forEach((n, i) => { comm[n.id] = i; });
  // Iterative label propagation (lightweight)
  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    for (const n of nodes) {
      const neighborComms = {};
      for (const nb of adj[n.id]) {
        const c = comm[nb];
        neighborComms[c] = (neighborComms[c] || 0) + 1;
      }
      let bestComm = comm[n.id], bestCount = 0;
      for (const [c, count] of Object.entries(neighborComms)) {
        if (count > bestCount) { bestComm = Number(c); bestCount = count; }
      }
      if (bestComm !== comm[n.id]) { comm[n.id] = bestComm; changed = true; }
    }
    if (!changed) break;
  }
  // Remap to sequential IDs
  const remap = {};
  let idx = 0;
  for (const c of Object.values(comm)) {
    if (remap[c] === undefined) remap[c] = idx++;
  }
  for (const id of Object.keys(comm)) comm[id] = remap[comm[id]];
  return comm;
}

// Degree centrality
function computeCentrality(nodes, links) {
  const deg = {};
  for (const n of nodes) deg[n.id] = 0;
  for (const l of links) {
    const s = typeof l.source === 'object' ? l.source.id : l.source;
    const t = typeof l.target === 'object' ? l.target.id : l.target;
    if (deg[s] !== undefined) deg[s]++;
    if (deg[t] !== undefined) deg[t]++;
  }
  return deg;
}

const COMMUNITY_COLORS = ['#dc9a24', '#07c4a3', '#a25a19', '#5c6d7d', '#087e6d', '#c37a1b', '#85481c', '#444e59', '#039e87', '#6e3c1a', '#778897', '#e5b63f'];

export default function NetworkPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const { data: silsile, loading: loadingSilsile } = useAsync(getSilsileEdges);
  const { data: allEdges, loading: loadingEdges } = useAsync(getEdges);
  const { data: searchIdx, loading: loadingSearch } = useAsync(getSearchIndex);
  const svgRef = useRef(null);
  const simRef = useRef(null);
  const [mode, setMode] = useState('silsile');
  const [edgeFilter, setEdgeFilter] = useState('all');
  const [hovered, setHovered] = useState(null);
  const [colorBy, setColorBy] = useState('field'); // 'field' | 'community'
  const [showCentrality, setShowCentrality] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedNode, setHighlightedNode] = useState(null);
  const [communityCount, setCommunityCount] = useState(0);

  const handleSearchDebounced = useCallback(debounce((val) => setSearchQuery(val), 200), []);

  useEffect(() => {
    if (!silsile || !allEdges || !searchIdx || !svgRef.current) return;

    import('d3').then(d3 => {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;

      const scholarLookup = {};
      for (const s of searchIdx.data) scholarLookup[s.id] = s;

      let sourceEdges;
      if (mode === 'silsile') { sourceEdges = silsile; }
      else {
        sourceEdges = edgeFilter === 'all' ? allEdges.slice(0, 600) : allEdges.filter(e => e.type === edgeFilter).slice(0, 600);
      }

      const nodeMap = new Map();
      const links = [];
      for (const edge of sourceEdges) {
        for (const id of [edge.source, edge.target]) {
          if (!nodeMap.has(id)) {
            const s = scholarLookup[id];
            const names = s ? parseName(s.n) : null;
            nodeMap.set(id, {
              id, name: names?.name_en || names?.name_tr || id.split(':').pop(),
              field: s?.fn || 'unknown', importance: s?.i || 'low', death: s?.d,
            });
          }
        }
        links.push({ source: edge.source, target: edge.target, type: edge.type });
      }
      const nodes = Array.from(nodeMap.values());

      // Community detection
      const communities = detectCommunities(nodes, links);
      const numComm = new Set(Object.values(communities)).size;
      setCommunityCount(numComm);
      nodes.forEach(n => { n.community = communities[n.id]; });

      // Centrality
      const centrality = computeCentrality(nodes, links);
      const maxDeg = Math.max(1, ...Object.values(centrality));
      nodes.forEach(n => { n.centrality = centrality[n.id] / maxDeg; });

      const g = svg.append('g');
      const zoom = d3.zoom().scaleExtent([0.3, 5]).on('zoom', (event) => g.attr('transform', event.transform));
      svg.call(zoom);

      const link = g.append('g').selectAll('line').data(links).join('line')
        .attr('stroke', d => {
          if (d.type === 'TEACHER_OF') return '#07c4a3';
          if (d.type === 'STUDENT_OF') return '#dc9a24';
          if (d.type === 'CONTEMPORARY') return '#778897';
          if (d.type === 'DIA_CROSS_REF') return '#a25a19';
          return '#c4ac76';
        }).attr('stroke-opacity', 0.35).attr('stroke-width', 1);

      const node = g.append('g').selectAll('circle').data(nodes).join('circle')
        .attr('r', d => {
          const base = d.importance === 'high' ? 8 : d.importance === 'medium' ? 5 : 3.5;
          return showCentrality ? Math.max(3, base * (0.5 + d.centrality * 1.5)) : base;
        })
        .attr('fill', d => {
          if (colorBy === 'community') return COMMUNITY_COLORS[d.community % COMMUNITY_COLORS.length];
          return FIELD_LABELS[d.field]?.color || '#a4b0bb';
        })
        .attr('stroke', '#fff').attr('stroke-width', 1.5).attr('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          setHovered(d);
          d3.select(event.currentTarget).attr('stroke', '#dc9a24').attr('stroke-width', 2.5);
        })
        .on('mouseout', (event) => {
          setHovered(null);
          d3.select(event.currentTarget).attr('stroke', '#fff').attr('stroke-width', 1.5);
        })
        .on('click', (_, d) => navigate(`/scholar/${encodeURIComponent(d.id)}`));

      const label = g.append('g').selectAll('text')
        .data(nodes.filter(d => d.importance === 'high')).join('text')
        .text(d => d.name).attr('font-size', 10)
        .attr('font-family', "'Cormorant Garamond', serif").attr('font-weight', 600)
        .attr('fill', 'var(--network-label, #2d3239)').attr('dx', 10).attr('dy', 4).attr('pointer-events', 'none');

      const sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(40))
        .force('charge', d3.forceManyBody().strength(-80))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(12))
        .on('tick', () => {
          link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
          node.attr('cx', d => d.x).attr('cy', d => d.y);
          label.attr('x', d => d.x).attr('y', d => d.y);
        });

      node.call(d3.drag()
        .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

      simRef.current = { sim, svg, zoom, node, link, g, d3 };
    });

    return () => { if (simRef.current?.sim) simRef.current.sim.stop(); };
  }, [silsile, allEdges, searchIdx, navigate, mode, edgeFilter, colorBy, showCentrality]);

  // Highlight searched node
  useEffect(() => {
    if (!simRef.current || !searchQuery || searchQuery.length < 2) {
      setHighlightedNode(null);
      return;
    }
    const { node, svg, zoom, d3 } = simRef.current;
    const q = searchQuery.toLowerCase();
    let found = null;
    node.each(function(d) {
      if (d.name.toLowerCase().includes(q)) {
        found = d;
        d3.select(this).attr('stroke', '#dc9a24').attr('stroke-width', 3).attr('r', 14);
      }
    });
    if (found) {
      setHighlightedNode(found);
      svg.transition().duration(500).call(zoom.transform,
        d3.zoomIdentity.translate(svg.node().clientWidth / 2 - found.x, svg.node().clientHeight / 2 - found.y)
      );
    }
  }, [searchQuery]);

  if (loadingSilsile || loadingSearch || loadingEdges) return <Loading />;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="bg-white/80 dark:bg-ink-900/80 backdrop-blur border-b border-sand-200 dark:border-ink-700 px-4 py-2.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-600 dark:text-sand-300">
            {mode === 'silsile' ? (lang === 'tr' ? 'Silsile A\u011F\u0131' : 'Silsile Network') : (lang === 'tr' ? 'T\u00FCm \u0130li\u015Fkiler' : 'All Relations')}
          </span>
          {silsile && mode === 'silsile' && (
            <span className="text-xs text-ink-400 dark:text-sand-500">({silsile.length} {lang === 'tr' ? 'ba\u011Flant\u0131' : 'links'})</span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Search within network */}
          <input
            type="text"
            placeholder={lang === 'tr' ? 'A\u011Fda ara...' : 'Search network...'}
            className="text-xs border border-sand-300 dark:border-ink-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-ink-800 dark:text-sand-200 w-36 focus:ring-1 focus:ring-gold-400/30 outline-none"
            onChange={(e) => handleSearchDebounced(e.target.value)}
            aria-label="Search network"
          />

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-sand-300 dark:border-ink-600 overflow-hidden">
            <button onClick={() => { setMode('silsile'); setEdgeFilter('all'); }} className={`text-xs px-2.5 py-1 font-medium transition-colors ${mode === 'silsile' ? 'bg-gold-500 text-white' : 'text-ink-600 dark:text-sand-300 hover:bg-sand-50 dark:hover:bg-ink-800'}`}>
              \uD83D\uDD17 Silsile
            </button>
            <button onClick={() => setMode('all')} className={`text-xs px-2.5 py-1 font-medium transition-colors ${mode === 'all' ? 'bg-gold-500 text-white' : 'text-ink-600 dark:text-sand-300 hover:bg-sand-50 dark:hover:bg-ink-800'}`}>
              \uD83C\uDF10 {lang === 'tr' ? 'T\u00FCm\u00FC' : 'All'}
            </button>
          </div>

          {mode === 'all' && (
            <select value={edgeFilter} onChange={(e) => setEdgeFilter(e.target.value)} className="text-xs border border-sand-300 dark:border-ink-600 rounded px-2 py-1 bg-white dark:bg-ink-800 dark:text-sand-200">
              <option value="all">{getLabel('all_types', lang)}</option>
              {Object.entries(EDGE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v.icon} {v[lang]}</option>))}
            </select>
          )}

          {/* Color by */}
          <select value={colorBy} onChange={(e) => setColorBy(e.target.value)} className="text-xs border border-sand-300 dark:border-ink-600 rounded px-2 py-1 bg-white dark:bg-ink-800 dark:text-sand-200" aria-label="Color nodes by">
            <option value="field">{lang === 'tr' ? 'Alan' : 'Field'}</option>
            <option value="community">{lang === 'tr' ? 'Topluluk' : 'Community'}</option>
          </select>

          {/* Centrality toggle */}
          <button
            onClick={() => setShowCentrality(!showCentrality)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${showCentrality ? 'bg-teal-500 text-white' : 'border border-sand-300 dark:border-ink-600 text-ink-600 dark:text-sand-300 hover:bg-sand-50 dark:hover:bg-ink-800'}`}
            title={lang === 'tr' ? 'Merkezlik vurgulama' : 'Centrality highlighting'}
          >
            &#x25CE; {lang === 'tr' ? 'Merkezlik' : 'Centrality'}
          </button>
        </div>

        {(hovered || highlightedNode) && (
          <div className="w-full text-sm text-ink-700 dark:text-sand-200 font-medium mt-1">
            {(hovered || highlightedNode).name}
            {(hovered || highlightedNode).death && <span className="text-ink-400 dark:text-sand-500 ml-1 font-mono text-xs">d.{(hovered || highlightedNode).death}</span>}
            {colorBy === 'community' && <span className="text-ink-400 dark:text-sand-500 ml-2 text-xs">Community #{(hovered || highlightedNode).community}</span>}
          </div>
        )}
      </div>

      <svg ref={svgRef} className="flex-1 bg-sand-50 dark:bg-ink-950" style={{ width: '100%', touchAction: 'none' }} />

      <div className="bg-white/80 dark:bg-ink-900/80 backdrop-blur border-t border-sand-200 dark:border-ink-700 px-4 py-2 flex flex-wrap gap-3 text-xs">
        {colorBy === 'field' ? (
          <>
            <span className="text-ink-500 dark:text-sand-400 font-medium">{lang === 'tr' ? 'Renk = Alan' : 'Color = Field'}:</span>
            {['fiqh', 'hadith', 'kalam', 'sufism', 'literature', 'philosophy'].map(f => (
              <span key={f} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: FIELD_LABELS[f]?.color }} />
                <span className="text-ink-600 dark:text-sand-400">{FIELD_LABELS[f]?.[lang]}</span>
              </span>
            ))}
          </>
        ) : (
          <span className="text-ink-500 dark:text-sand-400 font-medium">
            {lang === 'tr' ? `${communityCount} topluluk tespit edildi` : `${communityCount} communities detected`}
          </span>
        )}
      </div>
    </div>
  );
}
