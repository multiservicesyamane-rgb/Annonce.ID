// ───────── Constantes globales Annonce.ID ─────────
// Brand, 27 pays, catégories + champs dynamiques, options de boost.

export const BRAND = {
  name: "Annonce.ID",
  tagline: "Le marché de l'Afrique de l'Ouest dans votre poche",
  legal: "Annonce.ID by YamaneTech",
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
  name: string;
  icon: string;
  count: string;
  subs: string[];
  fields: DynField[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "immobilier",
    name: "Immobilier",
    icon: "🏠",
    count: "45 230",
    subs: ["Appartement", "Villa", "Studio", "Terrain", "Commerce", "Bureau"],
    fields: [
      { label: "Transaction", type: "select", options: ["Vente", "Location", "Colocation"] },
      { label: "Surface (m²)", type: "number", placeholder: "Ex : 120" },
      { label: "Chambres", type: "select", options: ["Studio", "1", "2", "3", "4", "5+"] },
      { label: "Salles de bain", type: "select", options: ["1", "2", "3", "4+"] },
      { label: "Meublé", type: "select", options: ["Non", "Oui", "Partiellement"] },
      { label: "Titre foncier", type: "select", options: ["Oui", "Non", "Bail"] },
    ],
  },
  {
    slug: "vehicules",
    name: "Véhicules",
    icon: "🚗",
    count: "32 100",
    subs: ["Voiture", "Moto", "Camion", "Bus", "Pièces"],
    fields: [
      { label: "Marque", type: "select", options: ["Toyota", "Mercedes", "BMW", "Honda", "Renault", "Peugeot", "Hyundai", "Autre"] },
      { label: "Modèle", type: "text", placeholder: "Ex : Corolla" },
      { label: "Année", type: "select", options: ["2025", "2024", "2023", "2022", "2021", "2020", "Avant 2020"] },
      { label: "Kilométrage", type: "number", placeholder: "Ex : 45000" },
      { label: "Carburant", type: "select", options: ["Essence", "Diesel", "Hybride", "Électrique"] },
      { label: "Boîte", type: "select", options: ["Manuelle", "Automatique"] },
      { label: "Dédouané", type: "select", options: ["Oui", "Non"] },
    ],
  },
  {
    slug: "electronique",
    name: "Électronique",
    icon: "📱",
    count: "58 400",
    subs: ["Téléphone", "Ordinateur", "TV", "Console", "Tablette"],
    fields: [
      { label: "Marque", type: "select", options: ["Apple", "Samsung", "Huawei", "Xiaomi", "Dell", "HP", "Autre"] },
      { label: "Modèle", type: "text", placeholder: "Ex : iPhone 15" },
      { label: "Stockage", type: "select", options: ["64 Go", "128 Go", "256 Go", "512 Go", "1 To"] },
      { label: "Garantie", type: "select", options: ["Aucune", "3 mois", "6 mois", "1 an"] },
      { label: "Facture", type: "select", options: ["Oui", "Non"] },
    ],
  },
  {
    slug: "mode",
    name: "Mode",
    icon: "👗",
    count: "28 900",
    subs: ["Femme", "Homme", "Chaussures", "Sacs", "Accessoires"],
    fields: [
      { label: "Genre", type: "select", options: ["Femme", "Homme", "Unisexe", "Enfant"] },
      { label: "Taille", type: "select", options: ["XS", "S", "M", "L", "XL", "Sur mesure"] },
      { label: "Couleur", type: "text", placeholder: "Ex : Bleu" },
      { label: "Matière", type: "text", placeholder: "Ex : Coton wax" },
    ],
  },
  {
    slug: "montres-bijoux",
    name: "Montres & Bijoux",
    icon: "⌚",
    count: "9 800",
    subs: ["Montres", "Colliers & Pendentifs", "Bagues", "Boucles d'oreilles", "Bracelets", "Parures"],
    fields: [
      { label: "Type", type: "text", placeholder: "Ex : Montre automatique" },
      { label: "Matière principale", type: "select", options: ["Or", "Argent", "Plaqué or", "Acier", "Cuir", "Autre"] },
      { label: "Marque", type: "text", placeholder: "Ex : Rolex, Seiko..." },
      { label: "État", type: "select", options: ["Neuf", "Très bon état", "Occasion"] },
    ],
  },
  {
    slug: "beaute-sante",
    name: "Beauté & Santé",
    icon: "💄",
    count: "14 200",
    subs: ["Parfums", "Cosmétiques", "Soins cheveux", "Soins peau", "Matériel beauté"],
    fields: [
      { label: "Type de produit", type: "text", placeholder: "Ex : Parfum" },
      { label: "Marque", type: "text", placeholder: "Ex : Dior, Local..." },
      { label: "État", type: "select", options: ["Neuf sous blister", "Neuf sans boîte", "Très bon état", "Occasion"] },
      { label: "Contenance / Volume", type: "text", placeholder: "Ex : 100ml" },
    ],
  },
  {
    slug: "emploi",
    name: "Emploi",
    icon: "💼",
    count: "12 050",
    subs: ["Offre", "Demande", "Stage", "Freelance"],
    fields: [
      { label: "Contrat", type: "select", options: ["CDI", "CDD", "Stage", "Freelance", "Journalier"] },
      { label: "Secteur", type: "select", options: ["IT", "Commerce", "BTP", "Santé", "Éducation", "Autre"] },
      { label: "Expérience", type: "select", options: ["Débutant", "1-2 ans", "3-5 ans", "5+ ans"] },
      { label: "Salaire", type: "text", placeholder: "Ex : 250 000 ou À négocier" },
    ],
  },
  {
    slug: "maison",
    name: "Maison",
    icon: "🛋",
    count: "19 800",
    subs: ["Meubles", "Électroménager", "Décoration", "Jardin"],
    fields: [
      { label: "Type", type: "text", placeholder: "Ex : Canapé" },
      { label: "Matière", type: "text", placeholder: "Ex : Bois" },
      { label: "Dimensions", type: "text", placeholder: "Ex : 200x90 cm" },
      { label: "Livraison", type: "select", options: ["Oui", "Non", "Sur demande"] },
    ],
  },
  {
    slug: "alimentation",
    name: "Alimentation",
    icon: "🍲",
    count: "8 200",
    subs: ["Produits frais", "Épicerie", "Boissons", "Bio"],
    fields: [
      { label: "Produit", type: "text", placeholder: "Ex : Mangues" },
      { label: "Quantité", type: "text", placeholder: "Ex : 50 kg" },
      { label: "Unité", type: "select", options: ["Au kilo", "À l'unité", "Par lot"] },
      { label: "Origine", type: "text", placeholder: "Ex : Casamance" },
    ],
  },
  {
    slug: "services",
    name: "Services",
    icon: "🔧",
    count: "15 600",
    subs: ["Plomberie", "Électricité", "Ménage", "Coiffure", "Transport"],
    fields: [
      { label: "Type", type: "text", placeholder: "Ex : Plomberie" },
      { label: "Disponibilité", type: "select", options: ["Temps plein", "Sur RDV", "Week-end", "24h/24"] },
      { label: "Zone", type: "text", placeholder: "Ex : Dakar" },
      { label: "Tarif", type: "text", placeholder: "Ex : 5000/h ou Devis" },
    ],
  },
  {
    slug: "animaux",
    name: "Animaux",
    icon: "🐐",
    count: "6 400",
    subs: ["Bétail", "Volaille", "Compagnie", "Accessoires"],
    fields: [
      { label: "Animal", type: "text", placeholder: "Ex : Mouton Ladoum" },
      { label: "Âge", type: "text", placeholder: "Ex : 2 ans" },
      { label: "Sexe", type: "select", options: ["Mâle", "Femelle"] },
      { label: "Vacciné", type: "select", options: ["Oui", "Non"] },
    ],
  },
  {
    slug: "formation",
    name: "Formation",
    icon: "📚",
    count: "4 100",
    subs: ["Cours particuliers", "Formation pro", "Langues"],
    fields: [
      { label: "Domaine", type: "text", placeholder: "Ex : Maths" },
      { label: "Niveau", type: "select", options: ["Primaire", "Collège", "Lycée", "Université", "Tous"] },
      { label: "Format", type: "select", options: ["Présentiel", "En ligne", "À domicile"] },
      { label: "Certifiant", type: "select", options: ["Oui", "Non"] },
    ],
  },
  {
    slug: "agriculture",
    name: "Agriculture",
    icon: "🌿",
    count: "7 300",
    subs: ["Terrains", "Matériel", "Semences", "Récoltes"],
    fields: [
      { label: "Type", type: "text", placeholder: "Ex : Tracteur" },
      { label: "Superficie", type: "text", placeholder: "Ex : 5 ha" },
      { label: "Région", type: "text", placeholder: "Ex : Vallée" },
      { label: "Bio", type: "select", options: ["Oui", "Non", "En cours"] },
    ],
  },
  {
    slug: "sport",
    name: "Sport",
    icon: "⚽",
    count: "9 500",
    subs: ["Équipement", "Vélos", "Musique", "Jeux"],
    fields: [
      { label: "Type", type: "text", placeholder: "Ex : Vélo VTT" },
      { label: "Marque", type: "text", placeholder: "Ex : Decathlon" },
      { label: "Taille", type: "text", placeholder: "Ex : M" },
    ],
  },
  {
    slug: "art-artisanat",
    name: "Art & Artisanat",
    icon: "🎨",
    count: "3 200",
    subs: ["Tableaux & Peintures", "Sculptures", "Poterie", "Tissus & Wax", "Décoration locale"],
    fields: [
      { label: "Origine", type: "select", options: ["Fabrication locale", "Importé", "Fait main", "Industriel"] },
      { label: "Matière", type: "text", placeholder: "Ex : Bois d'ébène, Cuir..." },
      { label: "Style", type: "text", placeholder: "Ex : Abstrait, Traditionnel..." },
    ],
  },
  {
    slug: "loisirs",
    name: "Loisirs & Divertissement",
    icon: "🎸",
    count: "5 400",
    subs: ["Instruments de musique", "Livres & Romans", "Jeux de société", "Films & Vinyles", "Collection"],
    fields: [
      { label: "Type", type: "text", placeholder: "Ex : Guitare acoustique" },
      { label: "État", type: "select", options: ["Neuf", "Très bon état", "Bon état", "Usagé"] },
      { label: "Marque / Éditeur", type: "text", placeholder: "Ex : Yamaha, Hachette..." },
    ],
  },
  {
    slug: "bebe-enfant",
    name: "Bébé & Enfant",
    icon: "🧸",
    count: "11 500",
    subs: ["Vêtements enfant", "Jouets", "Poussettes & Sièges", "Mobilier bébé", "Puériculture"],
    fields: [
      { label: "Âge", type: "select", options: ["0-12 mois", "1-3 ans", "4-7 ans", "8-12 ans", "Toutes tailles"] },
      { label: "Genre", type: "select", options: ["Fille", "Garçon", "Mixte"] },
      { label: "État", type: "select", options: ["Neuf", "Très bon état", "Bon état", "Occasion"] },
    ],
  },
  {
    slug: "materiaux-pro",
    name: "Matériaux & Pro",
    icon: "🧱",
    count: "8 900",
    subs: ["Matériaux de construction", "Outillage manuel", "Machines industrielles", "Mobilier bureau", "Équipement médical"],
    fields: [
      { label: "État", type: "select", options: ["Neuf", "Occasion", "Pour pièces"] },
      { label: "Quantité", type: "number", placeholder: "Ex : 50" },
      { label: "Marque / Fabricant", type: "text", placeholder: "Ex : Sococim, Bosch..." },
      { label: "Livraison", type: "select", options: ["Possible", "À récupérer sur place"] },
    ],
  },
  {
    slug: "produits-digitaux",
    name: "Produits Digitaux",
    icon: "💻",
    count: "4 200",
    subs: ["Logiciels", "E-books & Formations", "Abonnements", "Templates & Scripts", "Cartes cadeaux", "Création Web"],
    fields: [
      { label: "Type de produit", type: "text", placeholder: "Ex : Clé Windows, E-book PDF, Compte Netflix..." },
      { label: "Livraison", type: "select", options: ["Immédiate (Auto)", "Lien par Email", "Clé d'activation par message", "Transfert de compte"] },
      { label: "Licence / Durée", type: "select", options: ["À vie", "1 an", "1 mois", "Autre"] },
      { label: "Garantie / Support", type: "select", options: ["Oui (inclus)", "Non"] },
    ],
  },
];

export const categoryBySlug = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug);
export const categoryByName = (name: string) =>
  CATEGORIES.find((c) => c.name === name);

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
  { key: "gratuit", name: "🆓 Gratuit (Basique)", price: 0, duration: "Illimité", features: ["Publication immédiate", "1 photo maximum", "Position standard"] },
  { key: "basic", name: "🚀 Standard", price: 1500, duration: "7 jours", features: ["Mise en avant", "Jusqu'à 3 photos", "Badge Standard"] },
  { key: "premium", name: "⭐ Premium", price: 3500, duration: "14 jours", features: ["Mise en avant prioritaire", "Jusqu'à 5 photos", "Badge Premium exclusif"], popular: true },
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
    { key: "starter", name: "Starter (Gratuit)", price: 0, duration: "1 mois", limits: { activeAds: 1, photos: 1 }, features: ["Positionnement standard"] },
    { key: "standard", name: "Standard Auto", price: 10000, duration: "1 mois", limits: { activeAds: 5, photos: 3 }, features: ["Positionnement standard"] },
    { key: "premium", name: "Premium Auto", price: 25000, duration: "1 mois", limits: { activeAds: 15, photos: 5 }, features: ["1 boost Standard / mois", "Vitrine personnalisée", "Bouton WhatsApp direct"] },
    { key: "vip", name: "VIP Auto", price: 50000, duration: "1 mois", limits: { activeAds: 50, photos: 8 }, features: ["1 boost Premium / mois", "Badge Vérifié", "Statistiques basiques"] }
  ],
  immobilier: [
    { key: "starter", name: "Starter (Gratuit)", price: 0, duration: "1 mois", limits: { activeAds: 1, photos: 1 }, features: ["Positionnement standard"] },
    { key: "standard", name: "Standard Immo", price: 15000, duration: "1 mois", limits: { activeAds: 5, photos: 3 }, features: ["Positionnement standard"] },
    { key: "premium", name: "Premium Immo", price: 35000, duration: "1 mois", limits: { activeAds: 15, photos: 5 }, features: ["1 boost Standard / mois", "Vitrine personnalisée", "Bouton WhatsApp direct", "Géolocalisation"] },
    { key: "vip", name: "VIP Immo", price: 75000, duration: "1 mois", limits: { activeAds: 40, photos: 8 }, features: ["1 boost Premium / mois", "Badge Vérifié", "Statistiques basiques"] }
  ],
  electronique: [
    { key: "starter", name: "Starter (Gratuit)", price: 0, duration: "1 mois", limits: { activeAds: 1, photos: 1 }, features: ["Positionnement standard"] },
    { key: "standard", name: "Standard Tech", price: 7500, duration: "1 mois", limits: { activeAds: 10, photos: 3 }, features: ["Positionnement standard"] },
    { key: "premium", name: "Premium Tech", price: 15000, duration: "1 mois", limits: { activeAds: 30, photos: 5 }, features: ["1 boost Standard / mois", "Vitrine personnalisée", "Bouton WhatsApp direct"] },
    { key: "vip", name: "VIP Tech", price: 30000, duration: "1 mois", limits: { activeAds: 80, photos: 8 }, features: ["1 boost Premium / mois", "Badge Vérifié", "Statistiques basiques"] }
  ],
  general: [
    { key: "starter", name: "Starter (Gratuit)", price: 0, duration: "1 mois", limits: { activeAds: 1, photos: 1 }, features: ["Positionnement standard"] },
    { key: "standard", name: "Standard Boutique", price: 5000, duration: "1 mois", limits: { activeAds: 15, photos: 3 }, features: ["Positionnement standard"] },
    { key: "premium", name: "Premium Boutique", price: 10000, duration: "1 mois", limits: { activeAds: 50, photos: 5 }, features: ["1 boost Standard / mois", "Vitrine personnalisée"] },
    { key: "vip", name: "VIP Boutique", price: 20000, duration: "1 mois", limits: { activeAds: 120, photos: 8 }, features: ["1 boost Premium / mois", "Badge Vérifié"] }
  ]
};
