import Link from "next/link";
import CVSheet from "@/components/carriere/templates";
import { CV_TEMPLATES, LETTRE_TEMPLATES, type CVContent, type TemplateId } from "@/lib/carriere";
import { DOC_TEMPLATES } from "@/lib/pro";

/**
 * Les sections de presentation de l'accueil.
 *
 * ── Un parti pris sur les images ─────────────────────────────────────────
 * Aucune photo de personne, et aucun temoignage. Ce n'est pas un manque : le
 * site n'a pas encore de temoignages reels, et en inventer — une photo de
 * banque d'images sous une phrase entre guillemets — reviendrait a fabriquer
 * un faux client. Ca se repere, et ca coute plus cher en confiance que ca ne
 * rapporte. Le fichier de l'accueil portait deja cette regle pour les notes et
 * les chiffres de frequentation ; on la tient aussi ici.
 *
 * A la place, on montre LE PRODUIT. Les vignettes de CV ci-dessous ne sont pas
 * des images : ce sont les vrais gabarits, rendus avec le meme code que celui
 * qui fabrique le PDF. Ce que le visiteur voit est exactement ce qu'il
 * obtiendra — c'est la preuve la plus forte qu'on puisse donner, et la seule
 * qui ne puisse pas mentir.
 *
 * Le jour ou de vrais clients accepteront d'etre cites, leurs phrases
 * prendront place ici, avec leur nom.
 */

/** Specimen de remplissage des vignettes. Aucune personne reelle. */
const SPECIMEN: CVContent = {
  personalInfo: {
    firstName: "Awa", lastName: "Diallo", title: "Assistante commerciale",
    email: "awa.diallo@exemple.sn", phone: "+221 77 000 00 00",
    location: "Dakar", linkedin: "", photoUrl: "",
  },
  accent: "", police: "",
  summary:
    "Quatre ans d'experience dans le suivi des ventes et la relation client. Rigoureuse, organisee, a l'aise avec les outils bureautiques.",
  experiences: [
    {
      id: "x1", title: "Assistante commerciale", company: "SunuCom", location: "Dakar",
      startDate: "2021", endDate: "", isCurrent: true,
      bullets: ["Gestion des commandes et suivi des livraisons.", "Preparation des devis et des factures."],
    },
    {
      id: "x2", title: "Vendeuse", company: "Boutique Teranga", location: "Thies",
      startDate: "2019", endDate: "2021", isCurrent: false,
      bullets: ["Accueil et conseil clientele."],
    },
  ],
  education: [
    { id: "e1", degree: "Licence en Commerce", school: "Universite Cheikh Anta Diop", location: "Dakar", startDate: "2016", endDate: "2019" },
  ],
  certifications: [{ id: "c1", name: "Bureautique et Pack Office", issuer: "Sonatel Academy", year: "2020" }],
  skills: ["Relation client", "Prospection", "Pack Office"],
  niveaux: { "Relation client": 5, Prospection: 4, "Pack Office": 4 },
  languages: [
    { id: "l1", name: "Francais", level: 5 },
    { id: "l2", name: "Wolof", level: 5 },
    { id: "l3", name: "Anglais", level: 3 },
  ],
  atouts: ["Sens de l'organisation", "Rigueur"],
};

/** Largeur d'une vignette. L'echelle et la hauteur s'en deduisent. */
const VIGNETTE_W = 168;
const ECHELLE = VIGNETTE_W / 794;
const VIGNETTE_H = Math.round(1123 * ECHELLE);

/** Les six gabarits montres en vitrine, choisis pour leur variete visuelle. */
const EN_VITRINE: TemplateId[] = ["vague", "moderne", "pilule", "ruban", "medaillon", "tandem"];

function Vignette({ id }: { id: TemplateId }) {
  const nom = CV_TEMPLATES.find((t) => t.id === id)?.name || "";
  return (
    <div className="shrink-0">
      <div
        className="overflow-hidden rounded-lg bg-white ring-1 ring-black/10 transition-transform duration-200 hover:-translate-y-1"
        style={{ width: VIGNETTE_W, height: VIGNETTE_H }}
      >
        {/* La feuille A4 reelle, reduite. Pas une capture : le meme composant
            que celui qui produit le PDF. */}
        <div
          style={{
            transform: `scale(${ECHELLE})`,
            transformOrigin: "top left",
            width: 794,
            height: 1123,
            pointerEvents: "none",
          }}
        >
          <CVSheet cv={SPECIMEN} template={id} />
        </div>
      </div>
      <p className="mt-1.5 text-center text-[.72rem] font-semibold text-gray-500">{nom}</p>
    </div>
  );
}

/* ═══════════════ 1. Les CV, montres pour de vrai ═══════════════ */

export function VitrineCV() {
  const gratuits = CV_TEMPLATES.filter((t) => !t.pro).length;
  return (
    <section className="wrap py-9" aria-labelledby="vitrine-cv">
      <div className="rounded-3xl bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] p-6 dark:from-[#4F46E5]/12 dark:to-[#7C3AED]/8 sm:p-8">
        <div className="text-center">
          <span className="inline-block rounded-full bg-[#4F46E5]/10 px-3 py-1 text-[.72rem] font-bold uppercase tracking-wider text-[#4F46E5] dark:text-[#A5B4FC]">
            Ma Carriere
          </span>
          <h2
            id="vitrine-cv"
            className="mt-3 font-display text-[1.5rem] font-extrabold leading-tight text-gray-900 dark:text-white sm:text-[2rem]"
          >
            Ton CV prêt ce soir
          </h2>
          <p className="mx-auto mt-2 max-w-[520px] text-[.92rem] leading-relaxed text-gray-600 dark:text-gray-300">
            Choisis un modele, remplis tes informations, telecharge ton PDF.{" "}
            <strong className="text-gray-800 dark:text-gray-100">
              {CV_TEMPLATES.length} modeles
            </strong>{" "}
            dont {gratuits} gratuits, et {LETTRE_TEMPLATES.length} mises en page de courrier.
          </p>
        </div>

        {/* Bande horizontale : sur un telephone on fait defiler du doigt,
            comme partout ailleurs. Une grille aurait impose des vignettes
            minuscules ou trois rangees a derouler. */}
        <div className="-mx-6 mt-6 flex gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8 [&::-webkit-scrollbar]:hidden">
          {EN_VITRINE.map((id) => (
            <Vignette key={id} id={id} />
          ))}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/carriere"
            className="inline-block rounded-xl bg-[#4F46E5] px-7 py-3.5 text-[.95rem] font-bold text-white shadow-lg shadow-[#4F46E5]/25 transition hover:-translate-y-0.5"
          >
            Creer mon CV gratuitement →
          </Link>
          <p className="mt-2.5 text-[.8rem] text-gray-500">
            Sans compte pour commencer. On te le demande seulement au telechargement.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 2. L'Espace Pro ═══════════════ */

const ATOUTS_PRO = [
  ["📄", "Devis en 2 minutes", "Tes lignes, ton total, ton logo. Le client recoit un lien."],
  ["✅", "Accepte en 1 clic", "Il valide depuis son telephone, sans rien installer."],
  ["🧾", "Facture automatique", "Le devis accepte devient une facture. Rien a resaisir."],
  ["💰", "Paiements suivis", "Wave, Orange Money, especes : tu sais qui a paye, et qui doit."],
];

export function VitrinePro() {
  return (
    <section className="wrap py-9" aria-labelledby="vitrine-pro">
      <div className="rounded-3xl border border-[#047857]/15 bg-[#ECFDF5] p-6 dark:border-[#047857]/25 dark:bg-[#047857]/10 sm:p-8">
        <div className="grid gap-7 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-block rounded-full bg-[#047857]/10 px-3 py-1 text-[.72rem] font-bold uppercase tracking-wider text-[#047857] dark:text-[#6EE7B7]">
              Espace Pro
            </span>
            <h2
              id="vitrine-pro"
              className="mt-3 font-display text-[1.5rem] font-extrabold leading-tight text-gray-900 dark:text-white sm:text-[2rem]"
            >
              Arrete les devis sur cahier
            </h2>
            <p className="mt-2 text-[.92rem] leading-relaxed text-gray-600 dark:text-gray-300">
              Macon, couturier, informaticien, traiteur : tes devis et tes factures
              sortent propres, avec ton logo, en {DOC_TEMPLATES.length} mises en page au choix.
              Ton client valide depuis WhatsApp.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ATOUTS_PRO.map(([icone, titre, texte]) => (
                <div key={titre} className="flex gap-2.5">
                  <span className="text-[1.05rem]" aria-hidden="true">{icone}</span>
                  <span>
                    <span className="block text-[.87rem] font-bold text-gray-900 dark:text-white">{titre}</span>
                    <span className="block text-[.8rem] leading-snug text-gray-600 dark:text-gray-400">{texte}</span>
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/espace-pro"
              className="mt-6 inline-block rounded-xl bg-[#047857] px-7 py-3.5 text-[.95rem] font-bold text-white shadow-lg shadow-[#047857]/25 transition hover:-translate-y-0.5"
            >
              Voir l&apos;Espace Pro →
            </Link>
          </div>

          {/*
            Une illustration de l'ECRAN, dessinee en CSS — pas un faux document.
            Les libelles sont volontairement generiques (« Prestation »,
            « Client ») : personne ne doit pouvoir la prendre pour une vraie
            facture, ni y lire un nom d'entreprise qui n'a rien demande.
          */}
          <div aria-hidden="true" className="hidden lg:block">
            <div className="mx-auto max-w-[380px] rotate-1 rounded-2xl bg-white p-5 shadow-[0_20px_50px_-20px_rgba(4,120,87,.45)] ring-1 ring-black/5 dark:bg-dark-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-2.5 w-24 rounded bg-[#047857]" />
                  <div className="mt-1.5 h-1.5 w-16 rounded bg-gray-200 dark:bg-white/15" />
                </div>
                <div className="rounded-md bg-[#ECFDF5] px-2 py-1 text-[.6rem] font-bold text-[#047857]">FACTURE</div>
              </div>
              <div className="mt-4 space-y-2">
                {[["Prestation", "45 000"], ["Deplacement", "10 000"], ["Fournitures", "22 500"]].map(([l, m]) => (
                  <div key={l} className="flex items-center justify-between border-b border-gray-100 pb-1.5 dark:border-white/10">
                    <span className="text-[.72rem] text-gray-600 dark:text-gray-400">{l}</span>
                    <span className="text-[.72rem] font-semibold text-gray-800 dark:text-gray-200">{m} F</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-[#ECFDF5] px-3 py-2 dark:bg-[#047857]/15">
                <span className="text-[.72rem] font-bold text-[#047857]">Total</span>
                <span className="text-[.9rem] font-extrabold text-[#047857]">77 500 F</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-gray-900 dark:bg-white/20" />
                <span className="text-[.65rem] leading-tight text-gray-500">
                  QR code · le client scanne et valide
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ 3. Comment ca marche ═══════════════ */

const ETAPES = [
  ["1", "Tu choisis", "Une annonce a publier, un devis a envoyer, un CV a ecrire."],
  ["2", "Tu remplis", "Des questions simples, en francais. L'assistant propose les textes."],
  ["3", "Tu envoies", "PDF, WhatsApp, lien a partager. Ton document est pret."],
];

export function VitrineEtapes() {
  return (
    <section className="wrap py-9" aria-labelledby="vitrine-etapes">
      <h2
        id="vitrine-etapes"
        className="text-center font-display text-[1.5rem] font-extrabold text-gray-900 dark:text-white sm:text-[1.9rem]"
      >
        Trois etapes, pas une de plus
      </h2>
      <p className="mx-auto mt-2 max-w-[460px] text-center text-[.92rem] text-gray-600 dark:text-gray-400">
        Pas de formation a suivre, pas de logiciel a installer.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {ETAPES.map(([n, titre, texte]) => (
          <div key={n} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-dark-800">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-green text-[.9rem] font-extrabold text-white">
              {n}
            </span>
            <p className="mt-3 text-[1rem] font-extrabold text-gray-900 dark:text-white">{titre}</p>
            <p className="mt-1 text-[.86rem] leading-relaxed text-gray-600 dark:text-gray-400">{texte}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════ 4. Pourquoi nous ═══════════════ */

const RAISONS = [
  ["🇸🇳", "Pense pour ici", "Francais, FCFA, Wave et Orange Money. Pas un outil traduit a la hate."],
  ["📱", "Sur ton telephone", "Rien a installer. Le site devient une application en deux gestes."],
  ["🆓", "Commence gratuitement", "Un document par mois, sans carte bancaire. Tu juges avant de payer."],
  ["🔒", "Tes documents t'appartiennent", "Aucune mention Wanteermako sur ce que tu envoies a tes clients."],
];

export function VitrineConfiance() {
  return (
    <section className="wrap py-9" aria-labelledby="vitrine-confiance">
      <div className="rounded-3xl bg-gray-900 p-6 text-white dark:bg-white/[0.04] sm:p-8">
        <h2
          id="vitrine-confiance"
          className="text-center font-display text-[1.5rem] font-extrabold sm:text-[1.9rem]"
        >
          Pourquoi Wanteermako
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RAISONS.map(([icone, titre, texte]) => (
            <div key={titre}>
              <span className="text-[1.4rem]" aria-hidden="true">{icone}</span>
              <p className="mt-1.5 text-[.94rem] font-bold">{titre}</p>
              <p className="mt-1 text-[.83rem] leading-relaxed text-white/70">{texte}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/carriere"
            className="rounded-xl bg-white px-6 py-3 text-[.9rem] font-bold text-gray-900 transition hover:-translate-y-0.5"
          >
            Creer mon CV
          </Link>
          <Link
            href="/espace-pro"
            className="rounded-xl border border-white/25 px-6 py-3 text-[.9rem] font-bold text-white transition hover:bg-white/10"
          >
            Faire un devis
          </Link>
        </div>
      </div>
    </section>
  );
}
