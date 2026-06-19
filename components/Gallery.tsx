"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

/** Galerie annonce : image principale + swipe tactile + défilement auto + miniatures + lightbox zoom. */
export default function Gallery({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);

  const nav = useCallback((d: number) => setIdx((i) => (i + d + images.length) % images.length), [images.length]);

  // Défilement automatique (une image à la fois), en pause au survol/swipe/zoom
  useEffect(() => {
    if (images.length < 2 || paused || zoom) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length, paused, zoom]);

  // Gestes tactiles (swipe horizontal)
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
    touchY.current = e.touches[0].clientY;
    setPaused(true);
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchX.current === null || touchY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    // swipe horizontal franc (et pas un scroll vertical)
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) nav(dx < 0 ? 1 : -1);
    touchX.current = null; touchY.current = null;
    setTimeout(() => setPaused(false), 6000); // reprise auto après inactivité
  }

  return (
    <>
      <div
        className="relative overflow-hidden rounded-lg bg-dark-900 select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Image
          src={images[idx]}
          alt={title}
          width={900}
          height={675}
          priority
          draggable={false}
          className="w-full aspect-square md:aspect-[4/3] md:max-h-[500px] cursor-zoom-in object-contain bg-gray-50 dark:bg-dark-800 transition-opacity duration-300"
          onClick={() => setZoom(true)}
        />
        <button
          type="button"
          aria-label="Image précédente"
          onClick={() => nav(-1)}
          className="absolute left-2.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-[1.2rem] text-white transition hover:bg-black/75"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Image suivante"
          onClick={() => nav(1)}
          className="absolute right-2.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-[1.2rem] text-white transition hover:bg-black/75"
        >
          ›
        </button>
        <div className="absolute bottom-2.5 right-2.5 rounded-xl bg-black/60 px-2.5 py-1 text-[.72rem] text-white">
          {idx + 1} / {images.length}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button key={i} type="button" aria-label={`Image ${i + 1}`} onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
        {images.map((src, i) => (
          <button key={i} type="button" onClick={() => setIdx(i)} className="shrink-0">
            <Image
              src={src}
              alt={`${title} ${i + 1}`}
              width={64}
              height={64}
              className={`h-16 w-16 rounded-lg border-2 object-cover transition ${
                i === idx ? "border-gold opacity-100" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            />
          </button>
        ))}
      </div>

      {zoom && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 p-8"
        >
          <button type="button" aria-label="Fermer" className="absolute right-6 top-5 text-[1.8rem] text-white">
            ✕
          </button>
          <Image src={images[idx]} alt={title} width={1200} height={900} className="max-h-[85vh] w-auto rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}
