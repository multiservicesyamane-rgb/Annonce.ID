"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./ui";
import {
  DEFAULT_TEMPLATE,
  contenuVide,
  titreParDefaut,
  type CareerContent,
  type CareerKind,
} from "@/lib/carriere";

/**
 * Le document en cours d'ecriture, et son enregistrement.
 *
 * ── Pourquoi pas le store de cvurgent ────────────────────────────────────
 * Le projet d'origine tient son CV dans un singleton de module : une seule
 * instance pour toute l'application, partagee entre tous les onglets et tous
 * les documents. Ouvrir un deuxieme CV y ecrase le premier. Ici l'etat vit
 * dans le composant qui edite, et meurt avec lui.
 *
 * ── L'enregistrement ─────────────────────────────────────────────────────
 * Automatique, 1,2 s apres la derniere frappe. Le public tape sur un
 * telephone, souvent en 4G instable : un bouton « Enregistrer » a trouver
 * avant de fermer l'onglet perd du travail. Le premier enregistrement CREE
 * le document, les suivants le mettent a jour.
 */
export function useDoc(kind: CareerKind, docId?: string, prerempli?: Partial<CareerContent>) {
  const [id, setId] = useState<string | null>(docId || null);
  // Le pre-remplissage ne s'applique qu'a un NOUVEAU document : sur un
  // document existant, il ecraserait ce que l'utilisateur a deja ecrit.
  const [content, setContent] = useState<CareerContent>(
    () => ({ ...contenuVide(kind), ...(docId ? {} : prerempli) }) as CareerContent,
  );
  //  et non  : les courriers ont leurs propres gabarits
  // (« l_… »), et la validation fait autorite cote serveur. Figer le type sur
  // les CV interdisait a une lettre de choisir sa mise en page.
  const [template, setTemplate] = useState<string>(DEFAULT_TEMPLATE);
  const [chargement, setChargement] = useState(!!docId);
  const [etat, setEtat] = useState<"repos" | "enregistrement" | "enregistre" | "erreur">("repos");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Le premier rendu ne doit rien enregistrer : sans ce garde-fou, ouvrir un
  // document creerait aussitot une copie vide.
  const pret = useRef(false);

  /* ---------------------------- Chargement ---------------------------- */
  useEffect(() => {
    if (!docId) {
      pret.current = true;
      return;
    }
    let vivant = true;
    (async () => {
      try {
        const d = await api("documents", { action: "get", id: docId });
        if (!vivant) return;
        setContent(d.document.content || contenuVide(kind));
        setTemplate(d.document.template || DEFAULT_TEMPLATE);
        setId(d.document.id);
      } catch {
        // Document introuvable ou supprime : on repart d'un document vierge
        // plutot que de bloquer l'ecran sur une erreur.
        if (vivant) setId(null);
      } finally {
        if (vivant) {
          setChargement(false);
          pret.current = true;
        }
      }
    })();
    return () => {
      vivant = false;
    };
  }, [docId, kind]);

  /* --------------------------- Enregistrement --------------------------- */
  const enregistrer = useCallback(
    async (c: CareerContent, t: string) => {
      setEtat("enregistrement");
      try {
        if (id) {
          await api("documents", { action: "update", id, content: c, template: t, title: titreParDefaut(kind, c) });
        } else {
          const d = await api("documents", {
            action: "create",
            kind,
            content: c,
            template: t,
            title: titreParDefaut(kind, c),
          });
          setId(d.document.id);
        }
        setEtat("enregistre");
      } catch {
        setEtat("erreur");
      }
    },
    [id, kind],
  );

  useEffect(() => {
    if (!pret.current || chargement) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => enregistrer(content, template), 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [content, template, chargement, enregistrer]);

  /** Modifie une partie du contenu sans avoir a recopier tout l'objet. */
  const patch = useCallback((p: Record<string, unknown>) => {
    setContent((c) => ({ ...(c as object), ...p }) as CareerContent);
  }, []);

  return { id, content, setContent, patch, template, setTemplate, chargement, etat };
}
