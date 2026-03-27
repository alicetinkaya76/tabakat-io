import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync, getGeoJSON, getDynasties, getTradeRoutes, getWaqfs, getMonuments, useLang, useTheme } from '../utils/data';
import { getLabel, FIELD_LABELS, ERA_LABELS } from '../utils/i18n';
import { formatNumber } from '../utils/helpers';
import Loading from '../components/Loading';
import SEO from '../components/SEO';

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export default function MapPage() {
  const { lang } = useLang();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { data: geo, loading } = useAsync(getGeoJSON);
  const { data: dynasties } = useAsync(getDynasties);
  const { data: tradeRoutes } = useAsync(getTradeRoutes);
  const { data: waqfs } = useAsync(getWaqfs);
  const { data: monuments } = useAsync(getMonuments);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef(null);
  const dynastyLayerRef = useRef(null);
  const tradeLayerRef = useRef(null);
  const waqfLayerRef = useRef(null);
  const monumentLayerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const [colorBy, setColorBy] = useState('field');
  const [selectedEra, setSelectedEra] = useState('all');
  const [showDynasties, setShowDynasties] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [showWaqfs, setShowWaqfs] = useState(false);
  const [showMonuments, setShowMonuments] = useState(false);

  const filteredFeatures = useMemo(() => {
    if (!geo) return [];
    let features = geo.features;
    if (selectedEra !== 'all') {
      features = features.filter(f => {
        const era = f.properties.era;
        return era === selectedEra;
      });
    }
    return features;
  }, [geo, selectedEra]);

  useEffect(() => {
    if (!geo || !mapRef.current || mapInstance.current) return;

    import('leaflet').then(L => {
      const map = L.map(mapRef.current, {
        center: [30, 45],
        zoom: 4,
        minZoom: 3,
        maxZoom: 12,
        zoomControl: true,
      });

      const tileUrl = theme === 'dark' ? DARK_TILES : LIGHT_TILES;
      tileLayerRef.current = L.tileLayer(tileUrl, {
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
  }, [geo]);

  // Switch tile layer when theme changes
  useEffect(() => {
    if (!mapInstance.current || !tileLayerRef.current) return;
    import('leaflet').then(L => {
      mapInstance.current.removeLayer(tileLayerRef.current);
      const tileUrl = theme === 'dark' ? DARK_TILES : LIGHT_TILES;
      tileLayerRef.current = L.tileLayer(tileUrl, {
        attribution: '© <a href="https://www.openstreetmap.org">OSM</a> · <a href="https://carto.com">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapInstance.current);
      // Re-add markers on top
      if (markersRef.current) {
        markersRef.current.bringToFront();
      }
    });
  }, [theme]);

  // Update markers when filters change
  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;

    import('leaflet').then(L => {
      markersRef.current.clearLayers();

      const features = filteredFeatures;
      
      // Cluster by proximity for performance
      const gridSize = 0.5;
      const clusters = {};
      
      for (const f of features) {
        const [lng, lat] = f.geometry.coordinates;
        const key = `${Math.round(lat / gridSize) * gridSize},${Math.round(lng / gridSize) * gridSize}`;
        if (!clusters[key]) {
          clusters[key] = { lat, lng, features: [], count: 0 };
        }
        clusters[key].features.push(f);
        clusters[key].count++;
      }

      for (const cluster of Object.values(clusters)) {
        const f = cluster.features[0];
        const props = f.properties;
        
        let color = '#a4b0bb';
        if (colorBy === 'field') {
          // Get normalized field from the search index mapping
          const fieldMap = {
            'Jurist': 'fiqh', 'Hadith Scholar': 'hadith', 'Theologian': 'kalam',
            'Sufi': 'sufism', 'Historian': 'history', 'Poet': 'literature',
            'Philosopher': 'philosophy', 'Physician': 'medicine', 'Companion': 'sahaba',
            'Ruler': 'politics', 'Military Commander': 'politics',
          };
          const norm = fieldMap[props.field] || props.field?.toLowerCase();
          color = FIELD_LABELS[norm]?.color || '#a4b0bb';
        } else if (colorBy === 'era') {
          color = ERA_LABELS[props.era]?.color || '#c9d1d7';
        } else if (colorBy === 'importance') {
          color = props.importance === 'high' ? '#dc9a24' : props.importance === 'medium' ? '#a4b0bb' : '#c9d1d7';
        }

        const radius = cluster.count === 1 ? 5 : Math.min(4 + Math.sqrt(cluster.count) * 2, 20);

        const marker = L.circleMarker([cluster.lat, cluster.lng], {
          radius,
          fillColor: color,
          color: '#fff',
          weight: 1,
          opacity: 0.9,
          fillOpacity: 0.7,
        });

        if (cluster.count === 1) {
          const scholarUrl = `/scholar/${encodeURIComponent(props.id)}`;
          marker.bindPopup(`
            <div style="min-width:180px">
              <a href="${scholarUrl}" style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600;margin:0 0 4px;display:block;color:#2d3239;text-decoration:none" class="scholar-popup-link">${props.name_en || props.id}</a>
              ${props.name_ar ? `<p style="font-family:'Amiri',serif;direction:rtl;font-size:14px;color:#5c6d7d;margin:0 0 4px">${props.name_ar}</p>` : ''}
              <p style="font-size:12px;color:#5c6d7d;margin:0">${props.field || ''} · ${props.era || ''}</p>
              ${props.death_ce ? `<p style="font-size:12px;color:#778897;margin:2px 0 0">d. ${props.death_ce} CE</p>` : ''}
              <p style="font-size:11px;color:#a4b0bb;margin:4px 0 0">${props.place || ''}</p>
              <a href="${scholarUrl}" style="display:inline-block;margin-top:8px;font-size:11px;color:#c37a1b;font-weight:600;text-decoration:none">${lang === 'tr' ? 'Detay →' : 'Details →'}</a>
            </div>
          `);
          // Navigate on popup link click
          marker.on('popupopen', () => {
            const el = document.querySelector('.scholar-popup-link');
            if (el) {
              el.addEventListener('click', (e) => { e.preventDefault(); navigate(scholarUrl); });
            }
            const detailLink = el?.parentElement?.querySelector('a:last-child');
            if (detailLink) {
              detailLink.addEventListener('click', (e) => { e.preventDefault(); navigate(scholarUrl); });
            }
          });
        } else {
          marker.bindPopup(`
            <div>
              <p style="font-weight:600;margin:0">${cluster.count} ${lang === 'tr' ? 'âlim' : 'scholars'}</p>
              <p style="font-size:12px;color:#778897;margin:2px 0 0">
                ${cluster.features.slice(0, 5).map(f => f.properties.name_en || f.properties.id.split(':').pop()).join(', ')}
                ${cluster.count > 5 ? '…' : ''}
              </p>
            </div>
          `);
        }

        markersRef.current.addLayer(marker);
      }
    });
  }, [filteredFeatures, colorBy, navigate, lang]);

  // Dynasty overlay
  useEffect(() => {
    if (!mapInstance.current || !dynasties) return;
    import('leaflet').then(L => {
      // Remove old dynasty layer
      if (dynastyLayerRef.current) {
        mapInstance.current.removeLayer(dynastyLayerRef.current);
        dynastyLayerRef.current = null;
      }
      if (!showDynasties) return;

      dynastyLayerRef.current = L.layerGroup().addTo(mapInstance.current);
      
      // Filter dynasties by era if selected
      let dyns = dynasties;
      if (selectedEra !== 'all') {
        dyns = dynasties.filter(d => d.period === selectedEra || d.period?.includes(selectedEra));
      }

      for (const d of dyns) {
        if (!d.lat || !d.lon) continue;
        const name = lang === 'en' ? d.en : d.tr;
        const yearRange = `${d.start}–${d.end}`;
        
        // Capital marker with pulsing ring
        const marker = L.circleMarker([d.lat, d.lon], {
          radius: d.imp === 'Yüksek' ? 10 : d.imp === 'Orta' ? 7 : 5,
          fillColor: '#dc9a24',
          color: '#dc9a24',
          weight: 2,
          opacity: 0.6,
          fillOpacity: 0.25,
        });

        const dynastyUrl = `/dynasty/${d.id}`;

        marker.bindPopup(`
          <div style="min-width:200px">
            <a href="${dynastyUrl}" style="font-family:'Cormorant Garamond',serif;font-size:15px;font-weight:700;margin:0 0 4px;display:block;color:#2d3239;text-decoration:none" class="dynasty-popup-link">${name}</a>
            ${d.ar ? `<p style="font-family:'Amiri',serif;direction:rtl;font-size:13px;color:#5c6d7d;margin:0 0 4px">${d.ar}</p>` : ''}
            <p style="font-size:12px;color:#778897;margin:0 0 4px;font-family:'JetBrains Mono',monospace">${yearRange} CE</p>
            ${d.cap ? `<p style="font-size:11px;color:#5c6d7d;margin:0 0 4px">🏛️ ${d.cap}</p>` : ''}
            <p style="font-size:11px;color:#778897;margin:0">${d.zone || ''} · ${d.gov || ''}</p>
            <a href="${dynastyUrl}" style="display:inline-block;margin-top:8px;font-size:11px;color:#c37a1b;font-weight:600;text-decoration:none" class="dynasty-detail-link">${lang === 'tr' ? 'Detay →' : 'Details →'}</a>
          </div>
        `);
        marker.on('popupopen', () => {
          const links = document.querySelectorAll('.dynasty-popup-link, .dynasty-detail-link');
          links.forEach(el => {
            el.addEventListener('click', (e) => { e.preventDefault(); navigate(dynastyUrl); });
          });
        });

        dynastyLayerRef.current.addLayer(marker);
      }
    });
  }, [showDynasties, dynasties, selectedEra, lang]);

  // Trade routes overlay
  useEffect(() => {
    if (!mapInstance.current) return;
    import('leaflet').then(L => {
      if (tradeLayerRef.current) {
        mapInstance.current.removeLayer(tradeLayerRef.current);
        tradeLayerRef.current = null;
      }
      if (!showTrade || !tradeRoutes) return;

      tradeLayerRef.current = L.layerGroup().addTo(mapInstance.current);
      const routeColors = ['#dc9a24', '#07c4a3', '#dc2626', '#5c6d7d', '#a25a19', '#087e6d', '#c37a1b', '#0f524a', '#85481c', '#444e59', '#039e87', '#6e3c1a', '#778897', '#3c434c', '#8d6843'];

      for (let i = 0; i < tradeRoutes.length; i++) {
        const route = tradeRoutes[i];
        if (!route.wp || route.wp.length < 2) continue;
        const color = routeColors[i % routeColors.length];
        const coords = route.wp.map(wp => [wp.lat, wp.lon]);
        const line = L.polyline(coords, { color, weight: 3, opacity: 0.7, dashArray: '8 6' });
        const name = lang === 'en' ? route.en : route.tr;
        line.bindPopup(`<div style="min-width:180px"><strong style="font-family:'Cormorant Garamond',serif;font-size:14px">${name}</strong><p style="font-size:11px;color:#778897;margin:4px 0 0">${route.ps}–${route.pe} CE</p>${route.goods_en ? `<p style="font-size:11px;color:#5c6d7d;margin:4px 0 0">🏺 ${lang === 'en' ? route.goods_en : route.goods_tr}</p>` : ''}</div>`);
        tradeLayerRef.current.addLayer(line);

        // Waypoint dots
        for (const wp of route.wp) {
          const dot = L.circleMarker([wp.lat, wp.lon], {
            radius: 3, fillColor: color, color: '#fff', weight: 1, opacity: 0.8, fillOpacity: 0.9
          });
          dot.bindTooltip(wp.n, { direction: 'top', offset: [0, -6], className: 'leaflet-tooltip-trade' });
          tradeLayerRef.current.addLayer(dot);
        }
      }
    });
  }, [showTrade, tradeRoutes, lang]);

  // Waqf overlay
  useEffect(() => {
    if (!mapInstance.current) return;
    import('leaflet').then(L => {
      if (waqfLayerRef.current) {
        mapInstance.current.removeLayer(waqfLayerRef.current);
        waqfLayerRef.current = null;
      }
      if (!showWaqfs || !waqfs) return;

      waqfLayerRef.current = L.layerGroup().addTo(mapInstance.current);
      for (const w of waqfs) {
        if (!w.lat || !w.lon) continue;
        const name = lang === 'en' ? w.en : w.tr;
        const marker = L.circleMarker([w.lat, w.lon], {
          radius: 7, fillColor: '#07c4a3', color: '#07c4a3', weight: 2, opacity: 0.6, fillOpacity: 0.3
        });
        const founder = lang === 'en' ? w.founder_en : w.founder_tr;
        marker.bindPopup(`<div style="min-width:160px"><strong style="font-family:'Cormorant Garamond',serif;font-size:14px">🕌 ${name}</strong>${founder ? `<p style="font-size:11px;color:#5c6d7d;margin:4px 0 0">${founder}</p>` : ''}${w.yr ? `<p style="font-size:11px;color:#778897;margin:2px 0 0">${w.yr} CE</p>` : ''}</div>`);
        waqfLayerRef.current.addLayer(marker);
      }
    });
  }, [showWaqfs, waqfs, lang]);

  // Monuments overlay
  useEffect(() => {
    if (!mapInstance.current) return;
    import('leaflet').then(L => {
      if (monumentLayerRef.current) {
        mapInstance.current.removeLayer(monumentLayerRef.current);
        monumentLayerRef.current = null;
      }
      if (!showMonuments || !monuments) return;

      monumentLayerRef.current = L.layerGroup().addTo(mapInstance.current);
      for (const m of monuments) {
        if (!m.lat || !m.lon) continue;
        const name = lang === 'en' ? m.en : m.tr;
        const marker = L.circleMarker([m.lat, m.lon], {
          radius: 6, fillColor: m.unesco ? '#dc2626' : '#85481c', color: m.unesco ? '#dc2626' : '#85481c', weight: 2, opacity: 0.6, fillOpacity: 0.3
        });
        const typeName = lang === 'en' ? m.type_en : m.type_tr;
        marker.bindPopup(`<div style="min-width:160px"><strong style="font-family:'Cormorant Garamond',serif;font-size:14px">${m.unesco ? '🏛️ ' : '🕌 '}${name}</strong>${typeName ? `<p style="font-size:11px;color:#5c6d7d;margin:4px 0 0">${typeName}</p>` : ''}${m.yr ? `<p style="font-size:11px;color:#778897;margin:2px 0 0">${m.yr} CE</p>` : ''}${m.unesco ? '<p style="font-size:10px;color:#dc2626;margin:4px 0 0;font-weight:600">UNESCO</p>' : ''}</div>`);
        monumentLayerRef.current.addLayer(marker);
      }
    });
  }, [showMonuments, monuments, lang]);

  if (loading) return <Loading />;

  const eras = Object.entries(ERA_LABELS)
    .filter(([k]) => k !== 'unknown')
    .sort((a, b) => a[1].order - b[1].order);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <SEO title={getLabel('map', lang)} path="/map" description="Interactive map of 22,000+ scholars across the Islamic world." />
      {/* Controls */}
      <div className="bg-white/80 dark:bg-ink-900/80 backdrop-blur border-b border-sand-200 dark:border-ink-700 px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-xs sm:text-sm font-medium text-ink-600 dark:text-sand-300">
          {formatNumber(filteredFeatures.length)} {lang === 'tr' ? 'nokta' : 'points'}
        </span>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Dynasty toggle */}
          <button
            onClick={() => setShowDynasties(!showDynasties)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-200 font-medium ${
              showDynasties
                ? 'bg-gold-500 text-white border-gold-500 shadow-sm'
                : 'border-sand-300 dark:border-ink-600 text-ink-600 dark:text-sand-300 hover:border-gold-400'
            }`}
          >
            🏰 {lang === 'tr' ? 'Hanedanlar' : 'Dynasties'}
          </button>

          {/* Trade routes toggle */}
          <button
            onClick={() => setShowTrade(!showTrade)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-200 font-medium ${
              showTrade
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'border-sand-300 dark:border-ink-600 text-ink-600 dark:text-sand-300 hover:border-amber-400'
            }`}
          >
            🐪 {lang === 'tr' ? 'Ticaret' : 'Trade'}
          </button>

          {/* Waqf toggle */}
          <button
            onClick={() => setShowWaqfs(!showWaqfs)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-200 font-medium ${
              showWaqfs
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                : 'border-sand-300 dark:border-ink-600 text-ink-600 dark:text-sand-300 hover:border-teal-400'
            }`}
          >
            🕌 {lang === 'tr' ? 'Vakıf' : 'Waqf'}
          </button>

          {/* Monuments toggle */}
          <button
            onClick={() => setShowMonuments(!showMonuments)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-200 font-medium ${
              showMonuments
                ? 'bg-stone-600 text-white border-stone-600 shadow-sm'
                : 'border-sand-300 dark:border-ink-600 text-ink-600 dark:text-sand-300 hover:border-stone-400'
            }`}
          >
            🏛️ {lang === 'tr' ? 'Anıtlar' : 'Monuments'}
          </button>

          <label className="text-xs text-ink-500 dark:text-sand-400 ml-1">{lang === 'tr' ? 'Renk' : 'Color'}:</label>
          <select
            value={colorBy}
            onChange={(e) => setColorBy(e.target.value)}
            className="text-xs border border-sand-300 dark:border-ink-600 rounded px-2 py-1 bg-white dark:bg-ink-800 dark:text-sand-200"
          >
            <option value="field">{getLabel('field', lang)}</option>
            <option value="era">{getLabel('era', lang)}</option>
            <option value="importance">{getLabel('importance', lang)}</option>
          </select>

          <label className="text-xs text-ink-500 dark:text-sand-400 ml-2">{getLabel('era', lang)}:</label>
          <select
            value={selectedEra}
            onChange={(e) => setSelectedEra(e.target.value)}
            className="text-xs border border-sand-300 dark:border-ink-600 rounded px-2 py-1 bg-white dark:bg-ink-800 dark:text-sand-200"
          >
            <option value="all">{getLabel('all', lang)}</option>
            {eras.map(([k, v]) => (
              <option key={k} value={k}>{v[lang]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} className="flex-1" />
    </div>
  );
}
