import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch, useLang } from '../utils/data';
import { debounce, parseName, getDisplayName } from '../utils/helpers';
import { getFieldLabel, FIELD_LABELS } from '../utils/i18n';

export default function CmdKSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const { results, loading } = useSearch(query);
  const { lang } = useLang();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const debouncedSet = useCallback(debounce(setQuery, 200), []);

  // Listen for Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => setSelected(0), [results]);

  const items = results.slice(0, 10);

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && items[selected]) {
      e.preventDefault();
      goTo(items[selected].id);
    }
  }

  function goTo(id) {
    setOpen(false);
    navigate(`/scholar/${encodeURIComponent(id)}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-ink-950/40 dark:bg-ink-950/60 cmd-k-overlay" onClick={() => setOpen(false)} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 glass rounded-2xl shadow-2xl overflow-hidden cmd-k-modal" onKeyDown={handleKeyDown}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 border-b border-sand-200/40 dark:border-ink-700/40">
          <svg className="w-5 h-5 text-ink-400 dark:text-sand-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={lang === 'tr' ? 'Âlim ara...' : 'Search scholars...'}
            className="flex-1 bg-transparent py-4 text-ink-900 dark:text-sand-100 placeholder:text-ink-400 dark:placeholder:text-sand-500 outline-none text-[15px]"
            onChange={e => debouncedSet(e.target.value)}
          />
          <kbd className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-sand-200/60 dark:bg-ink-700/60 text-ink-400 dark:text-sand-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="py-8 text-center">
              <div className="w-5 h-5 border-2 border-transparent border-t-gold-500 rounded-full animate-spin mx-auto" />
            </div>
          )}

          {!loading && query.length >= 2 && items.length === 0 && (
            <div className="py-8 text-center text-sm text-ink-400 dark:text-sand-500">
              {lang === 'tr' ? 'Sonuç bulunamadı' : 'No results found'}
            </div>
          )}

          {items.map((s, i) => {
            const names = parseName(s.n);
            const displayName = lang === 'en' ? (names.name_en || names.name_tr) : (names.name_tr || names.name_en);
            const fieldColor = FIELD_LABELS[s.fn]?.color || '#a4b0bb';
            return (
              <button
                key={s.id}
                onClick={() => goTo(s.id)}
                onMouseEnter={() => setSelected(i)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                  i === selected
                    ? 'bg-gold-50/60 dark:bg-gold-900/15'
                    : 'hover:bg-sand-50/60 dark:hover:bg-ink-800/60'
                }`}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: fieldColor }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${i === selected ? 'text-gold-800 dark:text-gold-300' : 'text-ink-800 dark:text-sand-200'}`}>
                    {displayName || s.id}
                  </p>
                  <p className="text-xs text-ink-400 dark:text-sand-500 truncate">
                    {s.d && `d. ${s.d}`}
                    {s.fn && ` · ${getFieldLabel(s.fn, lang)}`}
                  </p>
                </div>
                {s.i === 'high' && <span className="text-gold-500 text-xs shrink-0">★</span>}
                {i === selected && (
                  <kbd className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-sand-200/60 dark:bg-ink-700/60 text-ink-400 dark:text-sand-500 shrink-0">
                    ↵
                  </kbd>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-sand-200/30 dark:border-ink-700/30 text-[11px] text-ink-400 dark:text-sand-500">
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 rounded bg-sand-200/60 dark:bg-ink-700/60 text-[10px]">↑↓</kbd>
            {lang === 'tr' ? 'gezin' : 'navigate'}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 rounded bg-sand-200/60 dark:bg-ink-700/60 text-[10px]">↵</kbd>
            {lang === 'tr' ? 'aç' : 'open'}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="font-mono px-1 py-0.5 rounded bg-sand-200/60 dark:bg-ink-700/60 text-[10px]">esc</kbd>
            {lang === 'tr' ? 'kapat' : 'close'}
          </span>
        </div>
      </div>
    </div>
  );
}
