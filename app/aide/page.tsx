import StaticPage from "@/components/StaticPage";

export const metadata = { title: "Aide & Contact" };

export default function AidePage() {
  return (
    <StaticPage
      title="Centre d'aide"
      intro="Tout ce qu'il faut savoir pour acheter et vendre sur Wanteermako."
      sections={[
        { h: "Comment publier une annonce ?", p: "Cliquez sur « + Publier », choisissez une catégorie, remplissez les détails, ajoutez 1 à 10 photos, vos coordonnées, puis choisissez une option de visibilité. La publication gratuite est immédiate." },
        { h: "Comment contacter un vendeur ?", p: "Chaque annonce dispose de boutons WhatsApp, Appel et Message. Le contact est direct, sans intermédiaire et sans panier." },
        { h: "Comment booster mon annonce ?", p: "Lors de la publication (étape 5) ou depuis votre tableau de bord, choisissez Premium, À la Une ou Pack Pro, puis payez par mobile money (Orange Money, Wave, MTN, Moov) ou carte bancaire." },
        { h: "Nous contacter", p: "Écrivez-nous via WhatsApp ou à support@annonce.id. Notre équipe répond en français du lundi au samedi." },
      ]}
    />
  );
}
