import { useEffect, useRef, useState } from 'react';
import { Check, Crop, Maximize2, X } from 'lucide-react';
import type { ImageType } from '../../types/api';

export interface CropResult {
  imageUrl: string;
  imageType: ImageType;
}

export interface CropFramingOptions {
  imageType: ImageType;
  selectAll: boolean;
  scale: number;
  offsetX: number; // 0..1 normalized center X
  offsetY: number; // 0..1 normalized center Y
}

interface ImageCropModalProps {
  src: string;
  initialType: ImageType;
  queueIndex: number;
  queueTotal: number;
  onCancel: () => void;
  onApply: (result: CropResult) => void;
  onApplyAll?: (framing: CropFramingOptions) => void;
}

const ASPECT_BY_TYPE: Record<ImageType, { ratio: number; label: string }> = {
  COVER: { ratio: 16 / 9, label: 'Cover (16:9)' },
  GALLERY: { ratio: 16 / 9, label: 'Gallery (16:9)' },
  ROOM: { ratio: 4 / 3, label: 'Room (4:3)' },
  COMMON_AREA: { ratio: 4 / 3, label: 'Common Area (4:3)' },
};

/**
 * Crops a data/image URL using normalized framing options and returns a compressed JPEG data URL.
 */
export function renderCroppedImage(src: string, framing: CropFramingOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.onload = () => {
      const natW = img.naturalWidth || img.width;
      const natH = img.naturalHeight || img.height;
      if (!natW || !natH) {
        resolve(src);
        return;
      }

      let sx = 0;
      let sy = 0;
      let sw = natW;
      let sh = natH;

      if (!framing.selectAll) {
        const targetRatio = ASPECT_BY_TYPE[framing.imageType].ratio;
        const imgRatio = natW / natH;
        const maxW = imgRatio > targetRatio ? natH * targetRatio : natW;
        const maxH = imgRatio > targetRatio ? natH : natW / targetRatio;

        sw = Math.max(40, Math.round(maxW * framing.scale));
        sh = Math.max(40, Math.round(maxH * framing.scale));

        const maxLeft = Math.max(0, natW - sw);
        const maxTop = Math.max(0, natH - sh);
        sx = Math.min(maxLeft, Math.max(0, Math.round(framing.offsetX * natW - sw / 2)));
        sy = Math.min(maxTop, Math.max(0, Math.round(framing.offsetY * natH - sh / 2)));
      }

      const maxDim = 1200;
      const outScale = Math.min(1, maxDim / Math.max(sw, sh));
      const outW = Math.max(1, Math.round(sw * outScale));
      const outH = Math.max(1, Math.round(sh * outScale));

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      resolve(canvas.toDataURL('image/jpeg', 0.84));
    };
    img.src = src;
  });
}

export function ImageCropModal({
  src,
  initialType,
  queueIndex,
  queueTotal,
  onCancel,
  onApply,
  onApplyAll,
}: ImageCropModalProps) {
  const [imageType, setImageType] = useState<ImageType>(initialType);
  const [selectAll, setSelectAll] = useState(false);
  const [scale, setScale] = useState(1); // 0.35 .. 1
  const [offsetX, setOffsetX] = useState(0.5);
  const [offsetY, setOffsetY] = useState(0.5);
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 16, h: 9 });
  const [applying, setApplying] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  useEffect(() => {
    setImageType(initialType);
    setSelectAll(false);
    setScale(1);
    setOffsetX(0.5);
    setOffsetY(0.5);
  }, [src, initialType]);

  // Compute displayed crop box percentage inside the rendered image wrapper
  const imgRatio = imgSize.w / imgSize.h;
  const targetRatio = selectAll ? imgRatio : ASPECT_BY_TYPE[imageType].ratio;

  const boxWidthPct = selectAll
    ? 100
    : (imgRatio > targetRatio ? (targetRatio / imgRatio) * 100 : 100) * scale;
  const boxHeightPct = selectAll
    ? 100
    : (imgRatio > targetRatio ? 100 : (imgRatio / targetRatio) * 100) * scale;

  const clampedLeftPct = Math.min(100 - boxWidthPct, Math.max(0, offsetX * 100 - boxWidthPct / 2));
  const clampedTopPct = Math.min(100 - boxHeightPct, Math.max(0, offsetY * 100 - boxHeightPct / 2));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (selectAll) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: offsetX,
      origY: offsetY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !stageRef.current || selectAll) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dx = (e.clientX - dragRef.current.startX) / rect.width;
    const dy = (e.clientY - dragRef.current.startY) / rect.height;
    const halfW = boxWidthPct / 200;
    const halfH = boxHeightPct / 200;
    setOffsetX(Math.min(1 - halfW, Math.max(halfW, dragRef.current.origX + dx)));
    setOffsetY(Math.min(1 - halfH, Math.max(halfH, dragRef.current.origY + dy)));
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleConfirm = async () => {
    setApplying(true);
    try {
      const url = await renderCroppedImage(src, { imageType, selectAll, scale, offsetX, offsetY });
      onApply({ imageUrl: url, imageType });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-white">
              <Crop className="h-4 w-4 text-cyan-400" />
              Adjust Photo Framing {queueTotal > 1 ? `(${queueIndex + 1} of ${queueTotal})` : ''}
            </h3>
            <p className="text-xs text-slate-400">
              Drag the highlighted box to choose what is shown. Darkened areas are cropped out.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close crop dialog"
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Type & Select All Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(Object.keys(ASPECT_BY_TYPE) as ImageType[]).map((t) => {
            const active = !selectAll && imageType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setImageType(t);
                  setSelectAll(false);
                }}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-600'
                }`}
              >
                {ASPECT_BY_TYPE[t].label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectAll((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              selectAll
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                : 'border-slate-700 bg-slate-950/70 text-slate-200 hover:border-emerald-400/50'
            }`}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            {selectAll ? '✓ Full Image (All)' : 'Select Full Image (All)'}
          </button>
        </div>

        {/* Visual Crop Stage */}
        <div className="mt-4 flex justify-center rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div ref={stageRef} className="relative inline-block max-h-[340px] select-none overflow-hidden rounded-lg">
            <img
              src={src}
              alt="Crop preview"
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                if (el.naturalWidth && el.naturalHeight) {
                  setImgSize({ w: el.naturalWidth, h: el.naturalHeight });
                }
              }}
              className="block max-h-[340px] w-auto max-w-full object-contain"
            />

            {/* Highlighted crop frame with darkened exterior */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                left: `${clampedLeftPct}%`,
                top: `${clampedTopPct}%`,
                width: `${boxWidthPct}%`,
                height: `${boxHeightPct}%`,
                boxShadow: selectAll ? 'none' : '0 0 0 9999px rgba(2, 6, 23, 0.74)',
              }}
              className={`absolute border-2 ${
                selectAll
                  ? 'border-emerald-400'
                  : 'cursor-move border-cyan-400'
              }`}
            >
              {/* Rule-of-thirds grid */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div key={idx} className="border border-white/15" />
                ))}
              </div>
              {/* Corner handles */}
              <span className="pointer-events-none absolute -left-1 -top-1 h-3 w-3 border-l-2 border-t-2 border-white" />
              <span className="pointer-events-none absolute -right-1 -top-1 h-3 w-3 border-r-2 border-t-2 border-white" />
              <span className="pointer-events-none absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-white" />
              <span className="pointer-events-none absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-white" />
            </div>
          </div>
        </div>

        {/* Zoom / Frame Size Slider */}
        {!selectAll && (
          <div className="mt-3 flex items-center gap-3">
            <label htmlFor="crop-scale" className="text-xs font-medium text-slate-300">
              Frame Size ({Math.round(scale * 100)}%)
            </label>
            <input
              id="crop-scale"
              type="range"
              min={0.35}
              max={1}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="flex-1 accent-cyan-400"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white"
          >
            Cancel
          </button>
          {queueTotal - queueIndex > 1 && onApplyAll && (
            <button
              type="button"
              disabled={applying}
              onClick={() => onApplyAll({ imageType, selectAll, scale, offsetX, offsetY })}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-60"
            >
              Apply to All ({queueTotal - queueIndex})
            </button>
          )}
          <button
            type="button"
            disabled={applying}
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" />
            {queueTotal - queueIndex > 1 ? 'Apply & Next' : 'Apply & Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
