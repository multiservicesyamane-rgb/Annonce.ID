# Annonce.ID

Plateforme de petites annonces **premium** pour l'Afrique de l'Ouest (27 pays).
Design ultra-premium (néon + gradients sur fond sombre pour le hero, fond clair pour les listings), mobile-first, **contact direct WhatsApp/Appel/Message — sans panier**.

> Construit avec **Next.js 14 (App Router) + TailwindCSS + Supabase**.

---

## ✨ Fonctionnalités

- 🏠 **Accueil** : hero néon animé, À la Une, Premium, catégories, annonces récentes filtrables, zones pub
- 📄 **Page annonce plein écran** `/annonce/[id]/[slug]` (URL propre, SEO, schema.org) — **jamais une modale**
- 🔍 **Recherche moderne** : autocomplétion live, recherches récentes (localStorage), tendances, filtres
- 🗂 **Listing / catégorie** : filtres (pays, prix, premium), tri, carte sponsorisée tous les 8 résultats
- ➕ **Wizard de publication** : 5 étapes, **champs dynamiques par catégorie**
- 🔐 **Auth téléphone + OTP** : code **démo `1234`** affiché à l'écran (prod : Africa's Talking)
- 📊 **Dashboard vendeur** : 9 sections (vue d'ensemble, annonces, messages, favoris, stats, paiements, profil, sécurité)
- 💳 **Paiement mobile money** : Orange Money, Wave, MTN, Moov + carte (CinetPay)
- 🛡️ **Admin `/yamanetech`** : 9+ panneaux (modération, utilisateurs, pubs, finances, pays, signalements, réglages)
- 🌍 **27 pays** : sélecteur **en bas de page** (footer)
- 📢 **10 zones publicitaires** annonceurs (A1–A10), gérables en admin

---

## 🚀 Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre **http://localhost:3000** (ou **3001** si le 3000 est occupé).

> L'app fonctionne **immédiatement en mode démo** avec des données fictives réalistes (`lib/data.ts`), même sans Supabase configuré.

### Identifiants de démo

| Accès | Identifiants |
|-------|--------------|
| OTP connexion | code **`1234`** |
| Admin `/yamanetech/super-admin` | Definir `ADMIN_PASSWORD` dans les variables d'environnement serveur |

---

## 🔌 Configuration (production)

Copie `.env.example` en `.env.local` et remplis les valeurs. Le projet Supabase est déjà pré-câblé dans `.env.local`.

### 1. Base de données Supabase

Dans **Supabase > SQL Editor**, exécute dans l'ordre :

1. `supabase/migrations/0001_init.sql` — tables, index, RLS
2. `supabase/migrations/0002_seed.sql` — 27 pays + 12 catégories

Ou avec la CLI Supabase :

```bash
supabase link --project-ref kbcljnfsyzqkcrkjoedm
supabase db push
```

Une fois les tables remplies, remplace les lectures `lib/data.ts` par des requêtes Supabase
(les clients sont prêts : `lib/supabase/client.ts` et `lib/supabase/server.ts`).
Tant que les variables Supabase sont absentes, l'app reste en mode démo.

### 2. SMS OTP — Africa's Talking

- Crée un compte sur [africastalking.com](https://africastalking.com)
- Renseigne `AFRICASTALKING_API_KEY` et `AFRICASTALKING_USERNAME`
- La logique est dans `app/api/otp/route.ts` (TODO marqués). Sans clé → code démo `1234`.

### 3. Paiement — CinetPay

- Compte sur [cinetpay.com](https://cinetpay.com) (couvre tout le mobile money Afrique de l'Ouest)
- Renseigne `CINETPAY_API_KEY` et `CINETPAY_SITE_ID`
- Branche l'appel API + webhook signé dans `components/PaymentFlow.tsx` / une route `app/api/payment`.

### 4. Images — Supabase Storage ou Cloudinary

Crée un bucket public `listings` dans Supabase Storage, ou utilise Cloudinary
(`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, etc.). Domaines déjà autorisés dans `next.config.js`.

---

## 🗂 Structure

```
app/
  page.tsx                      Accueil
  annonce/[id]/[slug]/page.tsx  Page annonce plein écran (SEO + schema.org)
  categorie/[slug]/page.tsx     Listing par catégorie
  recherche/page.tsx            Résultats de recherche
  publier/page.tsx              Wizard 5 étapes
  connexion/ inscription/       Auth OTP
  dashboard/page.tsx            Espace vendeur
  paiement/page.tsx             Mobile money
  yamanetech/page.tsx           Admin (route non indexée)
  boutique/[vendeur]/page.tsx   Boutique vendeur Pro
  aide/ securite/ cgu/          Pages statiques
  api/otp/route.ts              OTP (démo 1234 / Africa's Talking)
  sitemap.ts  robots.ts         SEO
components/                     Header, Footer, SearchBar, AdCard, Gallery, wizard, dashboard, admin…
lib/
  constants.ts                  27 pays, 12 catégories + champs dynamiques, boosts, paiements
  data.ts                       Données de démo (à remplacer par Supabase)
  supabase/                     Clients browser + server
  utils.ts  types.ts
supabase/migrations/            Schéma SQL + seed
tailwind.config.ts              Tokens de design (couleurs néon, gradients, animations)
```

---

## 🔒 Sécurité (à faire avant la mise en production)

- **Admin** : remplacer les identifiants démo par un hash bcrypt en base, activer une vraie 2FA (TOTP),
  restreindre via `role = 'admin'` + RLS, journaliser dans `admin_logs`. **Ne jamais committer ces identifiants.**
- **OTP** : rate limit (5/15 min), expiration 5 min, code aléatoire stocké dans `otp_codes`.
- **RLS** activé sur les tables sensibles (voir migration). Affiner selon les besoins.
- **Numéros de téléphone** masqués dans les annonces, révélés au clic.
- **Paiements** : agrégateur certifié PCI-DSS, webhooks signés, aucune donnée carte stockée.
- **Captcha invisible** (Cloudflare Turnstile) sur publication et inscription.

---

## 📦 Déploiement (Vercel)

```bash
npm run build
```

Push sur GitHub → importe le repo dans **Vercel** → ajoute les variables d'environnement
(`.env.local`) dans les *Project Settings* → déploie. Mets à jour `NEXT_PUBLIC_APP_URL`.

---

*Annonce.ID by YamaneTech — v1.0*
