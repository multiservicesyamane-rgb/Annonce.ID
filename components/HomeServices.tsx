import Link from "next/link";

/**
 * Les trois services, en haut de l'accueil.
 *
 * ── Pourquoi ce bloc existe ──────────────────────────────────────────────
 * L'Espace Pro n'apparaissait qu'a la ligne 403 de l'accueil, et Ma Carriere
 * nulle part. Les deux modules qui font vivre le site etaient donc invisibles
 * pour qui arrive par la page d'accueil — c'est-a-dire presque tout le monde.
 *
 * ── Pourquoi il est COMPACT ──────────────────────────────────────────────
 * La premiere version empilait trois grandes cartes : sur un telephone, elles
 * occupaient presque tout le premier ecran et repoussaient les annonces — la
 * raison meme pour laquelle les gens viennent — sous la ligne de flottaison.
 *
 * Un raccourci doit se voir sans se substituer au contenu. Trois tuiles sur
 * une seule rangee, a toutes les tailles d'ecran : elles se lisent d'un coup
 * d'oeil et laissent la page respirer. La phrase d'explication n'apparait
 * qu'a partir de `sm`, ou il y a la place de la lire.
 */

const SERVICES = [
  {
    href: "/annonces",
    icone: "🛒",
    nom: "Annonces",
    texte: "Vendre et acheter pres de chez soi",
    // Teintes reprises de chaque module, pour qu'on reconnaisse l'univers
    // avant meme d'avoir lu le titre.
    anneau: "ring-gold/25 hover:ring-gold/60",
    pastille: "bg-gold-pale dark:bg-[#F59E0B]/15",
    encre: "text-gold-dark dark:text-neon-gold",
  },
  {
    href: "/espace-pro",
    icone: "🧾",
    nom: "Devis & factures",
    texte: "Facturer et suivre ses paiements",
    anneau: "ring-[#047857]/20 hover:ring-[#047857]/50",
    pastille: "bg-[#ECFDF5] dark:bg-[#047857]/15",
    encre: "text-[#047857] dark:text-[#6EE7B7]",
  },
  {
    href: "/carriere",
    icone: "📄",
    nom: "CV & lettres",
    texte: "Son CV pret en quelques minutes",
    anneau: "ring-[#4F46E5]/20 hover:ring-[#4F46E5]/50",
    pastille: "bg-[#EEF2FF] dark:bg-[#4F46E5]/15",
    encre: "text-[#4F46E5] dark:text-[#A5B4FC]",
  },
];

export default function HomeServices() {
  return (
    <section className="wrap pt-4 pb-1" aria-label="Nos services">
      {/* `grid-cols-3` des le telephone : trois tuiles etroites cote a cote
          valent mieux qu'une pile de trois pavés. On garde ainsi les annonces
          visibles sans avoir a faire defiler. */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {SERVICES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`group flex flex-col items-center gap-1.5 rounded-2xl bg-white px-2 py-3 text-center ring-1 transition-all duration-200 hover:-translate-y-0.5 dark:bg-dark-800 sm:flex-row sm:gap-3 sm:px-4 sm:py-3.5 sm:text-left ${s.anneau}`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[1.15rem] transition-transform duration-200 group-hover:scale-105 sm:h-11 sm:w-11 sm:text-[1.3rem] ${s.pastille}`}
              aria-hidden="true"
            >
              {s.icone}
            </span>
            <span className="min-w-0">
              <span className={`block truncate text-[.76rem] font-extrabold leading-tight sm:text-[.92rem] ${s.encre}`}>
                {s.nom}
              </span>
              {/* Masquee au telephone : deux lignes de plus par tuile y
                  rendraient la rangee aussi haute que le pave qu'on remplace. */}
              <span className="mt-0.5 hidden text-[.78rem] leading-snug text-gray-500 sm:block">
                {s.texte}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
