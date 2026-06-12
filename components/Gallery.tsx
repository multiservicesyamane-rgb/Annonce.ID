"use client";

import { useState } from "react";
import Image from "next/image";

/** Galerie annonce : image principale 4:3 + miniatures carrées + lightbox zoom. */
export default function Gallery({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const nav = (d: number) => setIdx((i) => (i + d + images.length) % images.length);

  return (
    <>
      <div className="relative overflow-hidden rounded-lg bg-dark-900">
        <Image
          src={images[idx]}
          alt={title}
          width={900}
          height={675}
          priority
          className="aspect-[4/3] w-full cursor-zoom-in object-cover"
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
