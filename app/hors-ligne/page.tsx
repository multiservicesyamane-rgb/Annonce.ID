import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pas de connexion — Wanteermako",
  // Rien à indexer : cette page ne s'affiche que depuis le cache du téléphone,
  // quand le réseau est tombé. Dans un résultat de recherche, elle serait
  // absurde.
  robots: { index: false, follow: false },
};

/**
 * Ce que voit l'application quand le réseau tombe.
 *
 * Mise en cache par le service worker à l'installation, et servie à sa place
 * pour toute navigation qui échoue. Sans elle, on tombait sur l'écran
 * d'erreur du navigateur — celui avec le dinosaure — qui ne porte aucun nom
 * et laisse croire que l'application est cassée.
 *
 * Volontairement sans JavaScript, sans image distante, sans police à charger :
 * elle doit s'afficher entièrement hors connexion, sinon elle ne sert à rien.
 */
export default function HorsLignePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[460px] flex-col items-center justify-center px-5 text-center">
      <p className="text-[3rem]" aria-hidden="true">
        📡
      </p>
      <h1 className="mt-3 font-display text-[1.45rem] font-extrabold text-gray-900 dark:text-white">
        Pas de connexion
      </h1>
      <p className="mt-2 text-[.95rem] leading-relaxed text-gray-600 dark:text-gray-400">
        Wanteermako a besoin d&apos;Internet pour afficher cette page. Vérifie tes données
        mobiles ou ton Wi-Fi, puis réessaie.
      </p>

      <div className="mt-6 w-full rounded-2xl border border-gray-200 bg-white p-4 text-left dark:border-white/10 dark:bg-dark-800">
        <p className="text-[.82rem] font-bold text-gray-900 dark:text-white">Bon à savoir</p>
        <p className="mt-1 text-[.82rem] leading-relaxed text-gray-600 dark:text-gray-400">
          Tes documents et tes annonces sont enregistrés sur nos serveurs, pas sur ton
          téléphone. Rien n&apos;est perdu : tout revient dès que la connexion revient.
        </p>
      </div>

      {/* Un lien et non un bouton : sans JavaScript, `history.back()` ou un
          rechargement scripté ne fonctionneraient pas. */}
      <Link
        href="/"
        className="mt-6 rounded-xl bg-green px-6 py-3 text-[.92rem] font-bold text-white"
      >
        Réessayer
      </Link>
    </div>
  );
}
