import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useLang, useSearch, useTheme } from '../utils/data';
import { getLabel } from '../utils/i18n';
import { getDisplayName, debounce, parseName } from '../utils/helpers';
import ScholarCard from './ScholarCard';

export default function Navbar() {
  const { lang, toggleLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { results, loading } = useSearch(query);
  const searchRef = useRef(null);
  const moreRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = useCallback(debounce((val) => setQuery(val), 250), []);

  const primaryNav = [
    { to: '/browse', label: getLabel('browse', lang) },
    { to: '/map', label: getLabel('map', lang) },
    { to: '/network', label: getLabel('network', lang) },
    { to: '/timeline', label: getLabel('timeline', lang) },
  ];

  const secondaryNav = [
    { to: '/books', label: getLabel('books', lang) },
    { to: '/dynasties', label: getLabel('dynasties', lang) },
    { to: '/madrasas', label: getLabel('madrasas', lang) },
    { to: '/compare', label: getLabel('compare', lang) },
    { to: '/stats', label: getLabel('stats', lang) },
    { to: '/about', label: getLabel('about', lang) },
  ];

  const allNav = [...primaryNav, ...secondaryNav];

  return (
    <nav className="sticky top-0 z-50 glass" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="w-8 h-8 bg-ink-900 dark:bg-gold-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-gold-400 dark:text-ink-950 font-arabic text-lg font-bold leading-none">ط</span>
            </span>
            <span className="font-display text-lg font-semibold text-ink-900 dark:text-sand-100 hidden sm:block">
              tabakat<span className="text-gold-600 dark:text-gold-400">.io</span>
            </span>
          </NavLink>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {primaryNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setShowMore(!showMore)}
                className={`nav-link flex items-center gap-1 ${showMore ? 'text-ink-900 dark:text-sand-100' : ''}`}
                aria-expanded={showMore}
                aria-haspopup="true"
              >
                {lang === 'tr' ? 'Diğer' : 'More'}
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {showMore && (
                <div className="absolute top-full right-0 mt-1 w-48 glass rounded-xl shadow-xl overflow-hidden fade-in-scale">
                  {secondaryNav.map(item => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setShowMore(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 text-sm transition-colors ${
                          isActive
                            ? 'text-gold-700 dark:text-gold-400 bg-gold-50/50 dark:bg-gold-900/20'
                            : 'text-ink-700 dark:text-sand-300 hover:bg-sand-100/80 dark:hover:bg-ink-800/80'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5" ref={searchRef}>
            {/* Search */}
            <div className="relative">
              <button
                onClick={() => { setShowSearch(!showSearch); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-200/60 dark:hover:bg-ink-700/60 transition-colors text-ink-500 dark:text-sand-400"
                aria-label="Search"
                title="⌘K"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </button>

              {showSearch && (
                <div className="absolute right-0 top-11 w-80 sm:w-96 glass rounded-xl shadow-xl overflow-hidden fade-in-scale">
                  <div className="p-3 border-b border-sand-200/40 dark:border-ink-700/40">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={getLabel('search', lang)}
                      className="w-full px-3 py-2 text-sm bg-sand-50/80 dark:bg-ink-800/80 rounded-lg border-0 outline-none focus:ring-2 focus:ring-gold-400/30 dark:focus:ring-gold-600/30 dark:text-sand-100 dark:placeholder:text-ink-500"
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {loading && <div className="py-6 text-center"><div className="w-5 h-5 border-2 border-transparent border-t-gold-500 rounded-full animate-spin mx-auto" /></div>}
                    {!loading && results.length === 0 && query.length >= 2 && (
                      <p className="text-center text-sm text-ink-400 dark:text-sand-500 py-6">{getLabel('no_results', lang)}</p>
                    )}
                    {results.slice(0, 8).map(s => {
                      const names = parseName(s.n);
                      const mapped = { id: s.id, name_tr: names.name_tr, name_en: names.name_en, name_ar: names.name_ar, death_ce: s.d, field_normalized: s.fn, era_normalized: s.en, madhab_normalized: s.mn, importance: s.i, source_count: s.s };
                      return (
                        <div key={s.id} onClick={() => { setShowSearch(false); setQuery(''); }}>
                          <ScholarCard scholar={mapped} compact />
                        </div>
                      );
                    })}
                    {results.length > 8 && (
                      <button
                        onClick={() => { setShowSearch(false); navigate(`/browse?q=${encodeURIComponent(query)}`); }}
                        className="w-full py-3 text-sm text-gold-600 dark:text-gold-400 hover:bg-sand-50/60 dark:hover:bg-ink-800/60 font-medium transition-colors border-t border-sand-200/30 dark:border-ink-700/30"
                      >
                        {lang === 'tr' ? `Tüm ${results.length} sonucu gör` : `View all ${results.length} results`} →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lang */}
            <button
              onClick={toggleLang}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-200/60 dark:hover:bg-ink-700/60 transition-colors text-[11px] font-mono font-bold text-ink-500 dark:text-sand-400"
              title={lang === 'tr' ? 'Switch to English' : lang === 'en' ? 'العربية' : 'Türkçeye geç'}
              aria-label={lang === 'tr' ? 'Switch to English' : lang === 'en' ? 'العربية' : 'Türkçeye geç'}
            >
              {lang === 'tr' ? 'EN' : lang === 'en' ? 'عر' : 'TR'}
            </button>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-200/60 dark:hover:bg-ink-700/60 transition-colors text-ink-500 dark:text-sand-400"
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
              aria-label={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 1110.239 1.57a.75.75 0 01.218.434h-.002z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zm0 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm-8-5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 012 10zm13 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0115 10zM4.343 4.343a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.061l-1.06-1.06a.75.75 0 010-1.06zm9.193 9.193a.75.75 0 011.06 0l1.061 1.06a.75.75 0 01-1.06 1.061l-1.06-1.06a.75.75 0 010-1.061zM4.343 15.657a.75.75 0 010-1.06l1.06-1.061a.75.75 0 111.061 1.06l-1.06 1.061a.75.75 0 01-1.061 0zm9.193-9.193a.75.75 0 010-1.06l1.06-1.061a.75.75 0 011.061 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM10 7a3 3 0 100 6 3 3 0 000-6z" /></svg>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-200/60 dark:hover:bg-ink-700/60 transition-colors text-ink-600 dark:text-sand-300"
            >
              {mobileMenu ? (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 012 10z" clipRule="evenodd" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t border-sand-200/40 dark:border-ink-700/40 py-2 pb-4 fade-in">
            {allNav.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenu(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gold-50/60 text-gold-800 dark:bg-gold-900/20 dark:text-gold-400'
                      : 'text-ink-600 hover:bg-sand-100/60 dark:text-sand-400 dark:hover:bg-ink-800/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
