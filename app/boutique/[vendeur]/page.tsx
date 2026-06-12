import Image from "next/image";
import Link from "next/link";
import AdCard from "@/components/AdCard";
import { LISTINGS } from "@/lib/data";

type Props = { params: { vendeur: string } };

export function generateMetadata({ params }: Props) {
  const name = decodeURIComponent(params.vendeur).replace(/-/g, " ");
  return { title: `Boutique ${name}` };
}

export default function BoutiquePage({ params }: Props) {
  const name = decodeURIComponent(params.vendeur)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
  const ads = LISTINGS.slice(0, 8);

  return (
    <div>
      {/* Bannière boutique */}
      <div className="relative overflow-hidden bg-grad-hero">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_20%_30%,rgba(245,166,35,.22)_0,transparent_45%)]" />
        <div className="relative z-10 mx-auto flex max-w-[1320px] flex-wrap items-center gap-5 px-4 py-10">
          <Image src="https://i.pravatar.cc/120?img=12" alt={name} width={88} height={88} className="h-22 w-22 rounded-full border-4 border-gold object-cover" />
          <div>
            <h1 className="flex items-center gap-2 font-display text-[1.6rem] font-extrabold text-white">
              {name} <span className="badge b-pro">PRO</span>
            </h1>
            <div className="mt-1 flex flex-wrap gap-4 text-[.85rem] text-white/70">
              <span>⭐ 4.8 · 127 ventes</span>
              <span className="badge b-verif">✅ Vérifié</span>
              <span>📍 Dakar, Sénégal</span>
            </div>
          </div>
          <a href="https://wa.me/221770000000" target="_blank" rel="noopener noreferrer" className="btn btn-wa ml-auto">
            💬 Contacter
          </a>
        </div>
      </div>

      <div className="wrap py-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-[1.2rem] font-bold">Annonces de {name}</h2>
          <Link href="/recherche" className="text-[.82rem] font-semibold text-green">Voir tout →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ads.map((a) => (
            <AdCard key={a.id} ad={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
