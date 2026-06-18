import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales | Wanteermako",
  description: "Mentions légales de la plateforme Wanteermako",
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-12">
      <h1 className="font-display text-[2.5rem] font-black text-gray-900 dark:text-white mb-8">Mentions Légales</h1>
      
      <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
        <h3 className="font-display font-bold text-[1.4rem] mt-8 mb-4 text-gray-900 dark:text-white">1. Éditeur du site</h3>
        <p>Le site <strong>Wanteermako</strong> est édité par la société <strong>YamaneTech</strong>.</p>
        <ul className="list-disc ml-6 mb-4">
          <li><strong>Siège social :</strong> Dakar, Sénégal</li>
          <li><strong>Email :</strong> contact@yamanetech.com</li>
          <li><strong>Téléphone :</strong> +221 77 000 00 00</li>
        </ul>

        <h3 className="font-display font-bold text-[1.4rem] mt-8 mb-4 text-gray-900 dark:text-white">2. Hébergement</h3>
        <p>
          Ce site est hébergé par <strong>Vercel Inc.</strong><br/>
          340 S Lemon Ave #4133<br/>
          Walnut, CA 91789<br/>
          États-Unis
        </p>

        <h3 className="font-display font-bold text-[1.4rem] mt-8 mb-4 text-gray-900 dark:text-white">3. Propriété Intellectuelle</h3>
        <p>
          L'ensemble du contenu (textes, images, code source, logos) présent sur le site Wanteermako est la propriété exclusive de YamaneTech, à l'exception des contenus publiés par les utilisateurs (photos des annonces, descriptions) qui restent la propriété de leurs auteurs respectifs. Toute reproduction sans autorisation est interdite.
        </p>

        <h3 className="font-display font-bold text-[1.4rem] mt-8 mb-4 text-gray-900 dark:text-white">4. Responsabilité</h3>
        <p>
          Wanteermako agit en tant que simple intermédiaire technique permettant la mise en relation entre acheteurs et vendeurs. Nous n'intervenons pas dans les transactions et ne pouvons être tenus responsables de la qualité des produits vendus ou d'éventuels litiges entre utilisateurs.
        </p>
      </div>
    </div>
  );
}
