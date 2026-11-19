import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { catConfig } from '../lib/catConfig';
import { isDark, useIsDark } from '../../theme';

const CARTO_KEY = import.meta.env.VITE_CARTO_KEY;

// CARTO "Voyager": blue water, green parks, colored roads — the closest free look to
// Google Maps (Google's own tiles can't be used in Leaflet under their terms).
// Dark theme uses CARTO "Dark Matter". Without a key, plain OSM (light only).
const tileUrl = (dark) =>
  CARTO_KEY
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/${dark ? 'dark_all' : 'voyager'}/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Fixed landmark pin, not from Supabase, not filterable. Category: 'college'.
const HUNTER_COLLEGE = { lat: 40.7685, lng: -73.9645, label: 'College' };

export default function MapView({ places, onSelectPlace, selectedId }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const tilesRef = useRef(null);
  const dark = useIsDark();

  useEffect(() => {
    tilesRef.current?.setUrl(tileUrl(dark));
  }, [dark]);

  useEffect(() => {
    const map = L.map(containerRef.current, { zoomControl: false }).setView(
      [40.73, -73.99],
      13
    );

    tilesRef.current = L.tileLayer(tileUrl(isDark()), {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Static Hunter College landmark pin, added once, independent of the places data.
    const hunterIcon = L.divIcon({
      className: '',
      html: '<div class="emoji-marker">🎓</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.marker([HUNTER_COLLEGE.lat, HUNTER_COLLEGE.lng], { icon: hunterIcon })
      .bindTooltip(HUNTER_COLLEGE.label, {
        permanent: false,
        direction: 'top',
        className: 'hunter-tooltip',
      })
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    places.forEach((place) => {
      const cfg = catConfig[place.category] || catConfig.cafe;
      if (!cfg) return;

      const icon = L.divIcon({
        className: '',
        // Places recommended by more than one person show how many.
        html: `<div class="emoji-marker">${cfg.emoji}${
          place.reviews?.length > 1
            ? `<span class="pin-count" aria-label="${place.reviews.length} recommendations">${place.reviews.length}</span>`
            : ''
        }</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([place.lat, place.lng], { icon });

      marker.bindPopup(
        `<div class="popup-inner">
          <strong>${place.name}</strong>
          <span>${cfg.label} · ${place.cuisine}${
            place.reviews?.length > 1 ? ` · ${place.reviews.length} recommendations` : ''
          }</span>
        </div>`,
        { closeButton: false, minWidth: 100 }
      );

      marker.on('click', () => onSelectPlace?.(place));
      marker.addTo(map);
      marker.placeId = place.id;
      markersRef.current.push(marker);
    });
  }, [places, onSelectPlace]);

  // Ring and lift the pin whose place panel is open, so it's clear which one it is.
  useEffect(() => {
    markersRef.current.forEach((marker) => {
      const isSelected = marker.placeId === selectedId;
      marker.getElement()?.querySelector('.emoji-marker')?.classList.toggle('is-selected', isSelected);
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    });
  }, [selectedId, places]);

  return <div id="map" ref={containerRef} style={{ flex: 1, zIndex: 1 }} />;
}
