import Link from "next/link";

export default function PaymentError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-5xl">⚠️</span>
      </div>
      <h1 className="font-display font-extrabold text-3xl text-gray-900 mb-4">Paiement annulé</h1>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        Votre paiement n'a pas été finalisé. Aucun montant n'a été débité. Vous pouvez réessayer
        à tout moment depuis votre tableau de bord.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/dashboard" className="btn btn-green px-8 py-3 text-lg">
          Retour au tableau de bord
        </Link>
        <Link href="/" className="btn btn-outline px-8 py-3 text-lg">
          Accueil
        </Link>
      </div>
    </div>
  );
}
