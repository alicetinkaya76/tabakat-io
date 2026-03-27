import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAsync, getStats, getDynasties, useLang } from '../utils/data';
import { ERA_LABELS, FIELD_LABELS, getEraLabel, getFieldLabel } from '../utils/i18n';
import { formatNumber, formatCentury } from '../utils/helpers';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

export default function TimelinePage() {
  const { lang } = useLang();
  const { data: stats, loading: statsLoading } = useAsync(getStats);
  const { data: dynasties } = useAsync(getDynasties);
  const containerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [hoveredCentury, setHoveredCentury] = useState(null);
  const [selectedField, setSelectedField] = useState('all');
  const [showDynastyBands, setShowDynastyBands] = useState(true);
  const isDragging = useRef(false);
  const dragStart = useRef(0);
  const panStart = useRef(0);

  const centuryData = useMemo(() => {
    if (!stats?.centuries) return [];
    return Object.entries(stats.centuries)
      .map(([c, count]) => ({ century: parseInt(c), count }))
      .filter(d => d.century >= 6 && d.century <= 21)
      .sort((a, b) => a.century - b.century);
  }, [stats]);

  const fieldData = useMemo(() => stats?.field_century || {}, [stats]);
  const maxCount = Math.max(...centuryData.map(d => d.count), 1);

  const dynastyBands = useMemo(() => {
    if (!dynasties) return [];
    return dynasties
      .filter(d => d.imp === 'Kritik' || d.imp === 'Yüksek')
      .map(d => ({
        id: d.id, name: lang === 'en' ? d.en : d.tr,
        start: d.start, end: d.end, imp: d.imp,
      }))
      .sort((a, b) => a.start - b.start);
  }, [dynasties, lang]);

  const topFields = useMemo(() => {
    if (!stats?.fields) return [];
    return Object.entries(stats.fields).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k);
  }, [stats]);

  // Zoom/pan
  const handleZoomIn = useCallback(() => setZoomLevel(z => Math.min(z * 1.5, 5)), []);
  const handleZoomOut = useCallback(() => {
    setZoomLevel(z => {
      const next = Math.max(z / 1.5, 1);
      if (next === 1) setPanOffset(0);
      return next;
    });
  }, []);
  const handleReset = useCallback(() => { setZoomLevel(1); setPanOffset(0); }, []);

  const handlePointerDown = useCallback(e => {
    if (zoomLevel <= 1) return;
    isDragging.current = true;
    dragStart.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    panStart.current = panOffset;
  }, [zoomLevel, panOffset]);

  const handlePointerMove = useCallback(e => {
    if (!isDragging.current) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const dx = x - dragStart.current;
    const container = containerRef.current;
    if (!container) return;
    const maxPan = container.offsetWidth * (zoomLevel - 1) / 2;
    setPanOffset(Math.max(-maxPan, Math.min(maxPan, panStart.current + dx)));
  }, [zoomLevel]);

  const handlePointerUp = useCallback(() => { isDragging.current = false; }, []);

  useEffect(() => {
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
    return () => { window.removeEventListener('mouseup', handlePointerUp); window.removeEventListener('touchend', handlePointerUp); };
  }, [handlePointerUp]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = e => { e.preventDefault(); e.deltaY < 0 ? handleZoomIn() : handleZoomOut(); };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [handleZoomIn, handleZoomOut]);

  if (statsLoading) return <Loading />;

  const W = 960, H = 520;
  const margin = { top: 40, right: 20, bottom: 55, left: 50 };
  const chartW = W - margin.left - margin.right;
  const chartH = H - margin.top - margin.bottom;
  const minC = centuryData[0]?.century || 6;
  const maxC = centuryData[centuryData.length - 1]?.century || 21;
  const range = maxC - minC + 1;
  const barW = chartW / range;
  const x = c => margin.left + (c - minC) * barW;
  const y = count => margin.top + chartH - (count / maxCount) * chartH;

  const eraRanges = [
    { key: 'Rashidun', start: 7, end: 7 },
    { key: 'Umayyad', start: 7.5, end: 8.5 },
    { key: 'Abbasid', start: 8, end: 13 },
    { key: 'Seljuk', start: 11, end: 13 },
    { key: 'Mamluk', start: 13, end: 16 },
    { key: 'Ottoman', start: 14, end: 20 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <SEO title={lang === 'tr' ? 'Zaman Çizelgesi' : 'Timeline'} path="/timeline" />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title mb-1">{lang === 'tr' ? 'Zaman Çizelgesi' : 'Timeline'}</h1>
          <p className="text-sm text-ink-500 dark:text-sand-400">
            {lang === 'tr' ? 'Yüzyıllara göre âlim dağılımı · kaydırarak yakınlaştır' : 'Scholar distribution by century · scroll to zoom'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white dark:bg-ink-800 border border-sand-200 dark:border-ink-700 rounded-lg px-1 py-0.5">
            <button onClick={handleZoomOut} className="w-7 h-7 flex items-center justify-center rounded text-ink-500 hover:bg-sand-100 dark:hover:bg-ink-700 text-sm font-mono">−</button>
            <span className="text-[10px] font-mono text-ink-400 w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={handleZoomIn} className="w-7 h-7 flex items-center justify-center rounded text-ink-500 hover:bg-sand-100 dark:hover:bg-ink-700 text-sm font-mono">+</button>
            {zoomLevel > 1 && <button onClick={handleReset} className="w-7 h-7 flex items-center justify-center rounded text-ink-500 hover:bg-sand-100 dark:hover:bg-ink-700 text-xs">↺</button>}
          </div>
          <button
            onClick={() => setShowDynastyBands(!showDynastyBands)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all font-medium ${showDynastyBands ? 'bg-gold-500 text-white border-gold-500' : 'border-sand-300 dark:border-ink-600 text-ink-600 dark:text-sand-300'}`}
          >
            🏰
          </button>
          <select value={selectedField} onChange={e => setSelectedField(e.target.value)}
            className="text-xs border border-sand-300 dark:border-ink-600 rounded-lg px-2 py-1.5 bg-white dark:bg-ink-800 dark:text-sand-200">
            <option value="all">{lang === 'tr' ? 'Tüm Alanlar' : 'All Fields'}</option>
            {topFields.map(f => <option key={f} value={f}>{getFieldLabel(f, lang)}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div
          ref={containerRef}
          className={`overflow-hidden select-none ${zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{
              transform: `scaleX(${zoomLevel}) translateX(${panOffset / zoomLevel}px)`,
              transformOrigin: 'center',
              transition: isDragging.current ? 'none' : 'transform 0.3s ease',
            }}
          >
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e5b63f" />
                <stop offset="100%" stopColor="#dc9a24" />
              </linearGradient>
            </defs>

            {/* Era background */}
            {eraRanges.map(era => {
              const color = ERA_LABELS[era.key]?.color || '#c9d1d7';
              return <rect key={era.key} x={x(era.start)} y={margin.top} width={x(era.end + 1) - x(era.start)} height={chartH} fill={color} opacity={0.04} />;
            })}

            {/* Dynasty bands */}
            {showDynastyBands && dynastyBands.map((d, i) => {
              const sc = Math.ceil(d.start / 100);
              const ec = Math.ceil(d.end / 100);
              const x1 = x(Math.max(sc, minC));
              const x2 = x(Math.min(ec, maxC) + 1);
              if (x2 <= x1) return null;
              const row = i % 4;
              const yPos = chartH + margin.top + 2 + row * 9;
              return (
                <g key={d.id}>
                  <rect x={x1} y={yPos} width={x2 - x1} height={7} rx={2} fill={d.imp === 'Kritik' ? '#dc9a24' : '#a4b0bb'} opacity={0.35} />
                  {(x2 - x1) > 50 && <text x={x1 + 4} y={yPos + 5.5} fontSize={5.5 / Math.max(zoomLevel, 1)} fill={d.imp === 'Kritik' ? '#85481c' : '#5c6d7d'} className="select-none">{d.name.slice(0, 20)}</text>}
                </g>
              );
            })}

            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => {
              const yPos = margin.top + chartH - pct * chartH;
              return (
                <g key={pct}>
                  <line x1={margin.left} y1={yPos} x2={W - margin.right} y2={yPos} stroke="currentColor" className="text-sand-200 dark:text-ink-700" strokeWidth={0.5} strokeDasharray={pct > 0 && pct < 1 ? '3 3' : 'none'} />
                  <text x={margin.left - 6} y={yPos + 3} textAnchor="end" fontSize={9 / Math.max(zoomLevel, 1)} className="fill-ink-400 dark:fill-sand-500 select-none">{formatNumber(Math.round(pct * maxCount))}</text>
                </g>
              );
            })}

            {/* Bars */}
            {centuryData.map(d => {
              const barH = (d.count / maxCount) * chartH;
              const xPos = x(d.century);
              const yPos = margin.top + chartH - barH;
              const isHovered = hoveredCentury === d.century;
              const fColor = selectedField !== 'all' ? (FIELD_LABELS[selectedField]?.color || '#dc9a24') : null;

              return (
                <g key={d.century} onMouseEnter={() => setHoveredCentury(d.century)} onMouseLeave={() => setHoveredCentury(null)} className="cursor-pointer">
                  <rect x={xPos + barW * 0.12} y={yPos} width={barW * 0.76} height={barH} rx={3} fill={fColor || 'url(#barGrad)'} opacity={isHovered ? 1 : 0.85} className="transition-opacity duration-150" />
                  <text x={xPos + barW / 2} y={margin.top + chartH + 14} textAnchor="middle" fontSize={10 / Math.max(zoomLevel, 1)} className="fill-ink-500 dark:fill-sand-500 select-none font-mono">{d.century}</text>
                  {isHovered && (
                    <g>
                      <rect x={xPos + barW / 2 - 38} y={yPos - 28} width={76} height={22} rx={6} className="fill-ink-900 dark:fill-ink-100" opacity={0.9} />
                      <text x={xPos + barW / 2} y={yPos - 14} textAnchor="middle" fontSize={10 / Math.max(zoomLevel, 1)} className="fill-white dark:fill-ink-900 select-none">
                        {formatNumber(d.count)} {lang === 'tr' ? 'âlim' : 'scholars'}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            <line x1={margin.left} y1={margin.top + chartH} x2={W - margin.right} y2={margin.top + chartH} stroke="currentColor" className="text-sand-300 dark:text-ink-600" strokeWidth={1} />
            <text x={W / 2} y={H - 4} textAnchor="middle" fontSize={11 / Math.max(zoomLevel, 1)} className="fill-ink-400 dark:fill-sand-500 select-none">{lang === 'tr' ? 'Yüzyıl (Miladi)' : 'Century (CE)'}</text>
          </svg>
        </div>
      </div>

      {/* Era legend */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        {eraRanges.map(era => {
          const color = ERA_LABELS[era.key]?.color || '#c9d1d7';
          return (
            <div key={era.key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.5 }} />
              <span className="text-xs text-ink-500 dark:text-sand-400">{getEraLabel(era.key, lang)}</span>
            </div>
          );
        })}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
        <SummaryCard label={lang === 'tr' ? 'En yoğun yüzyıl' : 'Peak century'}
          value={formatCentury(centuryData.reduce((max, d) => d.count > max.count ? d : max, { count: 0 }).century, lang)}
          sub={`${formatNumber(Math.max(...centuryData.map(d => d.count)))} ${lang === 'tr' ? 'âlim' : 'scholars'}`} />
        <SummaryCard label={lang === 'tr' ? 'Toplam dönem' : 'Total span'}
          value={`${centuryData[0]?.century || '?'}–${centuryData[centuryData.length - 1]?.century || '?'}. yy`}
          sub={`${centuryData.length} ${lang === 'tr' ? 'yüzyıl' : 'centuries'}`} />
        <SummaryCard label={lang === 'tr' ? 'Ortalama/yüzyıl' : 'Average/century'}
          value={formatNumber(Math.round(centuryData.reduce((s, d) => s + d.count, 0) / centuryData.length))}
          sub={lang === 'tr' ? 'âlim' : 'scholars'} />
        <SummaryCard label={lang === 'tr' ? 'Tarihli âlim' : 'Dated scholars'}
          value={formatNumber(centuryData.reduce((s, d) => s + d.count, 0))}
          sub={lang === 'tr' ? 'toplam' : 'total'} />
      </div>

      {/* Field breakdown */}
      {selectedField !== 'all' && fieldData[selectedField] && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-ink-700 dark:text-sand-300 mb-4">
            {getFieldLabel(selectedField, lang)} — {lang === 'tr' ? 'Yüzyıllık Dağılım' : 'Century Distribution'}
          </h3>
          <div className="card p-4">
            <div className="flex items-end gap-1 h-32">
              {centuryData.map(d => {
                const fc = fieldData[selectedField]?.[d.century] || 0;
                const maxFc = Math.max(...Object.values(fieldData[selectedField] || {}), 1);
                const h = (fc / maxFc) * 100;
                return (
                  <div key={d.century} className="flex-1 flex flex-col items-center justify-end h-full group">
                    <span className="text-[9px] text-ink-400 font-mono opacity-0 group-hover:opacity-100 mb-0.5">{fc}</span>
                    <div className="w-full rounded-t min-h-[1px]" style={{ height: `${h}%`, backgroundColor: FIELD_LABELS[selectedField]?.color || '#dc9a24' }} />
                    <span className="text-[9px] text-ink-400 mt-1 font-mono">{d.century}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs text-ink-400 dark:text-sand-500 font-medium mb-1">{label}</p>
      <p className="font-display text-2xl font-bold text-ink-900 dark:text-sand-100">{value}</p>
      <p className="text-xs text-ink-500 dark:text-sand-400">{sub}</p>
    </div>
  );
}
