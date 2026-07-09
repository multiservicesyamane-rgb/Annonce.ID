import Link from "next/link";

export default function PaymentError() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-gray-50 to-white py-10 transition-colors dark:from-[#2a1a05] dark:via-black dark:to-black sm:py-16">
      <div className="mx-auto max-w-[540px] px-3 sm:px-4">
        <div className="overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-[0_20px_60px_-20px_rgba(245,158,11,0.35)] dark:border-white/10 dark:bg-[#111722]/90 dark:backdrop-blur-xl animate-fadeUp">
          {/* En-tête */}
          <div className="relative bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 px-5 py-9 text-center text-white sm:px-8 sm:py-11">
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 15% 20%, #fff 1.5px, transparent 1.5px)", backgroundSize: "26px 26px" }}
            />
            <div className="relative">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-[2.6rem] ring-4 ring-white/25 backdrop-blur-sm">
                ⏸️
              </div>
              <h1 className="font-display text-[1.5rem] font-extrabold sm:text-[1.8rem]">Paiement annulé</h1>
              <p className="mt-1 text-[.9rem] text-white/85">Aucun montant n'a été débité</p>
            </div>
          </div>

          {/* Corps */}
          <div className="p-5 sm:p-7">
            <p className="text-center text-[.9rem] leading-relaxed text-gray-500 dark:text-gray-400">
              Vous avez interrompu le paiement — pas de souci, votre commande n'a pas été validée
              et <b className="text-gray-700 dark:text-gray-200">rien ne vous a été facturé</b>.
              Vous pouvez réessayer quand vous voulez.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/paiement"
                className="flex-1 rounded-2xl bg-gradient-to-r from-[#6366F1] to-[#A855F7] px-4 py-3.5 text-center text-[.95rem] font-extrabold text-white shadow-lg shadow-[#7C5CFC]/30 transition-all hover:scale-[1.02]"
              >
                🔁 Réessayer le paiement
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 rounded-2xl border-2 border-gray-200 px-4 py-3.5 text-center text-[.95rem] font-extrabold text-gray-700 transition-all hover:border-indigo-400 hover:text-indigo-600 dark:border-white/10 dark:text-gray-200 dark:hover:border-indigo-400"
              >
                📊 Tableau de bord
              </Link>
            </div>

            <p className="mt-4 text-center text-[.75rem] text-gray-400">
              Besoin d'aide ? <Link href="/aide" className="font-bold text-indigo-500 hover:underline">Contactez-nous</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
