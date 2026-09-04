"use client";

/**
 * Espace Freelancer — aiguillage des cinq panneaux du module.
 *
 * Chaîne fonctionnelle :
 *   Client → Projet → Devis → Acceptation → Facture → Paiement → Mon Activité
 *
 * Chaque panneau vit dans son propre fichier (components/pro/) : ils partagent
 * le socle `pro/ui.tsx` mais restent indépendants, ce qui évite un composant
 * unique de plusieurs milliers de lignes impossible à faire évoluer.
 */

import ActivityPanel from "./pro/ActivityPanel";
import ClientsPanel from "./pro/ClientsPanel";
import ProjectsPanel from "./pro/ProjectsPanel";
import QuotesPanel from "./pro/QuotesPanel";
import InvoicesPanel from "./pro/InvoicesPanel";
import type { GoTo } from "./pro/ui";

export type ProPanel = "activity" | "clients" | "projects" | "quotes" | "invoices";

export default function MonActivite({
  panel,
  toast,
  goTo,
  focusId,
}: {
  panel: ProPanel;
  toast: (m: string) => void;
  goTo: GoTo;
  /** Pièce à ouvrir d'emblée sur l'écran demandé (devis ou facture). */
  focusId?: string;
}) {
  switch (panel) {
    case "activity":
      return <ActivityPanel toast={toast} goTo={goTo} />;
    case "clients":
      return <ClientsPanel toast={toast} goTo={goTo} />;
    case "projects":
      return <ProjectsPanel toast={toast} goTo={goTo} />;
    case "quotes":
      return <QuotesPanel toast={toast} goTo={goTo} focusId={focusId} />;
    case "invoices":
      return <InvoicesPanel toast={toast} goTo={goTo} focusId={focusId} />;
    default:
      return null;
  }
}
