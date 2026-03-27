import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../utils/data';
import { getDisplayName } from '../utils/helpers';
import { FIELD_LABELS } from '../utils/i18n';

function buildTree(scholarId, allEdges, scholarLookup) {
  const childrenMap = {};
  const parentMap = {};
  for (const e of allEdges) {
    if (!childrenMap[e.source]) childrenMap[e.source] = new Set();
    childrenMap[e.source].add(e.target);
    if (!parentMap[e.target]) parentMap[e.target] = new Set();
    parentMap[e.target].add(e.source);
  }
  const findRoots = (id, visited = new Set()) => {
    if (visited.has(id)) return [id];
    visited.add(id);
    const parents = parentMap[id];
    if (!parents || parents.size === 0) return [id];
    const roots = [];
    for (const p of parents) roots.push(...findRoots(p, visited));
    return roots.length ? roots : [id];
  };
  const roots = [...new Set(findRoots(scholarId))];
  const buildNode = (id, depth = 0, visited = new Set()) => {
    if (visited.has(id) || depth > 12) return null;
    visited.add(id);
    const info = scholarLookup[id];
    const name = info?.name || id.split(':').pop();
    const node = { id, name, field: info?.field, death: info?.death, isCurrent: id === scholarId, children: [] };
    const kids = childrenMap[id];
    if (kids) {
      for (const kid of kids) {
        const child = buildNode(kid, depth + 1, new Set(visited));
        if (child) node.children.push(child);
      }
    }
    return node;
  };
  if (roots.length === 1) return buildNode(roots[0]);
  const virtualRoot = { id: '__root__', name: '', virtual: true, children: [] };
  for (const r of roots) {
    const node = buildNode(r);
    if (node) virtualRoot.children.push(node);
  }
  return virtualRoot.children.length === 1 ? virtualRoot.children[0] : virtualRoot;
}

export default function SilsileTree({ scholarId, silsileEdges, scholarNames = {} }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { lang } = useLang();
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomRef = useRef(null);

  const treeData = useMemo(() => {
    if (!silsileEdges || silsileEdges.length === 0) return null;
    return buildTree(scholarId, silsileEdges, scholarNames);
  }, [scholarId, silsileEdges, scholarNames]);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 100) setDimensions(d => ({ ...d, width: w }));
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const handleZoom = useCallback((delta) => {
    if (!zoomRef.current || !svgRef.current) return;
    import('d3').then(d3 => {
      const svg = d3.select(svgRef.current);
      const ct = d3.zoomTransform(svgRef.current);
      const ns = Math.max(0.3, Math.min(5, ct.k + delta));
      svg.transition().duration(300).call(zoomRef.current.scaleTo, ns);
      setZoomLevel(ns);
    });
  }, []);

  const handleReset = useCallback(() => {
    if (!zoomRef.current || !svgRef.current) return;
    import('d3').then(d3 => {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(400).call(zoomRef.current.transform, d3.zoomIdentity);
      setZoomLevel(1);
    });
  }, []);

  useEffect(() => {
    if (!treeData || !svgRef.current) return;
    import('d3').then(d3 => {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      const root = d3.hierarchy(treeData, d => d.children);
      const nodeCount = root.descendants().length;
      const maxDepth = root.height;
      const isMobile = dimensions.width < 500;
      const margin = { top: 40, right: 40, bottom: 40, left: 40 };
      const nodeW = isMobile ? 120 : 160;
      const nodeH = isMobile ? 44 : 56;
      const levelGap = isMobile ? 70 : 90;
      const treeWidth = Math.max(dimensions.width - margin.left - margin.right, nodeCount * (isMobile ? 60 : 80));
      const treeHeight = (maxDepth + 1) * (nodeH + levelGap);
      const totalHeight = treeHeight + margin.top + margin.bottom;
      const totalWidth = Math.max(dimensions.width, treeWidth + margin.left + margin.right);
      setDimensions(d => ({ ...d, height: totalHeight }));
      const treeLayout = d3.tree().size([treeWidth, treeHeight]).separation((a, b) => a.parent === b.parent ? 1.2 : 1.8);
      treeLayout(root);

      const g = svg.append('g');
      const zoom = d3.zoom().scaleExtent([0.3, 5]).on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });
      zoomRef.current = zoom;
      svg.call(zoom);
      svg.call(zoom.transform, d3.zoomIdentity.translate(margin.left, margin.top));
      svg.style('touch-action', 'none');

      const defs = svg.append('defs');
      const grad = defs.append('linearGradient').attr('id', 'silsile-link-grad').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
      grad.append('stop').attr('offset', '0%').attr('stop-color', '#dc9a24').attr('stop-opacity', 0.4);
      grad.append('stop').attr('offset', '100%').attr('stop-color', '#07c4a3').attr('stop-opacity', 0.4);
      const filter = defs.append('filter').attr('id', 'glow-current');
      filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
      const merge = filter.append('feMerge');
      merge.append('feMergeNode').attr('in', 'coloredBlur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');

      g.selectAll('.silsile-link').data(root.links().filter(l => !l.source.data.virtual)).enter()
        .append('path').attr('d', d => {
          const sx = d.source.x, sy = d.source.y + nodeH / 2, tx = d.target.x, ty = d.target.y - nodeH / 2, my = (sy + ty) / 2;
          return `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`;
        }).attr('fill', 'none').attr('stroke', 'url(#silsile-link-grad)').attr('stroke-width', 2)
        .attr('opacity', 0).transition().duration(600).delay((_, i) => i * 60).attr('opacity', 1);

      const nodes = g.selectAll('.silsile-node').data(root.descendants().filter(d => !d.data.virtual)).enter()
        .append('g').attr('transform', d => `translate(${d.x - nodeW / 2}, ${d.y - nodeH / 2})`)
        .style('cursor', 'pointer').style('opacity', 0)
        .on('click', (_, d) => { if (d.data.id !== scholarId) navigate(`/scholar/${encodeURIComponent(d.data.id)}`); });
      nodes.transition().duration(400).delay((_, i) => 200 + i * 80).style('opacity', 1);
      nodes.append('rect').attr('width', nodeW).attr('height', nodeH)
        .attr('rx', isMobile ? 8 : 12).attr('ry', isMobile ? 8 : 12)
        .attr('fill', d => d.data.isCurrent ? 'var(--silsile-current-bg, rgba(220,154,36,0.12))' : 'var(--silsile-node-bg, rgba(250,248,242,0.9))')
        .attr('stroke', d => d.data.isCurrent ? '#dc9a24' : (FIELD_LABELS[d.data.field]?.color || '#d5c69e') + '40')
        .attr('stroke-width', d => d.data.isCurrent ? 2 : 1)
        .attr('filter', d => d.data.isCurrent ? 'url(#glow-current)' : null);
      nodes.append('circle').attr('cx', isMobile ? 12 : 16).attr('cy', nodeH / 2).attr('r', isMobile ? 3 : 4)
        .attr('fill', d => FIELD_LABELS[d.data.field]?.color || '#a4b0bb');
      nodes.append('text').attr('x', isMobile ? 22 : 28).attr('y', nodeH / 2 - (isMobile ? 2 : 4))
        .attr('font-size', isMobile ? '10px' : '12px').attr('font-weight', d => d.data.isCurrent ? '700' : '500')
        .attr('fill', d => d.data.isCurrent ? '#dc9a24' : 'var(--silsile-text, #2d3239)')
        .attr('font-family', "'Cormorant Garamond', serif")
        .text(d => { const n = d.data.name; const mx = isMobile ? 14 : 20; return n.length > mx ? n.slice(0, mx - 2) + '\u2026' : n; });
      nodes.append('text').attr('x', isMobile ? 22 : 28).attr('y', nodeH / 2 + (isMobile ? 9 : 12))
        .attr('font-size', isMobile ? '8px' : '10px').attr('fill', 'var(--silsile-sub, #778897)')
        .attr('font-family', "'JetBrains Mono', monospace").text(d => d.data.death ? `d. ${d.data.death}` : '');
      nodes.filter(d => d.data.isCurrent).append('text')
        .attr('x', nodeW - 12).attr('y', nodeH / 2 + 4).attr('text-anchor', 'end')
        .attr('font-size', '12px').text('\u25C6').attr('fill', '#dc9a24');
    });
  }, [treeData, dimensions.width, navigate, scholarId]);

  if (!treeData) return null;

  return (
    <div ref={containerRef} className="silsile-tree-container rounded-xl overflow-hidden border border-sand-200/50 dark:border-ink-700/50 bg-sand-50/30 dark:bg-ink-900/30 relative">
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <button onClick={() => handleZoom(0.3)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-ink-600 dark:text-sand-300 hover:bg-sand-200/60 dark:hover:bg-ink-700/60 transition-colors text-sm font-bold" aria-label="Zoom in">+</button>
        <button onClick={() => handleZoom(-0.3)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-ink-600 dark:text-sand-300 hover:bg-sand-200/60 dark:hover:bg-ink-700/60 transition-colors text-sm font-bold" aria-label="Zoom out">&minus;</button>
        <button onClick={handleReset} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-ink-600 dark:text-sand-300 hover:bg-sand-200/60 dark:hover:bg-ink-700/60 transition-colors" aria-label="Reset zoom" title="Reset">
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-2.033l.31.31A7 7 0 0016.76 11.04a.75.75 0 10-1.448.384zm-10.624-2.85a5.5 5.5 0 019.201-2.465l.312.31H11.77a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V3.535a.75.75 0 00-1.5 0v2.033l-.31-.31A7 7 0 003.24 8.96a.75.75 0 101.448-.384z" clipRule="evenodd"/></svg>
        </button>
      </div>
      <div className="absolute bottom-3 right-3 z-10 text-[10px] font-mono text-ink-400 dark:text-sand-500 glass px-2 py-1 rounded-md">{Math.round(zoomLevel * 100)}%</div>
      <div className="overflow-hidden">
        <svg ref={svgRef} width="100%" height={dimensions.height} style={{ minWidth: 400 }} className="silsile-tree-svg" />
      </div>
    </div>
  );
}
