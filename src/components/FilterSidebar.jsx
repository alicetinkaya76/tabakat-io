import { useState } from 'react';
import { useLang } from '../utils/data';
import { getLabel, getFieldLabel, getEraLabel, getMadhabLabel, getRegionLabel, FIELD_LABELS, ERA_LABELS, MADHAB_LABELS, REGION_LABELS } from '../utils/i18n';

export default function FilterSidebar({ filters, onFilterChange, counts = {} }) {
  const { lang } = useLang();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fieldOptions = Object.keys(FIELD_LABELS).filter(k => k !== 'unknown');
  const eraOptions = Object.entries(ERA_LABELS)
    .filter(([k]) => k !== 'unknown')
    .sort((a, b) => a[1].order - b[1].order)
    .map(([k]) => k);
  const madhabOptions = Object.keys(MADHAB_LABELS);
  const importanceOptions = ['high', 'medium', 'low'];
  const regionOptions = Object.keys(REGION_LABELS);
  const sourceOptions = ['1', '2', '3+'];

  const toggleFilter = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: next });
  };

  const resetAll = () => {
    onFilterChange({
      fields: [], eras: [], madhabs: [], importance: [],
      regions: [], sources: [],
      deathMin: '', deathMax: '',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== '' && v !== undefined;
  });

  const activeCount = Object.entries(filters).reduce((sum, [k, v]) => {
    if (Array.isArray(v)) return sum + v.length;
    return v ? sum + 1 : sum;
  }, 0);

  return (
    <aside className="w-full space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-700 dark:text-sand-200 uppercase tracking-wider">
          {getLabel('filter', lang)}
          {activeCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-gold-500 text-white">{activeCount}</span>
          )}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={resetAll}
            className="text-xs text-gold-600 hover:text-gold-800 dark:text-gold-400 dark:hover:text-gold-300 font-medium transition-colors"
          >
            {getLabel('reset', lang)}
          </button>
        )}
      </div>

      {/* Field filter */}
      <FilterGroup
        title={getLabel('field', lang)}
        options={fieldOptions}
        selected={filters.fields || []}
        onToggle={(v) => toggleFilter('fields', v)}
        getLabel={(k) => getFieldLabel(k, lang)}
        getColor={(k) => FIELD_LABELS[k]?.color}
        counts={counts.fields}
      />

      {/* Era filter */}
      <FilterGroup
        title={getLabel('era', lang)}
        options={eraOptions}
        selected={filters.eras || []}
        onToggle={(v) => toggleFilter('eras', v)}
        getLabel={(k) => getEraLabel(k, lang)}
        getColor={(k) => ERA_LABELS[k]?.color}
        counts={counts.eras}
      />

      {/* Madhab filter */}
      <FilterGroup
        title={getLabel('madhab', lang)}
        options={madhabOptions}
        selected={filters.madhabs || []}
        onToggle={(v) => toggleFilter('madhabs', v)}
        getLabel={(k) => getMadhabLabel(k, lang)}
        getColor={(k) => MADHAB_LABELS[k]?.color}
        counts={counts.madhabs}
      />

      {/* Importance filter */}
      <FilterGroup
        title={getLabel('importance', lang)}
        options={importanceOptions}
        selected={filters.importance || []}
        onToggle={(v) => toggleFilter('importance', v)}
        getLabel={(k) => k === 'high' ? '★ ' + (lang === 'tr' ? 'Yüksek' : 'High') :
                         k === 'medium' ? (lang === 'tr' ? 'Orta' : 'Medium') :
                         (lang === 'tr' ? 'Düşük' : 'Low')}
        counts={counts.importance}
      />

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-xs font-medium text-gold-600 dark:text-gold-400 hover:text-gold-800 dark:hover:text-gold-300 transition-colors flex items-center gap-1.5 py-1"
      >
        <svg className={`w-3 h-3 transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
        {lang === 'tr' ? 'Gelişmiş Filtreler' : 'Advanced Filters'}
      </button>

      {showAdvanced && (
        <div className="space-y-5 pt-1 advanced-filters-enter">
          {/* Death date range */}
          <div>
            <p className="text-xs font-medium text-ink-500 dark:text-sand-400 mb-2">
              {getLabel('death_range', lang)}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.deathMin || ''}
                onChange={(e) => onFilterChange({ ...filters, deathMin: e.target.value })}
                placeholder={lang === 'tr' ? 'Min' : 'Min'}
                className="w-full text-xs border border-sand-300 dark:border-ink-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-ink-800 text-ink-700 dark:text-sand-200 focus:outline-none focus:ring-2 focus:ring-gold-300/50"
              />
              <span className="text-ink-400 dark:text-sand-500 text-xs shrink-0">—</span>
              <input
                type="number"
                value={filters.deathMax || ''}
                onChange={(e) => onFilterChange({ ...filters, deathMax: e.target.value })}
                placeholder={lang === 'tr' ? 'Maks' : 'Max'}
                className="w-full text-xs border border-sand-300 dark:border-ink-600 rounded-lg px-2.5 py-1.5 bg-white dark:bg-ink-800 text-ink-700 dark:text-sand-200 focus:outline-none focus:ring-2 focus:ring-gold-300/50"
              />
              <span className="text-[10px] text-ink-400 dark:text-sand-500 shrink-0">CE</span>
            </div>
          </div>

          {/* Region filter */}
          <FilterGroup
            title={getLabel('region', lang)}
            options={regionOptions}
            selected={filters.regions || []}
            onToggle={(v) => toggleFilter('regions', v)}
            getLabel={(k) => getRegionLabel(k, lang)}
            counts={counts.regions}
            collapsible
          />

          {/* Source count filter */}
          <FilterGroup
            title={getLabel('source_count', lang)}
            options={sourceOptions}
            selected={filters.sources || []}
            onToggle={(v) => toggleFilter('sources', v)}
            getLabel={(k) => k === '3+' ? '3+' : k}
            counts={counts.sources}
          />
        </div>
      )}
    </aside>
  );
}

function FilterGroup({ title, options, selected, onToggle, getLabel, getColor, counts = {}, collapsible = false }) {
  const [expanded, setExpanded] = useState(!collapsible);
  const shown = expanded ? options : options.slice(0, 6);

  return (
    <div>
      <p className="text-xs font-medium text-ink-500 dark:text-sand-400 mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {shown.map(opt => {
          const isActive = selected.includes(opt);
          const color = getColor?.(opt);
          const count = counts?.[opt];
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              className={`
                filter-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                transition-all duration-200 border
                ${isActive
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-sand-200 text-ink-600 hover:border-sand-400 bg-white/60 dark:border-ink-600 dark:text-sand-300 dark:bg-ink-800/60 dark:hover:border-ink-500'}
              `}
              style={isActive && color ? { backgroundColor: color } : undefined}
            >
              {getLabel(opt)}
              {count != null && (
                <span className={`text-[10px] ${isActive ? 'opacity-75' : 'text-ink-400 dark:text-sand-500'}`}>
                  {count > 999 ? `${(count/1000).toFixed(1)}k` : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {collapsible && options.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-gold-600 dark:text-gold-400 mt-1.5 font-medium hover:text-gold-800 dark:hover:text-gold-300 transition-colors"
        >
          {expanded ? (options.length > 6 ? '▲ Less' : '') : `+${options.length - 6} more…`}
        </button>
      )}
    </div>
  );
}
