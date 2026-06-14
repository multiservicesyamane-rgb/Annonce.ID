"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SearchBar from "./SearchBar";
import { CATEGORIES } from "@/lib/constants";

/** Compteur animé qui s'incrémente à l'apparition. */
function Counter({ to, suffix = "", label }: { to: number; suffix?: string; label: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const dur = 1200;
          const start = performance.now();
          const step = (now: number) => {
            const p = Math.min((now - start) / dur, 1);
            setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <div ref={ref}>
      <span className="block font-display text-[1.7rem] font-extrabold text-neon-gold [text-shadow:0_0_16px_rgba(255,201,60,.4)]">
        {val.toLocaleString("fr-FR")}
        {suffix}
      </span>
      <span className="text-[.7rem] uppercase tracking-widest text-white/55">{label}</span>
    </div>
  );
}

const QUICK = [
  { label: "📍 Autour de moi", href: "/recherche?geo=1" },
  { label: "🏠 Immobilier", href: "/categorie/immobilier" },
  { label: "🚗 Véhicules", href: "/categorie/vehicules" },
  { label: "📱 Téléphones", href: "/categorie/electronique" },
  { label: "💼 Emploi", href: "/categorie/emploi" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-grad-hero">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_20%_30%,rgba(245,166,35,.22)_0,transparent_45%),radial-gradient(at_80%_25%,rgba(45,226,230,.15)_0,transparent_45%),radial-gradient(at_60%_85%,rgba(255,42,109,.13)_0,transparent_45%)]" />
      <div className="pointer-events-none absolute -top-20 right-[10%] h-[300px] w-[300px] animate-floatBlob rounded-full bg-gold opacity-40 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-16 left-[5%] h-[240px] w-[240px] animate-floatBlob rounded-full bg-neon-cyan opacity-40 blur-[60px]" />

      {/* Desktop Hero */}
      <div className="hidden md:block relative z-10 mx-auto max-w-[1320px] px-4 pb-8 pt-6">
        <h1 className="mb-2.5 font-display text-[clamp(1.5rem,4vw,2.8rem)] font-extrabold leading-[1.12] text-white">
          Le marché de
          <br />
          <em className="text-grad-gold not-italic [filter:drop-shadow(0_0_20px_rgba(255,201,60,.4))]">
            l&apos;Afrique de l&apos;Ouest
          </em>
          <br />
          dans votre poche
        </h1>
        <p className="mb-6 max-w-[480px] text-white/70">
          Achetez, vendez, louez en toute confiance dans 27 pays. Contact direct WhatsApp, sans intermédiaire.
        </p>

        <SearchBar variant="hero" />

        <div className="mt-4 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <Link
              key={q.label}
              href={q.href}
              className="inline-flex items-center gap-1 rounded-[20px] border border-white/15 bg-white/10 px-2.5 py-1 text-[.72rem] text-white/85 transition hover:border-neon-gold hover:bg-neon-gold/20"
            >
              {q.label}
            </Link>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap gap-7">
          <Counter to={100} suffix="%" label="Gratuit" />
          <Counter to={0} suffix=" FCFA" label="Commission" />
          <Counter to={24} suffix="/7" label="Modération" />
          <Counter to={27} label="Pays Couverts" />
        </div>
      </div>

      {/* Mobile Strategic Hero */}
      <div className="md:hidden relative z-10 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-[1.15rem] font-extrabold text-white leading-tight">
            Trouvez ce que <br/><span className="text-neon-gold">vous cherchez</span>
          </h1>
          <div className="text-right">
            <div className="text-[1.05rem] font-bold text-white">100%</div>
            <div className="text-[.55rem] uppercase text-white/60 tracking-wider">Gratuit</div>
          </div>
        </div>
        <SearchBar variant="hero" />
        <div className="flex overflow-x-auto no-scrollbar gap-2 mt-4 pb-1">
          {QUICK.map((q) => (
            <Link
              key={q.label}
              href={q.href}
              className="whitespace-nowrap rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[.75rem] font-medium text-white shadow-sm"
            >
              {q.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
