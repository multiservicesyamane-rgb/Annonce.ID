import Link from "next/link";

/**
 * Les trois services, en haut de l'accueil.
 *
 * ── Pourquoi ce bloc existe ──────────────────────────────────────────────
 * L'Espace Pro n'apparaissait qu'a la ligne 403 de l'accueil, et Ma Carriere
 * nulle part. Les deux modules qui font vivre le site etaient donc invisibles
 * pour qui arrive par la page d'accueil — c'est-a-dire presque tout le monde.
 *
 * On n'oblige plus a passer par un tableau de bord pour les decouvrir : les
 * trois cartes menent directement au service, sans compte.
 */

const SERVICES = [
  {
    href: "/annonces",
    icone: "🛒",
    nom: "Petites annonces",
    texte: "Vendre et acheter pres de chez soi.",
    action: "Voir les annonces",
    // Teintes reprises de chaque module, pour qu'on reconnaisse l'univers
    // avant meme d'avoir lu le titre.
    fond: "from-[#FEF3DC] to-[#FDE4B0] dark:from-[#F59E0B]/20 dark:to-[#F59E0B]/5",
    encre: "text-gold-dark dark:text-neon-gold",
  },
  {
    href: "/espace-pro",
    icone: "🧾",
    nom: "Devis & factures",
    texte: "Facturer ses clients, suivre les paiements.",
    action: "Decouvrir l'Espace Pro",
    fond: "from-[#ECFDF5] to-[#D1FAE5] dark:from-[#047857]/20 dark:to-[#047857]/5",
    encre: "text-[#047857] dark:text-[#6EE7B7]",
  },
  {
    href: "/carriere",
    icone: "📄",
    nom: "CV & lettres",
    texte: "Creer son CV et ses courriers en quelques minutes.",
    action: "Creer mon CV",
    fond: "from-[#EEF2FF] to-[#E0E7FF] dark:from-[#4F46E5]/20 dark:to-[#4F46E5]/5",
    encre: "text-[#4F46E5] dark:text-[#A5B4FC]",
  },
];

export default function HomeServices() {
  return (
    <section className="wrap pt-6 pb-2" aria-labelledby="services-titre">
      <div className="text-center">
        <h2
          id="services-titre"
          className="font-display text-[1.35rem] font-extrabold text-gray-900 dark:text-white sm:text-[1.6rem]"
        >
          Trois services, un seul compte
        </h2>
        <p className="mx-auto mt-1.5 max-w-[480px] text-[.9rem] leading-relaxed text-gray-600 dark:text-gray-400">
          Vendez, facturez, decrochez un emploi. Tout se fait ici, sans rien installer.
        </p>
      </div>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
        {SERVICES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`group flex flex-col rounded-2xl bg-gradient-to-br p-5 transition-transform duration-200 hover:-translate-y-1 ${s.fond}`}
          >
            <span
              className="grid h-12 w-12 place-items-center rounded-xl bg-white/80 text-[1.5rem] shadow-sm dark:bg-white/10"
              aria-hidden="true"
            >
              {s.icone}
            </span>
            <span className={`mt-3 block font-display text-[1.05rem] font-extrabold ${s.encre}`}>
              {s.nom}
            </span>
            <span className="mt-1 block flex-1 text-[.85rem] leading-relaxed text-gray-700/90 dark:text-gray-300/90">
              {s.texte}
            </span>
            <span className={`mt-3 inline-flex items-center gap-1.5 text-[.83rem] font-bold ${s.encre}`}>
              {s.action}
              <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
