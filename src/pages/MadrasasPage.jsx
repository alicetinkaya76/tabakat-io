import { useState, useEffect, useRef, useMemo } from 'react';
import { useAsync, getMadrasas, useLang } from '../utils/data';
import { getLabel } from '../utils/i18n';
import { formatNumber } from '../utils/helpers';
import Loading from '../components/Loading';

export default function MadrasasPage() {
  const { lang } = useLang();
  const { data: madrasas, loading } = useAsync(getMadrasas);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const types = useMemo(() => {
    if (!madrasas) return [];
    const counts = {};
    for (const m of madrasas) {
      const t = lang === 'tr' ? m.type_tr : m.type_en;
      counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [madrasas, lang]);

  const filtered = useMemo(() => {
    if (!madrasas) return [];
    if (filterType === 'all') return madrasas;
    return madrasas.filter(m => {
      const t = lang === 'tr' ? m.type_tr : m.type_en;
      return t === filterType;
    });
  }, [madrasas, filterType, lang]);

  // Initialize map
  useEffect(() => {
    if (!madrasas || !mapRef.current || mapInstance.current) return;

    import('leaflet').then(L => {
      const map = L.map(mapRef.current, {
        center: [33, 45],
        zoom: 4,
        minZoom: 3,
        maxZoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org">OSM</a> · <a href="https://carto.com">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      mapInstance.current = map;
      markersRef.current = L.layerGroup().addTo(map);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [madrasas]);

  // Update markers
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;

    import('leaflet').then(L => {
      markersRef.current.clearLayers();

      for (const m of filtered) {
        if (!m.lat || !m.lon) continue;

        const name = lang === 'tr' ? m.tr : m.en;
        const typeName = lang === 'tr' ? m.type_tr : m.type_en;
        const founder = lang === 'tr' ? m.founder_tr : m.founder_en;
        const isSelected = selected?.id === m.id;

        const marker = L.circleMarker([m.lat, m.lon], {
          radius: isSelected ? 10 : 7,
          fillColor: isSelected ? '#dc9a24' : '#07c4a3',
          color: '#fff',
          weight: 2,
          opacity: 0.9,
          fillOpacity: isSelected ? 0.9 : 0.7,
        });

        marker.bindPopup(`
          <div style="min-width:200px">
            <p style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;margin:0 0 4px;color:#2d3239">${name}</p>
            <p style="font-size:12px;color:#5c6d7d;margin:0 0 4px">${typeName}</p>
            ${m.founded ? `<p style="font-size:12px;color:#778897;margin:0">${m.founded}${m.closed ? ` – ${m.closed}` : ''} CE</p>` : ''}
            ${founder ? `<p style="font-size:11px;color:#a4b0bb;margin:4px 0 0">${lang === 'tr' ? 'Kurucu' : 'Founder'}: ${founder}</p>` : ''}
            ${(lang === 'tr' ? m.city_tr : m.city_en) ? `<p style="font-size:11px;color:#a4b0bb;margin:2px 0 0">📍 ${lang === 'tr' ? m.city_tr : m.city_en}</p>` : ''}
          </div>
        `);

        marker.on('click', () => setSelected(m));
        markersRef.current.addLayer(marker);
      }
    });
  }, [filtered, selected, lang]);

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <div className="lg:w-96 shrink-0 bg-white/90 dark:bg-ink-900/90 backdrop-blur border-b lg:border-b-0 lg:border-r border-sand-200 dark:border-ink-700 overflow-y-auto">
        <div className="p-4">
          <h1 className="section-title text-xl mb-1">{getLabel('madrasas', lang)}</h1>
          <p className="text-sm text-ink-500 dark:text-sand-400 mb-4">
            {formatNumber(filtered.length)} {lang === 'tr' ? 'eğitim kurumu' : 'educational institutions'}
          </p>

          {/* Type filter */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => setFilterType('all')}
              className={`text-xs px-2 py-1 rounded-full border transition-all ${
                filterType === 'all'
                  ? 'bg-ink-900 text-white border-transparent dark:bg-gold-600'
                  : 'border-sand-200 text-ink-600 hover:border-sand-400 dark:border-ink-600 dark:text-sand-300'
              }`}
            >
              {getLabel('all', lang)} ({madrasas?.length || 0})
            </button>
            {types.map(([t, c]) => (
              <button
                key={t}
                onClick={() => setFilterType(t === filterType ? 'all' : t)}
                className={`text-xs px-2 py-1 rounded-full border transition-all ${
                  filterType === t
                    ? 'bg-teal-600 text-white border-transparent'
                    : 'border-sand-200 text-ink-600 hover:border-sand-400 dark:border-ink-600 dark:text-sand-300'
                }`}
              >
                {t} ({c})
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-1">
            {filtered.map(m => {
              const name = lang === 'tr' ? m.tr : m.en;
              const city = lang === 'tr' ? m.city_tr : m.city_en;
              const isActive = selected?.id === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelected(m);
                    if (mapInstance.current && m.lat && m.lon) {
                      mapInstance.current.flyTo([m.lat, m.lon], 10, { duration: 0.8 });
                    }
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gold-50 border border-gold-200 dark:bg-gold-900/30 dark:border-gold-700'
                      : 'hover:bg-sand-100 dark:hover:bg-ink-800'
                  }`}
                >
                  <p className={`text-sm font-medium ${isActive ? 'text-gold-800 dark:text-gold-400' : 'text-ink-800 dark:text-sand-200'}`}>
                    {name}
                  </p>
                  <p className="text-xs text-ink-500 dark:text-sand-400">
                    {city}
                    {m.founded && <span className="ml-1 font-mono">· {m.founded}</span>}
                    {m.closed && <span className="font-mono">–{m.closed}</span>}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1 min-h-[300px]" />
    </div>
  );
}
