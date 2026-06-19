import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PaiementEchec() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[500px] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-[2rem]">⚠️</div>
      <h1 className="mb-2 font-display text-[1.4rem] font-extrabold text-gray-800 dark:text-white">Paiement annulé</h1>
      <p className="mb-8 text-[.92rem] text-gray-500 dark:text-gray-400">
        Le paiement n'a pas été finalisé. Aucun montant n'a été débité. Vous pouvez réessayer quand vous voulez.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/dashboard" className="btn btn-green h-[48px] px-6 font-bold">Retour au tableau de bord</Link>
        <Link href="/" className="btn btn-outline h-[48px] px-6 font-bold">Accueil</Link>
      </div>
    </div>
  );
}
