import StaticPage from "@/components/StaticPage";

export const metadata = { title: "Conditions Générales d'Utilisation" };

export default function CguPage() {
  return (
    <StaticPage
      title="Conditions Générales d'Utilisation"
      intro="Dernière mise à jour : 2026. En utilisant Wanteermako, vous acceptez les présentes conditions."
      sections={[
        { h: "1. Objet", p: "Wanteermako est une plateforme de mise en relation entre acheteurs et vendeurs en Afrique de l'Ouest. Wanteermako n'est pas partie aux transactions conclues entre utilisateurs." },
        { h: "2. Publication d'annonces", p: "Vous vous engagez à publier des annonces licites, exactes et conformes à la législation en vigueur. Les annonces frauduleuses, illégales ou trompeuses sont supprimées et peuvent entraîner la suspension du compte." },
        { h: "3. Données personnelles", p: "Vos données sont traitées conformément à la loi sénégalaise sur la protection des données personnelles et au RGPD : consentement, droit d'accès et droit à l'effacement. Votre numéro de téléphone peut être masqué dans les annonces." },
        { h: "4. Paiements", p: "Les paiements de boosts sont opérés via des agrégateurs certifiés PCI-DSS. Wanteermako ne stocke aucune donnée de carte bancaire." },
        { h: "5. Responsabilité", p: "Wanteermako met tout en œuvre pour assurer la qualité du service mais ne saurait être tenu responsable des litiges entre utilisateurs. Respectez nos conseils de sécurité." },
      ]}
    />
  );
}
