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

const emptySeller: Seller = { name: "Utilisateur", avatar: "https://i.pravatar.cc/96?img=12", rating: 5, sales: 0, isPro: false, isVerified: false };

type Raw = Omit<Listing, "slug" | "categorySlug"> & { category: string };

const RAW: Raw[] = [];

export const LISTINGS: Listing[] = [];

export const getListing = (id: number) => undefined;
export const featuredListings = () => [];
export const premiumListings = () => [];
export const recentListings = () => [];
export const listingsByCategory = (slug: string) => [];
export const similarListings = (l: Listing) => [];

export function searchListings(q: string): Listing[] {
  return [];
}

export const TRENDING = ["Toyota Corolla", "Terrain Saly", "iPhone 15", "Appartement meublé", "Mouton Ladoum"];

export const MY_ADS = [];

export const MESSAGES: Message[] = [];
