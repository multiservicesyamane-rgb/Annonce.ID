import StaticPage from "@/components/StaticPage";

export const metadata = { title: "Conseils de sécurité" };

export default function SecuritePage() {
  return (
    <StaticPage
      title="Sécurité & confiance"
      intro="Quelques règles simples pour acheter et vendre en toute sérénité."
      sections={[
        { h: "🛡️ Ne payez jamais à l'avance", p: "Méfiez-vous de tout vendeur qui exige un acompte avant la rencontre. Wanteermako ne demandera jamais de paiement pour un produit — uniquement pour booster vos annonces." },
        { h: "📍 Rencontrez en lieu public", p: "Privilégiez un lieu fréquenté et de jour pour finaliser une transaction. Vérifiez le produit avant de payer." },
        { h: "✅ Vérifiez le vendeur", p: "Consultez la note, le nombre de ventes et les badges « Vérifié » / « PRO ». En cas de doute, signalez l'annonce." },
        { h: "🚩 Signalez les abus", p: "Un prix anormalement bas, une annonce dupliquée ou un contenu suspect ? Utilisez le bouton « Signaler ». Notre équipe de modération intervient rapidement." },
      ]}
    />
  );
}
