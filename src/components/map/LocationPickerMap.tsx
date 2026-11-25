import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  onChangeLocation: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  accuracyMeters,
  onChangeLocation,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current).setView([latitude, longitude], 15);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'spatial-pin-icon',
        html: '<div style="width:18px;height:18px;border-radius:9999px;background:#22d3ee;border:3px solid #0f172a;box-shadow:0 0 0 3px rgba(34,211,238,0.45);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([latitude, longitude], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChangeLocation(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        onChangeLocation(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        accuracyCircleRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([latitude, longitude]);
    map.panTo([latitude, longitude], { animate: true });

    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.remove();
      accuracyCircleRef.current = null;
    }
    if (accuracyMeters && accuracyMeters > 0) {
      accuracyCircleRef.current = L.circle([latitude, longitude], {
        radius: accuracyMeters,
        color: '#22d3ee',
        fillColor: '#22d3ee',
        fillOpacity: 0.12,
        weight: 1,
      }).addTo(map);
    }
  }, [latitude, longitude, accuracyMeters]);

  return (
    <div
      ref={containerRef}
      className="h-64 w-full overflow-hidden rounded-2xl border border-slate-700"
      aria-label="Interactive property location pin map"
    />
  );
}
