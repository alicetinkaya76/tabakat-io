import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsync, getSearchIndex, useLang } from '../utils/data';
import { getLabel } from '../utils/i18n';
import { formatNumber, debounce, parseName } from '../utils/helpers';
import ScholarCard from '../components/ScholarCard';
import FilterSidebar from '../components/FilterSidebar';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const PAGE_SIZE = 40;

export default function BrowsePage() {
  const { lang } = useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading } = useAsync(getSearchIndex);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState('importance');
  const [showFilters, setShowFilters] = useState(false);

  // Parse initial filters from URL
  const [filters, setFilters] = useState(() => {
    const fields = searchParams.get('fields')?.split(',').filter(Boolean) || (searchParams.get('field') ? [searchParams.get('field')] : []);
    const eras = searchParams.get('eras')?.split(',').filter(Boolean) || (searchParams.get('era') ? [searchParams.get('era')] : []);
    const regions = searchParams.get('regions')?.split(',').filter(Boolean) || (searchParams.get('region') ? [searchParams.get('region')] : []);
    const sources = searchParams.get('sources')?.split(',').filter(Boolean) || [];
    return {
      fields,
      eras,
      madhabs: searchParams.get('madhab') ? [searchParams.get('madhab')] : [],
      importance: [],
      regions,
      sources,
      deathMin: searchParams.get('dmin') || '',
      deathMax: searchParams.get('dmax') || '',
    };
  });

  const debouncedSetQuery = useCallback(debounce(setDebouncedQuery, 300), []);

  useEffect(() => {
    debouncedSetQuery(query);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, filters]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (filters.fields.length === 1) params.set('field', filters.fields[0]);
    if (filters.eras.length === 1) params.set('era', filters.eras[0]);
    if (filters.madhabs.length === 1) params.set('madhab', filters.madhabs[0]);
    if (filters.regions.length === 1) params.set('region', filters.regions[0]);
    if (filters.deathMin) params.set('dmin', filters.deathMin);
    if (filters.deathMax) params.set('dmax', filters.deathMax);
    if (filters.fields.length > 1) params.set('fields', filters.fields.join(','));
    if (filters.eras.length > 1) params.set('eras', filters.eras.join(','));
    if (filters.regions.length > 1) params.set('regions', filters.regions.join(','));
    if (filters.sources.length > 0) params.set('sources', filters.sources.join(','));
    setSearchParams(params, { replace: true });
  }, [debouncedQuery, filters]);

  // Filter + search
  const { filtered, counts } = useMemo(() => {
    if (!data) return { filtered: [], counts: {} };
    let items = data.data || [];

    // Apply text search via Fuse
    if (debouncedQuery && debouncedQuery.length >= 2 && data.fuse) {
      items = data.fuse.search(debouncedQuery, { limit: 500 }).map(r => r.item);
    }

    // Count before filtering (for filter badges)
    const fieldCounts = {};
    const eraCounts = {};
    const madhabCounts = {};
    const impCounts = {};
    const regionCounts = {};
    const sourceCounts = {};
    for (const s of items) {
      if (s.fn) fieldCounts[s.fn] = (fieldCounts[s.fn] || 0) + 1;
      if (s.en) eraCounts[s.en] = (eraCounts[s.en] || 0) + 1;
      if (s.mn) madhabCounts[s.mn] = (madhabCounts[s.mn] || 0) + 1;
      if (s.i) impCounts[s.i] = (impCounts[s.i] || 0) + 1;
      if (s.r) regionCounts[s.r] = (regionCounts[s.r] || 0) + 1;
      const sc = s.s || 1;
      const sk = sc >= 3 ? '3+' : String(sc);
      sourceCounts[sk] = (sourceCounts[sk] || 0) + 1;
    }

    // Apply filters
    if (filters.fields.length > 0) {
      items = items.filter(s => filters.fields.includes(s.fn));
    }
    if (filters.eras.length > 0) {
      items = items.filter(s => filters.eras.includes(s.en));
    }
    if (filters.madhabs.length > 0) {
      items = items.filter(s => filters.madhabs.includes(s.mn));
    }
    if (filters.importance.length > 0) {
      items = items.filter(s => filters.importance.includes(s.i));
    }
    if (filters.regions?.length > 0) {
      items = items.filter(s => filters.regions.includes(s.r));
    }
    if (filters.sources?.length > 0) {
      items = items.filter(s => {
        const sc = s.s || 1;
        return filters.sources.includes(sc >= 3 ? '3+' : String(sc));
      });
    }
    if (filters.deathMin) {
      const min = parseInt(filters.deathMin);
      if (!isNaN(min)) items = items.filter(s => s.d && s.d >= min);
    }
    if (filters.deathMax) {
      const max = parseInt(filters.deathMax);
      if (!isNaN(max)) items = items.filter(s => s.d && s.d <= max);
    }

    // Sort
    if (sortBy === 'death') {
      items = [...items].sort((a, b) => (a.d || 9999) - (b.d || 9999));
    } else if (sortBy === 'name') {
      items = [...items].sort((a, b) => (a.n || '').localeCompare(b.n || ''));
    } else if (sortBy === 'sources') {
      items = [...items].sort((a, b) => (b.s || 0) - (a.s || 0));
    } else {
      // importance: high first, then by sources
      const impOrder = { high: 0, medium: 1, low: 2 };
      items = [...items].sort((a, b) => {
        const ia = impOrder[a.i] ?? 1;
        const ib = impOrder[b.i] ?? 1;
        if (ia !== ib) return ia - ib;
        return (b.s || 0) - (a.s || 0);
      });
    }

    return {
      filtered: items,
      counts: { fields: fieldCounts, eras: eraCounts, madhabs: madhabCounts, importance: impCounts, regions: regionCounts, sources: sourceCounts },
    };
  }, [data, debouncedQuery, filters, sortBy]);

  // Map search index fields to scholar card format
  const mapToScholar = (item) => {
    const names = parseName(item.n);
    return {
      id: item.id,
      name_tr: names.name_tr,
      name_en: names.name_en,
      name_ar: names.name_ar,
      death_ce: item.d,
      field_normalized: item.fn,
      era_normalized: item.en,
      madhab_normalized: item.mn,
      importance: item.i,
      source_count: item.s,
      region: item.r,
    };
  };

  const pageItems = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <div className="skeleton h-9 w-48 mb-2" />
        <div className="skeleton h-4 w-32" />
      </div>
      <div className="skeleton h-12 w-full mb-6 rounded-xl" />
      <div className="flex gap-6">
        <div className="hidden md:block w-64 shrink-0">
          <div className="card p-4 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-6 w-full" />)}
          </div>
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card-skeleton p-5 space-y-3" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-3 w-full" />
              <div className="flex gap-2">
                <div className="skeleton h-5 w-16 rounded-full" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <SEO title={getLabel('browse', lang)} path="/browse" description="Browse 22,000+ scholars of the Islamic intellectual tradition." />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">{getLabel('browse', lang)}</h1>
          <p className="text-sm text-ink-500 dark:text-sand-400 mt-1">
            {formatNumber(filtered.length)} {getLabel('scholars', lang)}
            {debouncedQuery && <span className="text-gold-600"> · "{debouncedQuery}"</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-sand-300 dark:border-ink-600 rounded-lg px-3 py-1.5 bg-white dark:bg-ink-800 text-ink-700 dark:text-sand-200 focus:outline-none focus:ring-2 focus:ring-gold-300 dark:focus:ring-gold-600"
          >
            <option value="importance">{lang === 'tr' ? 'Önem' : 'Importance'}</option>
            <option value="death">{lang === 'tr' ? 'Vefat' : 'Death date'}</option>
            <option value="name">{lang === 'tr' ? 'İsim' : 'Name'}</option>
            <option value="sources">{lang === 'tr' ? 'Kaynak' : 'Sources'}</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-outline text-sm !py-1.5 md:hidden ${showFilters ? '!bg-gold-50 !border-gold-300' : ''}`}
          >
            {getLabel('filter', lang)}
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getLabel('search', lang)}
          className="input-search"
        />
      </div>

      <div className="flex gap-6">
        {/* Mobile filter drawer overlay */}
        {showFilters && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowFilters(false)}>
            <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />
            <div
              className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-ink-900 shadow-2xl overflow-y-auto filter-drawer-enter"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-ink-900/90 backdrop-blur border-b border-sand-200 dark:border-ink-700">
                <span className="text-sm font-semibold text-ink-700 dark:text-sand-200">{getLabel('mobile_filters', lang)}</span>
                <button onClick={() => setShowFilters(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-100 dark:hover:bg-ink-800 text-ink-500">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </button>
              </div>
              <div className="p-4">
                <FilterSidebar filters={filters} onFilterChange={setFilters} counts={counts} />
              </div>
            </div>
          </div>
        )}

        {/* Desktop sidebar filters */}
        <div className="hidden md:block w-64 shrink-0">
          <div className="card p-4 sticky top-20">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              counts={counts}
            />
          </div>
        </div>

        {/* Results grid */}
        <div className="flex-1 min-w-0">
          {pageItems.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-ink-500">{getLabel('no_results', lang)}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pageItems.map(item => (
                  <ScholarCard key={item.id} scholar={mapToScholar(item)} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="btn-outline text-sm !py-1.5 disabled:opacity-30"
                  >
                    ←
                  </button>
                  <span className="text-sm text-ink-500 px-3">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="btn-outline text-sm !py-1.5 disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
