import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import AdBanner from "@/components/AdBanner";
import AdCard from "@/components/AdCard";
import HomeRecent from "@/components/HomeRecent";
import { featuredListings, premiumListings } from "@/lib/data";
import { CATEGORIES } from "@/lib/constants";

export default function HomePage() {
  const une = featuredListings();
  const prem = premiumListings();

  return (
    <>
      <Hero />

      {/* AD A1 */}
      <div className="wrap mt-6">
        <AdBanner slot="A1" title="🟠 Orange Money — Payez vos annonces en 1 clic" subtitle="Bannière hero · Ciblage par pays" />
      </div>

      {/* À LA UNE */}
      <section className="wrap py-9">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-[1.25rem] font-bold text-gray-900">
            Annonces à la Une <span className="badge b-une">✦ UNE</span>
          </h2>
          <Link href="/recherche" className="text-[.82rem] font-semibold text-green hover:text-gold-dark">
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1fr]">
          {une.map((ad, i) => (
            <Link
              key={ad.id}
              href={`/annonce/${ad.id}/${ad.slug}`}
              className={`group relative overflow-hidden rounded-lg shadow-sm transition hover:-translate-y-[3px] hover:shadow-lg ${
                i === 0 ? "col-span-2 md:col-span-1 md:row-span-2" : ""
              }`}
            >
              <Image
                src={ad.image}
                alt={ad.title}
                width={600}
                height={i === 0 ? 600 : 180}
                className={`w-full object-cover transition duration-500 group-hover:scale-105 ${
                  i === 0 ? "h-full min-h-[240px] md:min-h-[320px]" : "h-[180px]"
                }`}
              />
              <span className="badge b-une absolute left-2.5 top-2.5">✦ À la Une</span>
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(0,0,0,.88),transparent)] p-4">
                <div className={`font-display font-bold text-white ${i === 0 ? "text-[1.2rem]" : "text-[.9rem]"}`}>
                  {ad.title}
                </div>
                <div
                  className={`font-bold text-neon-gold [text-shadow:0_0_12px_rgba(255,201,60,.4)] ${
                    i === 0 ? "text-[1.15rem]" : "text-[.92rem]"
                  }`}
                >
                  {ad.price}
                </div>
                <div className="mt-0.5 text-[.68rem] text-white/60">📍 {ad.location} · {ad.date}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PREMIUM carousel */}
      <section className="border-y border-[#f0d080] bg-[linear-gradient(135deg,#fffbf0,#fff8e6)] py-6">
        <div className="wrap">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-[1.25rem] font-bold text-gray-900">
              🌟 Annonces Premium <span className="badge b-prem">✦ PREMIUM</span>
            </h2>
            <Link href="/recherche" className="text-[.82rem] font-semibold text-green hover:text-gold-dark">
              Voir tout →
            </Link>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
            {prem.map((ad) => (
              <Link
                key={ad.id}
                href={`/annonce/${ad.id}/${ad.slug}`}
                className="w-[175px] shrink-0 overflow-hidden rounded-lg border-[1.5px] border-transparent [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(135deg,#F5A623,#FFD166,#F5A623)_border-box] transition hover:-translate-y-[3px] hover:shadow-glow-gold"
              >
                <Image src={ad.image} alt={ad.title} width={350} height={350} className="card-img-sq" />
                <div className="p-2.5">
                  <div className="line-clamp-2 text-[.82rem] font-semibold leading-snug">{ad.title}</div>
                  <div className="mt-0.5 font-display text-[.92rem] font-bold text-grad-gold">{ad.price}</div>
                  <div className="mt-0.5 text-[.68rem] text-gray-500">📍 {ad.location}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="wrap py-9">
        <h2 className="mb-5 font-display text-[1.25rem] font-bold text-gray-900">Explorer par catégorie</h2>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/categorie/${c.slug}`}
              className="rounded-lg border-[1.5px] border-gray-100 bg-white px-2 py-4 text-center transition hover:-translate-y-0.5 hover:border-gold hover:shadow-sm"
            >
              <span className="mb-1 block text-[1.7rem]">{c.icon}</span>
              <div className="text-[.76rem] font-semibold text-gray-700">{c.name}</div>
              <div className="text-[.66rem] text-gray-300">{c.count}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* AD A2 */}
      <div className="wrap">
        <AdBanner slot="A2" title="🏦 Votre marque ici" subtitle="Bannière in-feed · 250 000 vues/mois" variant="green" />
      </div>

      {/* RÉCENTES */}
      <section className="wrap py-9">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[1.25rem] font-bold text-gray-900">Annonces récentes</h2>
          <Link href="/recherche" className="text-[.82rem] font-semibold text-green hover:text-gold-dark">
            Voir tout →
          </Link>
        </div>
        <HomeRecent />
      </section>

      {/* TRUST */}
      <section className="wrap py-9">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { ic: "💬", t: "Contact direct", d: "WhatsApp, Appel ou message. Sans intermédiaire, sans panier." },
            { ic: "✅", t: "Vendeurs vérifiés", d: "Identité et téléphone vérifiés. Badges de confiance." },
            { ic: "💳", t: "Paiement local", d: "Orange Money, Wave, MTN, Moov. Sans frais cachés." },
            { ic: "🌍", t: "27 pays", d: "Toute l'Afrique de l'Ouest et au-delà, en français." },
          ].map((b) => (
            <div key={b.t} className="rounded-lg border-[1.5px] border-gray-100 bg-white p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[14px] bg-grad-gold text-[1.3rem] shadow-glow-gold">
                {b.ic}
              </div>
              <h4 className="mb-1 font-display text-[.92rem] font-bold">{b.t}</h4>
              <p className="text-[.78rem] text-gray-500">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-grad-hero">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(at_20%_30%,rgba(245,166,35,.22)_0,transparent_45%),radial-gradient(at_80%_25%,rgba(45,226,230,.15)_0,transparent_45%)]" />
        <div className="relative z-10 mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-4 py-10 max-sm:flex-col max-sm:text-center">
          <div>
            <h2 className="font-display text-[1.5rem] font-extrabold text-white">
              Vendez vite avec <em className="not-italic text-neon-gold [text-shadow:0_0_16px_rgba(255,201,60,.5)]">Annonce.ID</em>
            </h2>
            <p className="mt-1 text-[.88rem] text-white/65">Publiez gratuitement ou boostez pour des milliers de vues</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/publier" className="btn btn-lg bg-white !text-green">Publier gratuitement</Link>
            <Link href="/publier" className="btn btn-gold btn-lg">✦ Annonce Premium</Link>
          </div>
        </div>
      </section>
    </>
  );
}
