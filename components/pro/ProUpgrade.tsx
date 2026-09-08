"use client";

import ProPlans from "./ProPlans";

/**
 * L'offre Pro, montree au moment ou le quota gratuit bloque.
 *
 * Ce fichier ne porte plus que le contexte : les trois colonnes, le tunnel de
 * paiement Chariow et les textes vivent dans ProPlans, partages avec la page
 * publique /espace-pro. Le prix ne doit pas exister en deux exemplaires — c'est
 * ainsi qu'il avait fini par n'etre affiche qu'ici, au moment du blocage.
 *
 * Les appelants (InvoicesPanel, en trois endroits) gardent la meme signature.
 */
export default function ProUpgrade({
  message,
  onClose,
  module = "pro",
  quotaInclus,
}: {
  message?: string;
  onClose?: () => void;
  /** Quel module raconte l offre. L abonnement reste le meme. */
  module?: "pro" | "carriere";
  quotaInclus?: number;
}) {
  return <ProPlans mode="app" module={module} message={message} onClose={onClose} quotaInclus={quotaInclus} />;
}
