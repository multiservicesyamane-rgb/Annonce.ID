import { redirect } from "next/navigation";

/**
 * Ancienne adresse du kit d'affiches, devenue la page des partenaires.
 *
 * Le contenu a demenage vers /partenaires — c'est la son sujet. Laisser les
 * deux adresses servir la MEME page en aurait fait deux resultats concurrents
 * dans Google, chacun affaiblissant l'autre. Une redirection permanente
 * conserve les liens deja partages et n'en laisse qu'une seule faire autorite.
 */
export default function AffichesPage() {
  redirect("/partenaires");
}
