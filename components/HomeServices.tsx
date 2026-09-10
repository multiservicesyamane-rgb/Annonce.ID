import Link from "next/link";

/**
 * Les DEUX autres services, en haut de l'accueil.
 *
 * ── Pourquoi ce bloc existe ──────────────────────────────────────────────
 * L'Espace Pro n'apparaissait qu'a la ligne 403 de l'accueil, et Ma Carriere
 * nulle part. Les deux modules qui font vivre le site etaient donc invisibles
 * pour qui arrive par la page d'accueil — c'est-a-dire presque tout le monde.
 *
 * ── Pourquoi il n'y a PAS de tuile « Annonces » ──────────────────────────
 * La premiere version en comptait trois. C'etait une erreur de raisonnement :
 * cette page EST le site d'annonces. Proposer d'aller voir les annonces a
 * quelqu'un qui les a deja sous les yeux ne lui apprend rien, et volait un
 * tiers de la place aux deux services qu'il ne connait pas.
 *
 * A deux, les tuiles respirent : la phrase d'explication tient meme sur un
 * telephone, la ou trois tuiles obligeaient a la masquer.
 *
 * ── Pourquoi elles restent COMPACTES ─────────────────────────────────────
 * Trois grandes cartes empilees occupaient presque tout le premier ecran et
 * repoussaient les annonces — la raison meme de la visite — sous la ligne de
 * flottaison. Un raccourci se voit sans se substituer au contenu.
 */

const SERVICES = [
  {
    href: "/espace-pro",
    icone: "🧾",
    nom: "Devis & factures",
    texte: "Facturer ses clients, suivre ses paiements",
    anneau: "ring-[#047857]/20 hover:ring-[#047857]/55",
    pastille: "bg-[#ECFDF5] dark:bg-[#047857]/15",
    encre: "text-[#047857] dark:text-[#6EE7B7]",
  },
  {
    href: "/carriere",
    icone: "📄",
    nom: "CV & lettres",
    texte: "Son CV pret en quelques minutes",
    anneau: "ring-[#4F46E5]/20 hover:ring-[#4F46E5]/55",
    pastille: "bg-[#EEF2FF] dark:bg-[#4F46E5]/15",
    encre: "text-[#4F46E5] dark:text-[#A5B4FC]",
  },
];

export default function HomeServices() {
  return (
    <section className="wrap pt-4 pb-1" aria-labelledby="services-titre">
      {/* Un intitule court, pour que la rangee ne tombe pas de nulle part :
          on est sur les annonces, et il y a AUSSI ceci. Sans lui, deux tuiles
          posees la ressemblent a de la publicite. */}
      <p
        id="services-titre"
        className="mb-2 text-[.72rem] font-bold uppercase tracking-[.08em] text-gray-400"
      >
        Aussi sur Wanteermako
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {SERVICES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`group flex items-center gap-2.5 rounded-2xl bg-white px-3 py-3 ring-1 transition-all duration-200 hover:-translate-y-0.5 dark:bg-dark-800 sm:gap-3 sm:px-4 sm:py-3.5 ${s.anneau}`}
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[1.2rem] transition-transform duration-200 group-hover:scale-105 sm:h-11 sm:w-11 sm:text-[1.3rem] ${s.pastille}`}
              aria-hidden="true"
            >
              {s.icone}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-[.84rem] font-extrabold leading-tight sm:text-[.94rem] ${s.encre}`}>
                {s.nom}
              </span>
              <span className="mt-0.5 block text-[.72rem] leading-snug text-gray-500 sm:text-[.79rem]">
                {s.texte}
              </span>
            </span>
            <span
              className="hidden shrink-0 text-gray-300 transition-transform duration-200 group-hover:translate-x-0.5 sm:block"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
