// Types partagés (alignés sur le schéma Supabase, section 16 du brief).

export type Listing = {
  id: number;
  title: string;
  slug: string;
  price: string;
  priceType: "fixe" | "negociable" | "gratuit" | "echange";
  category: string;
  categorySlug: string;
  location: string;
  countryCode: string;
  date: string;
  premium: boolean;
  featured: boolean; // "à la Une"
  bigFeature?: boolean; // grande carte dans la grille Une
  image: string;
  description: string;
  specs: Record<string, string>;
  views?: number;
  favorites?: number;
  seller?: Seller;
};

export type Seller = {
  name: string;
  avatar: string;
  rating: number;
  sales: number;
  isPro: boolean;
  isVerified: boolean;
};

export type Message = {
  name: string;
  message: string;
  time: string;
  unread: boolean;
  avatar: string;
};
