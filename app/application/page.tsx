import type { Metadata } from "next";
import Link from "next/link";
import InstallerApp from "@/components/InstallerApp";

export const metadata: Metadata = {
  title: "Installer l'application Wanteermako",
  description:
    "Installez Wanteermako sur votre téléphone en deux gestes. Annonces, devis et factures, CV et lettres — sans passer par un magasin d'applications.",
  alternates: { canonical: "/application" },
};

/**
 * La page d'installation, en attendant les magasins.
 *
 * ── Ce qu'elle n'est pas ─────────────────────────────────────────────────
 * Ce n'est pas une page de téléchargement : il n'y a aucun fichier à
 * télécharger. Le navigateur installe le site lui-même. Le dire clairement
 * évite la question qui viendrait sinon — « où est le lien ? ».
 *
 * ── Pourquoi elle vaut la peine d'exister maintenant ─────────────────────
 * Le Play Store demandera un compte développeur et quelques jours. Cette page
 * fonctionne aujourd'hui, sur tous les Android, et ne coûte rien. Le jour où
 * l'application sera publiée, on ajoutera les badges ici même — le reste ne
 * bougera pas.
 */

const SERVICES = [
  { icone: "🛒", nom: "Petites annonces", texte: "Vendre et acheter près de chez soi.", lien: "/annonces" },
  { icone: "🧾", nom: "Devis et factures", texte: "Facturer ses clients, suivre les paiements.", lien: "/espace-pro" },
  { icone: "📄", nom: "CV et lettres", texte: "Créer son CV et ses courriers en quelques minutes.", lien: "/carriere" },
];

const ARGUMENTS = [
  ["⚡", "Aucun magasin d'applications", "Deux gestes depuis ce navigateur, et l'icône est sur ton écran d'accueil."],
  ["📉", "Presque rien à télécharger", "Pas de 40 Mo à charger : ton forfait ne le sentira pas passer."],
  ["🔄", "Toujours à jour", "Pas de mise à jour à installer. Tu ouvres, c'est la dernière version."],
  ["🔔", "Notifications", "Un message, un devis accepté, une annonce vue — tu le sais tout de suite."],
];

export default function ApplicationPage() {
  return (
    <div className="mx-auto max-w-[680px] px-5 py-10">
      <header className="text-center">
        <p className="text-[2.6rem]" aria-hidden="true">📱</p>
        <h1 className="mt-2 font-display text-[1.8rem] font-extrabold leading-tight text-gray-900 dark:text-white sm:text-[2.2rem]">
          Wanteermako sur ton téléphone
        </h1>
        <p className="mx-auto mt-3 max-w-[460px] text-[.95rem] leading-relaxed text-gray-600 dark:text-gray-400">
          Trois services, un seul compte, une seule application. Elle s&apos;installe depuis
          cette page — sans magasin d&apos;applications.
        </p>
      </header>

      <div className="mx-auto mt-7 max-w-[420px]">
        <InstallerApp />
      </div>

      <section className="mt-10">
        <h2 className="text-center font-display text-[1.15rem] font-extrabold text-gray-900 dark:text-white">
          Ce que tu trouves dedans
        </h2>
        <div className="mt-4 grid gap-3">
          {SERVICES.map((s) => (
            <Link
              key={s.nom}
              href={s.lien}
              className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-green/50 dark:border-white/10 dark:bg-dark-800"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green/10 text-[1.3rem]" aria-hidden="true">
                {s.icone}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[.98rem] font-bold text-gray-900 dark:text-white">{s.nom}</span>
                <span className="block text-[.85rem] text-gray-600 dark:text-gray-400">{s.texte}</span>
              </span>
              <span className="shrink-0 text-gray-400" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="grid gap-3 sm:grid-cols-2">
          {ARGUMENTS.map(([icone, titre, texte]) => (
            <div key={titre} className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
              <p className="text-[1.2rem]" aria-hidden="true">{icone}</p>
              <p className="mt-1 text-[.9rem] font-bold text-gray-900 dark:text-white">{titre}</p>
              <p className="mt-1 text-[.83rem] leading-relaxed text-gray-600 dark:text-gray-400">{texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dit franchement, plutôt que laissé deviner : quelqu'un qui cherche
          « Wanteermako » sur le Play Store et ne trouve rien se demande si le
          site est sérieux. Autant l'annoncer nous-mêmes. */}
      <p className="mt-8 text-center text-[.83rem] leading-relaxed text-gray-500">
        L&apos;application arrivera aussi sur le Play Store dans les prochaines semaines.
        En attendant, celle que tu installes ici est exactement la même —
        et elle se met à jour toute seule.
      </p>
    </div>
  );
}
