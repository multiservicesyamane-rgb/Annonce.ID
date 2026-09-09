"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./ui";
import {
  DEFAULT_TEMPLATE,
  contenuVide,
  documentVide,
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
 *
 * ── Rien n'est cree tant que rien n'est saisi ────────────────────────────
 * L'enregistrement partait des le montage de l'editeur : ouvrir « Creer mon
 * CV » pour regarder les modeles, puis ressortir, creait un CV vide. Sur un
 * plan gratuit a un document par mois, le quota etait consomme sans qu'une
 * seule lettre ait ete tapee.
 *
 * La creation attend donc le premier contenu reel (`documentVide`, partage
 * avec le serveur). Une fois le document cree, l'enregistrement automatique
 * reprend sur CHAQUE changement, y compris pour vider un champ — la retenue
 * ne vaut que pour le premier.
 *
 * ── Le verrou du plan gratuit ────────────────────────────────────────────
 * Un document telecharge devient FINI : sans abonnement, il ne se remodifie
 * plus. C'est justement parce que l'enregistrement est automatique que le
 * verrou ne peut pas tomber a la creation — il se refermerait sur un CV
 * contenant une seule lettre du prenom. Il tombe au premier telechargement,
 * apres confirmation explicite (voir ExportA4).
 *
 * Une fois verrouille, l'enregistrement automatique s'arrete net : laisser
 * partir des requetes que le serveur refuse afficherait « Erreur » en boucle
 * sous les yeux de quelqu'un qui n'a rien fait de mal.
 */
/**
 * Ou dort le brouillon d'un visiteur sans compte.
 *
 * Une clef par type de document : quelqu'un peut commencer un CV, puis une
 * lettre, sans que l'un ecrase l'autre.
 */
export function cleBrouillon(kind: CareerKind): string {
  return `wmk_carriere_brouillon_${kind}`;
}

/** Le brouillon en attente pour ce type, ou null. Ne leve jamais. */
export function lireBrouillon(kind: CareerKind): CareerContent | null {
  try {
    const brut = localStorage.getItem(cleBrouillon(kind));
    if (!brut) return null;
    const o = JSON.parse(brut);
    return o && typeof o === "object" ? (o as CareerContent) : null;
  } catch {
    // Navigation privee, stockage plein, JSON abime : on repart a vide plutot
    // que de faire tomber l'ecran sur un brouillon.
    return null;
  }
}

export function effacerBrouillon(kind: CareerKind): void {
  try {
    localStorage.removeItem(cleBrouillon(kind));
  } catch {
    /* sans consequence */
  }
}

export function useDoc(
  kind: CareerKind,
  docId?: string,
  prerempli?: Partial<CareerContent>,
  /**
   * Appele quand le serveur refuse la CREATION faute de quota.
   *
   * Sans lui, ce 402 tombait dans le cas general et devenait un discret
   * « erreur » : l'utilisateur continuait de taper un document que plus rien
   * n'enregistrait. Le peage doit s'annoncer, pas se deviner.
   */
  onQuota?: (message: string) => void,
  /**
   * Visiteur sans compte : tout reste dans le navigateur.
   *
   * ── Pourquoi ce mode existe ────────────────────────────────────────────
   * L'ecran opposait un cadenas et « Connecte-toi » a qui arrivait sans
   * compte. Quelqu'un qui recoit le lien par WhatsApp voyait une porte fermee
   * sans savoir ce qu'il y avait derriere, et repartait.
   *
   * On le laisse desormais composer son document entierement. La connexion
   * n'est demandee qu'au TELECHARGEMENT — au moment ou il a quelque chose
   * entre les mains et une raison de creer un compte.
   *
   * Aucun appel au serveur dans ce mode : ni quota consomme, ni ligne creee.
   */
  local = false,
) {
  const [id, setId] = useState<string | null>(docId || null);
  // Le pre-remplissage ne s'applique qu'a un NOUVEAU document : sur un
  // document existant, il ecraserait ce que l'utilisateur a deja ecrit.
  const [content, setContent] = useState<CareerContent>(() => {
    // En mode local, un brouillon deja commence reprend la main : recharger la
    // page ne doit pas effacer vingt minutes de saisie.
    if (local && !docId) {
      const repris = typeof window !== "undefined" ? lireBrouillon(kind) : null;
      if (repris) return repris;
    }
    return { ...contenuVide(kind), ...(docId ? {} : prerempli) } as CareerContent;
  });
  //  et non  : les courriers ont leurs propres gabarits
  // (« l_… »), et la validation fait autorite cote serveur. Figer le type sur
  // les CV interdisait a une lettre de choisir sa mise en page.
  const [template, setTemplate] = useState<string>(DEFAULT_TEMPLATE);
  const [chargement, setChargement] = useState(!!docId);
  const [etat, setEtat] = useState<"repos" | "enregistrement" | "enregistre" | "erreur">("repos");
  /** Document deja telecharge sur un compte gratuit : lecture seule. */
  const [verrouille, setVerrouille] = useState(false);
  /** Le texte que le serveur oppose a la modification, montre tel quel. */
  const [messageVerrou, setMessageVerrou] = useState<string | null>(null);

  /**
   * Le rappel de quota, garde dans une ref.
   *
   * Le passer en dependance de `enregistrer` aurait suffi a tout casser : les
   * ecrans le fournissent sous forme de fonction anonyme, donc une NOUVELLE
   * identite a chaque rendu. `enregistrer` aurait change a chaque rendu,
   * l'effet d'enregistrement se serait relance a chaque rendu, et la minuterie
   * de 1,2 s n'aurait jamais eu le temps d'arriver a son terme.
   */
  const rappelQuota = useRef(onQuota);
  rappelQuota.current = onQuota;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Le premier rendu ne doit rien enregistrer : sans ce garde-fou, ouvrir un
  // document creerait aussitot une copie vide.
  const pret = useRef(false);

  /**
   * Le contenu tel qu'il etait a l'ouverture, fige.
   *
   * `documentVide` ne suffit pas a lui seul : en venant de l'assistant, le CV
   * arrive PRE-REMPLI (poste vise, ville). Il n'est donc pas vide, et un
   * document se creait a l'ouverture sans qu'une touche ait ete pressee —
   * la meme fuite, par une autre porte.
   *
   * On compare donc au point de depart : tant que rien n'a bouge, rien ne
   * part. Le pre-remplissage n'est pas une saisie.
   */
  const depart = useRef<string | null>(null);
  if (depart.current === null) depart.current = JSON.stringify(content);

  /* ---------------------------- Chargement ---------------------------- */
  useEffect(() => {
    // Mode local : rien a aller chercher, le document vit dans le navigateur.
    if (local || !docId) {
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
        // Connu AVANT que l'editeur s'ouvre : decouvrir le verrou au premier
        // enregistrement ferait perdre ce qui vient d'etre tape.
        setVerrouille(!!d.verrouille);
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
  }, [docId, kind, local]);

  /* --------------------------- Enregistrement --------------------------- */
  const enregistrer = useCallback(
    async (c: CareerContent, t: string) => {
      setEtat("enregistrement");

      // Mode local : on ecrit dans le navigateur, et c'est tout. Le quota et
      // le verrou n'ont pas de sens ici — rien n'a encore ete cree.
      if (local) {
        try {
          localStorage.setItem(cleBrouillon(kind), JSON.stringify(c));
          setEtat("enregistre");
        } catch {
          // Stockage plein ou refuse : on le dit, sinon quelqu'un croit son
          // travail a l'abri alors qu'il ne l'est pas.
          setEtat("erreur");
        }
        return;
      }

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
          // Le brouillon du visiteur a rempli son office : il est maintenant
          // sur le compte. On l'efface SEULEMENT ici, apres la creation
          // reussie — l'effacer plus tot aurait perdu le travail si
          // l'enregistrement echouait.
          effacerBrouillon(kind);
        }
        setEtat("enregistre");
      } catch (e: any) {
        // 422 : le serveur juge le document encore vide. Ce n'est pas une
        // panne non plus — c'est le meme verdict que le notre, rendu une
        // seconde fois. On se tait : afficher « Erreur » a quelqu'un qui n'a
        // rien tape serait incomprehensible.
        if (e?.status === 422 && e?.data?.vide) {
          setEtat("repos");
          return;
        }
        // 402 : le document est fini et le compte est gratuit. Ce n'est pas
        // une panne, c'est le peage — on bascule en lecture seule et on
        // reprend le texte du serveur plutot que d'afficher « Erreur ».
        if (e?.status === 402 && e?.data?.verrouille) {
          setVerrouille(true);
          setMessageVerrou(e?.data?.error || null);
          setEtat("repos");
          return;
        }
        // 402 sans drapeau `verrouille` : c'est le QUOTA du mois, pas le
        // verrou d'un document fini. Deux refus differents, deux ecrans
        // differents — les confondre laissait le second sans explication.
        if (e?.status === 402) {
          setEtat("repos");
          rappelQuota.current?.(e?.data?.message || e?.data?.error || "Quota de documents atteint.");
          return;
        }
        setEtat("erreur");
      }
    },
    [id, kind, local],
  );

  useEffect(() => {
    if (!pret.current || chargement) return;
    // Verrouille : plus rien ne part. Sans ce garde-fou, chaque frappe
    // declencherait un refus du serveur, et le bandeau clignoterait a l'infini
    // sur un ecran ou l'utilisateur ne peut de toute facon rien changer.
    if (verrouille) return;
    // Tant que le document n'existe pas, deux conditions avant d'en creer un :
    // qu'il y ait quelque chose (regle du serveur, importee), et que ce
    // quelque chose ne soit pas simplement ce avec quoi l'ecran s'est ouvert.
    // C'est ce qui creait des CV fantomes a la simple ouverture de l'editeur.
    if (!id && (documentVide(kind, content) || JSON.stringify(content) === depart.current)) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => enregistrer(content, template), 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [content, template, chargement, enregistrer, verrouille, id, kind]);

  /**
   * Le document vient d'etre telecharge : il est fini.
   *
   * Appele par l'ecran d'apercu APRES un telechargement reussi, jamais avant —
   * verrouiller un document dont le PDF a echoue laisserait quelqu'un sans
   * fichier ET sans droit de le refaire.
   */
  const finaliser = useCallback(async () => {
    // En mode local il n'y a pas de document a finaliser : le verrou ne
    // s'applique qu'a une piece enregistree sur un compte.
    if (local || !id) return;
    try {
      const r = await api("documents", { action: "finaliser", id });
      if (r?.verrouille) setVerrouille(true);
    } catch {
      // Le PDF est deja dans les telechargements : echouer ici ne doit rien
      // casser a l'ecran. Le serveur refusera la modification de toute facon.
    }
  }, [id, local]);

  /** Modifie une partie du contenu sans avoir a recopier tout l'objet. */
  const patch = useCallback((p: Record<string, unknown>) => {
    setContent((c) => ({ ...(c as object), ...p }) as CareerContent);
  }, []);

  return {
    id, content, setContent, patch, template, setTemplate, chargement, etat,
    verrouille, messageVerrou, finaliser,
  };
}
