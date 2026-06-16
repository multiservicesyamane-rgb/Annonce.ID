import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Comment ça marche | Annonces.sn",
  description: "Découvrez comment vendre et acheter facilement sur Annonces.sn en 3 étapes simples.",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 py-12 md:py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-block bg-green/10 text-green font-bold px-4 py-1.5 rounded-full text-[.85rem] uppercase tracking-wider mb-4">
          Simple, Rapide et Sécurisé
        </div>
        <h1 className="font-display text-[2.5rem] md:text-[3.5rem] font-black text-gray-900 dark:text-white leading-tight mb-6">
          Comment ça marche ?
        </h1>
        <p className="text-[1.1rem] text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Que vous souhaitiez faire de la place chez vous ou développer votre commerce, vendre sur Annonces.sn est un jeu d'enfant.
        </p>
      </div>

      {/* 3 Steps */}
      <div className="grid md:grid-cols-3 gap-8 relative">
        {/* Connecting line (desktop only) */}
        <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gray-100 dark:bg-dark-border z-0"></div>

        {/* Step 1 */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-white dark:bg-dark-800 border-[3px] border-gold flex items-center justify-center text-[3rem] shadow-xl mb-6">
            📸
          </div>
          <div className="bg-gold text-dark-900 w-8 h-8 rounded-full flex items-center justify-center font-black absolute top-0 right-[calc(50%-3rem)] shadow-md">
            1
          </div>
          <h3 className="font-display text-[1.4rem] font-bold text-gray-900 dark:text-white mb-3">Prenez des photos</h3>
          <p className="text-gray-600 dark:text-gray-400 text-[.95rem] leading-relaxed">
            Prenez votre article en photo sous son meilleur angle. Une annonce avec de belles photos se vend 5 fois plus vite !
          </p>
        </div>

        {/* Step 2 */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-white dark:bg-dark-800 border-[3px] border-neon-cyan flex items-center justify-center text-[3rem] shadow-xl mb-6">
            📝
          </div>
          <div className="bg-neon-cyan text-dark-900 w-8 h-8 rounded-full flex items-center justify-center font-black absolute top-0 right-[calc(50%-3rem)] shadow-md">
            2
          </div>
          <h3 className="font-display text-[1.4rem] font-bold text-gray-900 dark:text-white mb-3">Postez votre annonce</h3>
          <p className="text-gray-600 dark:text-gray-400 text-[.95rem] leading-relaxed">
            Rédigez un titre accrocheur, fixez un prix juste et publiez. C'est 100% gratuit et cela prend moins de 2 minutes.
          </p>
        </div>

        {/* Step 3 */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-white dark:bg-dark-800 border-[3px] border-green flex items-center justify-center text-[3rem] shadow-xl mb-6">
            🤝
          </div>
          <div className="bg-green text-white w-8 h-8 rounded-full flex items-center justify-center font-black absolute top-0 right-[calc(50%-3rem)] shadow-md">
            3
          </div>
          <h3 className="font-display text-[1.4rem] font-bold text-gray-900 dark:text-white mb-3">Vendez !</h3>
          <p className="text-gray-600 dark:text-gray-400 text-[.95rem] leading-relaxed">
            Les acheteurs intéressés vous contacteront directement sur WhatsApp ou par appel téléphonique. Concluez la vente !
          </p>
        </div>
      </div>

      {/* Pro Section */}
      <div className="mt-20 bg-[#111722] rounded-[2rem] p-8 md:p-12 border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-gold/20 blur-[80px]"></div>
        
        <div className="flex-1 relative z-10">
          <h2 className="font-display text-[2rem] font-bold text-white mb-4">
            Vous êtes un professionnel ?
          </h2>
          <p className="text-gray-300 text-[1.05rem] mb-6 max-w-lg">
            Boostez vos ventes avec nos forfaits <span className="text-gold font-bold">Premium</span> et <span className="text-neon-cyan font-bold">VIP</span>. Obtenez une vitrine digitale (Boutique PRO) et propulsez vos annonces en tête de liste.
          </p>
          <ul className="space-y-2 text-gray-400 mb-8 text-[.95rem]">
            <li className="flex items-center gap-2"><span className="text-green">✓</span> Visibilité multipliée par 10</li>
            <li className="flex items-center gap-2"><span className="text-green">✓</span> Badge "Vendeur Vérifié" qui rassure</li>
            <li className="flex items-center gap-2"><span className="text-green">✓</span> Statistiques détaillées de vos vues</li>
          </ul>
          <Link href="/publier" className="btn btn-gold text-dark-900 px-8 py-3 text-[1.1rem]">
            Découvrir les offres PRO
          </Link>
        </div>
        
        <div className="w-full md:w-[350px] aspect-square rounded-2xl bg-white/5 border border-white/10 relative z-10 flex items-center justify-center text-[6rem]">
          🏪
        </div>
      </div>
    </div>
  );
}
