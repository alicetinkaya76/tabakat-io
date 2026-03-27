import { Link } from 'react-router-dom';
import { useLang } from '../utils/data';
import { getFieldLabel, getEraLabel, getMadhabLabel, FIELD_LABELS, ERA_LABELS } from '../utils/i18n';
import { formatLifespan, getDisplayName, truncate } from '../utils/helpers';

export default function ScholarCard({ scholar, compact = false }) {
  const { lang } = useLang();
  const name = getDisplayName(scholar, lang);
  const lifespan = formatLifespan(scholar);
  const fieldColor = FIELD_LABELS[scholar.field_normalized]?.color || '#a4b0bb';
  const eraColor = ERA_LABELS[scholar.era_normalized]?.color || '#c9d1d7';

  if (compact) {
    return (
      <Link
        to={`/scholar/${encodeURIComponent(scholar.id)}`}
        className="flex items-center gap-3 px-3 py-2.5 hover:bg-sand-100 rounded-lg transition-colors group"
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: fieldColor }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-900 dark:text-sand-100 truncate group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors">
            {name}
          </p>
          <p className="text-xs text-ink-500 dark:text-sand-400 truncate">
            {lifespan && <span>{lifespan}</span>}
            {scholar.field_normalized && (
              <span className="ml-1.5">· {getFieldLabel(scholar.field_normalized, lang)}</span>
            )}
          </p>
        </div>
        {scholar.importance === 'high' && (
          <span className="text-gold-500 text-xs">★</span>
        )}
      </Link>
    );
  }

  return (
    <Link
      to={`/scholar/${encodeURIComponent(scholar.id)}`}
      className="card-hover block p-5 group relative"
    >
      {/* Bio tooltip on desktop hover */}
      {scholar.bio && (
        <div className="scholar-tooltip absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 rounded-xl glass shadow-xl text-xs text-ink-600 dark:text-sand-300 leading-relaxed pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 hidden lg:block">
          {truncate(scholar.bio, 180)}
        </div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-sand-100 group-hover:text-gold-700 dark:group-hover:text-gold-400 transition-colors leading-tight">
            {name}
          </h3>
          {scholar.name_ar && (
            <p className="ar-text text-base text-ink-500 dark:text-sand-400 mt-0.5 truncate">
              {scholar.name_ar}
            </p>
          )}
        </div>
        {scholar.importance === 'high' && (
          <span className="badge-importance-high text-[10px] px-2 py-0.5 shrink-0">★</span>
        )}
      </div>

      {/* Lifespan */}
      {lifespan && (
        <p className="text-sm text-ink-600 dark:text-sand-400 mb-3 font-mono text-[13px]">
          {lifespan}
          {scholar.death_place && <span className="text-ink-400 dark:text-sand-500"> · {scholar.death_place}</span>}
        </p>
      )}

      {/* Bio excerpt */}
      {scholar.bio && (
        <p className="text-sm text-ink-600 dark:text-sand-400 leading-relaxed mb-3 line-clamp-2">
          {truncate(scholar.bio, 120)}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {scholar.field_normalized && (
          <span
            className="badge text-[10px]"
            style={{ backgroundColor: fieldColor + '18', color: fieldColor }}
          >
            {getFieldLabel(scholar.field_normalized, lang)}
          </span>
        )}
        {scholar.era_normalized && scholar.era_normalized !== 'unknown' && (
          <span
            className="badge text-[10px]"
            style={{ backgroundColor: eraColor + '15', color: eraColor }}
          >
            {getEraLabel(scholar.era_normalized, lang)}
          </span>
        )}
        {scholar.madhab_normalized && scholar.madhab_normalized !== '—' && (
          <span className="badge-madhab text-[10px]">
            {getMadhabLabel(scholar.madhab_normalized, lang)}
          </span>
        )}
        {scholar.source_count > 2 && (
          <span className="badge text-[10px] bg-sand-100 text-sand-700 dark:bg-ink-800 dark:text-sand-400">
            {scholar.source_count} {lang === 'tr' ? 'kaynak' : 'sources'}
          </span>
        )}
      </div>
    </Link>
  );
}
