import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | Annonces.sn",
  description: "Notre politique de confidentialité et de gestion des données personnelles.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-12">
      <h1 className="font-display text-[2.5rem] font-black text-gray-900 dark:text-white mb-8">Politique de Confidentialité</h1>
      
      <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
        <p><strong>Dernière mise à jour : 15 Juin 2026</strong></p>

        <p>
          Chez Annonces.sn, la confidentialité et la sécurité de vos données personnelles sont une priorité absolue. 
          Cette politique explique comment nous recueillons, utilisons et protégeons vos informations.
        </p>

        <h3 className="font-display font-bold text-[1.4rem] mt-8 mb-4 text-gray-900 dark:text-white">1. Données collectées</h3>
        <p>Nous collectons les données suivantes lorsque vous utilisez notre plateforme :</p>
        <ul className="list-disc ml-6 mb-4">
          <li><strong>Informations de compte :</strong> Nom, adresse e-mail, numéro de téléphone, mot de passe chiffré.</li>
          <li><strong>Informations de navigation :</strong> Adresse IP, type de navigateur, pages visitées (via des cookies de performance).</li>
          <li><strong>Contenu généré :</strong> Photos, descriptions et prix de vos annonces.</li>
        </ul>

        <h3 className="font-display font-bold text-[1.4rem] mt-8 mb-4 text-gray-900 dark:text-white">2. Utilisation de vos données</h3>
        <p>Vos données sont utilisées exclusivement pour :</p>
        <ul className="list-disc ml-6 mb-4">
          <li>Créer et gérer votre compte utilisateur.</li>
          <li>Faciliter la mise en relation entre acheteurs et vendeurs (affichage de votre nom et numéro sur vos annonces).</li>
          <li>Améliorer la sécurité de la plateforme et prévenir la fraude.</li>
        </ul>

        <h3 className="font-display font-bold text-[1.4rem] mt-8 mb-4 text-gray-900 dark:text-white">3. Publicité et Google AdSense</h3>
        <p>
          Annonces.sn utilise Google AdSense pour diffuser des annonces publicitaires. Google, en tant que prestataire tiers, utilise des cookies (y compris le cookie DoubleClick) pour diffuser des annonces en fonction de vos visites antérieures sur notre site et sur d'autres sites web.
        </p>
        <p>
          Vous pouvez désactiver la publicité ciblée par centres d'intérêt en visitant les 
          <a href="https://adssettings.google.com/" target="_blank" rel="noopener noreferrer" className="text-green hover:underline mx-1">Paramètres des annonces Google</a>.
        </p>

        <h3 className="font-display font-bold text-[1.4rem] mt-8 mb-4 text-gray-900 dark:text-white">4. Vos droits</h3>
        <p>
          Conformément à la législation en vigueur, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition concernant vos données personnelles. Vous pouvez exercer ce droit à tout moment en supprimant votre compte depuis votre tableau de bord ou en nous contactant à <strong>privacy@annonces.sn</strong>.
        </p>
      </div>
    </div>
  );
}
