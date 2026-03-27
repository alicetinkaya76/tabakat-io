import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getDynasties, getSearchIndex, useLang } from '../utils/data';
import { getLabel, getFieldLabel, ERA_LABELS, FIELD_LABELS } from '../utils/i18n';
import { formatNumber, parseName } from '../utils/helpers';
import ScholarCard from '../components/ScholarCard';
import { ScrollReveal } from '../hooks/useInView';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

export default function DynastyPage() {
  const { id } = useParams();
  const { lang } = useLang();
  const [dynasty, setDynasty] = useState(null);
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('narrative');
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getDynasties(), getSearchIndex()]).then(([dynasties, searchIdx]) => {
      const found = dynasties.find(d => String(d.id) === id);
      setDynasty(found || null);

      if (found && searchIdx?.data) {
        // Match scholars by era or time range
        const matched = searchIdx.data.filter(s => {
          if (!s.d) return false;
          return s.d >= found.start && s.d <= found.end + 30;
        });
        // Sort by importance
        const impOrder = { high: 0, medium: 1, low: 2 };
        matched.sort((a, b) => {
          const ia = impOrder[a.i] ?? 1, ib = impOrder[b.i] ?? 1;
          return ia !== ib ? ia - ib : (b.s || 0) - (a.s || 0);
        });
        setScholars(matched);
      }
      setLoading(false);
    });
  }, [id]);

  // Mini map
  useEffect(() => {
    if (!dynasty || !mapRef.current || mapInstance.current) return;
    if (!dynasty.lat || !dynasty.lon) return;
    import('leaflet').then(L => {
      const map = L.map(mapRef.current, {
        center: [dynasty.lat, dynasty.lon],
        zoom: 5,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        attributionControl: false,
      });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 19,
      }).addTo(map);
      L.circleMarker([dynasty.lat, dynasty.lon], {
        radius: 10, fillColor: '#dc9a24', color: '#fff', weight: 2, fillOpacity: 0.8,
      }).addTo(map);
      mapInstance.current = map;
    });
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [dynasty]);

  const mapToScholar = (item) => {
    const names = parseName(item.n);
    return {
      id: item.id, name_tr: names.name_tr, name_en: names.name_en, name_ar: names.name_ar,
      death_ce: item.d, field_normalized: item.fn, era_normalized: item.en,
      madhab_normalized: item.mn, importance: item.i, source_count: item.s, region: item.r,
    };
  };

  // Field distribution
  const fieldDist = useMemo(() => {
    const counts = {};
    for (const s of scholars) {
      if (s.fn) counts[s.fn] = (counts[s.fn] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [scholars]);

  if (loading) return <Loading />;

  if (!dynasty) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center fade-in">
      <div className="drift-float inline-block mb-6"><span className="text-6xl">🏰</span></div>
      <h2 className="font-display text-2xl font-semibold text-ink-700 dark:text-sand-200 mb-2">
        {lang === 'tr' ? 'Hanedan bulunamadı' : 'Dynasty not found'}
      </h2>
      <Link to="/map" className="btn-primary text-sm mt-4 inline-block">← {getLabel('map', lang)}</Link>
    </div>
  );

  const name = lang === 'en' ? dynasty.en : dynasty.tr;
  const narrative = lang === 'en' ? dynasty.narr_en : dynasty.narr_tr;
  const keyPoint = lang === 'en' ? dynasty.key_en : dynasty.key_tr;
  const rise = lang === 'en' ? dynasty.rise_en : dynasty.rise_tr;
  const fall = lang === 'en' ? dynasty.fall_en : dynasty.fall_tr;
  const ctxBefore = lang === 'en' ? dynasty.ctx_b_en : dynasty.ctx_b_tr;
  const ctxAfter = lang === 'en' ? dynasty.ctx_a_en : dynasty.ctx_a_tr;
  const yearRange = `${dynasty.start}–${dynasty.end} CE`;

  const sections = [
    { key: 'narrative', label: lang === 'tr' ? 'Anlatı' : 'Narrative', show: !!narrative },
    { key: 'timeline', label: lang === 'tr' ? 'Yükseliş & Çöküş' : 'Rise & Fall', show: !!(rise || fall) },
    { key: 'scholars', label: `${getLabel('dynasty_scholars', lang)} (${scholars.length})`, show: scholars.length > 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <SEO
        title={name}
        path={`/dynasty/${id}`}
        description={`${name} (${yearRange}) — ${keyPoint?.slice(0, 120) || ''}`}
      />

      {/* Breadcrumb */}
      <nav className="text-sm text-ink-400 dark:text-sand-500 mb-6 fade-in">
        <Link to="/map" className="hover:text-gold-600 dark:hover:text-gold-400 transition-colors">{getLabel('map', lang)}</Link>
        <span className="mx-2">›</span>
        <span className="text-ink-700 dark:text-sand-200">{name}</span>
      </nav>

      {/* Hero */}
      <div className="card dynasty-hero p-6 sm:p-8 mb-8 fade-in-scale">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center text-2xl">🏰</div>
              <div>
                <span className={`badge text-[10px] ${dynasty.imp === 'Yüksek' ? 'bg-gold-200 text-gold-900 dark:bg-gold-900/40 dark:text-gold-300' : 'bg-sand-200 text-sand-700 dark:bg-ink-800 dark:text-sand-400'}`}>
                  {dynasty.imp === 'Yüksek' ? '★ ' : ''}{dynasty.imp}
                </span>
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-900 dark:text-sand-50 leading-tight mb-1">
              {name}
            </h1>
            {dynasty.ar && (
              <p className="ar-text text-xl text-ink-500 dark:text-sand-400 mb-3">{dynasty.ar}</p>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-ink-600 dark:text-sand-400 mb-4">
              <span className="font-mono text-[13px] bg-sand-100/60 dark:bg-ink-800/60 px-2.5 py-0.5 rounded-lg">{yearRange}</span>
              {dynasty.zone && <span className="flex items-center gap-1">📍 {dynasty.zone}</span>}
              {dynasty.gov && <span className="text-ink-400 dark:text-sand-500">· {dynasty.gov}</span>}
            </div>

            {keyPoint && (
              <p className="text-sm text-gold-700 dark:text-gold-400 leading-relaxed mb-4 italic">{keyPoint}</p>
            )}

            <div className="flex flex-wrap gap-5 text-sm">
              <span className="text-ink-500 dark:text-sand-400">
                <strong className="text-ink-800 dark:text-sand-200 font-display text-base">{formatNumber(scholars.length)}</strong>
                <span className="ml-1 text-xs">{lang === 'tr' ? 'âlim' : 'scholars'}</span>
              </span>
              {dynasty.cap && (
                <span className="text-ink-500 dark:text-sand-400">
                  <span className="text-xs">🏛️ {dynasty.cap}</span>
                </span>
              )}
              {dynasty.eth && (
                <span className="text-ink-500 dark:text-sand-400">
                  <span className="text-xs">{dynasty.eth}</span>
                </span>
              )}
            </div>
          </div>

          {/* Mini map */}
          {dynasty.lat && dynasty.lon && (
            <div className="w-full md:w-72 h-44 rounded-xl overflow-hidden border border-sand-200/50 dark:border-ink-700/50 shrink-0">
              <div ref={mapRef} className="w-full h-full" />
            </div>
          )}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-sand-200 dark:border-ink-700 mb-6 overflow-x-auto fade-in fade-in-delay-2">
        {sections.filter(s => s.show).map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
              activeSection === s.key
                ? 'border-gold-500 text-gold-700 dark:text-gold-400'
                : 'border-transparent text-ink-500 hover:text-ink-700 dark:text-sand-400 dark:hover:text-sand-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Narrative */}
      {activeSection === 'narrative' && narrative && (
        <div className="space-y-6 tab-panel-enter">
          <ScrollReveal>
            <div className="card p-6 sm:p-8">
              <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-4">
                {lang === 'tr' ? 'Anlatı' : 'Narrative'}
              </h3>
              <p className="text-ink-700 dark:text-sand-300 leading-relaxed text-[15px]">{narrative}</p>
              {dynasty.narr_ar && (
                <div className="mt-6 pt-6 border-t border-sand-100 dark:border-ink-700">
                  <p className="ar-text text-ink-600 dark:text-sand-400 leading-loose text-base">{dynasty.narr_ar}</p>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Info grid */}
          <ScrollReveal delay={80}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dynasty.cap && <InfoCard label={getLabel('dynasty_capital', lang)} value={dynasty.cap} icon="🏛️" />}
              {dynasty.gov && <InfoCard label={getLabel('dynasty_governance', lang)} value={dynasty.gov} icon="⚖️" />}
              {dynasty.eth && <InfoCard label={getLabel('dynasty_ethnicity', lang)} value={dynasty.eth} icon="🏳️" />}
              {dynasty.zone && <InfoCard label={getLabel('dynasty_zone', lang)} value={dynasty.zone} icon="🌍" />}
              {dynasty.period && <InfoCard label={getLabel('dynasty_period', lang)} value={dynasty.period} icon="📅" />}
            </div>
          </ScrollReveal>

          {/* Field distribution */}
          {fieldDist.length > 0 && (
            <ScrollReveal delay={120}>
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
                      <div className="w-24 h-1.5 rounded-full bg-sand-100 dark:bg-ink-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((count / scholars.length) * 100, 100)}%`, backgroundColor: FIELD_LABELS[field]?.color || '#a4b0bb' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>
      )}

      {/* Rise & Fall */}
      {activeSection === 'timeline' && (
        <div className="space-y-6 tab-panel-enter">
          {ctxBefore && (
            <ScrollReveal>
              <div className="card p-6 border-l-4 border-l-sand-400 dark:border-l-ink-500">
                <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">
                  ⏪ {getLabel('dynasty_context_before', lang)}
                </h3>
                <p className="text-ink-700 dark:text-sand-300 leading-relaxed">{ctxBefore}</p>
              </div>
            </ScrollReveal>
          )}

          {rise && (
            <ScrollReveal delay={60}>
              <div className="card p-6 border-l-4 border-l-teal-500 dark:border-l-teal-600">
                <h3 className="text-sm font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-3">
                  📈 {getLabel('dynasty_rise', lang)}
                </h3>
                <p className="text-ink-700 dark:text-sand-300 leading-relaxed">{rise}</p>
              </div>
            </ScrollReveal>
          )}

          {fall && (
            <ScrollReveal delay={120}>
              <div className="card p-6 border-l-4 border-l-red-400 dark:border-l-red-600">
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3">
                  📉 {getLabel('dynasty_fall', lang)}
                </h3>
                <p className="text-ink-700 dark:text-sand-300 leading-relaxed">{fall}</p>
              </div>
            </ScrollReveal>
          )}

          {ctxAfter && (
            <ScrollReveal delay={180}>
              <div className="card p-6 border-l-4 border-l-sand-400 dark:border-l-ink-500">
                <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">
                  ⏩ {getLabel('dynasty_context_after', lang)}
                </h3>
                <p className="text-ink-700 dark:text-sand-300 leading-relaxed">{ctxAfter}</p>
              </div>
            </ScrollReveal>
          )}

          {/* Arabic versions */}
          {(dynasty.rise_ar || dynasty.fall_ar) && (
            <ScrollReveal delay={240}>
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-4">العربية</h3>
                {dynasty.rise_ar && <p className="ar-text text-ink-600 dark:text-sand-400 leading-loose mb-4">{dynasty.rise_ar}</p>}
                {dynasty.fall_ar && <p className="ar-text text-ink-600 dark:text-sand-400 leading-loose">{dynasty.fall_ar}</p>}
              </div>
            </ScrollReveal>
          )}
        </div>
      )}

      {/* Scholars */}
      {activeSection === 'scholars' && (
        <ScrollReveal>
          <div className="tab-panel-enter">
            {scholars.length === 0 ? (
              <div className="text-center py-12 card">
                <p className="text-2xl mb-2">🔍</p>
                <p className="text-ink-500 dark:text-sand-400">{getLabel('no_results', lang)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {scholars.slice(0, 60).map(item => (
                  <ScholarCard key={item.id} scholar={mapToScholar(item)} />
                ))}
              </div>
            )}
            {scholars.length > 60 && (
              <p className="text-center text-sm text-ink-400 dark:text-sand-500 mt-6">
                {lang === 'tr' ? `İlk 60 gösterildi (toplam ${scholars.length})` : `Showing first 60 of ${scholars.length}`}
              </p>
            )}
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div className="card p-4 group hover:border-gold-300/30 dark:hover:border-gold-700/30 transition-colors">
      <p className="text-xs text-ink-400 dark:text-sand-500 font-medium uppercase tracking-wider mb-1">
        {icon} {label}
      </p>
      <p className="text-ink-700 dark:text-sand-300 text-sm">{value}</p>
    </div>
  );
}
