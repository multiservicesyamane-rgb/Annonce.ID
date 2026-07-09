// ───────── Constantes globales Wanteermako ─────────
// Brand, 27 pays, catégories + champs dynamiques, options de boost.

export const BRAND = {
  name: "Wanteermako",
  tagline: "Le marché de l'Afrique de l'Ouest dans votre poche",
  legal: "Wanteermako by YamaneTech",
} as const;

export type Country = {
  code: string;
  name: string;
  dial: string;
  capital: string;
  currency: string;
  flag: string;
};

// 27 pays (section 3 du brief). Affiché UNIQUEMENT en bas de page (footer).
export const COUNTRIES: Country[] = [
  { code: "SN", name: "Sénégal", dial: "+221", capital: "Dakar", currency: "FCFA", flag: "🇸🇳" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", capital: "Abidjan", currency: "FCFA", flag: "🇨🇮" },
  { code: "ML", name: "Mali", dial: "+223", capital: "Bamako", currency: "FCFA", flag: "🇲🇱" },
  { code: "BJ", name: "Bénin", dial: "+229", capital: "Cotonou", currency: "FCFA", flag: "🇧🇯" },
  { code: "BF", name: "Burkina Faso", dial: "+226", capital: "Ouagadougou", currency: "FCFA", flag: "🇧🇫" },
  { code: "TG", name: "Togo", dial: "+228", capital: "Lomé", currency: "FCFA", flag: "🇹🇬" },
  { code: "NE", name: "Niger", dial: "+227", capital: "Niamey", currency: "FCFA", flag: "🇳🇪" },
  { code: "GN", name: "Guinée", dial: "+224", capital: "Conakry", currency: "GNF", flag: "🇬🇳" },
  { code: "GW", name: "Guinée-Bissau", dial: "+245", capital: "Bissau", currency: "FCFA", flag: "🇬🇼" },
  { code: "GH", name: "Ghana", dial: "+233", capital: "Accra", currency: "GHS", flag: "🇬🇭" },
  { code: "NG", name: "Nigéria", dial: "+234", capital: "Abuja", currency: "NGN", flag: "🇳🇬" },
  { code: "SL", name: "Sierra Leone", dial: "+232", capital: "Freetown", currency: "SLL", flag: "🇸🇱" },
  { code: "LR", name: "Liberia", dial: "+231", capital: "Monrovia", currency: "LRD", flag: "🇱🇷" },
  { code: "GM", name: "Gambie", dial: "+220", capital: "Banjul", currency: "GMD", flag: "🇬🇲" },
  { code: "CV", name: "Cap-Vert", dial: "+238", capital: "Praia", currency: "CVE", flag: "🇨🇻" },
  { code: "MR", name: "Mauritanie", dial: "+222", capital: "Nouakchott", currency: "MRU", flag: "🇲🇷" },
  { code: "CM", name: "Cameroun", dial: "+237", capital: "Yaoundé", currency: "FCFA", flag: "🇨🇲" },
  { code: "GA", name: "Gabon", dial: "+241", capital: "Libreville", currency: "FCFA", flag: "🇬🇦" },
  { code: "CG", name: "Congo", dial: "+242", capital: "Brazzaville", currency: "FCFA", flag: "🇨🇬" },
  { code: "CD", name: "RD Congo", dial: "+243", capital: "Kinshasa", currency: "CDF", flag: "🇨🇩" },
  { code: "TD", name: "Tchad", dial: "+235", capital: "N'Djaména", currency: "FCFA", flag: "🇹🇩" },
  { code: "CF", name: "Centrafrique", dial: "+236", capital: "Bangui", currency: "FCFA", flag: "🇨🇫" },
  { code: "GQ", name: "Guinée Éq.", dial: "+240", capital: "Malabo", currency: "FCFA", flag: "🇬🇶" },
  { code: "MA", name: "Maroc", dial: "+212", capital: "Rabat", currency: "MAD", flag: "🇲🇦" },
  { code: "DZ", name: "Algérie", dial: "+213", capital: "Alger", currency: "DZD", flag: "🇩🇿" },
  { code: "TN", name: "Tunisie", dial: "+216", capital: "Tunis", currency: "TND", flag: "🇹🇳" },
  { code: "MG", name: "Madagascar", dial: "+261", capital: "Antananarivo", currency: "MGA", flag: "🇲🇬" },
];

// ───────── Catégories + champs dynamiques (section 10.3) ─────────
export type DynField = {
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
  placeholder?: string;
};

export type Category = {
  slug: string;
  subdomainSlug: string;
  name: string;
  icon: string;
  count: string;
  subs: string[];
  fields: DynField[];
  // Champs additionnels selon la sous-catégorie choisie (optionnel)
  subFields?: Record<string, DynField[]>;
};

export const CATEGORIES: Category[] = [
  {
    slug: "vehicules",
    subdomainSlug: "vehicules",
    name: "Véhicules & Transport",
    icon: "🚗",
    count: "32 100",
    subs: ["Voitures", "Motos & Scooters", "Camions", "Utilitaires", "Bus & Minibus", "Pièces & Accessoires", "Pneus & Jantes", "Bateaux", "Engins agricoles", "Engins de chantier", "Autre"],
    fields: [
      { label: "Marque", type: "text", placeholder: "Ex : Toyota" },
      { label: "Année", type: "select", options: ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "2014", "2013", "2012", "2011", "2010", "Avant 2010"] },
      { label: "État", type: "select", options: ["Neuf", "Très bon état", "Bon état", "Occasion", "Pour pièces"] },
    ],
    subFields: {
      "Voitures": [
        { label: "Modèle", type: "text", placeholder: "Ex : Corolla" },
        { label: "Version", type: "text", placeholder: "Ex : 1.6 GLi" },
        { label: "Kilométrage", type: "number", placeholder: "Ex : 45000" },
        { label: "Carburant", type: "select", options: ["Essence", "Diesel", "Hybride", "Électrique", "GPL"] },
        { label: "Boîte de vitesse", type: "select", options: ["Manuelle", "Automatique"] },
        { label: "Nombre de portes", type: "select", options: ["2", "3", "4", "5"] },
        { label: "Couleur", type: "text", placeholder: "Ex : Gris métallisé" },
        { label: "Dédouané", type: "select", options: ["Oui", "Non"] },
      ],
      "Motos & Scooters": [
        { label: "Modèle", type: "text", placeholder: "Ex : Yamaha NMAX" },
        { label: "Cylindrée", type: "select", options: ["50cc", "125cc", "150cc", "250cc", "300cc+", "Autre"] },
        { label: "Kilométrage", type: "number", placeholder: "Ex : 12000" },
      ],
      "Camions": [
        { label: "Modèle", type: "text", placeholder: "Ex : Mercedes Actros" },
        { label: "Charge utile", type: "text", placeholder: "Ex : 10 tonnes" },
        { label: "Kilométrage", type: "number", placeholder: "Ex : 120000" },
      ],
      "Utilitaires": [
        { label: "Modèle", type: "text", placeholder: "Ex : Renault Master" },
        { label: "Charge utile", type: "text", placeholder: "Ex : 1.5 tonne" },
      ],
      "Bus & Minibus": [
        { label: "Modèle", type: "text", placeholder: "Ex : Toyota Hiace" },
        { label: "Nombre de places", type: "select", options: ["7", "9", "15", "30", "50+"] },
      ],
    },
  },
  {
    slug: "immobilier",
    subdomainSlug: "immobilier",
    name: "Immobilier",
    icon: "🏠",
    count: "45 230",
    subs: ["Appartements", "Maisons", "Villas", "Terrains", "Chambres", "Bureaux", "Magasins", "Entrepôts", "Immeubles", "Autre"],
    fields: [
      { label: "Transaction", type: "select", options: ["Vente", "Location", "Colocation"] },
      { label: "Surface (m²)", type: "number", placeholder: "Ex : 120" },
    ],
    subFields: {
      "Appartements": [
        { label: "Chambres", type: "select", options: ["Studio", "1", "2", "3", "4", "5+"] },
        { label: "Salons", type: "select", options: ["1", "2", "3+"] },
        { label: "Salles de bain", type: "select", options: ["1", "2", "3", "4+"] },
        { label: "Meublé", type: "select", options: ["Non", "Oui", "Partiellement"] },
        { label: "Climatisation", type: "select", options: ["Oui", "Non"] },
        { label: "Parking", type: "select", options: ["Oui", "Non"] },
        { label: "Piscine", type: "select", options: ["Oui", "Non"] },
      ],
      "Maisons": [
        { label: "Chambres", type: "select", options: ["1", "2", "3", "4", "5+"] },
        { label: "Salons", type: "select", options: ["1", "2", "3+"] },
        { label: "Salles de bain", type: "select", options: ["1", "2", "3", "4+"] },
        { label: "Meublé", type: "select", options: ["Non", "Oui", "Partiellement"] },
        { label: "Parking", type: "select", options: ["Oui", "Non"] },
      ],
      "Villas": [
        { label: "Chambres", type: "select", options: ["2", "3", "4", "5", "6+"] },
        { label: "Salles de bain", type: "select", options: ["1", "2", "3", "4+"] },
        { label: "Piscine", type: "select", options: ["Oui", "Non"] },
        { label: "Parking", type: "select", options: ["Oui", "Non"] },
      ],
      "Terrains": [
        { label: "Titre foncier", type: "select", options: ["Titre foncier", "Bail", "Délibération", "Aucun"] },
        { label: "Zone", type: "text", placeholder: "Ex : Diamniadio" },
        { label: "Viabilisé", type: "select", options: ["Oui", "Non"] },
      ],
      "Bureaux": [
        { label: "Surface utile (m²)", type: "number", placeholder: "Ex : 60" },
        { label: "Parking", type: "select", options: ["Oui", "Non"] },
      ],
      "Magasins": [
        { label: "Surface (m²)", type: "number", placeholder: "Ex : 40" },
        { label: "Emplacement", type: "text", placeholder: "Ex : Bord de route" },
      ],
    },
  },
  {
    slug: "electronique",
    subdomainSlug: "electronique",
    name: "Téléphones & Multimédia",
    icon: "📱",
    count: "58 400",
    subs: ["Smartphones", "Tablettes", "Ordinateurs", "Téléviseurs", "Consoles de jeux", "Appareils photo", "Imprimantes", "Audio & Casques", "Accessoires", "Autre"],
    fields: [
      { label: "Marque", type: "text", placeholder: "Ex : Apple, Samsung..." },
      { label: "État", type: "select", options: ["Neuf", "Très bon état", "Bon état", "Occasion"] },
      { label: "Garantie", type: "select", options: ["Aucune", "3 mois", "6 mois", "1 an"] },
    ],
    subFields: {
      "Smartphones": [
        { label: "Modèle", type: "text", placeholder: "Ex : iPhone 15 Pro" },
        { label: "Stockage", type: "select", options: ["64 Go", "128 Go", "256 Go", "512 Go", "1 To"] },
        { label: "RAM", type: "select", options: ["3 Go", "4 Go", "6 Go", "8 Go", "12 Go+"] },
        { label: "Couleur", type: "text", placeholder: "Ex : Noir" },
        { label: "Batterie (%)", type: "text", placeholder: "Ex : 95%" },
      ],
      "Tablettes": [
        { label: "Modèle", type: "text", placeholder: "Ex : iPad Air" },
        { label: "Stockage", type: "select", options: ["32 Go", "64 Go", "128 Go", "256 Go", "512 Go+"] },
        { label: "RAM", type: "select", options: ["2 Go", "3 Go", "4 Go", "6 Go", "8 Go+"] },
      ],
      "Ordinateurs": [
        { label: "Modèle", type: "text", placeholder: "Ex : Dell XPS 15" },
        { label: "Processeur", type: "text", placeholder: "Ex : Intel i7, Ryzen 5" },
        { label: "RAM", type: "select", options: ["4 Go", "8 Go", "16 Go", "32 Go+"] },
        { label: "Stockage", type: "text", placeholder: "Ex : 512 Go SSD" },
        { label: "Carte graphique", type: "text", placeholder: "Ex : RTX 3060" },
      ],
      "Téléviseurs": [
        { label: "Taille écran", type: "select", options: ["32\"", "43\"", "50\"", "55\"", "65\"", "75\"+"] },
        { label: "Smart TV", type: "select", options: ["Oui", "Non"] },
        { label: "Résolution", type: "select", options: ["HD", "Full HD", "4K", "8K"] },
      ],
    },
  },
  {
    slug: "maison",
    subdomainSlug: "maison",
    name: "Maison & Électroménager",
    icon: "🛋️",
    count: "19 800",
    subs: ["Salons", "Canapés", "Lits", "Armoires", "Tables", "Chaises", "Réfrigérateurs", "Congélateurs", "Machines à laver", "Climatiseurs", "Fours", "Cuisinières", "Décoration", "Autre"],
    fields: [
      { label: "Marque", type: "text", placeholder: "Ex : LG, Samsung, Artisanal" },
      { label: "État", type: "select", options: ["Neuf", "Très bon état", "Bon état", "Occasion"] },
    ],
    subFields: {
      "Salons": [
        { label: "Matière", type: "text", placeholder: "Ex : Cuir, Tissu" },
        { label: "Couleur", type: "text", placeholder: "Ex : Beige" },
        { label: "Places", type: "select", options: ["3 places", "5 places", "7 places", "Angle"] },
      ],
      "Canapés": [
        { label: "Matière", type: "text", placeholder: "Ex : Cuir" },
        { label: "Places", type: "select", options: ["2", "3", "4", "5+"] },
      ],
      "Lits": [
        { label: "Dimensions", type: "text", placeholder: "Ex : 160x200" },
        { label: "Matière", type: "text", placeholder: "Ex : Bois" },
      ],
      "Réfrigérateurs": [
        { label: "Capacité", type: "text", placeholder: "Ex : 300 L" },
        { label: "Classe énergie", type: "select", options: ["A+++", "A++", "A+", "A", "B"] },
      ],
      "Machines à laver": [
        { label: "Capacité", type: "text", placeholder: "Ex : 8 kg" },
        { label: "Type", type: "select", options: ["Frontale", "Top", "Lavante-séchante"] },
      ],
      "Climatiseurs": [
        { label: "Puissance", type: "select", options: ["1 CV", "1.5 CV", "2 CV", "2.5 CV", "3 CV+"] },
        { label: "Type", type: "select", options: ["Split", "Fenêtre", "Mobile"] },
      ],
    },
  },
  {
    slug: "mode",
    subdomainSlug: "mode",
    name: "Mode, Beauté & Accessoires",
    icon: "👗",
    count: "28 900",
    subs: ["Homme", "Femme", "Enfant", "Chaussures", "Sacs", "Montres", "Bijoux", "Parfums", "Cosmétiques", "Coiffure", "Autre"],
    fields: [
      { label: "Genre", type: "select", options: ["Femme", "Homme", "Unisexe", "Enfant"] },
      { label: "État", type: "select", options: ["Neuf avec étiquette", "Neuf", "Très bon état", "Occasion"] },
      { label: "Couleur", type: "text", placeholder: "Ex : Bleu" },
    ],
    subFields: {
      "Homme": [{ label: "Taille", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] }],
      "Femme": [{ label: "Taille", type: "select", options: ["XS", "S", "M", "L", "XL", "Sur mesure"] }],
      "Chaussures": [{ label: "Pointure", type: "select", options: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45+"] }],
      "Montres": [
        { label: "Marque", type: "text", placeholder: "Ex : Rolex, Casio" },
        { label: "Matière", type: "select", options: ["Or", "Argent", "Plaqué or", "Acier", "Cuir", "Autre"] },
      ],
      "Bijoux": [
        { label: "Matière", type: "select", options: ["Or", "Argent", "Plaqué or", "Fantaisie", "Autre"] },
      ],
      "Parfums": [
        { label: "Marque", type: "text", placeholder: "Ex : Dior" },
        { label: "Contenance", type: "text", placeholder: "Ex : 100 ml" },
      ],
      "Cosmétiques": [
        { label: "Marque", type: "text", placeholder: "Ex : Nivea" },
        { label: "Type", type: "text", placeholder: "Ex : Crème visage" },
      ],
    },
  },
  {
    slug: "emploi",
    subdomainSlug: "emploi",
    name: "Emploi & Recrutement",
    icon: "💼",
    count: "12 050",
    subs: ["Informatique", "Commercial", "Comptabilité", "Marketing", "BTP", "Santé", "Éducation", "Logistique", "Hôtellerie", "Restauration", "Administration", "RH", "Autre"],
    fields: [
      { label: "Type d'annonce", type: "select", options: ["Offre d'emploi", "Demande d'emploi", "Stage", "Freelance"] },
      { label: "Intitulé du poste", type: "text", placeholder: "Ex : Développeur Web" },
      { label: "Entreprise", type: "text", placeholder: "Ex : Konnecta (ou Confidentiel)" },
      { label: "Contrat", type: "select", options: ["CDI", "CDD", "Stage", "Freelance", "Intérim", "Journalier"] },
      { label: "Salaire", type: "text", placeholder: "Ex : 250 000 ou À négocier" },
      { label: "Niveau d'étude", type: "select", options: ["Aucun", "BFEM", "Bac", "Bac+2", "Bac+3", "Bac+5", "Doctorat"] },
      { label: "Expérience", type: "select", options: ["Débutant", "1-2 ans", "3-5 ans", "5+ ans"] },
    ],
  },
  {
    slug: "services",
    subdomainSlug: "services",
    name: "Services Professionnels",
    icon: "🔧",
    count: "15 600",
    subs: ["Informatique & Web", "Développement Web", "Design Graphique", "Marketing Digital", "Livraison", "Déménagement", "Réparation Téléphone", "Réparation Électroménager", "Plomberie", "Électricité", "Menuiserie", "Climatisation", "Photographie", "Vidéographie", "Cuisine & Traiteur", "Couture", "Sécurité", "Autre"],
    fields: [
      { label: "Type de service", type: "text", placeholder: "Ex : Création de site web" },
      { label: "Prestataire", type: "select", options: ["Particulier", "Professionnel", "Entreprise"] },
      { label: "Zone d'intervention", type: "text", placeholder: "Ex : Dakar et banlieue" },
      { label: "Mode de tarification", type: "select", options: ["À l'heure", "Au forfait", "Sur devis", "À la journée"] },
      { label: "Tarif", type: "text", placeholder: "Ex : 5 000/h ou Devis gratuit" },
      { label: "Disponibilité", type: "select", options: ["Temps plein", "Sur RDV", "Week-end", "Soirs", "24h/24"] },
    ],
  },
  {
    slug: "sport",
    subdomainSlug: "sports",
    name: "Sports, Loisirs & Culture",
    icon: "⚽",
    count: "9 500",
    subs: ["Fitness", "Football", "Vélos", "Jeux vidéo", "Livres", "Instruments de musique", "Art & Artisanat", "Tourisme", "Autre"],
    fields: [
      { label: "Type", type: "text", placeholder: "Ex : Vélo VTT, Guitare..." },
      { label: "Marque / Éditeur", type: "text", placeholder: "Ex : Decathlon, Yamaha" },
      { label: "État", type: "select", options: ["Neuf", "Très bon état", "Bon état", "Occasion"] },
    ],
  },
  {
    slug: "equipements-pro",
    subdomainSlug: "equipements",
    name: "Équipements Professionnels",
    icon: "🏭",
    count: "8 900",
    subs: ["Matériel de construction", "Groupes électrogènes", "Panneaux solaires", "Matériel médical", "Équipement restaurant", "Caméras de surveillance", "Machines industrielles", "Autre"],
    fields: [
      { label: "État", type: "select", options: ["Neuf", "Occasion", "Reconditionné", "Pour pièces"] },
      { label: "Marque / Fabricant", type: "text", placeholder: "Ex : Bosch, Caterpillar" },
      { label: "Puissance / Capacité", type: "text", placeholder: "Ex : 5 kVA, 500 W" },
      { label: "Quantité", type: "number", placeholder: "Ex : 5" },
    ],
  },
  {
    slug: "agriculture",
    subdomainSlug: "agriculture",
    name: "Agriculture & Élevage",
    icon: "🌿",
    count: "7 300",
    subs: ["Produits agricoles", "Matériel agricole", "Semences", "Engrais", "Bétail", "Volaille", "Alimentation animale", "Autre"],
    fields: [
      { label: "Type", type: "text", placeholder: "Ex : Tracteur, Mil, Engrais NPK" },
      { label: "Quantité", type: "text", placeholder: "Ex : 50 kg, 5 ha, 10 têtes" },
      { label: "Région", type: "text", placeholder: "Ex : Vallée du fleuve" },
      { label: "Bio", type: "select", options: ["Oui", "Non", "En cours"] },
    ],
  },
  {
    slug: "animaux",
    subdomainSlug: "animaux",
    name: "Animaux & Accessoires",
    icon: "🐐",
    count: "6 400",
    subs: ["Chiens", "Chats", "Oiseaux", "Moutons", "Chèvres", "Poissons", "Nourriture animale", "Accessoires", "Autre"],
    fields: [
      { label: "Race / Type", type: "text", placeholder: "Ex : Mouton Ladoum, Berger allemand" },
      { label: "Âge", type: "text", placeholder: "Ex : 2 ans" },
      { label: "Sexe", type: "select", options: ["Mâle", "Femelle"] },
      { label: "Vacciné", type: "select", options: ["Oui", "Non"] },
    ],
  },
  {
    slug: "entreprises",
    subdomainSlug: "entreprises",
    name: "Entreprises & Opportunités",
    icon: "🤝",
    count: "3 500",
    subs: ["Fonds de commerce", "Partenariats", "Franchise", "Investissement", "Import & Export", "Grossistes", "Fournisseurs", "Autre"],
    fields: [
      { label: "Type d'opportunité", type: "text", placeholder: "Ex : Cession de fonds, Recherche associé" },
      { label: "Secteur", type: "text", placeholder: "Ex : Restauration, Import" },
      { label: "Apport / Montant", type: "text", placeholder: "Ex : 5 000 000 ou À discuter" },
      { label: "Localisation", type: "text", placeholder: "Ex : Dakar" },
    ],
  },
];

export const categoryBySlug = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug);
export const categoryByName = (name: string) =>
  CATEGORIES.find((c) => c.name === name);

// Couleur spécifique par catégorie (badges À la Une, puces, etc.)
export const CATEGORY_COLORS: Record<string, string> = {
  vehicules: "#2563EB",        // bleu
  immobilier: "#16A34A",       // vert
  electronique: "#7C3AED",     // violet
  maison: "#EA580C",           // orange
  mode: "#DB2777",             // rose
  emploi: "#0891B2",           // cyan
  services: "#CA8A04",         // doré
  sport: "#DC2626",            // rouge
  "equipements-pro": "#475569",// ardoise
  agriculture: "#15803D",      // vert foncé
  animaux: "#B45309",          // ambre
  entreprises: "#9333EA",      // magenta
};

/** Couleur d'une catégorie à partir d'un slug, d'un nom de catégorie OU d'une sous-catégorie. */
export function colorForCategory(slugOrName?: string): string {
  if (!slugOrName) return "#16A34A";
  const k = slugOrName.toLowerCase().trim();
  if (CATEGORY_COLORS[k]) return CATEGORY_COLORS[k];
  const c = CATEGORIES.find(
    (cat) => cat.slug === k || cat.name.toLowerCase() === k || cat.subs.some((s) => s.toLowerCase() === k),
  );
  return (c && CATEGORY_COLORS[c.slug]) || "#16A34A";
}

// ───────── Villes et Régions (Sénégal) ─────────
export const SENEGAL_REGIONS = [
  {
    name: "Dakar",
    communes: ["Plateau", "Médina", "Almadies", "Parcelles Assainies", "Grand Dakar", "Pikine", "Thiaroye", "Yeumbeul", "Guédiawaye", "Rufisque", "Sangalkam", "Diamniadio", "Keur Massar", "Jaxaay", "Autre"]
  },
  {
    name: "Thiès",
    communes: ["Thiès Ville", "Mbour", "Tivaouane", "Saly", "Joal-Fadiouth", "Autre"]
  },
  {
    name: "Diourbel",
    communes: ["Diourbel Ville", "Touba", "Mbacké", "Bambey", "Autre"]
  },
  {
    name: "Saint-Louis",
    communes: ["Saint-Louis Ville", "Richard-Toll", "Dagana", "Podor", "Autre"]
  },
  {
    name: "Ziguinchor",
    communes: ["Ziguinchor Ville", "Bignona", "Oussouye", "Cap Skirring", "Autre"]
  },
  {
    name: "Kaolack",
    communes: ["Kaolack Ville", "Nioro", "Guinguinéo", "Autre"]
  },
  {
    name: "Tambacounda",
    communes: ["Tambacounda Ville", "Bakel", "Goudiry", "Koumpentoum", "Autre"]
  },
  {
    name: "Fatick",
    communes: ["Fatick Ville", "Foundiougne", "Gossas", "Autre"]
  },
  {
    name: "Kolda",
    communes: ["Kolda Ville", "Vélingara", "Médina Yoro Foulah", "Autre"]
  },
  {
    name: "Louga",
    communes: ["Louga Ville", "Kébémer", "Linguère", "Autre"]
  },
  {
    name: "Matam",
    communes: ["Matam Ville", "Kanel", "Ranérou", "Autre"]
  },
  {
    name: "Kaffrine",
    communes: ["Kaffrine Ville", "Birkelane", "Koungheul", "Malem Hodar", "Autre"]
  },
  {
    name: "Kédougou",
    communes: ["Kédougou Ville", "Salemata", "Saraya", "Autre"]
  },
  {
    name: "Sédhiou",
    communes: ["Sédhiou Ville", "Bounkiling", "Goudomp", "Autre"]
  }
];

// ───────── Boosts (section 10.6) ─────────
export type Boost = {
  key: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
};

export const BOOSTS: Boost[] = [
  { key: "gratuit", name: "🆓 Gratuit", price: 0, duration: "2 annonces", features: ["2 annonces gratuites par compte", "Publication immédiate", "Position standard"] },
  { key: "premium", name: "⭐ Premium", price: 3500, duration: "7 jours", features: ["Mise en avant prioritaire", "Jusqu'à 5 photos", "Badge Premium exclusif"], popular: true },
  { key: "alaune", name: "🔥 À la Une", price: 7500, duration: "30 jours", features: ["Affichage Accueil (À la Une)", "Jusqu'à 8 photos", "Badge À la Une", "Forte visibilité"] },
  { key: "vip", name: "👑 VIP", price: 15000, duration: "60 jours", features: ["Affichage Accueil & Recherche", "Photos illimitées", "Badge VIP", "Visibilité maximale"] },
];

// ───────── Méthodes de paiement (section 13) ─────────
export type PaymentMethod = {
  key: string;
  name: string;
  scope: string;
  color: string;
  icon: string;
};

export const PAYMENT_METHODS: PaymentMethod[] = [
  { key: "orange", name: "Orange Money", scope: "SN, CI, ML, BF, GN · Sans frais", color: "#FF6600", icon: "🟠" },
  { key: "wave", name: "Wave", scope: "SN, CI · Sans frais", color: "#1DC8FF", icon: "🌊" },
  { key: "mtn", name: "MTN Mobile Money", scope: "CI, BJ, GH · Sans frais", color: "#FFCC00", icon: "🟡" },
  { key: "moov", name: "Moov Money", scope: "BJ, BF, TG · Sans frais", color: "#0066CC", icon: "🔵" },
  { key: "carte", name: "Carte bancaire", scope: "Visa, Mastercard · Frais 1,5%", color: "#243044", icon: "💳" },
];

// Zones publicitaires (section 15)
export const AD_SLOTS = [
  { slot: "A1", label: "Hero Banner", format: "1200×200" },
  { slot: "A2", label: "In-feed Home", format: "Native card" },
  { slot: "A3", label: "Sidebar Listing", format: "300×250" },
  { slot: "A4", label: "In-grid Listing", format: "Carte sponsorisée" },
  { slot: "A5", label: "Page Annonce", format: "300×250" },
  { slot: "A6", label: "Bas page annonce", format: "728×90" },
  { slot: "A7", label: "Footer Banner", format: "Bannière large" },
  { slot: "A8", label: "Interstitiel", format: "Plein écran skippable" },
  { slot: "A9", label: "Catégorie sponsor", format: "Bannière" },
  { slot: "A10", label: "Notification push", format: "—" },
] as const;

export type SubPlan = {
  key: string;
  name: string;
  price: number;
  duration: string;
  limits: {
    activeAds: number;
    photos: number;
  };
  features: string[];
};

export const SUBSCRIPTION_PLANS: Record<string, SubPlan[]> = {
  vehicules: [
    { key: "starter", name: "Gratuit", price: 0, duration: "2 annonces", limits: { activeAds: 2, photos: 3 }, features: ["2 annonces gratuites", "Positionnement standard"] },
    { key: "standard", name: "Standard Auto", price: 10000, duration: "1 mois", limits: { activeAds: 5, photos: 3 }, features: ["Positionnement standard"] },
    { key: "premium", name: "Premium Auto", price: 25000, duration: "1 mois", limits: { activeAds: 15, photos: 5 }, features: ["1 boost Standard / mois", "Vitrine personnalisée", "Bouton WhatsApp direct"] },
    { key: "vip", name: "VIP Auto", price: 50000, duration: "1 mois", limits: { activeAds: 50, photos: 8 }, features: ["1 boost Premium / mois", "Badge Vérifié", "Statistiques basiques"] }
  ],
  immobilier: [
    { key: "starter", name: "Gratuit", price: 0, duration: "2 annonces", limits: { activeAds: 2, photos: 3 }, features: ["2 annonces gratuites", "Positionnement standard"] },
    { key: "standard", name: "Standard Immo", price: 15000, duration: "1 mois", limits: { activeAds: 5, photos: 3 }, features: ["Positionnement standard"] },
    { key: "premium", name: "Premium Immo", price: 35000, duration: "1 mois", limits: { activeAds: 15, photos: 5 }, features: ["1 boost Standard / mois", "Vitrine personnalisée", "Bouton WhatsApp direct", "Géolocalisation"] },
    { key: "vip", name: "VIP Immo", price: 75000, duration: "1 mois", limits: { activeAds: 40, photos: 8 }, features: ["1 boost Premium / mois", "Badge Vérifié", "Statistiques basiques"] }
  ],
  electronique: [
    { key: "starter", name: "Gratuit", price: 0, duration: "2 annonces", limits: { activeAds: 2, photos: 3 }, features: ["2 annonces gratuites", "Positionnement standard"] },
    { key: "standard", name: "Standard Tech", price: 7500, duration: "1 mois", limits: { activeAds: 10, photos: 3 }, features: ["Positionnement standard"] },
    { key: "premium", name: "Premium Tech", price: 15000, duration: "1 mois", limits: { activeAds: 30, photos: 5 }, features: ["1 boost Standard / mois", "Vitrine personnalisée", "Bouton WhatsApp direct"] },
    { key: "vip", name: "VIP Tech", price: 30000, duration: "1 mois", limits: { activeAds: 80, photos: 8 }, features: ["1 boost Premium / mois", "Badge Vérifié", "Statistiques basiques"] }
  ],
  general: [
    { key: "starter", name: "Gratuit", price: 0, duration: "2 annonces", limits: { activeAds: 2, photos: 3 }, features: ["2 annonces gratuites", "Positionnement standard"] },
    { key: "standard", name: "Standard Boutique", price: 5000, duration: "1 mois", limits: { activeAds: 15, photos: 3 }, features: ["Positionnement standard"] },
    { key: "premium", name: "Premium Boutique", price: 10000, duration: "1 mois", limits: { activeAds: 50, photos: 5 }, features: ["1 boost Standard / mois", "Vitrine personnalisée"] },
    { key: "vip", name: "VIP Boutique", price: 20000, duration: "1 mois", limits: { activeAds: 120, photos: 8 }, features: ["1 boost Premium / mois", "Badge Vérifié"] }
  ]
};
