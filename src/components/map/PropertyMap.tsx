import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BedDouble, MapPin } from 'lucide-react';
import { formatINR } from '../../utils/format';

export interface PropertyMapMarker {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  startingPrice?: number;
  availableBedCount?: number;
  distanceKm?: number;
}

interface PropertyMapProps {
  markers: PropertyMapMarker[];
  venuePoint?: { latitude: number; longitude: number; label: string };
  heightClass?: string;
}

export default function PropertyMap({
  markers,
  venuePoint,
  heightClass = 'h-[420px]',
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [selected, setSelected] = useState<PropertyMapMarker | null>(null);

  const validMarkers = markers.filter(
    (m) =>
      typeof m.latitude === 'number' &&
      typeof m.longitude === 'number' &&
      !Number.isNaN(m.latitude) &&
      !Number.isNaN(m.longitude),
  );

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const defaultCenter: [number, number] = venuePoint
      ? [venuePoint.latitude, venuePoint.longitude]
      : validMarkers.length > 0
      ? [validMarkers[0].latitude, validMarkers[0].longitude]
      : [12.9716, 77.5946];

    const map = L.map(containerRef.current, {
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView(defaultCenter, 13);
    mapRef.current = map;
    let disposed = false;

    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      updateWhenIdle: false,
      keepBuffer: 4,
    }).addTo(map);

    let loadedAnyTile = false;
    let switchedToFallback = false;
    const switchToFallbackTiles = () => {
      if (switchedToFallback) return;
      switchedToFallback = true;
      tiles.setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}');
    };
    tiles.on('tileload', () => {
      loadedAnyTile = true;
    });
    tiles.on('tileerror', switchToFallbackTiles);
    const fallbackTimer = window.setTimeout(() => {
      if (!loadedAnyTile) switchToFallbackTiles();
    }, 2500);

    const bounds = L.latLngBounds([]);

    if (venuePoint) {
      const venueMarker = L.circleMarker([venuePoint.latitude, venuePoint.longitude], {
        radius: 9,
        color: '#f59e0b',
        fillColor: '#fbbf24',
        fillOpacity: 0.9,
        weight: 2,
      }).addTo(map);
      venueMarker.bindPopup(`<strong>${escapeHtml(venuePoint.label)}</strong>`);
      bounds.extend([venuePoint.latitude, venuePoint.longitude]);
    }

    validMarkers.forEach((m) => {
      const marker = L.circleMarker([m.latitude, m.longitude], {
        radius: 9,
        color: '#06b6d4',
        fillColor: '#22d3ee',
        fillOpacity: 0.85,
        weight: 2,
      }).addTo(map);

      marker.bindPopup(
        `<div style="min-width:160px">
          <strong>${escapeHtml(m.name)}</strong><br/>
          <span style="font-size:12px">${escapeHtml(m.address)}</span><br/>
          ${m.startingPrice != null ? `<span>From ${formatINR(m.startingPrice)}</span> · ` : ''}
          ${m.availableBedCount != null ? `<span>${m.availableBedCount} beds</span>` : ''}
        </div>`,
      );

      marker.on('click', () => {
        setSelected(m);
      });

      bounds.extend([m.latitude, m.longitude]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
    }

    const timer = window.setTimeout(() => {
      if (!disposed) map.invalidateSize({ pan: false });
    }, 120);
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (!disposed) map.invalidateSize({ pan: false });
          })
        : null;
    observer?.observe(containerRef.current);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      window.clearTimeout(fallbackTimer);
      observer?.disconnect();
      map.stop();
      map.remove();
      mapRef.current = null;
    };
  }, [JSON.stringify(validMarkers), venuePoint?.latitude, venuePoint?.longitude, venuePoint?.label]);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className={`w-full overflow-hidden rounded-2xl border border-slate-800 ${heightClass}`}
        aria-label="Property locations map"
      />
      {selected && (
        <div className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <div>
            <h3 className="text-sm font-semibold text-white">{selected.name}</h3>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              {selected.address}
              {selected.distanceKm != null ? ` · ${selected.distanceKm} km straight-line` : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {selected.startingPrice != null && (
              <span className="text-sm font-bold text-white">{formatINR(selected.startingPrice)}</span>
            )}
            {selected.availableBedCount != null && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
                <BedDouble className="h-3.5 w-3.5" /> {selected.availableBedCount} beds
              </span>
            )}
            <Link
              to={`/properties/${selected.id}`}
              className="rounded-xl bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
            >
              View Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
