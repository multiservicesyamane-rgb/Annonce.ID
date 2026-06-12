// Données de démonstration réalistes (Afrique de l'Ouest).
// En production, ces données viennent de Supabase (voir lib/supabase + migrations).
import type { Listing, Message, Seller } from "./types";
import { slugify, categorySlugFromName } from "./utils";

const IMG = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=800&fit=crop",
];

export const GALLERY = IMG;

const moussa: Seller = { name: "Moussa Diallo", avatar: "https://i.pravatar.cc/96?img=12", rating: 4.8, sales: 127, isPro: true, isVerified: true };
const aminata: Seller = { name: "Aminata Koné", avatar: "https://i.pravatar.cc/96?img=5", rating: 4.6, sales: 43, isPro: false, isVerified: true };
const ibrahim: Seller = { name: "Ibrahim Traoré", avatar: "https://i.pravatar.cc/96?img=8", rating: 4.9, sales: 88, isPro: true, isVerified: true };

type Raw = Omit<Listing, "slug" | "categorySlug"> & { category: string };

const RAW: Raw[] = [
  { id: 1, title: "Villa F5 piscine Almadies", price: "280 000 000 FCFA", priceType: "negociable", category: "Immobilier", location: "Dakar, Almadies", countryCode: "SN", date: "Auj.", premium: true, featured: true, bigFeature: true, image: IMG[0], views: 1247, favorites: 23, seller: moussa, description: "Splendide villa de 350m² avec piscine, jardin paysager, 5 chambres avec salle de bain.\nGardien 24h/24. Titre foncier disponible. Idéale pour famille ou résidence de standing.", specs: { Surface: "350 m²", Chambres: "5", SDB: "4", Parking: "3 voitures", Piscine: "Oui", "Titre foncier": "Oui" } },
  { id: 2, title: "BMW X5 2022 Full options 18 000km", price: "45 000 000 FCFA", priceType: "negociable", category: "Véhicules", location: "Dakar, Plateau", countryCode: "SN", date: "Auj.", premium: true, featured: true, image: IMG[7], views: 843, favorites: 19, seller: ibrahim, description: "BMW X5 xDrive40i, toit panoramique, cuir beige, caméra 360°. Carnet d'entretien à jour. Dédouané.", specs: { Année: "2022", Kilométrage: "18 000 km", Carburant: "Essence", Boîte: "Automatique", Couleur: "Noir", Dédouané: "Oui" } },
  { id: 3, title: "iPhone 15 Pro Max 256Go Neuf", price: "750 000 FCFA", priceType: "fixe", category: "Électronique", location: "Abidjan, Cocody", countryCode: "CI", date: "Hier", premium: true, featured: true, image: IMG[2], views: 2134, favorites: 56, seller: aminata, description: "iPhone 15 Pro Max titane noir 256Go. Jamais ouvert, boîte scellée. Facture Apple Store fournie.", specs: { Marque: "Apple", Stockage: "256 Go", Couleur: "Titane noir", État: "Neuf scellé", Garantie: "1 an", Facture: "Oui" } },
  { id: 4, title: "Appt meublé F3 Cocody Riviera", price: "350 000 FCFA/mois", priceType: "fixe", category: "Immobilier", location: "Abidjan, Cocody", countryCode: "CI", date: "2h", premium: true, featured: false, image: IMG[6], views: 612, favorites: 14, seller: aminata, description: "Appartement F3 entièrement meublé, climatisé, sécurité 24h, parking privé.", specs: { Type: "F3", Meublé: "Oui", Climatisé: "Oui", Parking: "Oui", Transaction: "Location" } },
  { id: 5, title: 'MacBook Pro M3 14" Comme neuf', price: "1 200 000 FCFA", priceType: "negociable", category: "Électronique", location: "Lomé, Tokoin", countryCode: "TG", date: "3h", premium: false, featured: false, image: IMG[1], views: 287, favorites: 9, seller: moussa, description: 'MacBook Pro M3 14", 16Go RAM, 512Go SSD. 3 mois d\'utilisation, parfait état.', specs: { Marque: "Apple", RAM: "16 Go", Stockage: "512 Go", État: "Très bon" } },
  { id: 6, title: "Toyota Land Cruiser 200 2020", price: "55 000 000 FCFA", priceType: "negociable", category: "Véhicules", location: "Bamako, ACI 2000", countryCode: "ML", date: "5h", premium: true, featured: false, image: IMG[4], views: 921, favorites: 31, seller: ibrahim, description: "Land Cruiser V8 2020, 85 000km, blanc, 7 places, toit ouvrant. Dédouané.", specs: { Année: "2020", Kilométrage: "85 000 km", Carburant: "Diesel", Places: "7", Dédouané: "Oui" } },
  { id: 7, title: "Canapé angle velours 5p Neuf", price: "280 000 FCFA", priceType: "fixe", category: "Maison", location: "Cotonou, Cadjehoun", countryCode: "BJ", date: "1j", premium: false, featured: false, image: IMG[5], views: 156, favorites: 6, seller: aminata, description: "Canapé d'angle 5 places en velours vert bouteille, jamais utilisé. Livraison Cotonou.", specs: { Type: "Canapé angle", Places: "5", Matière: "Velours", État: "Neuf" } },
  { id: 8, title: "Terrain 500m² Bord de mer Saly", price: "18 000 000 FCFA", priceType: "negociable", category: "Immobilier", location: "Saly, Mbour", countryCode: "SN", date: "2j", premium: false, featured: false, image: IMG[9], views: 432, favorites: 18, seller: moussa, description: "Terrain de 500m² à 200m de la mer à Saly. Titre foncier. Viabilisé eau/électricité.", specs: { Surface: "500 m²", "Titre foncier": "Oui", Distance: "200m mer", Viabilisé: "Oui" } },
  { id: 9, title: "Samsung Galaxy S24 Ultra", price: "620 000 FCFA", priceType: "fixe", category: "Électronique", location: "Ouagadougou", countryCode: "BF", date: "4h", premium: false, featured: false, image: IMG[3], views: 398, favorites: 12, seller: ibrahim, description: "Galaxy S24 Ultra 256Go titanium. Boîte scellée. Garantie 1 an.", specs: { Marque: "Samsung", Stockage: "256 Go", État: "Neuf", Garantie: "1 an" } },
  { id: 10, title: "Robe wax brodée sur mesure", price: "45 000 FCFA", priceType: "negociable", category: "Mode", location: "Dakar, Médina", countryCode: "SN", date: "6h", premium: false, featured: false, image: IMG[8], views: 211, favorites: 27, seller: aminata, description: "Robe de cérémonie wax, broderie dorée, faite sur mesure.", specs: { Genre: "Femme", Matière: "Wax premium", Taille: "Sur mesure" } },
  { id: 11, title: "Chef de projet IT — CDI", price: "Salaire attractif", priceType: "negociable", category: "Emploi", location: "Dakar, Plateau", countryCode: "SN", date: "1h", premium: true, featured: false, image: IMG[0], views: 540, favorites: 8, seller: moussa, description: "Entreprise tech recherche chef de projet expérimenté. CDI, avantages.", specs: { Contrat: "CDI", Secteur: "IT", Expérience: "3 ans", Études: "Bac+4/5" } },
  { id: 12, title: "Moto Yamaha YBR 125 2023", price: "680 000 FCFA", priceType: "fixe", category: "Véhicules", location: "Cotonou, Akpakpa", countryCode: "BJ", date: "8h", premium: false, featured: false, image: IMG[7], views: 174, favorites: 5, seller: ibrahim, description: "Yamaha YBR 125 2023, 2000km, état neuf. Carte grise disponible.", specs: { Année: "2023", Kilométrage: "2 000 km", "Carte grise": "Oui" } },
  { id: 13, title: "Mouton Ladoum pure race", price: "1 500 000 FCFA", priceType: "negociable", category: "Animaux", location: "Thiès", countryCode: "SN", date: "12h", premium: true, featured: false, image: IMG[9], views: 765, favorites: 41, seller: moussa, description: "Magnifique mouton Ladoum pure race, grand format, lignée championne. Idéal Tabaski ou élevage.", specs: { Animal: "Mouton Ladoum", Âge: "2 ans", Sexe: "Mâle", Vacciné: "Oui" } },
  { id: 14, title: "Service plomberie 24h/24 Dakar", price: "5 000 FCFA/h", priceType: "fixe", category: "Services", location: "Dakar", countryCode: "SN", date: "1j", premium: false, featured: false, image: IMG[6], views: 132, favorites: 3, seller: ibrahim, description: "Plombier expérimenté, interventions rapides toute la région de Dakar. Devis gratuit.", specs: { Type: "Plomberie", Disponibilité: "24h/24", Zone: "Dakar", Tarif: "5000/h" } },
];

export const LISTINGS: Listing[] = RAW.map((r) => ({
  ...r,
  slug: slugify(r.title),
  categorySlug: categorySlugFromName(r.category),
}));

export const getListing = (id: number) => LISTINGS.find((l) => l.id === id);
export const featuredListings = () => LISTINGS.filter((l) => l.featured);
export const premiumListings = () => LISTINGS.filter((l) => l.premium);
export const recentListings = () => LISTINGS;
export const listingsByCategory = (slug: string) =>
  LISTINGS.filter((l) => l.categorySlug === slug);
export const similarListings = (l: Listing) =>
  LISTINGS.filter((x) => x.category === l.category && x.id !== l.id).slice(0, 5);

export function searchListings(q: string): Listing[] {
  const term = q.trim().toLowerCase();
  if (!term) return LISTINGS;
  return LISTINGS.filter(
    (l) =>
      l.title.toLowerCase().includes(term) ||
      l.description.toLowerCase().includes(term) ||
      l.category.toLowerCase().includes(term) ||
      l.location.toLowerCase().includes(term),
  );
}

export const TRENDING = ["Toyota Corolla", "Terrain Saly", "iPhone 15", "Appartement meublé", "Mouton Ladoum"];

// Dashboard vendeur
export const MY_ADS = [
  { title: "Villa F5 piscine Almadies", category: "Immobilier", price: "280 000 000 FCFA", views: 1247, status: "act", id: 1 },
  { title: "BMW X5 2022", category: "Véhicules", price: "45 000 000 FCFA", views: 843, status: "act", id: 2 },
  { title: "iPhone 15 Pro Max", category: "Électronique", price: "750 000 FCFA", views: 2134, status: "act", id: 3 },
  { title: "Terrain Saly 500m²", category: "Immobilier", price: "18 000 000 FCFA", views: 432, status: "pen", id: 8 },
  { title: "MacBook Pro M3", category: "Électronique", price: "1 200 000 FCFA", views: 98, status: "exp", id: 5 },
];

export const MESSAGES: Message[] = [
  { name: "Aminata Koné", message: "La villa est-elle disponible ?", time: "10:24", unread: true, avatar: "https://i.pravatar.cc/64?img=5" },
  { name: "Ibrahim Traoré", message: "Votre meilleur prix pour le BMW ?", time: "Hier", unread: true, avatar: "https://i.pravatar.cc/64?img=8" },
  { name: "Fatou Diallo", message: "Merci pour votre réponse !", time: "Hier", unread: false, avatar: "https://i.pravatar.cc/64?img=15" },
  { name: "Oumar Seck", message: "Intéressé par le terrain Saly", time: "Lun.", unread: true, avatar: "https://i.pravatar.cc/64?img=20" },
];
