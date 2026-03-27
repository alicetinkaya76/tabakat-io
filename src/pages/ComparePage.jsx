import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getScholar, getSearchIndex, getEdgesForScholar, useLang } from '../utils/data';
import { getLabel, getFieldLabel, getEraLabel, getMadhabLabel, FIELD_LABELS, ERA_LABELS } from '../utils/i18n';
import { formatDeath, formatBirth, getDisplayName, truncate, debounce, parseName, formatNumber } from '../utils/helpers';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const MAX_COMPARE = 3;
const RADAR_DIMS = [
  { key: 'source_count', label: { tr: 'Kaynaklar', en: 'Sources' }, max: 10 },
  { key: '_edgeCount', label: { tr: 'İlişkiler', en: 'Relations' }, max: 50 },
  { key: 'works_count', label: { tr: 'Eserler', en: 'Works' }, max: 30 },
  { key: '_importanceScore', label: { tr: 'Önem', en: 'Importance' }, max: 3 },
  { key: '_subFieldCount', label: { tr: 'Alt Alanlar', en: 'Sub-fields' }, max: 5 },
];

function RadarChart({ scholars, lang }) {
  const size = 260, cx = size / 2, cy = size / 2, r = 90;
  const n = RADAR_DIMS.length;
  const colors = ['#dc9a24', '#07c4a3', '#a25a19'];

  const enriched = scholars.map(s => ({
    ...s,
    _edgeCount: s._edges?.length || 0,
    _importanceScore: s.importance === 'high' ? 3 : s.importance === 'medium' ? 2 : 1,
    _subFieldCount: s.sub_fields?.length || 0,
  }));

  const maxVals = RADAR_DIMS.map(dim => {
    const vals = enriched.map(s => s[dim.key] || 0);
    return Math.max(dim.max, ...vals);
  });

  const getPoint = (dimIdx, value, maxVal) => {
    const angle = (Math.PI * 2 * dimIdx) / n - Math.PI / 2;
    const ratio = Math.min(1, (value || 0) / maxVal);
    return { x: cx + r * ratio * Math.cos(angle), y: cy + r * ratio * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px]">
        {/* Grid */}
        {gridLevels.map(level => (
          <polygon key={level} points={RADAR_DIMS.map((_, i) => {
            const a = (Math.PI * 2 * i) / n - Math.PI / 2;
            return `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`;
          }).join(' ')} fill="none" stroke="var(--radar-grid, #e6ddc4)" strokeWidth="0.5" opacity={0.6} />
        ))}
        {/* Axis lines */}
        {RADAR_DIMS.map((_, i) => {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="var(--radar-grid, #e6ddc4)" strokeWidth="0.5" opacity={0.4} />;
        })}
        {/* Data polygons */}
        {enriched.map((s, si) => (
          <polygon key={s.id}
            points={RADAR_DIMS.map((dim, di) => {
              const p = getPoint(di, s[dim.key], maxVals[di]);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill={colors[si] + '20'} stroke={colors[si]} strokeWidth="2" />
        ))}
        {/* Data dots */}
        {enriched.map((s, si) => RADAR_DIMS.map((dim, di) => {
          const p = getPoint(di, s[dim.key], maxVals[di]);
          return <circle key={`${s.id}-${di}`} cx={p.x} cy={p.y} r="3" fill={colors[si]} />;
        }))}
        {/* Labels */}
        {RADAR_DIMS.map((dim, i) => {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2;
          const lx = cx + (r + 22) * Math.cos(a);
          const ly = cy + (r + 22) * Math.sin(a);
          return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--radar-text, #5c6d7d)" fontFamily="'Source Sans 3', sans-serif">{dim.label[lang]}</text>;
        })}
      </svg>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {scholars.map((s, i) => (
          <span key={s.id} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
            <span className="text-ink-600 dark:text-sand-400">{getDisplayName(s, lang)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { lang } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (ids.length === 0) { setScholars([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(ids.map(async id => {
      const s = await getScholar(id);
      if (!s) return null;
      const edges = await getEdgesForScholar(id);
      return { ...s, _edges: edges };
    })).then(results => { setScholars(results.filter(Boolean)); setLoading(false); });
  }, [searchParams]);

  const addScholar = useCallback((id) => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (ids.includes(id) || ids.length >= MAX_COMPARE) return;
    setSearchParams({ ids: [...ids, id].join(',') }, { replace: true });
    setShowSearch(false); setSearchQuery(''); setSearchResults([]);
  }, [searchParams, setSearchParams]);

  const removeScholar = useCallback((id) => {
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    const next = ids.filter(i => i !== id);
    setSearchParams(next.length ? { ids: next.join(',') } : {}, { replace: true });
  }, [searchParams, setSearchParams]);

  const doSearch = useCallback(debounce(async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    const { fuse } = await getSearchIndex();
    const res = fuse.search(q, { limit: 10 }).map(r => r.item);
    setSearchResults(res);
    setSearching(false);
  }, 250), []);

  useEffect(() => { doSearch(searchQuery); }, [searchQuery]);

  const shareUrl = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, []);

  const currentIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  if (loading && currentIds.length > 0) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <SEO title={getLabel('compare_scholars', lang)} path="/compare" description="Compare scholars side by side." />
      <div className="flex items-center justify-between mb-2">
        <h1 className="section-title">{getLabel('compare_scholars', lang)}</h1>
        {scholars.length >= 2 && (
          <button onClick={shareUrl} className="btn-outline text-xs flex items-center gap-1.5" aria-label="Share comparison URL">
            {copied ? '✓' : '🔗'} {copied ? (lang === 'tr' ? 'Kopyalandı' : 'Copied') : (lang === 'tr' ? 'Paylaş' : 'Share')}
          </button>
        )}
      </div>
      <p className="text-sm text-ink-500 dark:text-sand-400 mb-6">
        {lang === 'tr' ? `${scholars.length}/${MAX_COMPARE} âlim seçili` : `${scholars.length}/${MAX_COMPARE} scholars selected`}
      </p>

      {scholars.length < MAX_COMPARE && (
        <div className="mb-6 relative">
          <button onClick={() => setShowSearch(!showSearch)} className="btn-outline text-sm">
            + {lang === 'tr' ? 'Âlim Ekle' : 'Add Scholar'}
          </button>
          {showSearch && (
            <div className="absolute top-full left-0 mt-2 w-full max-w-md z-30 glass rounded-xl shadow-xl overflow-hidden fade-in-scale">
              <div className="p-3 border-b border-sand-200/40 dark:border-ink-700/40">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder={getLabel('search', lang)} autoFocus
                  className="w-full px-3 py-2 text-sm bg-sand-50/80 dark:bg-ink-800/80 rounded-lg border-0 outline-none focus:ring-2 focus:ring-gold-400/30 dark:text-sand-100" />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {searching && <div className="py-4 text-center"><div className="w-5 h-5 border-2 border-transparent border-t-gold-500 rounded-full animate-spin mx-auto" /></div>}
                {searchResults.map(r => {
                  const names = parseName(r.n);
                  const displayName = lang === 'en' ? (names.name_en || names.name_tr) : (names.name_tr || names.name_en);
                  const alreadyAdded = currentIds.includes(r.id);
                  return (
                    <button key={r.id} onClick={() => !alreadyAdded && addScholar(r.id)} disabled={alreadyAdded}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-sand-100/80 dark:hover:bg-ink-800/80'}`}>
                      <div>
                        <span className="font-medium text-ink-800 dark:text-sand-200">{displayName}</span>
                        {r.d && <span className="text-ink-400 text-xs ml-2">d. {r.d}</span>}
                      </div>
                      {alreadyAdded && <span className="text-xs text-ink-400">✓</span>}
                    </button>
                  );
                })}
                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                  <p className="text-center text-sm text-ink-400 py-4">{getLabel('no_results', lang)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {scholars.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">⚖️</p>
          <p className="text-ink-500 dark:text-sand-400 text-lg mb-2">
            {lang === 'tr' ? 'Karşılaştırmak istediğiniz âlimleri ekleyin' : 'Add scholars you want to compare'}
          </p>
          <p className="text-ink-400 dark:text-sand-500 text-sm">
            {lang === 'tr' ? 'En fazla 3 âlim karşılaştırabilirsiniz' : 'You can compare up to 3 scholars'}
          </p>
        </div>
      )}

      {/* Radar Chart */}
      {scholars.length >= 2 && (
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-ink-700 dark:text-sand-300 mb-4 text-center">
            {lang === 'tr' ? 'Görsel Karşılaştırma' : 'Visual Comparison'}
          </h2>
          <RadarChart scholars={scholars} lang={lang} />
        </div>
      )}

      {/* Comparison Table */}
      {scholars.length > 0 && (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full sm:rounded-xl overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="compare-header-cell w-36"></th>
                  {scholars.map(s => (
                    <th key={s.id} className="compare-header-cell text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Link to={`/scholar/${encodeURIComponent(s.id)}`} className="font-display text-base font-bold text-ink-900 dark:text-sand-100 hover:text-gold-700 dark:hover:text-gold-400 transition-colors">
                          {getDisplayName(s, lang)}
                        </Link>
                        {s.name_ar && <p className="ar-text text-sm text-ink-500 dark:text-sand-400">{s.name_ar}</p>}
                        <button onClick={() => removeScholar(s.id)} className="text-xs text-red-400 hover:text-red-600 mt-1" title={lang === 'tr' ? 'Kaldır' : 'Remove'}>✕ {lang === 'tr' ? 'Kaldır' : 'Remove'}</button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label={lang === 'tr' ? 'Vefat' : 'Death'} scholars={scholars} render={s => formatDeath(s, lang)} />
                <CompareRow label={lang === 'tr' ? 'Doğum' : 'Birth'} scholars={scholars} render={s => formatBirth(s, lang) || '—'} />
                <CompareRow label={getLabel('field', lang)} scholars={scholars} render={s => {
                  const color = FIELD_LABELS[s.field_normalized]?.color || '#a4b0bb';
                  return <span className="badge text-[10px]" style={{ backgroundColor: color + '18', color }}>{getFieldLabel(s.field_normalized, lang)}</span>;
                }} />
                <CompareRow label={getLabel('era', lang)} scholars={scholars} render={s => {
                  const color = ERA_LABELS[s.era_normalized]?.color || '#c9d1d7';
                  return <span className="badge text-[10px]" style={{ backgroundColor: color + '18', color }}>{getEraLabel(s.era_normalized, lang)}</span>;
                }} />
                <CompareRow label={getLabel('madhab', lang)} scholars={scholars} render={s => getMadhabLabel(s.madhab_normalized, lang) || '—'} />
                <CompareRow label={getLabel('region', lang)} scholars={scholars} render={s => s.region || '—'} />
                <CompareRow label={lang === 'tr' ? 'Vefat Yeri' : 'Death Place'} scholars={scholars} render={s => s.death_place || '—'} />
                <CompareRow label={getLabel('importance', lang)} scholars={scholars} render={s => {
                  const colors = { high: '#dc9a24', medium: '#5c6d7d', low: '#a4b0bb' };
                  const labels = { high: lang === 'tr' ? 'Yüksek' : 'High', medium: lang === 'tr' ? 'Orta' : 'Medium', low: lang === 'tr' ? 'Düşük' : 'Low' };
                  return <span style={{ color: colors[s.importance] || '#a4b0bb' }} className="font-medium text-sm">{labels[s.importance] || '—'}</span>;
                }} />
                <CompareRow label={getLabel('source_count', lang)} scholars={scholars} render={s => s.source_count || 0} />
                <CompareRow label={lang === 'tr' ? 'İlişki Sayısı' : 'Relations'} scholars={scholars} render={s => s._edges?.length || 0} />
                <CompareRow label={lang === 'tr' ? 'Eser Sayısı' : 'Works'} scholars={scholars} render={s => s.works_count || 0} />
                <CompareRow label={lang === 'tr' ? 'Nisbe' : 'Nisba'} scholars={scholars} render={s => s.nisbe || '—'} />
                <CompareRow label={lang === 'tr' ? 'Alt Alanlar' : 'Sub-fields'} scholars={scholars} render={s => s.sub_fields?.join(', ') || '—'} className="text-xs" />
                <CompareRow label={lang === 'tr' ? 'Öne Çıkan Eser' : 'Notable Work'} scholars={scholars} render={s => s.notable_work || '—'} className="text-xs" />
                <CompareRow label={lang === 'tr' ? 'Biyografi' : 'Biography'} scholars={scholars} render={s => (
                  <p className="text-xs leading-relaxed">{truncate(s.bio, 200) || '—'}</p>
                )} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, scholars, render, className = '' }) {
  return (
    <tr className="border-b border-sand-100 dark:border-ink-800">
      <td className="compare-label-cell">{label}</td>
      {scholars.map(s => (<td key={s.id} className={`compare-data-cell text-center ${className}`}>{render(s)}</td>))}
    </tr>
  );
}
