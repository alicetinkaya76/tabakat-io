import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAsync, getDynasties, useLang } from '../utils/data';
import { getLabel } from '../utils/i18n';
import { formatNumber } from '../utils/helpers';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const ZONE_LABELS = {
  'Anadolu': { en: 'Anatolia' },
  'Arap Yarımadası': { en: 'Arabian Peninsula' },
  'Batı İslam (İspanya/Mağrib)': { en: 'Western Islam (Spain/Maghrib)' },
  'Doğu İran/Mâverâünnehir': { en: 'Eastern Iran/Transoxiana' },
  'Doğu/Batı Afrika': { en: 'East/West Africa' },
  'Güney Asya': { en: 'South Asia' },
  'Güneydoğu Asya': { en: 'Southeast Asia' },
  'Irak/Cezîre': { en: 'Iraq/Jazira' },
  'Kafkasya/Batı İran': { en: 'Caucasus/Western Iran' },
  'Kuzey Afrika': { en: 'North Africa' },
  'Moğol/Tatar Dünyası': { en: 'Mongol/Tatar World' },
  'Mısır/Şam': { en: 'Egypt/Syria' },
  'Selçuklu Dünyası': { en: 'Seljuk World' },
};

const IMP_COLORS = {
  'Kritik': '#dc2626',
  'Yüksek': '#dc9a24',
  'Normal': '#5c6d7d',
  'Düşük': '#a4b0bb',
};

const IMP_EN = { 'Kritik': 'Critical', 'Yüksek': 'High', 'Normal': 'Normal', 'Düşük': 'Low' };
const IMP_ORDER = { 'Kritik': 0, 'Yüksek': 1, 'Normal': 2, 'Düşük': 3 };

export default function DynastiesPage() {
  const { lang } = useLang();
  const { data: dynasties, loading } = useAsync(getDynasties);
  const [query, setQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [impFilter, setImpFilter] = useState('all');
  const [sortBy, setSortBy] = useState('importance');

  const { zones, periods } = useMemo(() => {
    if (!dynasties) return { zones: [], periods: [] };
    const zSet = new Set(), pSet = new Set();
    dynasties.forEach(d => { if (d.zone) zSet.add(d.zone); if (d.period) pSet.add(d.period); });
    return { zones: [...zSet].sort(), periods: [...pSet].sort() };
  }, [dynasties]);

  const filtered = useMemo(() => {
    if (!dynasties) return [];
    let items = dynasties;

    if (query.length >= 2) {
      const q = query.toLowerCase();
      items = items.filter(d =>
        d.tr?.toLowerCase().includes(q) ||
        d.en?.toLowerCase().includes(q) ||
        d.ar?.includes(query)
      );
    }
    if (zoneFilter !== 'all') items = items.filter(d => d.zone === zoneFilter);
    if (periodFilter !== 'all') items = items.filter(d => d.period === periodFilter);
    if (impFilter !== 'all') items = items.filter(d => d.imp === impFilter);

    if (sortBy === 'importance') {
      items = [...items].sort((a, b) => (IMP_ORDER[a.imp] ?? 2) - (IMP_ORDER[b.imp] ?? 2) || a.start - b.start);
    } else if (sortBy === 'start') {
      items = [...items].sort((a, b) => a.start - b.start);
    } else if (sortBy === 'name') {
      items = [...items].sort((a, b) => (lang === 'en' ? a.en : a.tr).localeCompare(lang === 'en' ? b.en : b.tr));
    } else if (sortBy === 'duration') {
      items = [...items].sort((a, b) => (b.end - b.start) - (a.end - a.start));
    }

    return items;
  }, [dynasties, query, zoneFilter, periodFilter, impFilter, sortBy, lang]);

  if (loading) return <Loading />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <SEO title={lang === 'tr' ? 'Hanedanlar' : 'Dynasties'} path="/dynasties" description="Browse 186 Islamic dynasties across history and geography." />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">{lang === 'tr' ? 'Hanedanlar' : 'Dynasties'}</h1>
          <p className="text-sm text-ink-500 dark:text-sand-400 mt-1">
            {formatNumber(filtered.length)} {lang === 'tr' ? 'hanedan' : 'dynasties'}
          </p>
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="text-sm border border-sand-300 dark:border-ink-600 rounded-lg px-3 py-1.5 bg-white dark:bg-ink-800 text-ink-700 dark:text-sand-200"
        >
          <option value="importance">{lang === 'tr' ? 'Önem' : 'Importance'}</option>
          <option value="start">{lang === 'tr' ? 'Kuruluş' : 'Founded'}</option>
          <option value="name">{lang === 'tr' ? 'İsim' : 'Name'}</option>
          <option value="duration">{lang === 'tr' ? 'Süre' : 'Duration'}</option>
        </select>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={lang === 'tr' ? 'Hanedan ara...' : 'Search dynasties...'}
          className="input-search"
        />
        <div className="flex flex-wrap gap-2">
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
            className="text-xs border border-sand-300 dark:border-ink-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-ink-800 text-ink-700 dark:text-sand-200">
            <option value="all">{lang === 'tr' ? 'Tüm Bölgeler' : 'All Zones'}</option>
            {zones.map(z => <option key={z} value={z}>{lang === 'en' ? (ZONE_LABELS[z]?.en || z) : z}</option>)}
          </select>
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}
            className="text-xs border border-sand-300 dark:border-ink-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-ink-800 text-ink-700 dark:text-sand-200">
            <option value="all">{lang === 'tr' ? 'Tüm Dönemler' : 'All Periods'}</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={impFilter} onChange={e => setImpFilter(e.target.value)}
            className="text-xs border border-sand-300 dark:border-ink-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-ink-800 text-ink-700 dark:text-sand-200">
            <option value="all">{lang === 'tr' ? 'Tüm Önem' : 'All Levels'}</option>
            {Object.keys(IMP_ORDER).map(k => <option key={k} value={k}>{lang === 'en' ? IMP_EN[k] : k}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-2xl mb-2">🏰</p>
          <p className="text-ink-500">{getLabel('no_results', lang)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(d => (
            <DynastyCard key={d.id} dynasty={d} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

function DynastyCard({ dynasty: d, lang }) {
  const name = lang === 'en' ? d.en : d.tr;
  const impColor = IMP_COLORS[d.imp] || '#a4b0bb';
  const duration = d.end - d.start;
  const zone = lang === 'en' ? (ZONE_LABELS[d.zone]?.en || d.zone) : d.zone;

  return (
    <Link
      to={`/dynasty/${d.id}`}
      className="card-hover block p-5 group relative overflow-hidden"
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full rounded-l" style={{ backgroundColor: impColor }} />

      <div className="pl-2">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-sand-100 group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors leading-tight">
            {name}
          </h3>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
            style={{ backgroundColor: impColor + '18', color: impColor }}
          >
            {lang === 'en' ? IMP_EN[d.imp] : d.imp}
          </span>
        </div>

        {d.ar && (
          <p className="ar-text text-sm text-ink-500 dark:text-sand-400 mb-2 truncate">{d.ar}</p>
        )}

        <p className="text-sm text-ink-600 dark:text-sand-400 font-mono mb-2">
          {d.start}–{d.end} <span className="text-ink-400">({duration} {lang === 'tr' ? 'yıl' : 'yrs'})</span>
        </p>

        <div className="flex flex-wrap gap-1.5">
          {zone && (
            <span className="badge text-[10px] bg-sand-100 dark:bg-ink-800 text-ink-600 dark:text-sand-400">
              📍 {zone}
            </span>
          )}
          {d.gov && (
            <span className="badge text-[10px] bg-sand-100 dark:bg-ink-800 text-ink-600 dark:text-sand-400">
              {d.gov}
            </span>
          )}
          {d.cap && (
            <span className="badge text-[10px] bg-sand-100 dark:bg-ink-800 text-ink-500 dark:text-sand-500 truncate max-w-[180px]">
              🏛️ {d.cap.split(';')[0].trim()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
