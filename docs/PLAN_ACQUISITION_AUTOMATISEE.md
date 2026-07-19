# PLAN STRATÉGIQUE D'AUTOMATISATION — WANTEERMAKO

Ce plan est directement adapté à l'architecture technique de **Wanteermako** (`wanteermako.com`, Next.js 14, Supabase, Tailwind). Il permet de transformer la stratégie proposée en une véritable machine opérationnelle, sans recourir à des serveurs complexes externes : tout est géré nativement via les API de Next.js et Vercel Cron.

---

## ⚠️ État réel du projet (audit du 19 juillet 2026)

Audit du code et de la base de production effectué. À lire avant d'appliquer la suite de ce plan :

1. **La machine de publication (section 1) existe déjà** : `lib/campaign-engine.ts` + `lib/social/` (Telegram, Facebook), légendes Gemini via `lib/gemini.ts`, cron Vercel 3×/jour (`vercel.json` → `/api/campaign/auto-publish`, protégé par `CRON_SECRET`), publication instantanée à l'activation d'une annonce (`publishOneListing`). Plus de 100 posts déjà publiés en production.
2. **Ne pas créer de table `publication_jobs`** : `campaign_posts` remplit déjà ce rôle (draft / scheduled / published / failed). La reprise sur échec (3 tentatives, espacées de 6 h) est gérée par le moteur, après exécution de `database/MIGRATION_CAMPAIGN_RETRY.sql`.
3. **Schéma réel confirmé** : `listings.id` = **uuid** ; statuts réels observés = `active`, `pending`, `sold`, `inactive` (pas de `expired` ni `draft`) ; `expires_at` en place (30 jours, cf. `MIGRATION_EXPIRATION_ANNONCES.sql`).
4. **Emails : le code utilise Resend** (`lib/email.ts`), pas Brevo. Des clés Brevo existent dans `.env.local` mais aucun code ne les utilise — choisir UN fournisseur avant la phase fidélisation, sans faire tourner les deux.
5. **Déploiement : Netlify** (`netlify.toml` + plugin Next.js). Les crons passent par les **Scheduled Functions** (`netlify/functions/*-cron.mjs`) qui appellent les routes Next protégées par `CRON_SECRET`. L'ancien `vercel.json` était un résidu jamais actif — supprimé le 19/07/2026.
6. **Prospects (section 2)** : la table existe (`database/MIGRATION_B2B.sql`), la qualification IA aussi (`lib/prospects.ts` + bouton « Qualifier IA » du CRM, colonnes ajoutées par `MIGRATION_PROSPECTS_QUALIFICATION.sql`). Deux sources de scraping : `scripts/scrape-acteurs.mjs` (**recommandé** — professionnels sur Google Maps : boutiques, agences, concessionnaires) et `scripts/scrape-prospects.mjs` (annonces des sites concurrents — à éviter, CGU restrictives et prospects de moindre qualité).
7. **Tarifs réels** (`lib/constants.ts`, modifiables via `app_settings`) : Premium 3 500 F / 7 j, À la Une 7 500 F / 30 j, VIP 15 000 F / 60 j. Ne jamais coder ces montants en dur dans les emails ou les posts.

---

## 1. La Priorité Absolue : La Machine de Publication (Phase 1)
Avant d'aller chercher de nouveaux vendeurs, il faut que l'expérience de ceux qui publient déjà soit magique. Dès qu'une annonce est approuvée sur Wanteermako, elle doit rayonner partout (Telegram, Facebook).

### Architecture Technique
Au lieu de bloquer l'utilisateur lors de la publication, nous utiliserons un système asynchrone (files d'attente) avec Supabase.

1. **Table `publication_jobs` dans Supabase** :
   ```sql
   create table if not exists public.publication_jobs (
     id uuid primary key default gen_random_uuid(),
     listing_id text references public.listings(id),
     channel text, -- 'facebook_wanteermako', 'telegram_wanteermako', 'pinterest'
     content text, -- texte généré par Gemini
     media_url text,
     status text default 'pending', -- pending, processing, published, failed
     error_message text,
     published_at timestamptz,
     created_at timestamptz default now()
   );
   ```

2. **Cron Job Next.js (`app/api/cron/prepare-publications/route.ts`)** :
   * S'exécute toutes les heures via `vercel.json`.
   * Sélectionne les nouvelles annonces avec `status = 'active'`.
   * Fait appel à **l'API Gemini** (`app/api/ai/route.ts` déjà existant) pour formater l'annonce (Titre SEO, description attractive, mots-clés liés aux 12 catégories comme `Téléphones & Multimédia` ou `Véhicules & Transport`).
   * Insère les requêtes dans `publication_jobs`.

3. **Cron Job Next.js (`app/api/cron/publish/route.ts`)** :
   * S'exécute toutes les 15 minutes.
   * Prend les jobs `pending` et utilise les clés API de Facebook (Pages API) et Telegram (Bot API) pour diffuser le contenu.
   * Ajoute systématiquement le numéro officiel de Wanteermako **+221 77 682 78 51** pour l'assistance dans la signature.
   * Marque le job comme `published`.

---

## 2. La Machine à Prospects (Phase 2)
Trouver des vendeurs de manière chirurgicale, particulièrement pour vos catégories phares (Immobilier, Téléphones, Véhicules).

### Architecture Technique
Nous avons déjà une table `prospects` (créée dans `database/MIGRATION_B2B.sql`). Nous allons l'enrichir pour cette stratégie.

1. **Intégration d'Apify** :
   * Un bouton dans votre tableau de bord `components/SuperAdminApp.tsx` déclenchera Apify.
   * L'Actor Apify scrape Google Maps ou Facebook (ex: "Boutique téléphone Plateau Dakar").
   * Les données tombent dans la route API (`app/api/admin/import-prospects/route.ts`).

2. **Qualification par Gemini** :
   * Lors de l'import, Gemini analyse le prospect et lui attribue un score de pertinence, et génère **l'accroche WhatsApp**.

3. **Prospection Semi-Automatisée (Dans le Dashboard CRM)** :
   * Au lieu d'envoyer en masse et d'être banni, votre CRM (dans Wanteermako) aura un bouton **"Contacter WhatsApp"** sur chaque prospect.
   * Ce bouton générera le lien ciblant le numéro du prospect, pré-rempli par Gemini :
     `https://wa.me/NUMERO_DU_PROSPECT?text=Bonjour...`
   * Ce message l'invitera à créer sa "Boutique PRO" sur Wanteermako ou à contacter votre support au **+221 77 682 78 51** s'il a besoin d'assistance.

---

## 3. Fidélisation et Upsell avec Brevo (Phase 3)
Garder les vendeurs engagés et les pousser vers les abonnements de Boutique PRO (ex: "Standard Boutique" à 5 000 FCFA / mois) ou les boosts (ex: Boost "Premium" à 3 500 FCFA).

1. **Emails Transactionnels (`lib/brevo.ts`)** :
   * **Bienvenue** : Lorsqu'un utilisateur s'inscrit, il reçoit un email l'invitant à finaliser son profil.
   * **Annonce expirée** : Votre base de données passe désormais les annonces en expiration après 30 jours (grâce au fichier `MIGRATION_EXPIRATION_ANNONCES.sql`). Brevo envoie un email : *"Votre annonce a expiré sur Wanteermako, renouvelez-la ou passez PRO"*.
   
2. **Statistiques Vendeurs** :
   * Une route Cron hebdomadaire (`app/api/cron/seller-reports/route.ts`) calcule les vues générées (colonne `views` dans `listings`) et envoie un récapitulatif via Brevo : *"Votre annonce a été vue 240 fois ! Mettez la 'À la une' pour 7500 FCFA et doublez vos contacts."*

---

## 4. Configuration et Sécurité (Checklist)

Voici les variables d'environnement réelles à sécuriser dans votre `.env.local` et sur l'interface Vercel :

```env
# CRON & SECURITE
CRON_SECRET=votre_super_mot_de_passe_aleatoire

# INTELLIGENCE ARTIFICIELLE
GEMINI_API_KEY=votre_cle_google_ai

# RESEAUX SOCIAUX WANTEERMAKO
META_ACCESS_TOKEN=jeton_longue_duree
META_PAGE_ID_MAIN=id_page_wanteermako
TELEGRAM_BOT_TOKEN=token_botfather
TELEGRAM_CHANNEL_ID=@wanteermako  # ou votre ID numérique

# CONTACT WANTEERMAKO
WHATSAPP_NUMBER=221776827851

# PROSPECTION ET EMAILING
APIFY_TOKEN=cle_apify
BREVO_API_KEY=cle_brevo_v3
```

> **Attention** : Vos routes Cron DOIVENT valider le header `Authorization: Bearer CRON_SECRET` avant de s'exécuter pour empêcher un petit malin d'appeler l'URL `wanteermako.com/api/cron/publish` en boucle.

---

## 5. Exécution Pratique (Semaine par Semaine)

**Semaine 1 : Le Coeur du Système (Diffusion FB & Telegram)**
* Créer la table `publication_jobs`.
* Créer la route `prepare-publications` (Gemini).
* Créer la route `publish` (Facebook / Telegram).
* *Résultat* : Dès qu'un vendeur publie sur Wanteermako, c'est sur votre Telegram 15min plus tard.

**Semaine 2 : Prospection Intelligente**
* Ajouter les colonnes "score" et "accroche_whatsapp" à la table `prospects`.
* Créer le script d'import Apify -> Gemini -> Supabase.
* *Résultat* : Vous avez 50 vendeurs qualifiés (Sénégal, Côte d'Ivoire, Mali...) à contacter par jour en 1 clic via WhatsApp.

**Semaine 3 : Relances Brevo**
* Mettre en place l'API Brevo dans Next.js.
* Créer les templates d'emails avec le branding Wanteermako.
* *Résultat* : Les vendeurs inactifs sont relancés, les vendeurs actifs achètent des boosts Premium et VIP.
