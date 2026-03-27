import { useAsync, getStats, useLang } from '../utils/data';
import { getLabel, getFieldLabel, getEraLabel, getMadhabLabel, FIELD_LABELS, ERA_LABELS, MADHAB_LABELS } from '../utils/i18n';
import { formatNumber } from '../utils/helpers';
import Loading from '../components/Loading';

export default function StatsPage() {
  const { lang } = useLang();
  const { data: stats, loading } = useAsync(getStats);

  if (loading) return <Loading />;
  if (!stats) return null;

  const topFields = Object.entries(stats.fields).slice(0, 15);
  const topEras = Object.entries(stats.eras)
    .filter(([k]) => ERA_LABELS[k])
    .sort((a, b) => (ERA_LABELS[a[0]]?.order ?? 99) - (ERA_LABELS[b[0]]?.order ?? 99));
  const topMadhabs = Object.entries(stats.madhabs).slice(0, 10);
  const topRegions = Object.entries(stats.regions).slice(0, 15);
  const edgeTypes = Object.entries(stats.edge_types);
  const topSources = Object.entries(stats.sources);

  const maxField = Math.max(...topFields.map(([, v]) => v));
  const maxEra = Math.max(...topEras.map(([, v]) => v));
  const maxMadhab = Math.max(...topMadhabs.map(([, v]) => v));
  const maxRegion = Math.max(...topRegions.map(([, v]) => v));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="section-title mb-2">{getLabel('stats', lang)}</h1>
      <p className="text-sm text-ink-500 dark:text-sand-400 mb-8">
        {lang === 'tr' ? 'Veritabanı genel bakış' : 'Database overview'}
      </p>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
        <MetricCard icon="📚" value={stats.total_scholars} label={lang === 'tr' ? 'Âlim' : 'Scholars'} />
        <MetricCard icon="🔗" value={stats.total_edges} label={lang === 'tr' ? 'İlişki' : 'Relations'} />
        <MetricCard icon="🗺️" value={stats.geocoded} label={lang === 'tr' ? 'Haritada' : 'Mapped'} />
        <MetricCard icon="📖" value={stats.with_dia} label="DİA" />
        <MetricCard icon="📝" value={stats.with_narrative} label={lang === 'tr' ? 'Anlatı' : 'Narrative'} />
        <MetricCard icon="🔗" value={stats.with_silsile} label={lang === 'tr' ? 'Silsile' : 'Chain'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fields */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">
            {getLabel('field', lang)}
          </h3>
          <div className="space-y-2">
            {topFields.map(([field, count]) => (
              <BarRow
                key={field}
                label={getFieldLabel(field, lang)}
                value={count}
                max={maxField}
                color={FIELD_LABELS[field]?.color || '#a4b0bb'}
                total={stats.total_scholars}
              />
            ))}
          </div>
        </div>

        {/* Eras */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">
            {getLabel('era', lang)}
          </h3>
          <div className="space-y-2">
            {topEras.map(([era, count]) => (
              <BarRow
                key={era}
                label={getEraLabel(era, lang)}
                value={count}
                max={maxEra}
                color={ERA_LABELS[era]?.color || '#c9d1d7'}
                total={stats.total_scholars}
              />
            ))}
          </div>
        </div>

        {/* Madhabs */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">
            {getLabel('madhab', lang)}
          </h3>
          <div className="space-y-2">
            {topMadhabs.map(([madhab, count]) => (
              <BarRow
                key={madhab}
                label={getMadhabLabel(madhab, lang)}
                value={count}
                max={maxMadhab}
                color={MADHAB_LABELS[madhab]?.color || '#a4b0bb'}
                total={stats.total_scholars}
              />
            ))}
          </div>
        </div>

        {/* Regions */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">
            {getLabel('region', lang)}
          </h3>
          <div className="space-y-2">
            {topRegions.map(([region, count]) => (
              <BarRow
                key={region}
                label={region}
                value={count}
                max={maxRegion}
                color="#5c6d7d"
                total={stats.total_scholars}
              />
            ))}
          </div>
        </div>

        {/* Edge types */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">
            {lang === 'tr' ? 'İlişki Tipleri' : 'Relation Types'}
          </h3>
          <div className="space-y-3">
            {edgeTypes.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-ink-700">{type.replace(/_/g, ' ')}</span>
                <span className="font-mono text-sm text-ink-900 font-medium">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">
            {getLabel('sources', lang)}
          </h3>
          <div className="space-y-3">
            {topSources.map(([src, count]) => (
              <div key={src} className="flex items-center justify-between">
                <span className="text-sm text-ink-700 uppercase tracking-wide">{src}</span>
                <span className="font-mono text-sm text-ink-900 font-medium">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gender / Importance */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">
            {lang === 'tr' ? 'Cinsiyet' : 'Gender'}
          </h3>
          <div className="flex gap-6">
            {Object.entries(stats.genders).map(([g, count]) => (
              <div key={g} className="text-center">
                <p className="text-3xl mb-1">{g === 'M' ? '♂' : g === 'F' ? '♀' : '?'}</p>
                <p className="font-display text-2xl font-bold text-ink-900">{formatNumber(count)}</p>
                <p className="text-xs text-ink-500">
                  {((count / stats.total_scholars) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wider mb-4">
            {getLabel('importance', lang)}
          </h3>
          <div className="flex gap-6">
            {Object.entries(stats.importance).map(([imp, count]) => (
              <div key={imp} className="text-center">
                <p className="text-lg mb-1">{imp === 'high' ? '★' : imp === 'medium' ? '☆' : '·'}</p>
                <p className="font-display text-2xl font-bold text-ink-900">{formatNumber(count)}</p>
                <p className="text-xs text-ink-500 capitalize">{imp}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center mt-12 text-xs text-ink-400">
        <p>tabakat.io v5.0 — {formatNumber(stats.total_scholars)} scholars · {formatNumber(stats.total_edges)} relations · 435 tabaqāt books</p>
        <p className="mt-1">Dr. Ali Çetinkaya & Dr. Hüseyin Gökalp — Selçuk Üniversitesi</p>
      </div>
    </div>
  );
}

function MetricCard({ icon, value, label }) {
  return (
    <div className="card p-4 text-center">
      <span className="text-xl">{icon}</span>
      <p className="stat-number text-2xl mt-1">{formatNumber(value)}</p>
      <p className="text-xs text-ink-500 dark:text-sand-400 mt-0.5">{label}</p>
    </div>
  );
}

function BarRow({ label, value, max, color, total }) {
  const pct = (value / max) * 100;
  const totalPct = ((value / total) * 100).toFixed(1);
  return (
    <div className="group">
      <div className="flex items-center justify-between text-sm mb-0.5">
        <span className="text-ink-700 dark:text-sand-300 truncate mr-2">{label}</span>
        <span className="text-ink-500 dark:text-sand-400 font-mono text-xs shrink-0">
          {formatNumber(value)}
          <span className="text-ink-300 dark:text-sand-600 ml-1">({totalPct}%)</span>
        </span>
      </div>
      <div className="h-2 bg-sand-100 dark:bg-ink-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
