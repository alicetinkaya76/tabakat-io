import { Link, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { useLang, useSearch } from '../utils/data';
import { getDisplayName, debounce, parseName } from '../utils/helpers';

export default function NotFoundPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { results, loading } = useSearch(query);
  const debouncedSet = useCallback(debounce(setQuery, 300), []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16">
      {/* Floating ornament */}
      <div className="drift-float mb-8 relative">
        <span className="font-arabic text-[120px] leading-none text-gold-200/60 dark:text-gold-800/30 font-bold select-none">
          ٤٠٤
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl">🕌</span>
        </div>
      </div>

      <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink-800 dark:text-sand-100 mb-3 text-center fade-in">
        {lang === 'tr' ? 'Sayfa Bulunamadı' : 'Page Not Found'}
      </h1>
      <p className="text-ink-500 dark:text-sand-400 text-center max-w-md mb-8 fade-in fade-in-delay-1">
        {lang === 'tr'
          ? 'Aradığınız sayfa mevcut değil veya taşınmış olabilir. Aşağıdan âlim arayabilir veya ana sayfaya dönebilirsiniz.'
          : 'The page you are looking for does not exist or may have been moved. You can search for a scholar below or return to the home page.'}
      </p>

      {/* Inline search */}
      <div className="w-full max-w-md fade-in fade-in-delay-2">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400 dark:text-sand-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder={lang === 'tr' ? 'Âlim ara...' : 'Search scholars...'}
            className="input-search !pl-12"
            onChange={e => debouncedSet(e.target.value)}
          />
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-3 card overflow-hidden divide-y divide-sand-100 dark:divide-ink-700 fade-in">
            {results.slice(0, 5).map(s => {
              const names = parseName(s.n);
              const displayName = lang === 'en' ? (names.name_en || names.name_tr) : (names.name_tr || names.name_en);
              return (
                <Link
                  key={s.id}
                  to={`/scholar/${encodeURIComponent(s.id)}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-sand-50 dark:hover:bg-ink-800 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-gold-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800 dark:text-sand-200 truncate">{displayName || s.id}</p>
                    {s.d && <p className="text-xs text-ink-400 dark:text-sand-500">d. {s.d}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {query.length >= 2 && !loading && results.length === 0 && (
          <p className="mt-3 text-sm text-ink-400 dark:text-sand-500 text-center">
            {lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found'}
          </p>
        )}
      </div>

      {/* Navigation links */}
      <div className="flex gap-4 mt-8 fade-in fade-in-delay-3">
        <Link to="/" className="btn-primary text-sm">
          {lang === 'tr' ? 'Ana Sayfa' : 'Home'}
        </Link>
        <Link to="/browse" className="btn-outline text-sm">
          {lang === 'tr' ? 'Keşfet' : 'Browse'}
        </Link>
      </div>
    </div>
  );
}
