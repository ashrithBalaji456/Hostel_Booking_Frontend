import { useState } from 'react';
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react';
import type { ImageResponse, ImageType } from '../../types/api';

interface PropertyGalleryModalProps {
  propertyName: string;
  images: ImageResponse[];
  initialIndex?: number | null;
  onClose: () => void;
}

const TYPE_LABELS: Record<'ALL' | ImageType, string> = {
  ALL: 'All Photos',
  COVER: 'Cover',
  ROOM: 'Rooms',
  COMMON_AREA: 'Common Area',
  GALLERY: 'Gallery',
};

export function PropertyGalleryModal({
  propertyName,
  images,
  initialIndex = null,
  onClose,
}: PropertyGalleryModalProps) {
  const [filter, setFilter] = useState<'ALL' | ImageType>('ALL');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(initialIndex);

  const filtered = filter === 'ALL' ? images : images.filter((img) => img.imageType === filter);
  const availableTypes = (['ALL', 'COVER', 'ROOM', 'COMMON_AREA', 'GALLERY'] as const).filter(
    (t) => t === 'ALL' || images.some((img) => img.imageType === t),
  );

  const activeLightbox = lightboxIdx != null ? filtered[lightboxIdx] ?? null : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
      <div className="glass-panel flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <Images className="h-4 w-4 text-cyan-400" />
              {propertyName} — Photo Gallery ({images.length})
            </h2>
            <p className="text-xs text-slate-400">Click any photo to view full size.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gallery"
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        {availableTypes.length > 1 && (
          <div className="flex flex-wrap gap-2 border-b border-slate-800 px-5 py-3">
            {availableTypes.map((t) => {
              const count = t === 'ALL' ? images.length : images.filter((i) => i.imageType === t).length;
              const active = filter === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setFilter(t);
                    setLightboxIdx(null);
                  }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {TYPE_LABELS[t]} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Content: Lightbox or Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeLightbox ? (
            <div className="flex flex-col items-center">
              <div className="relative flex w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-2">
                <img
                  src={activeLightbox.imageUrl}
                  alt={`${propertyName} - ${activeLightbox.imageType}`}
                  className="max-h-[62vh] w-auto max-w-full rounded-xl object-contain"
                />
                {filtered.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous photo"
                      onClick={() => setLightboxIdx((prev) => ((prev ?? 0) - 1 + filtered.length) % filtered.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/80 p-2 text-white hover:border-cyan-400/50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next photo"
                      onClick={() => setLightboxIdx((prev) => ((prev ?? 0) + 1) % filtered.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/80 p-2 text-white hover:border-cyan-400/50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              <div className="mt-3 flex w-full items-center justify-between text-xs text-slate-300">
                <span className="rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 font-medium text-cyan-200">
                  {activeLightbox.imageType.replace('_', ' ')} · {(lightboxIdx ?? 0) + 1} / {filtered.length}
                </span>
                <button
                  type="button"
                  onClick={() => setLightboxIdx(null)}
                  className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  Back to All Photos
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxIdx(idx)}
                  className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-left transition hover:border-cyan-400/50"
                >
                  <img
                    src={img.imageUrl}
                    alt={`${propertyName} - ${img.imageType}`}
                    loading="lazy"
                    className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-slate-950/80 px-2.5 py-0.5 text-[11px] font-medium text-cyan-200 backdrop-blur">
                    {img.imageType.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
