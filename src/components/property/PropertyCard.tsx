import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, BedDouble, ShieldCheck } from 'lucide-react';
import type { PropertySearchItemResponse } from '../../types/api';
import { formatINR } from '../../utils/format';

export function PropertyCard({ property }: { property: PropertySearchItemResponse }) {
  const images =
    property.imageUrls && property.imageUrls.length > 0
      ? property.imageUrls
      : property.mainImage
      ? [property.mainImage]
      : [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setActiveIdx(0);
  }, [property.id, images.length]);

  useEffect(() => {
    if (images.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % images.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [images.length, paused]);

  return (
    <Link
      to={`/properties/${property.id}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="glass-panel group flex flex-col overflow-hidden rounded-2xl transition hover:border-cyan-500/40"
    >
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        {images.length > 0 ? (
          <>
            <div
              className="flex h-full w-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIdx * 100}%)` }}
            >
              {images.map((src, idx) => (
                <img
                  key={`${property.id}-img-${idx}`}
                  src={src}
                  alt={`${property.name} photo ${idx + 1}`}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full shrink-0 object-cover transition duration-300 group-hover:scale-105"
                />
              ))}
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-slate-950/75 px-2 py-1 backdrop-blur">
                {images.map((_, idx) => (
                  <span
                    key={idx}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activeIdx ? 'w-3.5 bg-cyan-400' : 'w-1.5 bg-slate-400/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-xs text-slate-400">
            {property.propertyType} · {property.city}
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-slate-950/80 px-2.5 py-0.5 text-xs font-medium text-cyan-300 backdrop-blur">
            {property.propertyType.replace('_', ' ')}
          </span>
          {property.verificationStatus === 'APPROVED' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/85 px-2.5 py-0.5 text-xs font-medium text-emerald-300 backdrop-blur">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-white group-hover:text-cyan-300">
            {property.name}
          </h3>
          {property.averageRating != null && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {property.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span className="line-clamp-1">
            {[property.locality, property.city, property.pincode].filter(Boolean).join(', ')}
          </span>
        </p>

        {property.distanceKm != null && (
          <p className="mt-1 text-xs text-cyan-300">{property.distanceKm} km away</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300">
            {property.genderPolicy.replace('_', ' ')}
          </span>
          {property.availableStayTypes.map((st) => (
            <span key={st} className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-[11px] text-indigo-300">
              {st === 'SHORT_STAY' ? 'Hourly / Nightly' : 'Weekly / Monthly'}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-slate-800/80 pt-3 mt-4">
          <div>
            <p className="text-xs text-slate-400">Starting from</p>
            <p className="text-lg font-bold text-white">{formatINR(property.startingPrice)}</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-300">
            <BedDouble className="h-4 w-4" />
            <span>{property.availableBedCount} beds</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
