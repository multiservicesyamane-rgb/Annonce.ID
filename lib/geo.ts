// Coordonnées des zones du Sénégal, pour la carte des annonces.
// Volontairement au niveau COMMUNE (jamais l'adresse exacte d'un vendeur) :
// c'est la même granularité que celle déjà affichée sur chaque annonce.

// Communes (Dakar en priorité : c'est là qu'est le gros du stock)
const COMMUNE_COORDS: Record<string, [number, number]> = {
  // — Région de Dakar —
  "plateau": [14.6688, -17.4381],
  "medina": [14.6839, -17.452],
  "almadies": [14.7439, -17.5153],
  "parcelles assainies": [14.7644, -17.4344],
  "grand dakar": [14.7075, -17.4508],
  "pikine": [14.7548, -17.3907],
  "thiaroye": [14.7644, -17.3608],
  "yeumbeul": [14.7833, -17.3833],
  "guediawaye": [14.7769, -17.4056],
  "rufisque": [14.7167, -17.2667],
  "sangalkam": [14.7833, -17.2167],
  "diamniadio": [14.7275, -17.1839],
  "keur massar": [14.7811, -17.3211],
  "jaxaay": [14.8, -17.3167],
  // — Autres régions —
  "thies ville": [14.791, -16.9256],
  "mbour": [14.4197, -16.9644],
  "tivaouane": [14.95, -16.8167],
  "saly": [14.45, -17.0167],
  "joal-fadiouth": [14.1667, -16.8333],
  "diourbel ville": [14.6522, -16.2314],
  "touba": [14.8667, -15.8833],
  "mbacke": [14.79, -15.9086],
  "bambey": [14.7, -16.4667],
  "saint-louis ville": [16.0326, -16.4818],
  "richard-toll": [16.4625, -15.7003],
  "dagana": [16.5167, -15.5],
  "podor": [16.6519, -14.9597],
  "ziguinchor ville": [12.5833, -16.2719],
  "bignona": [12.8103, -16.2264],
  "oussouye": [12.485, -16.5469],
  "cap skirring": [12.3928, -16.7458],
  "kaolack ville": [14.1652, -16.0728],
  "nioro": [13.75, -15.8],
  "guinguineo": [14.2667, -15.95],
  "tambacounda ville": [13.7708, -13.6672],
  "bakel": [14.9, -12.4667],
  "goudiry": [14.1833, -12.7167],
  "koumpentoum": [13.9833, -14.55],
};

// Chefs-lieux de région (repli quand la commune est inconnue ou « Autre »)
const REGION_COORDS: Record<string, [number, number]> = {
  "dakar": [14.6928, -17.4467],
  "thies": [14.791, -16.9256],
  "diourbel": [14.6522, -16.2314],
  "saint-louis": [16.0326, -16.4818],
  "ziguinchor": [12.5833, -16.2719],
  "kaolack": [14.1652, -16.0728],
  "tambacounda": [13.7708, -13.6672],
  "fatick": [14.339, -16.4111],
  "kolda": [12.8833, -14.95],
  "louga": [15.6144, -16.2264],
  "matam": [15.6559, -13.2553],
  "kaffrine": [14.1058, -15.5508],
  "kedougou": [12.5556, -12.1806],
  "sedhiou": [12.7081, -15.5569],
};

/** Clé de recherche insensible aux accents/casse. */
function norm(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function coordsFor(commune?: string | null, region?: string | null): [number, number] | null {
  const c = norm(String(commune || ""));
  if (c && COMMUNE_COORDS[c]) return COMMUNE_COORDS[c];
  const r = norm(String(region || ""));
  if (r && REGION_COORDS[r]) return REGION_COORDS[r];
  return null;
}

type RawListingLocation = {
  region?: string | null;
  commune?: string | null;
  custom_commune?: string | null;
  location?: string | null;
};

/** Une annonce positionnée sur la carte. */
export type MapPoint = {
  id: string;
  slug: string;
  title: string;
  price: string;
  image: string;
  zone: string;
  lat: number;
  lng: number;
};

type RawListing = RawListingLocation & {
  id: string;
  slug?: string | null;
  title?: string | null;
  price?: string | number | null;
  image?: string | null;
};

/** Résout la zone (commune, sinon région) d'une annonce. */
function zoneOf(row: RawListingLocation): { name: string; coords: [number, number] } | null {
  const parts = String(row.location || "").split(" - ");
  const region = (row.region || parts[0] || "").trim();
  let commune = (row.commune || parts[1] || "").trim();
  if (!commune || /^autre$/i.test(commune)) commune = "";
  const coords = coordsFor(commune, region);
  if (!coords) return null;
  return { name: commune || region, coords };
}

/**
 * Place CHAQUE annonce sur la carte. Plusieurs annonces d'une même commune
 * partageraient le même point : on les répartit en cercle autour du centre
 * (~400 m) pour qu'elles restent toutes cliquables, sans jamais prétendre
 * connaître l'adresse exacte du vendeur.
 */
export function buildMapPoints(rows: RawListing[], max = 120): MapPoint[] {
  const groups = new Map<string, { zone: string; coords: [number, number]; items: RawListing[] }>();

  for (const row of rows || []) {
    if (!row?.id) continue;
    const z = zoneOf(row);
    if (!z) continue;
    const key = `${z.coords[0]},${z.coords[1]}`;
    const g = groups.get(key);
    if (g) g.items.push(row);
    else groups.set(key, { zone: z.name, coords: z.coords, items: [row] });
  }

  const points: MapPoint[] = [];
  for (const g of groups.values()) {
    const n = g.items.length;
    g.items.forEach((row, i) => {
      let lat = g.coords[0];
      let lng = g.coords[1];
      if (n > 1) {
        // Cercles concentriques : 8 annonces par anneau.
        const ring = Math.floor(i / 8);
        const perRing = Math.min(8, n - ring * 8);
        const angle = ((i % 8) / perRing) * Math.PI * 2;
        const radius = 0.0035 + ring * 0.0022;
        lat += radius * Math.cos(angle);
        lng += radius * Math.sin(angle);
      }
      points.push({
        id: String(row.id),
        slug: String(row.slug || ""),
        title: String(row.title || "Annonce"),
        price: String(row.price ?? ""),
        image: String(row.image || ""),
        zone: g.zone,
        lat,
        lng,
      });
    });
  }

  return points.slice(0, max);
}

