import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface ImageCropperModalProps {
  imageSrc: string;
  aspectRatio: number;
  onCropDone: (croppedImageBase64: string) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({ imageSrc, aspectRatio, onCropDone, onCancel }: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async () => {
    if (!croppedAreaPixels) return;

    try {
      const image = new window.Image();
      image.src = imageSrc;
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to the cropped size (or a max to prevent huge files)
      const MAX_W = 1200;
      let finalW = croppedAreaPixels.width;
      let finalH = croppedAreaPixels.height;
      if (finalW > MAX_W) {
        finalH = Math.round((finalH * MAX_W) / finalW);
        finalW = MAX_W;
      }

      canvas.width = finalW;
      canvas.height = finalH;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        finalW,
        finalH
      );

      // Return base64
      onCropDone(canvas.toDataURL('image/jpeg', 0.8));
    } catch (e) {
      console.error(e);
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-dark-900 rounded-xl overflow-hidden flex flex-col h-[80vh]">
        <div className="p-4 border-b border-gray-100 dark:border-dark-border flex justify-between items-center bg-white dark:bg-dark-900 relative z-10">
          <h3 className="font-bold text-lg dark:text-white">Recadrer l'image</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-red-500">✕</button>
        </div>
        
        <div className="relative flex-1 bg-gray-900 min-h-0">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-900 relative z-10">
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 block">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-green"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border dark:text-white">
              Annuler
            </button>
            <button onClick={createCroppedImage} className="px-6 py-2 rounded-lg bg-green text-white font-bold">
              Valider le recadrage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
