import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAsync, getStats, getSearchIndex, useLang } from '../utils/data';
import SEO from '../components/SEO';
import { getLabel, FIELD_LABELS, ERA_LABELS } from '../utils/i18n';
import { formatNumber, parseName } from '../utils/helpers';
import { ScrollReveal } from '../hooks/useInView';
import Loading from '../components/Loading';

// Animated counter hook
function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const step = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function StatCounter({ value, label, icon, to, delay = 0 }) {
  const { count, ref } = useCounter(value);
  return (
    <Link
      ref={ref}
      to={to}
      className="card p-6 text-center hover-lift group"
      style={{ animationDelay: `${delay}s` }}
    >
      <span className="text-2xl block mb-3 opacity-80 group-hover:opacity-100 transition-opacity">{icon}</span>
      <p className="stat-number text-4xl sm:text-5xl group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
        {count.toLocaleString('tr-TR')}
      </p>
      <p className="text-xs text-ink-500 dark:text-sand-400 mt-2 font-medium uppercase tracking-wider">{label}</p>
    </Link>
  );
}

export default function HomePage() {
  const { lang } = useLang();
  const { data: stats, loading: loadingStats } = useAsync(getStats);
  const { data: searchIdx } = useAsync(getSearchIndex);
  const [featured, setFeatured] = useState([]);

  // Pick 6 featured high-importance scholars
  useEffect(() => {
    if (!searchIdx?.data) return;
    const high = searchIdx.data.filter(s => s.i === 'high' && s.d);
    const shuffled = high.sort(() => Math.random() - 0.5).slice(0, 6);
    setFeatured(shuffled);
  }, [searchIdx]);

  if (loadingStats) return <Loading />;
  if (!stats) return null;

  const topFields = Object.entries(stats.fields).slice(0, 8);
  const topEras = Object.entries(stats.eras)
    .filter(([k]) => ERA_LABELS[k])
    .sort((a, b) => (ERA_LABELS[a[0]]?.order ?? 99) - (ERA_LABELS[b[0]]?.order ?? 99));

  const t = lang === 'tr' ? TR : EN;

  return (
    <div className="min-h-screen">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden hero-gradient text-sand-50">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-pattern-geo opacity-[0.06]" />
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 select-none pointer-events-none hidden lg:block">
          <span className="font-arabic text-[280px] leading-none text-gold-500/[0.035] block" style={{filter:'blur(0.5px)'}}>
            طبقات
          </span>
        </div>
        <div className="absolute left-0 bottom-0 w-1/2 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            {/* Kicker */}
            <div className="flex items-center gap-3 mb-6 fade-in">
              <div className="w-8 h-px bg-gold-500/60" />
              <span className="text-gold-400/90 font-mono text-xs tracking-[0.2em] uppercase">
                {t.kicker}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-sand-50 leading-[1.05] mb-6 fade-in fade-in-delay-1">
              <span className="text-balance">tabakat</span><span className="text-gold-400">.io</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-sand-300/90 leading-relaxed mb-10 max-w-xl fade-in fade-in-delay-2" style={{textWrap:'balance'}}>
              {t.subtitle}
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 fade-in fade-in-delay-3">
              <Link to="/browse" className="group inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-ink-950 font-semibold rounded-lg hover:bg-gold-400 transition-all duration-200 shadow-lg shadow-gold-500/20 hover:shadow-gold-400/30 hover:-translate-y-0.5">
                {t.explore}
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link to="/map" className="inline-flex items-center gap-2 px-6 py-3 border border-sand-600/50 text-sand-200 font-medium rounded-lg hover:bg-sand-800/20 hover:border-sand-500/50 transition-all duration-200">
                {t.openMap}
              </Link>
            </div>

            {/* Quick badges */}
            <div className="flex flex-wrap gap-2 mt-10 fade-in fade-in-delay-4">
              {['23,142 scholars', '28,531 relations', '12,206 mapped', '435 tabaqāt books'].map((item, i) => (
                <span key={i} className="text-[11px] text-sand-400/70 font-mono tracking-wide bg-sand-100/[0.06] px-3 py-1 rounded-full border border-sand-500/10">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ KEY STATS ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 stagger-children">
          <StatCounter value={stats.total_scholars} label={t.scholars} icon="📚" to="/browse" delay={0} />
          <StatCounter value={stats.total_edges} label={t.relations} icon="🔗" to="/network" delay={0.1} />
          <StatCounter value={stats.geocoded} label={t.mapped} icon="🗺️" to="/map" delay={0.2} />
          <StatCounter value={stats.with_dia} label="DİA" icon="📖" to="/browse" delay={0.3} />
        </div>
      </section>

      {/* ═══ FEATURED SCHOLARS ═══ */}
      {featured.length > 0 && (
        <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-8">
          <div className="divider-ornament mb-8">
            <span className="text-xs text-ink-400 dark:text-sand-500 font-mono tracking-[0.15em] uppercase">
              {t.featuredScholars}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
            {featured.map(s => {
              const names = parseName(s.n);
              const displayName = lang === 'tr' ? (names.name_tr || names.name_en) : (names.name_en || names.name_tr);
              const fieldColor = FIELD_LABELS[s.fn]?.color || '#a4b0bb';
              return (
                <Link
                  key={s.id}
                  to={`/scholar/${encodeURIComponent(s.id)}`}
                  className="card p-4 text-center hover-lift group"
                >
                  <div
                    className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                    style={{ backgroundColor: fieldColor + '15' }}
                  >
                    <span className="font-arabic text-xl font-bold" style={{ color: fieldColor }}>
                      {names.name_ar?.[0] || 'ع'}
                    </span>
                  </div>
                  <p className="text-sm font-display font-semibold text-ink-800 dark:text-sand-200 group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors leading-tight line-clamp-2">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-ink-400 dark:text-sand-500 font-mono mt-1.5">
                    d. {s.d} CE
                  </p>
                  <span className="badge text-[9px] mt-2" style={{ backgroundColor: fieldColor + '12', color: fieldColor }}>
                    {FIELD_LABELS[s.fn]?.[lang] || s.fn}
                  </span>
                </Link>
              );
            })}
          </div>
        </ScrollReveal>
      )}

      {/* ═══ FIELDS OF KNOWLEDGE ═══ */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">{t.fieldsTitle}</h2>
            <p className="text-sm text-ink-500 dark:text-sand-400 mt-2">{t.fieldsDesc}</p>
          </div>
          <Link to="/stats" className="text-sm text-gold-600 dark:text-gold-400 hover:text-gold-800 font-medium hidden sm:block transition-colors">
            {t.viewAll} →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
          {topFields.map(([field, count]) => {
            const color = FIELD_LABELS[field]?.color || '#a4b0bb';
            const label = FIELD_LABELS[field]?.[lang] || field;
            const pct = ((count / stats.total_scholars) * 100).toFixed(1);
            return (
              <Link key={field} to={`/browse?field=${field}`} className="card p-5 group hover-lift">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                  <span className="text-sm font-semibold text-ink-800 dark:text-sand-200 group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors">
                    {label}
                  </span>
                </div>
                <p className="font-display text-3xl font-bold text-ink-900 dark:text-sand-100">
                  {formatNumber(count)}
                </p>
                <div className="mt-3 h-1 bg-sand-100 dark:bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }}
                  />
                </div>
                <p className="text-[11px] text-ink-400 dark:text-sand-500 mt-2 font-mono">{pct}%</p>
              </Link>
            );
          })}
        </div>
      </ScrollReveal>

      {/* ═══ ERAS TIMELINE ═══ */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">{t.erasTitle}</h2>
            <p className="text-sm text-ink-500 dark:text-sand-400 mt-2">{t.erasDesc}</p>
          </div>
          <Link to="/timeline" className="text-sm text-gold-600 dark:text-gold-400 hover:text-gold-800 font-medium hidden sm:block transition-colors">
            {t.viewTimeline} →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 stagger-children">
          {topEras.map(([era, count]) => {
            const color = ERA_LABELS[era]?.color || '#c9d1d7';
            const label = ERA_LABELS[era]?.[lang] || era;
            return (
              <Link key={era} to={`/browse?era=${era}`} className="card px-5 py-3.5 group hover-lift flex items-center gap-3">
                <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: color }} />
                <div>
                  <p className="text-sm font-semibold text-ink-800 dark:text-sand-200 group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors">
                    {label}
                  </p>
                  <p className="text-xs text-ink-500 dark:text-sand-400 font-mono">{formatNumber(count)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollReveal>

      {/* ═══ EXPLORE CTA ═══ */}
      <ScrollReveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="card p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-50/30 via-transparent to-teal-50/20 dark:from-gold-900/10 dark:to-teal-900/10" />
          <div className="relative">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 dark:text-sand-50 mb-3">
              {t.ctaTitle}
            </h3>
            <p className="text-ink-600 dark:text-sand-300 mb-6 max-w-lg mx-auto">
              {t.ctaDesc}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/books" className="btn-outline text-sm">{t.browseBooks}</Link>
              <Link to="/madrasas" className="btn-outline text-sm">{t.exploreMadrasas}</Link>
              <Link to="/network" className="btn-outline text-sm">{t.viewNetwork}</Link>
              <Link to="/about" className="btn-outline text-sm">{t.aboutProject}</Link>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-sand-200/60 dark:border-ink-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <p className="font-display text-lg font-semibold text-ink-900 dark:text-sand-100">
                tabakat<span className="text-gold-600">.io</span>
                <span className="text-xs text-ink-400 dark:text-sand-500 ml-2 font-mono font-normal">v7.0</span>
              </p>
              <p className="text-xs text-ink-400 dark:text-sand-500 mt-1.5 leading-relaxed">
                Dr. Ali Çetinkaya & Dr. Hüseyin Gökalp<br />
                Selçuk Üniversitesi, Konya
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-500 dark:text-sand-400">
              <span className="font-mono">{formatNumber(stats.total_scholars)} {lang === 'tr' ? 'âlim' : 'scholars'}</span>
              <span className="hidden sm:inline text-ink-300 dark:text-ink-600">·</span>
              <span className="font-mono">{formatNumber(stats.total_edges)} {lang === 'tr' ? 'ilişki' : 'relations'}</span>
              <span className="hidden sm:inline text-ink-300 dark:text-ink-600">·</span>
              <span className="font-mono">435 tabaqāt</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-sand-200/40 dark:border-ink-700/40 flex justify-center gap-6 text-xs">
            <a href="https://github.com/alicetinkaya76/tabakat-io" target="_blank" rel="noopener noreferrer" className="text-ink-400 dark:text-sand-500 hover:text-gold-600 dark:hover:text-gold-400 transition-colors">
              GitHub ↗
            </a>
            <Link to="/about" className="text-ink-400 dark:text-sand-500 hover:text-gold-600 dark:hover:text-gold-400 transition-colors">
              {lang === 'tr' ? 'Hakkında' : 'About'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const TR = {
  kicker: 'İslam Medeniyeti Dijital Atlası',
  subtitle: '23.000\'den fazla âlimin biyografileri, ilişki ağları, eğitim rotaları ve silsile zincirleri — tek bir araştırma platformunda.',
  explore: 'Keşfet',
  openMap: 'Haritayı Aç',
  scholars: 'Âlim',
  relations: 'İlişki',
  mapped: 'Haritada',
  featuredScholars: 'Öne Çıkan Âlimler',
  fieldsTitle: 'İlim Alanları',
  fieldsDesc: 'Bilgi üretiminin tarihî dağılımı',
  viewAll: 'Tümünü Gör',
  erasTitle: 'Dönemler',
  erasDesc: 'İslam medeniyetinin tarihî çağları',
  viewTimeline: 'Zaman Çizelgesi',
  ctaTitle: 'Veritabanını Keşfedin',
  ctaDesc: 'Tabakat kitapları, medreseler, silsile ağları ve daha fazlası',
  browseBooks: '📚 Tabakat Kitapları',
  exploreMadrasas: '🏛 Medreseler',
  viewNetwork: '⬡ Silsile Ağı',
  aboutProject: 'ⓘ Proje Hakkında',
};

const EN = {
  kicker: 'Islamic Civilization Digital Atlas',
  subtitle: 'Biographies, relationship networks, education routes, and chains of transmission of over 23,000 scholars — in one research platform.',
  explore: 'Explore',
  openMap: 'Open Map',
  scholars: 'Scholars',
  relations: 'Relations',
  mapped: 'Mapped',
  featuredScholars: 'Featured Scholars',
  fieldsTitle: 'Fields of Knowledge',
  fieldsDesc: 'Historical distribution of knowledge production',
  viewAll: 'View All',
  erasTitle: 'Historical Eras',
  erasDesc: 'Periods of Islamic civilization',
  viewTimeline: 'View Timeline',
  ctaTitle: 'Explore the Database',
  ctaDesc: 'Tabaqāt books, madrasas, transmission networks, and more',
  browseBooks: '📚 Tabaqāt Books',
  exploreMadrasas: '🏛 Madrasas',
  viewNetwork: '⬡ Network',
  aboutProject: 'ⓘ About',
};
