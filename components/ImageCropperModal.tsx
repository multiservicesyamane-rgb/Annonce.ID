import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

// Bornes du zoom, partagees par le cadre et le curseur : deux valeurs
// separees finissaient toujours par diverger.
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 4;

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
  maxWidth?: number;
  onCropDone: (croppedImageBase64: string) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({ imageSrc, aspectRatio, maxWidth = 1200, onCropDone, onCancel }: ImageCropperModalProps) {
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
      const MAX_W = maxWidth;
      let finalW = croppedAreaPixels.width;
      let finalH = croppedAreaPixels.height;
      if (finalW > MAX_W) {
        finalH = Math.round((finalH * MAX_W) / finalW);
        finalW = MAX_W;
      }

      canvas.width = finalW;
      canvas.height = finalH;

      // Fond blanc : depuis qu'on peut dézoomer sous le cadre, la zone de
      // recadrage déborde volontairement de la photo. Ce qui dépasse doit être
      // blanc — pas noir, pas transparent : une photo verticale se retrouve
      // avec des bandes claires, comme sur les autres sites d'annonces.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, finalW, finalH);

      // On ne dessine que l'INTERSECTION entre le cadre et la photo, à sa
      // place exacte. Passer directement un rectangle source qui sort de
      // l'image ne renvoie pas d'erreur : le navigateur en étire l'intersection
      // sur toute la destination, et la photo sort déformée.
      const { x: sx, y: sy, width: sw, height: sh } = croppedAreaPixels;
      const echelle = finalW / sw;
      const x0 = Math.max(0, sx);
      const y0 = Math.max(0, sy);
      const x1 = Math.min(image.width, sx + sw);
      const y1 = Math.min(image.height, sy + sh);

      if (x1 > x0 && y1 > y0) {
        ctx.drawImage(
          image,
          x0,
          y0,
          x1 - x0,
          y1 - y0,
          (x0 - sx) * echelle,
          (y0 - sy) * echelle,
          (x1 - x0) * echelle,
          (y1 - y0) * echelle
        );
      }

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
          {/*
            objectFit="contain" : au zoom 1, la photo ENTIÈRE tient dans le
            cadre. Par défaut la bibliothèque fait l'inverse — elle couvre le
            cadre — et sur une photo verticale dans un cadre horizontal, le
            haut et le bas étaient rognés dès l'ouverture, sans aucun moyen de
            les récupérer : le zoom arrière s'arrêtait à ce point-là.

            minZoom 0.4 : on descend encore sous « l'image entière », pour
            laisser de la marge blanche autour d'une photo très allongée.

            restrictPosition={false} : sans cela, une image plus petite que le
            cadre reste collée au centre et ne se déplace plus.
          */}
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            objectFit="contain"
            restrictPosition={false}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-white dark:bg-dark-900 relative z-10">
          <div className="mb-4">
            <label className="text-sm font-bold text-gray-700 dark:text-white mb-2 block">
              Zoom (avant / arrière)
              <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                — vers la gauche pour faire tenir toute la photo
              </span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Dézoomer"
                onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))}
                className="h-9 w-9 shrink-0 rounded-lg border border-gray-300 dark:border-dark-border text-xl font-black text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
              >−</button>
              <input
                type="range"
                value={zoom}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.05}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-green"
              />
              <button
                type="button"
                aria-label="Zoomer"
                onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))}
                className="h-9 w-9 shrink-0 rounded-lg border border-gray-300 dark:border-dark-border text-xl font-black text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10"
              >+</button>
            </div>
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
