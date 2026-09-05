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
}: {
  message?: string;
  onClose?: () => void;
}) {
  return <ProPlans mode="app" message={message} onClose={onClose} />;
}
