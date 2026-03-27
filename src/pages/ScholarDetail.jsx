import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getScholar, getEdgesForScholar, getSilsileEdges, getBooks, getSearchIndex, useLang } from '../utils/data';
import { getLabel, getFieldLabel, getEraLabel, getMadhabLabel, FIELD_LABELS, ERA_LABELS } from '../utils/i18n';
import { formatDeath, formatBirth, formatLifespan, getDisplayName, getDIALink, formatNumber, parseName } from '../utils/helpers';
import { ScrollReveal } from '../hooks/useInView';
import Loading from '../components/Loading';
import SEO from '../components/SEO';
import SilsileTree from '../components/SilsileTree';

// ──── Education Route Mini-Map ────
function EducationRoute({ cities, lang }) {
  const svgRef = useRef(null);
  const [pathLength, setPathLength] = useState(1000);

  const cityCoords = useMemo(() => {
    const known = {
      'Baghdad': [0.55, 0.42], 'Bağdat': [0.55, 0.42],
      'Damascus': [0.38, 0.38], 'Şam': [0.38, 0.38], 'Dımaşk': [0.38, 0.38],
      'Cairo': [0.32, 0.52], 'Kahire': [0.32, 0.52],
      'Medina': [0.38, 0.62], 'Medine': [0.38, 0.62],
      'Mecca': [0.40, 0.68], 'Mekke': [0.40, 0.68],
      'Kufa': [0.52, 0.46], 'Kûfe': [0.52, 0.46],
      'Basra': [0.56, 0.50],
      'Isfahan': [0.65, 0.38], 'İsfahan': [0.65, 0.38],
      'Nishapur': [0.72, 0.32], 'Nîşâbur': [0.72, 0.32],
      'Bukhara': [0.70, 0.22], 'Buhara': [0.70, 0.22],
      'Samarkand': [0.72, 0.24], 'Semerkand': [0.72, 0.24],
      'Cordoba': [0.05, 0.35], 'Kurtuba': [0.05, 0.35],
      'Istanbul': [0.30, 0.18], 'İstanbul': [0.30, 0.18],
      'Konya': [0.34, 0.25],
      'Jerusalem': [0.36, 0.42], 'Kudüs': [0.36, 0.42],
      'Merv': [0.68, 0.28],
      'Rey': [0.60, 0.34],
      'Herat': [0.72, 0.32],
      'Tus': [0.70, 0.30], 'Tûs': [0.70, 0.30],
      'Aleppo': [0.38, 0.32], 'Halep': [0.38, 0.32],
      'Sanaa': [0.45, 0.78], "San'a": [0.45, 0.78],
      'Kairouan': [0.15, 0.38], 'Kayrevan': [0.15, 0.38],
      'Fez': [0.08, 0.38], 'Fas': [0.08, 0.38],
    };
    return cities.map((c, i) => {
      const name = (lang === 'en' ? c.city_en : c.city_tr) || c.city_en || c.city_tr;
      const match = known[name];
      if (match) return { x: match[0], y: match[1], name };
      const t = cities.length > 1 ? i / (cities.length - 1) : 0.5;
      return { x: 0.15 + t * 0.7, y: 0.3 + Math.sin(t * Math.PI) * 0.15, name };
    });
  }, [cities, lang]);

  useEffect(() => {
    const path = svgRef.current?.querySelector('.edu-route-path');
    if (path) setPathLength(path.getTotalLength());
  }, [cityCoords]);

  if (cities.length < 2) return null;

  const W = 400, H = 160, pad = 30;
  const points = cityCoords.map(c => ({
    x: pad + c.x * (W - pad * 2),
    y: pad + c.y * (H - pad * 2),
    name: c.name,
  }));

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1], curr = points[i];
    const cx = (prev.x + curr.x) / 2;
    pathD += ` Q ${prev.x + (curr.x - prev.x) * 0.5} ${prev.y}, ${cx} ${(prev.y + curr.y) / 2}`;
    if (i === points.length - 1) pathD += ` T ${curr.x} ${curr.y}`;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-sand-200/50 dark:border-ink-700/50 bg-sand-50/50 dark:bg-ink-900/50">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 180 }}>
        {Array.from({ length: 8 }).map((_, i) =>
          Array.from({ length: 4 }).map((_, j) => (
            <circle key={`${i}-${j}`} cx={pad + i * ((W - pad * 2) / 7)} cy={pad + j * ((H - pad * 2) / 3)} r="0.8" className="fill-sand-300/40 dark:fill-ink-600/40" />
          ))
        )}
        <path className="edu-route-path edu-path" d={pathD} fill="none" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" style={{ '--path-length': pathLength }} />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc9a24" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#dc9a24" stopOpacity="1" />
            <stop offset="100%" stopColor="#07c4a3" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" className={i === 0 ? 'fill-gold-500' : i === points.length - 1 ? 'fill-teal-500' : 'fill-gold-400/80'} stroke="white" strokeWidth="1.5" />
            {i === 0 && <circle cx={p.x} cy={p.y} r="4" className="fill-gold-500/30 edu-node-pulse" />}
            <text x={p.x} y={p.y - 8} textAnchor="middle" className="fill-ink-600 dark:fill-sand-300 text-[9px] font-medium" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>{p.name}</text>
            <text x={p.x} y={p.y + 14} textAnchor="middle" className="fill-ink-400 dark:fill-sand-500 text-[7px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ──── Main Component ────
export default function ScholarDetail() {
  const { id } = useParams();
  const decodedId = decodeURIComponent(id);
  const { lang } = useLang();
  const [scholar, setScholar] = useState(null);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bio');
  const [tabKey, setTabKey] = useState(0);
  const [allSilsileEdges, setAllSilsileEdges] = useState([]);
  const [scholarNames, setScholarNames] = useState({});
  const [bookMeta, setBookMeta] = useState([]);

  useEffect(() => {
    setLoading(true);
    setActiveTab('bio');
    Promise.all([
      getScholar(decodedId),
      getEdgesForScholar(decodedId),
      getSilsileEdges(),
      getSearchIndex(),
      getBooks(),
    ]).then(([s, e, silEdges, searchIdx, books]) => {
      setScholar(s);
      setEdges(e);
      setAllSilsileEdges(silEdges || []);
      setBookMeta(books || []);
      // Build name lookup from search index for silsile tree
      if (searchIdx?.data) {
        const lookup = {};
        for (const item of searchIdx.data) {
          const names = parseName(item.n);
          lookup[item.id] = {
            name: names.name_en || names.name_tr || item.id.split(':').pop(),
            field: item.fn,
            death: item.d,
          };
        }
        setScholarNames(lookup);
      }
      setLoading(false);
    });
  }, [decodedId]);

  const switchTab = (key) => { setActiveTab(key); setTabKey(k => k + 1); };


  const matchedBooks = useMemo(() => {
    if (!scholar?.book_list?.length || !bookMeta?.length) return [];
    return bookMeta.filter(b => scholar.book_list.includes(b.openiti_uri));
  }, [scholar?.book_list, bookMeta]);
  if (loading) return <Loading />;
  if (!scholar) return <NotFoundScholar id={decodedId} lang={lang} />;

  const name = getDisplayName(scholar, lang);
  const diaLink = getDIALink(scholar);
  const fieldColor = FIELD_LABELS[scholar.field_normalized]?.color || '#a4b0bb';
  const narrative = lang === 'en' ? scholar.narrative_en : scholar.narrative_tr;
  const silsile = lang === 'en' ? scholar.silsile_chain_en : scholar.silsile_chain_tr;

  const teachers = edges.filter(e => (e.type === 'TEACHER_OF' && e.target === decodedId) || (e.type === 'STUDENT_OF' && e.source === decodedId));
  const students = edges.filter(e => (e.type === 'TEACHER_OF' && e.source === decodedId) || (e.type === 'STUDENT_OF' && e.target === decodedId));
  const contemporaries = edges.filter(e => e.type === 'CONTEMPORARY');
  const crossRefs = edges.filter(e => e.type === 'DIA_CROSS_REF');
  const silsileEdges = edges.filter(e => e.type === 'SILSILE');

  // Check if this scholar appears in global silsile edges for tree view
  const hasSilsileTree = allSilsileEdges.some(e => e.source === decodedId || e.target === decodedId);


  const tabs = [
    { key: 'bio', label: getLabel('biography', lang), show: true },
    { key: 'relations', label: `${getLabel('relations', lang)} (${edges.length})`, show: edges.length > 0 },
    { key: 'narrative', label: getLabel('narrative', lang), show: !!narrative },
    { key: 'silsile', label: getLabel('silsile', lang), show: !!silsile || hasSilsileTree },
  ];

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: scholar.name_en || scholar.name_tr,
    alternateName: scholar.name_ar,
    ...(scholar.birth_ce && { birthDate: String(scholar.birth_ce) }),
    ...(scholar.death_ce && { deathDate: String(scholar.death_ce) }),
    ...(scholar.death_place && { deathPlace: { '@type': 'Place', name: scholar.death_place } }),
    description: scholar.bio,
    url: `https://tabakat.io/scholar/${encodeURIComponent(decodedId)}`,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <SEO
        title={name}
        path={`/scholar/${encodeURIComponent(decodedId)}`}
        description={`${name} ${scholar.death_ce ? `(d. ${scholar.death_ce})` : ''} — ${scholar.bio?.slice(0, 120) || ''}`}
        type="profile"
        jsonLd={jsonLd}
      />
      {/* Breadcrumb */}
      <nav className="text-sm text-ink-400 dark:text-sand-500 mb-6 fade-in">
        <Link to="/browse" className="hover:text-gold-600 dark:hover:text-gold-400 transition-colors">{getLabel('browse', lang)}</Link>
        <span className="mx-2">›</span>
        <span className="text-ink-700 dark:text-sand-200">{name}</span>
      </nav>

      {/* ═══ Hero Card ═══ */}
      <div className="card scholar-hero p-6 sm:p-8 mb-6 fade-in-scale">
        <span className="scholar-hero__calligraphy" aria-hidden="true">{scholar.name_ar?.[0] || 'ع'}</span>
        <div className="relative z-10 flex flex-col sm:flex-row gap-6">
          {/* Icon */}
          <div className="relative shrink-0">
            <div className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: fieldColor + '18', boxShadow: `0 8px 32px -8px ${fieldColor}30` }}>
              <span className="font-arabic text-4xl sm:text-5xl font-bold leading-none" style={{ color: fieldColor }}>{scholar.name_ar?.[0] || 'ع'}</span>
            </div>
            {scholar.importance === 'high' && (
              <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-[10px] font-bold">★</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-900 dark:text-sand-50 leading-tight mb-1">{name}</h1>
            {scholar.name_ar && <p className="ar-text text-xl text-ink-500 dark:text-sand-400 mb-2">{scholar.name_ar}</p>}
            {scholar.kunya && <p className="ar-text text-sm text-ink-400 dark:text-sand-500 mb-3">{scholar.kunya}</p>}

            <div className="flex flex-wrap items-center gap-3 text-sm text-ink-600 dark:text-sand-400 mb-4">
              {scholar.death_ce && (
                <span className="font-mono text-[13px] bg-sand-100/60 dark:bg-ink-800/60 px-2.5 py-0.5 rounded-lg">{formatLifespan(scholar)}</span>
              )}
              {scholar.death_place && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-ink-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                  {scholar.death_place}
                </span>
              )}
              {scholar.region && <span className="text-ink-400 dark:text-sand-500">· {scholar.region}</span>}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {scholar.field_normalized && <span className="badge text-xs" style={{ backgroundColor: fieldColor + '18', color: fieldColor }}>{getFieldLabel(scholar.field_normalized, lang)}</span>}
              {scholar.era_normalized && scholar.era_normalized !== 'unknown' && <span className="badge-era text-xs">{getEraLabel(scholar.era_normalized, lang)}</span>}
              {scholar.madhab_normalized && scholar.madhab_normalized !== '—' && <span className="badge-madhab text-xs">{getMadhabLabel(scholar.madhab_normalized, lang)}</span>}
              {scholar.aqida && <span className="badge text-xs bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-sand-400">{scholar.aqida}</span>}
            </div>

            <div className="flex flex-wrap gap-5 text-sm">
              {scholar.relations_count > 0 && <StatPill label={lang === 'tr' ? 'ilişki' : 'relations'} value={scholar.relations_count} />}
              {scholar.works_count > 0 && <StatPill label={lang === 'tr' ? 'eser' : 'works'} value={scholar.works_count} />}
              {scholar.source_count > 0 && <StatPill label={lang === 'tr' ? 'kaynak' : 'sources'} value={scholar.source_count} />}
              {scholar.tabakat_books > 0 && <StatPill label="tabakat" value={scholar.tabakat_books} />}
            </div>
          </div>

          {/* External links */}
          <div className="flex flex-col gap-2 shrink-0">
            {diaLink && (
              <a href={diaLink} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs !py-1.5 group">
                <span className="mr-1.5">📖</span>{getLabel('dia_link', lang)}
                <svg className="w-3 h-3 ml-1.5 opacity-50 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor"><path d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.5-2a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0V5.56l-5.72 5.72a.75.75 0 11-1.06-1.06l5.72-5.72H12.5a.75.75 0 01-.75-.75z" /></svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sand-200 dark:border-ink-700 mb-6 overflow-x-auto fade-in fade-in-delay-2">
        {tabs.filter(t => t.show).map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${activeTab === t.key ? 'border-gold-500 text-gold-700 dark:text-gold-400' : 'border-transparent text-ink-500 hover:text-ink-700 dark:text-sand-400 dark:hover:text-sand-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div key={tabKey} className="tab-panel-enter">
        {activeTab === 'bio' && <BioTab scholar={scholar} lang={lang} matchedBooks={matchedBooks} />}

        {activeTab === 'relations' && (
          <div className="space-y-6">
            <ScrollReveal><RelationGroup title={getLabel('teachers', lang)} icon="📚" edges={teachers} scholarId={decodedId} lang={lang} /></ScrollReveal>
            <ScrollReveal delay={60}><RelationGroup title={getLabel('students', lang)} icon="🎓" edges={students} scholarId={decodedId} lang={lang} /></ScrollReveal>
            <ScrollReveal delay={120}><RelationGroup title={getLabel('contemporaries', lang)} icon="🤝" edges={contemporaries} scholarId={decodedId} lang={lang} /></ScrollReveal>
            {silsileEdges.length > 0 && <ScrollReveal delay={180}><RelationGroup title={getLabel('silsile', lang)} icon="🔗" edges={silsileEdges} scholarId={decodedId} lang={lang} /></ScrollReveal>}
            {crossRefs.length > 0 && (
              <ScrollReveal delay={220}>
                <div className="card p-6">
                  <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">📖 DİA {lang === 'tr' ? 'Çapraz Atıflar' : 'Cross-References'} ({crossRefs.length})</h3>
                  <div className="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
                    {crossRefs.map((e, i) => {
                      const otherId = e.source === decodedId ? e.target : e.source;
                      const otherName = e.target_name || otherId.split(':').pop();
                      return <Link key={i} to={`/scholar/${encodeURIComponent(otherId)}`} className="text-xs px-2.5 py-1 rounded-lg bg-sand-50 dark:bg-ink-800 text-ink-600 dark:text-sand-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 hover:text-gold-700 dark:hover:text-gold-400 transition-colors">{otherName}</Link>;
                    })}
                  </div>
                </div>
              </ScrollReveal>
            )}
          </div>
        )}

        {activeTab === 'narrative' && narrative && (
          <ScrollReveal>
            <div className="card p-6 sm:p-8">
              <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-4">{getLabel('narrative', lang)}</h3>
              <p className="text-ink-700 dark:text-sand-300 leading-relaxed text-[15px]">{narrative}</p>
              {scholar.narrative_ar && <div className="mt-6 pt-6 border-t border-sand-100 dark:border-ink-700"><p className="ar-text text-ink-600 dark:text-sand-400 leading-loose text-base">{scholar.narrative_ar}</p></div>}
            </div>
          </ScrollReveal>
        )}

        {activeTab === 'silsile' && (silsile || hasSilsileTree) && (
          <div className="space-y-6">
            {hasSilsileTree && (
              <ScrollReveal>
                <div className="card p-6 sm:p-8">
                  <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-4">
                    🌳 {getLabel('silsile_tree', lang)}
                  </h3>
                  <SilsileTree
                    scholarId={decodedId}
                    silsileEdges={allSilsileEdges}
                    scholarNames={scholarNames}
                  />
                </div>
              </ScrollReveal>
            )}
            {silsile && (
              <ScrollReveal delay={hasSilsileTree ? 100 : 0}>
                <div className="card p-6 sm:p-8">
                  <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-4">{getLabel('silsile', lang)}</h3>
                  <p className="text-ink-700 dark:text-sand-300 leading-relaxed">{silsile}</p>
                  {scholar.silsile_chain_ar && <div className="mt-4 pt-4 border-t border-sand-100 dark:border-ink-700"><p className="ar-text text-ink-600 dark:text-sand-400 leading-loose">{scholar.silsile_chain_ar}</p></div>}
                </div>
              </ScrollReveal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ──── Bio Tab ────
function BioTab({ scholar, lang, matchedBooks = [] }) {
  return (
    <div className="space-y-6">
      {scholar.bio && (
        <ScrollReveal><div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">{getLabel('biography', lang)}</h3>
          <p className="text-ink-700 dark:text-sand-300 leading-relaxed">{scholar.bio}</p>
        </div></ScrollReveal>
      )}
      {scholar.notable_work && (
        <ScrollReveal delay={50}><div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">{lang === 'tr' ? 'Bilinen Eseri' : 'Notable Work'}</h3>
          <p className="text-ink-700 dark:text-sand-300">{scholar.notable_work}</p>
        </div></ScrollReveal>
      )}
      {scholar.patron_info_tr && (
        <ScrollReveal delay={80}><div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">{getLabel('patron', lang)}</h3>
          <p className="text-ink-700 dark:text-sand-300">{scholar.patron_info_tr}</p>
        </div></ScrollReveal>
      )}

      <ScrollReveal delay={100}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scholar.nisbe && <DetailItem label="Nisbe" value={scholar.nisbe} />}
          {scholar.birth_ce && <DetailItem label={getLabel('birth', lang)} value={formatBirth(scholar, lang)} />}
          {scholar.death_ce && <DetailItem label={getLabel('death', lang)} value={formatDeath(scholar, lang)} />}
          {scholar.state && <DetailItem label={lang === 'tr' ? 'Devlet' : 'State'} value={scholar.state} />}
          {scholar.ethnicity && <DetailItem label={lang === 'tr' ? 'Etnisite' : 'Ethnicity'} value={scholar.ethnicity} />}
          {scholar.sub_fields?.length > 0 && <DetailItem label={lang === 'tr' ? 'Alt Alanlar' : 'Sub-fields'} value={scholar.sub_fields.join(', ')} />}
          {scholar.genres?.length > 0 && <DetailItem label={lang === 'tr' ? 'Türler' : 'Genres'} value={scholar.genres.join(', ')} />}
          {scholar.tabaqa && <DetailItem label={lang === 'tr' ? 'Hadis Tabakası' : 'Hadith Layer'} value={`${scholar.tabaqa}`} />}
          {scholar.rawi_rank && <DetailItem label={lang === 'tr' ? 'Râvi Derecesi' : 'Narrator Rank'} value={scholar.rawi_rank} />}
          {scholar.hadith_count > 0 && <DetailItem label={lang === 'tr' ? 'Hadis Sayısı' : 'Hadith Count'} value={formatNumber(scholar.hadith_count)} />}
        </div>
      </ScrollReveal>

      {scholar.places?.length > 0 && (
        <ScrollReveal delay={130}><div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">{lang === 'tr' ? 'Yerler' : 'Places'}</h3>
          <div className="flex flex-wrap gap-2">
            {scholar.places.map((p, i) => (
              <Link key={i} to={`/city/${encodeURIComponent(p.modern || p.name)}`} className="badge bg-sand-100 dark:bg-ink-800 text-ink-700 dark:text-sand-300 hover:bg-gold-50 dark:hover:bg-gold-900/20 hover:text-gold-700 dark:hover:text-gold-400 transition-colors cursor-pointer">
                {p.modern || p.name}<span className="text-ink-400 dark:text-sand-500 ml-1 text-[10px]">({p.role})</span>
              </Link>
            ))}
          </div>
        </div></ScrollReveal>
      )}

      {scholar.education_cities?.length > 0 && (
        <ScrollReveal delay={160}><div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-4">{getLabel('education', lang)}</h3>
          {scholar.education_cities.length >= 2 && <div className="mb-4"><EducationRoute cities={scholar.education_cities} lang={lang} /></div>}
          <div className="flex items-center gap-2 flex-wrap">
            {scholar.education_cities.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <svg className="w-4 h-4 text-gold-400 dark:text-gold-500 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" /></svg>}
                <Link to={`/city/${encodeURIComponent(lang === 'en' ? c.city_en : c.city_tr)}`} className={`badge ${i === 0 ? 'bg-gold-100 text-gold-800 dark:bg-gold-900/30 dark:text-gold-400' : 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400'} hover:opacity-80 transition-opacity cursor-pointer`}>{lang === 'en' ? c.city_en : c.city_tr}</Link>
              </span>
            ))}
          </div>
        </div></ScrollReveal>
      )}

      {/* Linked Books */}
      {matchedBooks.length > 0 && (
        <ScrollReveal delay={180}><div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">
            📚 {lang === 'tr' ? 'İlişkili Tabakat Kitapları' : 'Related Tabaqāt Books'} ({matchedBooks.length})
          </h3>
          <div className="space-y-3">
            {matchedBooks.map((book, i) => (
              <Link key={i} to={`/book/${encodeURIComponent(book.openiti_uri)}`} className="block group">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-sand-50 dark:hover:bg-ink-800 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center text-gold-700 dark:text-gold-400 text-sm shrink-0">📖</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800 dark:text-sand-200 group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors leading-tight">{book.title_tr}</p>
                    {book.title_ar && <p className="ar-text text-xs text-ink-400 dark:text-sand-500 mt-0.5 truncate">{book.title_ar}</p>}
                    <p className="text-xs text-ink-500 dark:text-sand-400 mt-1">
                      {book.author_tr}
                      {book.death_hijri && <span className="font-mono text-ink-400 dark:text-sand-500 ml-1">(d. {book.death_hijri} H)</span>}
                      {book.bio_count && <span className="ml-2 text-ink-400 dark:text-sand-500">· {parseInt(book.bio_count).toLocaleString('tr-TR')} {lang === 'tr' ? 'biyografi' : 'biographies'}</span>}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div></ScrollReveal>
      )}

      {scholar.sources?.length > 0 && (
        <ScrollReveal delay={210}><div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">{getLabel('sources', lang)}</h3>
          <div className="flex flex-wrap gap-2">
            {scholar.sources.map(s => <span key={s} className="badge bg-sand-100 dark:bg-ink-800 text-ink-600 dark:text-sand-400 uppercase text-[10px] tracking-wider">{s}</span>)}
          </div>
          {scholar.book_list?.length > 0 && matchedBooks.length === 0 && (
            <div className="mt-3 pt-3 border-t border-sand-100 dark:border-ink-700">
              <p className="text-xs text-ink-400 dark:text-sand-500 mb-1.5">Tabakat {lang === 'tr' ? 'kitapları' : 'books'}:</p>
              <div className="flex flex-wrap gap-1.5">{scholar.book_list.map(b => <span key={b} className="text-xs font-mono text-ink-500 dark:text-sand-400 bg-sand-50 dark:bg-ink-800 px-2 py-0.5 rounded">{b}</span>)}</div>
            </div>
          )}
        </div></ScrollReveal>
      )}
    </div>
  );
}

// ──── Sub-components ────
function StatPill({ label, value }) {
  return (
    <span className="text-ink-500 dark:text-sand-400">
      <strong className="text-ink-800 dark:text-sand-200 font-display text-base">{value}</strong>
      <span className="ml-1 text-xs">{label}</span>
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="card p-4 group hover:border-gold-300/30 dark:hover:border-gold-700/30 transition-colors">
      <p className="text-xs text-ink-400 dark:text-sand-500 font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-ink-700 dark:text-sand-300 text-sm">{value}</p>
    </div>
  );
}

function RelationGroup({ title, icon, edges, scholarId, lang }) {
  const [expanded, setExpanded] = useState(false);
  if (edges.length === 0) return null;
  const shown = expanded ? edges : edges.slice(0, 20);
  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-ink-500 dark:text-sand-400 uppercase tracking-wider mb-3">{icon} {title} ({edges.length})</h3>
      <div className="space-y-0.5">
        {shown.map((e, i) => {
          const otherId = e.source === scholarId ? e.target : e.source;
          const otherName = e.target_name || otherId.split(':').pop();
          return <Link key={i} to={`/scholar/${encodeURIComponent(otherId)}`} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sand-50 dark:hover:bg-ink-800 transition-colors group"><div className="w-1.5 h-1.5 rounded-full bg-gold-400 group-hover:scale-125 transition-transform" /><span className="text-sm text-ink-700 dark:text-sand-300 group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors">{otherName}</span></Link>;
        })}
      </div>
      {edges.length > 20 && !expanded && (
        <button onClick={() => setExpanded(true)} className="mt-2 text-xs text-gold-600 dark:text-gold-400 hover:text-gold-700 dark:hover:text-gold-300 font-medium transition-colors px-3">
          +{edges.length - 20} {lang === 'tr' ? 'daha göster' : 'show more'}…
        </button>
      )}
    </div>
  );
}

function NotFoundScholar({ id, lang }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center fade-in">
      <div className="drift-float inline-block mb-6"><span className="text-6xl">🔍</span></div>
      <h2 className="font-display text-2xl font-semibold text-ink-700 dark:text-sand-200 mb-2">{lang === 'tr' ? 'Âlim bulunamadı' : 'Scholar not found'}</h2>
      <p className="text-sm text-ink-400 dark:text-sand-500 font-mono mb-6">{id}</p>
      <Link to="/browse" className="btn-primary text-sm">← {lang === 'tr' ? 'Keşfet' : 'Browse'}</Link>
    </div>
  );
}
