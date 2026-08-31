import { Metadata } from "next";
import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Espace Pro — Devis & factures gratuits | Wanteermako",
  description:
    "Créez un devis en 2 minutes, envoyez-le par WhatsApp. Votre client l'accepte sans créer de compte et la facture se génère automatiquement. Gratuit, pensé pour les freelances et prestataires d'Afrique de l'Ouest.",
};

/**
 * Landing dédiée à l'Espace Pro (Mon Activité — devis/clients/factures).
 *
 * Avant cette page, le seul point d'explication était /comment-ca-marche,
 * qui ne parle en réalité que des annonces boostées et des Boutiques PRO
 * (un « PRO » totalement différent). Rien ne montrait à quoi ressemble
 * concrètement un devis Wanteermako avant de s'inscrire — cette page comble
 * ce trou et sert de cible à « En savoir plus » depuis la home.
 */

const CHAIN = [
  { icon: "📝", title: "Vous créez un devis", desc: "Rubriques déjà prêtes, montants calculés automatiquement." },
  { icon: "💬", title: "Vous l'envoyez par WhatsApp", desc: "Un lien gratuit — pas d'API payante, pas de SMS." },
  { icon: "✅", title: "Le client accepte en un clic", desc: "Depuis son téléphone, sans créer de compte." },
  { icon: "🧾", title: "La facture se crée toute seule", desc: "Numérotée, et le suivi de paiement démarre." },
] as const;

const FEATURES = [
  { icon: "👥", title: "Clients", desc: "Fiches et historique de chaque relation" },
  { icon: "📄", title: "Devis", desc: "Rubriques réutilisables, acceptés en un clic" },
  { icon: "🧾", title: "Factures", desc: "Numérotation automatique, jamais deux fois le même numéro" },
  { icon: "💰", title: "Paiements", desc: "Encaissé, en attente, retards — calculés en direct" },
  { icon: "🏢", title: "Profil entreprise", desc: "Logo, signature, cachet — statut formel ou informel" },
  { icon: "📱", title: "QR code", desc: "Sur chaque pièce, pour vérifier son authenticité" },
] as const;

type Tpl = { id: string; name: string; desc: string; accent: string; header: "rule" | "band" | "frame" | "plain"; caps?: boolean };

const TEMPLATES: Tpl[] = [
  { id: "classique", name: "Classique", desc: "Filet de couleur, sobre", accent: "#4F46E5", header: "rule" },
  { id: "moderne", name: "Moderne", desc: "Titre coloré, blocs doux", accent: "#0891B2", header: "rule", caps: true },
  { id: "bande", name: "Bande pleine", desc: "Bandeau de couleur en tête", accent: "#047857", header: "band" },
  { id: "epure", name: "Épuré", desc: "Minimaliste, sans aplat", accent: "#111827", header: "plain" },
  { id: "officiel", name: "Administratif", desc: "Encadré, style officiel", accent: "#92400E", header: "frame" },
];

function TemplateSwatch({ t }: { t: Tpl }) {
  const lineCls = t.caps ? "tracking-[.1em] uppercase" : "";
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#0B1120]">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-gray-100 bg-white dark:border-white/10">
        {t.header === "band" ? (
          <div className="flex h-9 items-center px-3" style={{ background: t.accent }}>
            <div className="h-1.5 w-14 rounded-full bg-white/70" />
          </div>
        ) : t.header === "frame" ? (
          <div className="m-2 rounded-md p-2" style={{ border: `1.5px solid ${t.accent}` }}>
            <div className={`h-1.5 w-16 rounded-full ${lineCls}`} style={{ background: t.accent }} />
          </div>
        ) : (
          <div className="px-3 pt-3">
            <div
              className={`h-1.5 w-16 rounded-full ${lineCls}`}
              style={{ background: t.header === "plain" ? "#111827" : t.accent }}
            />
            {t.header === "rule" && <div className="mt-1.5 h-[2px] w-full" style={{ background: t.accent }} />}
          </div>
        )}

        <div className="space-y-1.5 px-3 pt-3">
          <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-white/10" />
          <div className="h-1 w-4/5 rounded-full bg-gray-100 dark:bg-white/10" />
          <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-white/10" />
        </div>

        <div className="px-3 pt-4">
          <div
            className="ml-auto h-3 w-16 rounded-sm"
            style={
              t.id === "epure"
                ? { border: `1.5px solid ${t.accent}` }
                : { background: `${t.accent}1A` }
            }
          />
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-[.8rem] font-bold text-gray-900 dark:text-white">{t.name}</p>
        <p className="text-[.7rem] text-gray-500 dark:text-gray-400">{t.desc}</p>
      </div>
    </div>
  );
}

export default function EspaceProPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 md:py-16">
      {/* Hero */}
      <ScrollReveal className="text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-neon-gold/15 px-3 py-1 text-[.7rem] font-black uppercase tracking-wider text-gold-dark dark:text-neon-gold">
          💼 Freelances &amp; prestataires
        </div>
        <h1 className="font-display text-[2.2rem] font-black leading-tight text-gray-900 dark:text-white sm:text-[2.8rem] md:text-[3.3rem]">
          Vos devis et factures,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-neon-gold">
            gratuitement
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[1.02rem] leading-relaxed text-gray-600 dark:text-gray-400">
          L'outil de gestion pensé pour les indépendants et petites entreprises
          d'Afrique de l'Ouest — sans carte bancaire, sans abonnement caché.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/mon-activite"
            className="btn btn-green btn-lg"
          >
            Ouvrir mon espace pro →
          </Link>
          <Link href="#modeles" className="btn btn-outline btn-lg">
            Voir les modèles de documents
          </Link>
        </div>
      </ScrollReveal>

      {/* Chaîne devis → facture */}
      <ScrollReveal className="mt-16 md:mt-24" delay={100}>
        <h2 className="text-center font-display text-[1.5rem] font-bold text-gray-900 dark:text-white md:text-[1.8rem]">
          Du devis à l'encaissement, sans ressaisie
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CHAIN.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#111722]">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-[1.3rem] dark:bg-white/5">
                {s.icon}
              </div>
              <p className="mb-1 text-[.7rem] font-black uppercase tracking-wider text-green-500">Étape {i + 1}</p>
              <h3 className="font-bold text-gray-900 dark:text-white">{s.title}</h3>
              <p className="mt-1 text-[.85rem] leading-relaxed text-gray-600 dark:text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Fonctionnalités */}
      <ScrollReveal className="mt-16 md:mt-24" delay={100}>
        <h2 className="text-center font-display text-[1.5rem] font-bold text-gray-900 dark:text-white md:text-[1.8rem]">
          Tout ce qu'il faut pour piloter votre activité
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-[#111722]">
              <span className="text-[1.4rem]">{f.icon}</span>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-[.85rem] text-gray-600 dark:text-gray-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Modèles de documents */}
      <div id="modeles" className="mt-16 scroll-mt-24 md:mt-24">
        <ScrollReveal delay={100}>
          <h2 className="text-center font-display text-[1.5rem] font-bold text-gray-900 dark:text-white md:text-[1.8rem]">
            Cinq mises en page, un seul document
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-[.9rem] text-gray-600 dark:text-gray-400">
            Choisissez le style qui correspond à votre activité — vos couleurs, votre logo, votre cachet.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {TEMPLATES.map((t) => (
              <TemplateSwatch key={t.id} t={t} />
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* Confiance */}
      <ScrollReveal className="mt-16 md:mt-24" delay={100}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-[#111722]">
            <p className="text-[1.4rem]">🆓</p>
            <h3 className="mt-1 font-bold text-gray-900 dark:text-white">100 % gratuit</h3>
            <p className="mt-1 text-[.85rem] text-gray-600 dark:text-gray-400">
              Aucune carte bancaire, aucun abonnement pour commencer.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-[#111722]">
            <p className="text-[1.4rem]">🏷️</p>
            <h3 className="mt-1 font-bold text-gray-900 dark:text-white">Formel ou informel</h3>
            <p className="mt-1 text-[.85rem] text-gray-600 dark:text-gray-400">
              Avec ou sans NINEA, TVA optionnelle — adapté à votre statut réel.
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-[#111722]">
            <p className="text-[1.4rem]">🔒</p>
            <h3 className="mt-1 font-bold text-gray-900 dark:text-white">Numérotation fiable</h3>
            <p className="mt-1 text-[.85rem] text-gray-600 dark:text-gray-400">
              Jamais deux devis ou factures avec le même numéro.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* CTA final */}
      <ScrollReveal className="mt-16 md:mt-24" delay={100}>
        <div className="overflow-hidden rounded-[2rem] bg-[#111722] p-8 text-center md:p-12">
          <h2 className="font-display text-[1.6rem] font-black text-white md:text-[2rem]">
            Envoyez votre premier devis aujourd'hui
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[.95rem] text-gray-300">
            Deux minutes suffisent pour créer un compte et envoyer un devis à votre premier client.
          </p>
          <Link href="/mon-activite" className="btn btn-gold btn-lg mt-6 inline-flex">
            Ouvrir mon espace pro →
          </Link>
        </div>
      </ScrollReveal>
    </div>
  );
}
