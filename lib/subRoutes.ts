export type SubRouteQuery = Record<string, string>;

export type CategorySubRoute = {
  active: boolean;
  query: SubRouteQuery;
};

export const CATEGORY_SUB_ROUTES: Record<string, Record<string, CategorySubRoute>> = {
  vehicules: {
    voitures: { active: true, query: { category: "Voitures" } },
    motos: { active: true, query: { category: "Motos & Scooters" } },
  },
  immobilier: {
    location: { active: false, query: { Transaction: "Location" } },
    vente: { active: false, query: { Transaction: "Vente" } },
  },
  emploi: {
    offres: { active: false, query: { "Type d'annonce": "Offre d'emploi" } },
  },
  services: {
    "informatique-web": { active: true, query: { category: "Informatique & Web" } },
  },
};

export function getSubRouteQuery(
  categorySlug: string,
  alias: string,
): SubRouteQuery | undefined {
  const subRoute = CATEGORY_SUB_ROUTES[categorySlug]?.[alias];

  return subRoute?.active ? subRoute.query : undefined;
}
