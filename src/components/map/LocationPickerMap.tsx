import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  accuracyMeters?: number | null;
  locked?: boolean;
  onLockedAttempt?: () => void;
  onChangeLocation: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({
  latitude,
  longitude,
  accuracyMeters,
  locked = false,
  onLockedAttempt,
  onChangeLocation,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const lockedRef = useRef(locked);
  const onLockedAttemptRef = useRef(onLockedAttempt);
  const onChangeLocationRef = useRef(onChangeLocation);

  lockedRef.current = locked;
  onLockedAttemptRef.current = onLockedAttempt;
  onChangeLocationRef.current = onChangeLocation;

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current).setView([latitude, longitude], 15);
      mapRef.current = map;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        updateWhenIdle: false,
        keepBuffer: 4,
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: 'spatial-pin-icon',
        html: '<div style="width:18px;height:18px;border-radius:9999px;background:#22d3ee;border:3px solid #0f172a;box-shadow:0 0 0 3px rgba(34,211,238,0.45);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([latitude, longitude], {
        draggable: !lockedRef.current,
        icon: pinIcon,
      }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        if (lockedRef.current) {
          marker.setLatLng([latitude, longitude]);
          onLockedAttemptRef.current?.();
          return;
        }
        const pos = marker.getLatLng();
        onChangeLocationRef.current(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        if (lockedRef.current) {
          onLockedAttemptRef.current?.();
          return;
        }
        onChangeLocationRef.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      });

      const timer = window.setTimeout(() => {
        map.invalidateSize({ pan: false });
      }, 120);

      const observer =
        typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(() => {
              map.invalidateSize({ pan: false });
            })
          : null;
      observer?.observe(containerRef.current);

      return () => {
        window.clearTimeout(timer);
        observer?.disconnect();
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          markerRef.current = null;
          accuracyCircleRef.current = null;
        }
      };
    }

    return undefined;
  }, []);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    if (locked) {
      marker.dragging?.disable();
    } else {
      marker.dragging?.enable();
    }
  }, [locked]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    map.invalidateSize({ pan: false });
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
      className={`h-64 w-full overflow-hidden rounded-2xl border ${
        locked ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-slate-700'
      }`}
      aria-label="Interactive property location pin map"
    />
  );
}
