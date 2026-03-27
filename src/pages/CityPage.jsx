import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { getCities, getSearchIndex, useLang } from '../utils/data';
import { getLabel, getFieldLabel, getEraLabel, FIELD_LABELS, ERA_LABELS } from '../utils/i18n';
import { formatNumber, parseName, getDisplayName } from '../utils/helpers';
import ScholarCard from '../components/ScholarCard';
import { ScrollReveal } from '../hooks/useInView';
import Loading from '../components/Loading';
import { Helmet } from 'react-helmet-async';

export default function CityPage() {
  const { name } = useParams();
  const decodedName = decodeURIComponent(name);
  const { lang } = useLang();
  const [city, setCity] = useState(null);
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('importance');
  const [showAll, setShowAll] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getCities(), getSearchIndex()]).then(([cities, searchIdx]) => {
      // Find city by TR or EN name
      const found = cities.find(c =>
        c.tr?.toLowerCase() === decodedName.toLowerCase() ||
        c.en?.toLowerCase() === decodedName.toLowerCase()
      );
      setCity(found || null);

      // Find scholars in this city's region
      if (found && searchIdx?.data) {
        const cityNames = [found.tr, found.en, found.tr?.toLowerCase(), found.en?.toLowerCase()].filter(Boolean);
        const matched = searchIdx.data.filter(s => {
          const region = s.r || '';
          // Match by region or ID containing city
          return cityNames.some(cn =>
            region.toLowerCase().includes(cn.toLowerCase()) ||
            (s.id || '').toLowerCase().includes(cn.toLowerCase())
          );
        });
        setScholars(matched);
      }
      setLoading(false);
    });
  }, [decodedName]);

  const sorted = useMemo(() => {
    let items = [...scholars];
    if (sortBy === 'death') items.sort((a, b) => (a.d || 9999) - (b.d || 9999));
    else if (sortBy === 'name') items.sort((a, b) => (a.n || '').localeCompare(b.n || ''));
    else {
      const impOrder = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => {
        const ia = impOrder[a.i] ?? 1, ib = impOrder[b.i] ?? 1;
        return ia !== ib ? ia - ib : (b.s || 0) - (a.s || 0);
      });
    }
    return items;
  }, [scholars, sortBy]);

  // Field distribution
  const fieldDist = useMemo(() => {
    const counts = {};
    for (const s of scholars) {
      if (s.fn) counts[s.fn] = (counts[s.fn] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [scholars]);

  // Era distribution
  const eraDist = useMemo(() => {
    const counts = {};
    for (const s of scholars) {
      if (s.en && s.en !== 'unknown') counts[s.en] = (counts[s.en] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => (ERA_LABELS[a[0]]?.order ?? 99) - (ERA_LABELS[b[0]]?.order ?? 99));
  }, [scholars]);

  // Mini map
  useEffect(() => {
    if (!city || !mapRef.current || mapInstance.current) return;
    import('leaflet').then(L => {
      const map = L.map(mapRef.current, {
        center: [city.lat, city.lon],
        zoom: 6,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 19,
      }).addTo(map);
      L.circleMarker([city.lat, city.lon], {
        radius: 8, fillColor: '#dc9a24', color: '#fff', weight: 2, fillOpacity: 0.9,
      }).addTo(map);
      mapInstance.current = map;
    });
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [city]);

  const mapToScholar = (item) => {
    const names = parseName(item.n);
    return {
      id: item.id, name_tr: names.name_tr, name_en: names.name_en, name_ar: names.name_ar,
      death_ce: item.d, field_normalized: item.fn, era_normalized: item.en,
      madhab_normalized: item.mn, importance: item.i, source_count: item.s, region: item.r,
    };
  };

  if (loading) return <Loading />;

  if (!city) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center fade-in">
      <div className="drift-float inline-block mb-6"><span className="text-6xl">🏛️</span></div>
      <h2 className="font-display text-2xl font-semibold text-ink-700 dark:text-sand-200 mb-2">
        {lang === 'tr' ? 'Şehir bulunamadı' : 'City not found'}
      </h2>
      <p className="text-sm text-ink-400 dark:text-sand-500 font-mono mb-6">{decodedName}</p>
      <Link to="/map" className="btn-primary text-sm">← {getLabel('map', lang)}</Link>
    </div>
  );

  const cityName = lang === 'en' ? city.en : city.tr;
  const cityRole = lang === 'en' ? city.role_en : city.role_tr;

  return (
    <>
      <Helmet>
        <title>{cityName} — tabakat.io</title>
        <meta name="description" content={`${cityName}: ${cityRole || ''} — ${scholars.length} scholars`} />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-ink-400 dark:text-sand-500 mb-6 fade-in">
          <Link to="/map" className="hover:text-gold-600 dark:hover:text-gold-400 transition-colors">{getLabel('map', lang)}</Link>
          <span className="mx-2">›</span>
          <span className="text-ink-700 dark:text-sand-200">{cityName}</span>
        </nav>

        {/* Hero */}
        <div className="card city-hero p-6 sm:p-8 mb-8 fade-in-scale">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-900 dark:text-sand-50 leading-tight mb-2">
                {cityName}
              </h1>
              {city.tr !== city.en && (
                <p className="text-lg text-ink-500 dark:text-sand-400 mb-1">{lang === 'en' ? city.tr : city.en}</p>
              )}
              {cityRole && (
                <p className="text-sm text-gold-700 dark:text-gold-400 mb-4">{cityRole}</p>
              )}
              {city.narr_tr && (
                <p className="text-sm text-ink-600 dark:text-sand-300 leading-relaxed line-clamp-4 mb-4">
                  {lang === 'en' ? (city.narr_en || city.narr_tr) : city.narr_tr}
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-ink-500 dark:text-sand-400">
                  <strong className="text-ink-800 dark:text-sand-200 font-display text-base">{formatNumber(scholars.length)}</strong>
                  <span className="ml-1 text-xs">{lang === 'tr' ? 'âlim' : 'scholars'}</span>
                </span>
                {city.pop && (
                  <span className="text-ink-500 dark:text-sand-400">
                    <strong className="text-ink-800 dark:text-sand-200 font-display text-base">{formatNumber(city.pop)}</strong>
                    <span className="ml-1 text-xs">{lang === 'tr' ? 'nüfus (zirve)' : 'peak pop.'}</span>
                  </span>
                )}
              </div>
            </div>
            {/* Mini map */}
            <div className="w-full md:w-72 h-36 sm:h-44 rounded-xl overflow-hidden border border-sand-200/50 dark:border-ink-700/50 shrink-0 order-first md:order-last">
              <div ref={mapRef} className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Stats row */}
        {(fieldDist.length > 0 || eraDist.length > 0) && (
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {fieldDist.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-xs font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">
                    {lang === 'tr' ? 'Alan Dağılımı' : 'Field Distribution'}
                  </h3>
                  <div className="space-y-2">
                    {fieldDist.map(([field, count]) => (
                      <div key={field} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: FIELD_LABELS[field]?.color || '#a4b0bb' }} />
                        <span className="text-xs text-ink-600 dark:text-sand-300 flex-1 truncate">{getFieldLabel(field, lang)}</span>
                        <span className="text-xs font-mono text-ink-400 dark:text-sand-500">{count}</span>
                        <div className="w-20 h-1.5 rounded-full bg-sand-100 dark:bg-ink-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(count / scholars.length) * 100}%`, backgroundColor: FIELD_LABELS[field]?.color || '#a4b0bb' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {eraDist.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-xs font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">
                    {lang === 'tr' ? 'Dönem Dağılımı' : 'Era Distribution'}
                  </h3>
                  <div className="space-y-2">
                    {eraDist.map(([era, count]) => (
                      <div key={era} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ERA_LABELS[era]?.color || '#c9d1d7' }} />
                        <span className="text-xs text-ink-600 dark:text-sand-300 flex-1 truncate">{getEraLabel(era, lang)}</span>
                        <span className="text-xs font-mono text-ink-400 dark:text-sand-500">{count}</span>
                        <div className="w-20 h-1.5 rounded-full bg-sand-100 dark:bg-ink-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(count / scholars.length) * 100}%`, backgroundColor: ERA_LABELS[era]?.color || '#c9d1d7' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Scholar list */}
        <ScrollReveal delay={100}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-ink-800 dark:text-sand-100">
              {lang === 'tr' ? 'Âlimler' : 'Scholars'}
            </h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-sand-300 dark:border-ink-600 rounded-lg px-3 py-1.5 bg-white dark:bg-ink-800 text-ink-700 dark:text-sand-200 focus:outline-none focus:ring-2 focus:ring-gold-300"
            >
              <option value="importance">{lang === 'tr' ? 'Önem' : 'Importance'}</option>
              <option value="death">{lang === 'tr' ? 'Vefat' : 'Death date'}</option>
              <option value="name">{lang === 'tr' ? 'İsim' : 'Name'}</option>
            </select>
          </div>

          {sorted.length === 0 ? (
            <div className="text-center py-12 card">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-ink-500 dark:text-sand-400">{getLabel('no_results', lang)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sorted.slice(0, showAll ? sorted.length : 60).map(item => (
                <ScholarCard key={item.id} scholar={mapToScholar(item)} />
              ))}
            </div>
          )}
          {sorted.length > 60 && !showAll && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAll(true)}
                className="btn-outline text-sm"
              >
                {lang === 'tr' ? `Tümünü göster (${sorted.length})` : `Show all (${sorted.length})`}
              </button>
            </div>
          )}
        </ScrollReveal>
      </div>
    </>
  );
}
