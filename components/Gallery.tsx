"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

type Media =
  | { type: "video"; src: string }
  | { type: "image"; src: string };

/**
 * Galerie annonce façon AliExpress : la vidéo (si présente) est le 1er média du
 * carrousel, suivie des photos. Onglets bas « Photos x/y · Vidéo », swipe
 * tactile, défilement auto (en pause sur la vidéo), miniatures et lightbox zoom.
 */
export default function Gallery({
  images,
  title,
  video,
}: {
  images: string[];
  title: string;
  video?: string | null;
}) {
  const media: Media[] = [
    ...(video ? [{ type: "video" as const, src: video }] : []),
    ...images.filter(Boolean).map((src) => ({ type: "image" as const, src })),
  ];

  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const touchY = useRef<number | null>(null);

  const total = media.length;
  const nav = useCallback((d: number) => setIdx((i) => (i + d + total) % total), [total]);

  const current = media[idx];
  const isVideo = current?.type === "video";
  const hasVideo = !!video;
  // Numérotation des photos uniquement (la vidéo n'est pas comptée dans « Photos x/y »)
  const photoCount = media.filter((m) => m.type === "image").length;
  const photoPos = isVideo ? 0 : idx - (hasVideo ? 1 : 0) + 1;
  const firstPhotoIdx = hasVideo ? 1 : 0;

  // Défilement automatique (photos uniquement), en pause au survol/swipe/zoom/vidéo
  useEffect(() => {
    if (total < 2 || paused || zoom || isVideo) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 4000);
    return () => clearInterval(t);
  }, [total, paused, zoom, isVideo]);

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
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) nav(dx < 0 ? 1 : -1);
    touchX.current = null;
    touchY.current = null;
    setTimeout(() => setPaused(false), 6000);
  }

  if (total === 0) return null;

  return (
    <>
      <div
        className="relative overflow-hidden rounded-lg bg-dark-900 select-none"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {isVideo ? (
          <video
            src={current.src}
            controls
            playsInline
            preload="metadata"
            className="w-full aspect-square md:aspect-[4/3] md:max-h-[500px] bg-black object-contain"
          >
            Votre navigateur ne prend pas en charge la lecture vidéo.
          </video>
        ) : (
          <Image
            src={current.src}
            alt={title}
            width={900}
            height={675}
            priority
            draggable={false}
            className="w-full aspect-square md:aspect-[4/3] md:max-h-[500px] cursor-zoom-in object-contain bg-gray-50 dark:bg-dark-800 transition-opacity duration-300"
            onClick={() => setZoom(true)}
          />
        )}

        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Média précédent"
              onClick={() => nav(-1)}
              className="absolute left-2.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-[1.2rem] text-white transition hover:bg-black/75"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Média suivant"
              onClick={() => nav(1)}
              className="absolute right-2.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-[1.2rem] text-white transition hover:bg-black/75"
            >
              ›
            </button>
          </>
        )}

        {/* Onglets bas façon AliExpress : Photos x/y · Vidéo */}
        {hasVideo && photoCount > 0 && (
          <div className="pointer-events-auto absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/55 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setIdx(firstPhotoIdx)}
              className={`rounded-full px-3 py-1 text-[.72rem] font-semibold transition ${
                !isVideo ? "bg-white text-dark-900" : "text-white/85 hover:text-white"
              }`}
            >
              Photos {!isVideo ? `${photoPos}/${photoCount}` : `1/${photoCount}`}
            </button>
            <button
              type="button"
              onClick={() => setIdx(0)}
              className={`rounded-full px-3 py-1 text-[.72rem] font-semibold transition ${
                isVideo ? "bg-white text-dark-900" : "text-white/85 hover:text-white"
              }`}
            >
              Vidéo
            </button>
          </div>
        )}

        {/* Compteur + points quand il n'y a pas de vidéo (galerie photos classique) */}
        {!hasVideo && total > 1 && (
          <>
            <div className="absolute bottom-2.5 right-2.5 rounded-xl bg-black/60 px-2.5 py-1 text-[.72rem] text-white">
              {idx + 1} / {total}
            </div>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {media.map((_, i) => (
                <button key={i} type="button" aria-label={`Image ${i + 1}`} onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniatures */}
      {total > 1 && (
        <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
          {media.map((m, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)} className="relative shrink-0" aria-label={m.type === "video" ? "Vidéo" : `Image ${i + 1}`}>
              {m.type === "video" ? (
                <span className="relative block h-16 w-16 overflow-hidden rounded-lg border-2 border-transparent bg-black" style={{ borderColor: i === idx ? "#F5A623" : "transparent" }}>
                  <video src={`${m.src}#t=0.1`} muted playsInline preload="metadata" className="h-16 w-16 object-cover opacity-90" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                </span>
              ) : (
                <Image
                  src={m.src}
                  alt={`${title} ${i + 1}`}
                  width={64}
                  height={64}
                  className={`h-16 w-16 rounded-lg border-2 object-cover transition ${
                    i === idx ? "border-gold opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {zoom && !isVideo && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 p-8"
        >
          <button type="button" aria-label="Fermer" className="absolute right-6 top-5 text-[1.8rem] text-white">
            ✕
          </button>
          <Image src={current.src} alt={title} width={1200} height={900} className="max-h-[85vh] w-auto rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}
