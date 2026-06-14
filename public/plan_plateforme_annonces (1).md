# 🏗️ Plan complet — Plateforme de petites annonces (type Leboncoin)

> Document de référence pour la conception, le développement et le lancement.  
> À mettre à jour au fil de l'avancement du projet.

---

## Statut du projet

| Élément | Statut | Notes |
|---|---|---|
| Document créé | ✅ Fait | — |
| Architecture définie | 🔄 En cours | — |
| Module boutiques ajouté | ✅ Fait | 2026-06-14 |
| MVP lancé | ⬜ À faire | — |
| Beta ouverte | ⬜ À faire | — |
| Lancement public | ⬜ À faire | — |

---

## Table des matières

1. [Vision & positionnement](#1-vision--positionnement)
2. [Utilisateurs cibles](#2-utilisateurs-cibles)
3. [Architecture technique](#3-architecture-technique)
4. [Base de données](#4-base-de-données)
5. [Fonctionnalités — MVP](#5-fonctionnalités--mvp)
6. [Fonctionnalités — Post-MVP](#6-fonctionnalités--post-mvp)
7. [**Module Boutiques**](#7-module-boutiques) ⭐ Nouveau
8. [Design & UX](#8-design--ux)
9. [Modération & confiance](#9-modération--confiance)
10. [Monétisation](#10-monétisation)
11. [SEO & acquisition](#11-seo--acquisition)
12. [Infrastructure & déploiement](#12-infrastructure--déploiement)
13. [Sécurité](#13-sécurité)
14. [Roadmap & jalons](#14-roadmap--jalons)
15. [KPIs à suivre](#15-kpis-à-suivre)
16. [Ressources & outils](#16-ressources--outils)

---

## 1. Vision & positionnement

### Proposition de valeur

> _En une phrase : ce que ta plateforme fait mieux ou différemment._

```
[ À compléter : ex. "La première plateforme d'annonces locales pour [niche/région/cible]" ]
```

### Différenciation vs Leboncoin

| Axe | Leboncoin | Ta plateforme |
|---|---|---|
| Marché géographique | France | [ À définir ] |
| Niche | Généraliste | [ Ex : Sénégal, mode, électronique… ] |
| Langue | Français | [ À définir ] |
| Points forts | Masse critique, notoriété | [ À définir ] |

---

## 2. Utilisateurs cibles

### Personas

#### Persona 1 — Particulier vendeur
- **Profil** : Individu souhaitant vendre un objet d'occasion
- **Besoin** : Déposer une annonce en moins de 3 minutes, être contacté rapidement
- **Frustrations** : Formulaires longs, photos difficiles à uploader, pas de réponse
- **Canaux** : Mobile (prioritaire), partage WhatsApp/Facebook

#### Persona 2 — Particulier acheteur
- **Profil** : Cherche à acheter à prix réduit ou trouver un service local
- **Besoin** : Recherche rapide, filtres pertinents, contact sécurisé
- **Frustrations** : Annonces expirées, arnaques, prix non négociés
- **Canaux** : Google, mobile

#### Persona 3 — Professionnel / Commerçant
- **Profil** : Boutique, garage, agence immobilière
- **Besoin** : Visibilité régulière, gestion multi-annonces, statistiques
- **Frustrations** : Coût trop élevé, peu de résultats mesurables
- **Canaux** : Desktop, email

---

## 3. Architecture technique

### Stack recommandée

```
Frontend       → React.js (Next.js pour le SSR/SEO)
Backend        → Node.js (Express) OU Laravel (PHP) OU Django (Python)
Base de données → PostgreSQL (données) + Elasticsearch (recherche)
Cache           → Redis
Stockage images → AWS S3 ou Cloudinary
CDN             → Cloudflare
Auth            → JWT + OAuth (Google, Facebook)
Paiement        → Stripe OU Wave/Orange Money (selon région)
Emails          → SendGrid ou Resend
Notifications   → Firebase Cloud Messaging (mobile)
```

### Schéma des couches

```
┌─────────────────────────────────────────────┐
│              UTILISATEURS                   │
│    Navigateur Web    Application Mobile     │
└───────────────┬─────────────────────────────┘
                │ HTTPS
┌───────────────▼─────────────────────────────┐
│              FRONTEND (Next.js)             │
│  Pages SSR · Composants React · Tailwind    │
└───────────────┬─────────────────────────────┘
                │ API REST / GraphQL
┌───────────────▼─────────────────────────────┐
│              API BACKEND                    │
│  Auth · Annonces · Messagerie · Paiement    │
└───┬───────┬──────────┬──────────────────────┘
    │       │          │
┌───▼──┐ ┌──▼────┐ ┌───▼──────────────────────┐
│ PG   │ │ Redis │ │ Elasticsearch             │
│ SQL  │ │ Cache │ │ Moteur de recherche       │
└───┬──┘ └───────┘ └──────────────────────────┘
    │
┌───▼───────────────────────────────────────┐
│  S3 / Cloudinary — Stockage images        │
└───────────────────────────────────────────┘
```

---

## 4. Base de données

### Tables principales (PostgreSQL)

#### `users`
```sql
id            UUID PRIMARY KEY
email         VARCHAR UNIQUE NOT NULL
password_hash VARCHAR
nom           VARCHAR
prenom        VARCHAR
telephone     VARCHAR
avatar_url    VARCHAR
role          ENUM('particulier', 'pro', 'admin')
is_verified   BOOLEAN DEFAULT false
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

#### `categories`
```sql
id          UUID PRIMARY KEY
nom         VARCHAR NOT NULL
slug        VARCHAR UNIQUE
parent_id   UUID REFERENCES categories(id)  -- sous-catégories
icone       VARCHAR
ordre       INT
```

#### `annonces`
```sql
id            UUID PRIMARY KEY
titre         VARCHAR(100) NOT NULL
description   TEXT NOT NULL
prix          DECIMAL(10,2)
type_prix     ENUM('fixe', 'negociable', 'gratuit', 'echange')
categorie_id  UUID REFERENCES categories(id)
user_id       UUID REFERENCES users(id)
ville         VARCHAR
latitude      DECIMAL(10,7)
longitude     DECIMAL(10,7)
statut        ENUM('active', 'expirée', 'vendue', 'supprimée', 'en_attente')
is_urgent     BOOLEAN DEFAULT false
is_pro        BOOLEAN DEFAULT false
vues          INT DEFAULT 0
expires_at    TIMESTAMP
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

#### `photos`
```sql
id          UUID PRIMARY KEY
annonce_id  UUID REFERENCES annonces(id)
url         VARCHAR NOT NULL
ordre       INT
is_cover    BOOLEAN DEFAULT false
created_at  TIMESTAMP
```

#### `messages`
```sql
id           UUID PRIMARY KEY
annonce_id   UUID REFERENCES annonces(id)
expediteur   UUID REFERENCES users(id)
destinataire UUID REFERENCES users(id)
contenu      TEXT NOT NULL
lu           BOOLEAN DEFAULT false
created_at   TIMESTAMP
```

#### `transactions`
```sql
id              UUID PRIMARY KEY
annonce_id      UUID REFERENCES annonces(id)
acheteur_id     UUID REFERENCES users(id)
vendeur_id      UUID REFERENCES users(id)
montant         DECIMAL(10,2)
commission      DECIMAL(10,2)
statut          ENUM('en_attente', 'payé', 'livré', 'remboursé', 'litige')
provider_ref    VARCHAR  -- référence Stripe / Wave
created_at      TIMESTAMP
```

#### `favoris`
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id)
annonce_id  UUID REFERENCES annonces(id)
created_at  TIMESTAMP
UNIQUE(user_id, annonce_id)
```

#### `signalements`
```sql
id          UUID PRIMARY KEY
annonce_id  UUID REFERENCES annonces(id)
user_id     UUID REFERENCES users(id)
motif       ENUM('arnaque', 'interdit', 'doublon', 'prix_abusif', 'autre')
detail      TEXT
statut      ENUM('ouvert', 'traité', 'rejeté')
created_at  TIMESTAMP
```

#### `options_payantes`
```sql
id           UUID PRIMARY KEY
annonce_id   UUID REFERENCES annonces(id)
user_id      UUID REFERENCES users(id)
type_option  ENUM('boost', 'urgente', 'mise_en_avant', 'premium')
prix_paye    DECIMAL(10,2)
debut        TIMESTAMP
fin          TIMESTAMP
active       BOOLEAN DEFAULT true
```

#### `avis`
```sql
id           UUID PRIMARY KEY
evaluateur   UUID REFERENCES users(id)
evalue       UUID REFERENCES users(id)
annonce_id   UUID REFERENCES annonces(id)
note         INT CHECK(note BETWEEN 1 AND 5)
commentaire  TEXT
created_at   TIMESTAMP
```

---

## 5. Fonctionnalités — MVP

### 5.1 Authentification

- [ ] Inscription email/mot de passe
- [ ] Connexion
- [ ] Confirmation email (lien de vérification)
- [ ] Mot de passe oublié / réinitialisation
- [ ] Connexion OAuth Google (optionnel MVP)
- [ ] Profil utilisateur (nom, photo, téléphone)

### 5.2 Dépôt d'annonce

- [x] Formulaire multi-étapes :
  - Étape 1 : Catégorie (arbre de catégories)
  - Étape 2 : Détails (titre, description, prix)
  - Étape 3 : Photos (upload multiple, drag & drop, recadrage)
  - Étape 4 : Localisation (ville ou carte)
  - Étape 5 : Coordonnées & publication
- [x] Sauvegarde brouillon automatique
- [x] Prévisualisation avant publication
- [ ] Limite de photos (ex : 8 photos max)
- [ ] Validation côté serveur (titre min 10 chars, description min 30)

### 5.3 Recherche & navigation

- [x] Barre de recherche full-text (Elasticsearch / local fuzzy)
- [x] Filtres :
  - Catégorie & sous-catégorie
  - Prix min / max
  - Localisation (rayon en km)
  - Date de publication
  - Type d'annonceur (particulier / pro)
- [x] Tri : pertinence, prix croissant/décroissant, date
- [x] Pagination ou scroll infini
- [ ] URL de recherche shareable (`/annonces?q=vélo&ville=Dakar&prix_max=50000`)

### 5.4 Page annonce

- [x] Galerie photos (carousel, plein écran)
- [x] Infos vendeur (nom, note, membre depuis)
- [x] Bouton "Contacter" → messagerie interne
- [x] Bouton "Ajouter aux favoris"
- [x] Bouton "Signaler"
- [x] Annonces similaires (même catégorie / zone)
- [x] Compteur de vues
- [x] Partage réseaux sociaux & WhatsApp

### 5.5 Messagerie

- [ ] Fil de conversation par annonce
- [ ] Notifications en temps réel (WebSocket)
- [ ] Notifications email si non connecté
- [ ] Masquage du numéro de téléphone (contact via plateforme uniquement)
- [ ] Indicateur "lu / non lu"

### 5.6 Espace utilisateur (Mon compte)

- [x] Mes annonces (actives, expirées, vendues)
- [x] Modifier / supprimer une annonce
- [ ] Marquer comme vendu
- [x] Mes favoris
- [x] Mes messages
- [x] Historique des transactions

### 5.7 Administration (Back-office)

- [x] Dashboard : stats clés (annonces, utilisateurs, signalements)
- [x] Gestion des annonces (approuver, rejeter, supprimer)
- [x] Gestion des utilisateurs (bannir, vérifier)
- [ ] Gestion des catégories
- [x] Traitement des signalements
- [x] Logs d'activité

---

## 6. Fonctionnalités — Post-MVP

### 6.1 Paiement sécurisé
- [ ] Intégration Stripe (cartes) + Wave / Orange Money (mobile money)
- [ ] Système d'escrow : fonds retenus jusqu'à confirmation réception
- [ ] Commission automatique prélevée (ex : 3–5%)
- [ ] Tableau de versements vendeur
- [ ] Gestion des litiges / remboursements

### 6.2 Abonnement professionnel
- [ ] Plans Pro (ex : 10 annonces simultanées, statistiques, badge Pro)
- [ ] Facturation mensuelle / annuelle
- [ ] Portail de gestion pour les pros
- [ ] Statistiques annonces (vues, contacts, taux de conversion)

### 6.3 Options payantes (boosts)
- [ ] "Remonter en tête" (annonce repositionnée en haut)
- [ ] "Annonce urgente" (badge rouge)
- [ ] "Mise en avant homepage" (carrousel accueil)
- [ ] Paiement à l'unité ou pack

### 6.4 Alertes & recommandations
- [ ] Alerte email/SMS sur recherche sauvegardée
- [ ] Recommandations personnalisées (basées sur historique)
- [ ] Notifications push mobile

### 6.5 Avis & réputation
- [ ] Système de notation vendeur (1–5 étoiles) après transaction
- [ ] Badge "Vendeur de confiance" (note > 4.5 + X transactions)
- [ ] Vérification identité (pièce d'identité)

### 6.6 Application mobile
- [ ] React Native ou Flutter (Android + iOS)
- [ ] Notifications push
- [ ] Accès caméra pour photos directes
- [ ] Géolocalisation automatique

### 6.7 Publicité (régie)
- [ ] Emplacements publicitaires (bannières, natif)
- [ ] Intégration Google AdSense ou régie propre
- [ ] Ciblage par catégorie et localisation

---

## 7. Module Boutiques

> Les boutiques permettent à un vendeur professionnel ou semi-pro d'avoir **sa propre vitrine** au sein de la plateforme — avec logo, description, catalogue, avis et abonnement dédié.

---

### 7.1 Concept & différenciation

| Annonce simple | Boutique |
|---|---|
| Un seul produit | Catalogue complet |
| Pas de page dédiée | Page boutique personnalisée |
| Gratuit | Abonnement mensuel |
| Pas de stats | Dashboard vendeur avec analytics |
| Aucune identité visuelle | Logo, bannière, couleur, nom de marque |

---

### 7.2 Types de boutiques

```
Boutique Starter   → gratuite, limitée (5 produits, pas de personnalisation)
Boutique Standard  → payante, 50 produits, logo + bannière, stats basiques
Boutique Pro       → payante, illimitée, toutes fonctionnalités + badge vérifié
Boutique Premium   → payante, mise en avant homepage, API stock, support prioritaire
```

---

### 7.3 Base de données — tables boutiques

#### `boutiques`
```sql
id               UUID PRIMARY KEY
user_id          UUID REFERENCES users(id)
nom              VARCHAR(80) NOT NULL
slug             VARCHAR UNIQUE NOT NULL
description      TEXT
logo_url         VARCHAR
banniere_url     VARCHAR
couleur_theme    VARCHAR(7)
telephone        VARCHAR
whatsapp         VARCHAR
email_contact    VARCHAR
adresse          VARCHAR
ville            VARCHAR
latitude         DECIMAL(10,7)
longitude        DECIMAL(10,7)
site_web         VARCHAR
plan             ENUM('starter','standard','pro','premium')
is_verified      BOOLEAN DEFAULT false
is_active        BOOLEAN DEFAULT true
note_moyenne     DECIMAL(3,2)
total_avis       INT DEFAULT 0
total_ventes     INT DEFAULT 0
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

#### `produits`
```sql
id               UUID PRIMARY KEY
boutique_id      UUID REFERENCES boutiques(id)
titre            VARCHAR(100) NOT NULL
description      TEXT NOT NULL
prix             DECIMAL(10,2) NOT NULL
prix_promo       DECIMAL(10,2)
stock            INT DEFAULT 0
is_disponible    BOOLEAN DEFAULT true
is_en_vedette    BOOLEAN DEFAULT false
slug             VARCHAR UNIQUE
vues             INT DEFAULT 0
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

#### `produit_photos`
```sql
id          UUID PRIMARY KEY
produit_id  UUID REFERENCES produits(id)
url         VARCHAR NOT NULL
ordre       INT
is_cover    BOOLEAN DEFAULT false
```

#### `commandes`
```sql
id               UUID PRIMARY KEY
boutique_id      UUID REFERENCES boutiques(id)
acheteur_id      UUID REFERENCES users(id)
statut           ENUM('en_attente','confirmée','expédiée','livrée','annulée','remboursée')
montant_total    DECIMAL(10,2)
frais_livraison  DECIMAL(10,2)
adresse_livraison TEXT
mode_livraison   ENUM('livraison','retrait','expedition')
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

#### `commande_produits`
```sql
id            UUID PRIMARY KEY
commande_id   UUID REFERENCES commandes(id)
produit_id    UUID REFERENCES produits(id)
quantite      INT NOT NULL
prix_unitaire DECIMAL(10,2) NOT NULL
```

#### `avis_boutique`
```sql
id           UUID PRIMARY KEY
boutique_id  UUID REFERENCES boutiques(id)
user_id      UUID REFERENCES users(id)
commande_id  UUID REFERENCES commandes(id)
note         INT CHECK(note BETWEEN 1 AND 5)
commentaire  TEXT
reponse      TEXT
created_at   TIMESTAMP
```

#### `boutique_followers`
```sql
id           UUID PRIMARY KEY
boutique_id  UUID REFERENCES boutiques(id)
user_id      UUID REFERENCES users(id)
created_at   TIMESTAMP
UNIQUE(boutique_id, user_id)
```

#### `boutique_horaires`
```sql
id           UUID PRIMARY KEY
boutique_id  UUID REFERENCES boutiques(id)
jour         ENUM('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche')
heure_ouv    TIME
heure_ferm   TIME
est_ferme    BOOLEAN DEFAULT false
```

---

### 7.4 Fonctionnalités — Page boutique publique

- [ ] URL personnalisée : `/boutique/[slug]`
- [ ] Header : logo, bannière, nom, description, badge vérifié
- [ ] Infos contact : téléphone, WhatsApp, adresse, carte
- [ ] Horaires d'ouverture avec statut ouvert/fermé en temps réel
- [ ] Catalogue produits filtrable par catégorie
- [ ] Page produit détaillée (photos, description, stock)
- [ ] Bouton "Suivre la boutique"
- [ ] Note moyenne + avis clients avec réponses vendeur
- [ ] Bouton WhatsApp direct
- [ ] Partage boutique (lien, réseaux sociaux)

---

### 7.5 Fonctionnalités — Dashboard vendeur

- [ ] Vue d'ensemble : ventes, vues, followers, chiffre du mois
- [ ] Gestion catalogue (ajouter / modifier / supprimer produits)
- [ ] Gestion commandes (confirmer, expédier, marquer livré)
- [ ] Gestion des avis (répondre aux avis clients)
- [ ] Statistiques :
  - Produits les plus vus
  - Taux de conversion vues → commandes
  - Revenus par semaine / mois
  - Nouveaux followers
- [ ] Paramètres boutique (logo, bannière, infos, horaires)
- [ ] Notifications (nouvelle commande, nouvel avis, nouveau follower)

---

### 7.6 Fonctionnalités — Acheteur

- [ ] Annuaire boutiques `/boutiques` (filtres : ville, catégorie, note)
- [ ] Suivre une boutique → alertes nouvelles arrivées
- [ ] Panier multi-produits d'une même boutique
- [ ] Choix livraison / retrait en boutique
- [ ] Paiement Wave / Orange Money / carte
- [ ] Historique commandes dans Mon Compte
- [ ] Laisser un avis après livraison confirmée

---

### 7.7 Flux de commande

```
Acheteur ajoute au panier
        │
        ▼
Choix mode : Livraison ou Retrait
        │
        ▼
     Paiement (Wave / Orange Money / Carte)
        │
        ▼
Commande créée → notification vendeur
        │
        ▼
Vendeur confirme → notification acheteur
        │
        ▼
Expédition / Retrait effectué
        │
        ▼
Acheteur confirme réception
        │
        ▼
Fonds débloqués au vendeur (escrow)
        │
        ▼
Invitation à laisser un avis
```

---

### 7.8 Intégration avec les annonces existantes

- Une boutique peut aussi poster des **annonces classiques** (liées à son profil)
- Une annonce affiche un **badge boutique** avec lien vers la page boutique
- La recherche globale remonte les annonces ET les produits boutique
- Un vendeur avec boutique a un profil enrichi dans ses annonces

---

### 7.9 Monétisation boutiques

| Plan | Prix | Produits | Fonctionnalités |
|---|---|---|---|
| Starter | Gratuit | 5 | Page basique, sans personnalisation |
| Standard | 9 900 FCFA/mois | 50 | Logo, bannière, stats basiques |
| Pro | 19 900 FCFA/mois | Illimité | Tout + badge vérifié, réponse avis |
| Premium | 39 900 FCFA/mois | Illimité | Tout + mise en avant, support, API |

Revenus additionnels :
- Commission sur commandes : 3–5% par vente
- Mise en avant produit en homepage : 2 500 FCFA / 7 jours
- Pack "Boutique du mois" : 15 000 FCFA

---

### 7.10 Pages à créer — Boutiques

| Page | URL | Priorité |
|---|---|---|
| Annuaire boutiques | `/boutiques` | 🔴 Critique |
| Page boutique | `/boutique/[slug]` | 🔴 Critique |
| Page produit | `/boutique/[slug]/[produit-slug]` | 🔴 Critique |
| Créer ma boutique | `/creer-boutique` | 🔴 Critique |
| Dashboard vendeur | `/dashboard/boutique` | 🔴 Critique |
| Gestion catalogue | `/dashboard/produits` | 🔴 Critique |
| Gestion commandes | `/dashboard/commandes` | 🟡 Important |
| Statistiques | `/dashboard/stats` | 🟡 Important |
| Paramètres boutique | `/dashboard/parametres` | 🟡 Important |
| Panier | `/panier` | 🔴 Critique |
| Suivi commande | `/commandes/[id]` | 🟡 Important |

---

### 7.11 Composants UI spécifiques boutiques

- `BoutiqueCard` — carte annuaire : logo, nom, ville, note, nb produits
- `ProduitCard` — grille catalogue : photo, titre, prix barré/promo, stock
- `CartDrawer` — panier latéral glissant
- `CommandeTimeline` — statut commande étape par étape
- `DashboardWidget` — blocs stats (ventes, vues, followers)
- `AvisCard` — avis avec réponse vendeur
- `HorairesWidget` — affichage ouvert/fermé en temps réel

---

## 8. Design & UX

### Principes de design

- **Mobile first** — 70%+ du trafic vient du mobile
- **Vitesse** — LCP < 2.5s, TTI < 3s (Core Web Vitals)
- **Confiance** — Photos nettes, profils vérifiés visibles, pas de spam
- **Simplicité** — Déposer une annonce en moins de 3 minutes

### Palette de couleurs

```
Primaire    → #E8593C  (orange-rouge, dynamique)
Secondaire  → #1A1A2E  (bleu nuit, sérieux)
Accent      → #F5A623  (ambre, appel à l'action)
Fond        → #F8F8F6  (blanc cassé, doux)
Texte       → #2D2D2D  (quasi-noir)
Succès      → #2ECC71
Erreur      → #E74C3C
Bordures    → #E0DED8
```

### Typographie

```
Display (titres annonces) → Inter 700 ou Space Grotesk 700
Body (descriptions)       → Inter 400, 16px, line-height 1.7
Labels / captions         → Inter 500, 12px
```

### Pages à concevoir

| Page | Priorité | Notes |
|---|---|---|
| Homepage | 🔴 Critique | Hero recherche, catégories, annonces récentes |
| Liste résultats | 🔴 Critique | Grille / liste, filtres sidebar |
| Détail annonce | 🔴 Critique | Photos, description, vendeur, CTA |
| Dépôt annonce | 🔴 Critique | Wizard multi-étapes |
| Login / Register | 🔴 Critique | Simple, OAuth |
| Mon compte | 🟡 Important | Mes annonces, messages, favoris |
| Messagerie | 🟡 Important | Style chat moderne |
| Admin dashboard | 🟡 Important | Vue tableau de bord |
| Page profil vendeur | 🟢 Secondaire | Avis, annonces actives |
| CGU / Mentions légales | 🟢 Secondaire | Obligatoire légalement |

### Composants clés

- Carte annonce (`AnnonceCard`) : photo, titre, prix, ville, badge Pro/Urgent
- Barre de recherche avec auto-complétion
- Carrousel photos plein écran
- Widget messagerie (drawer)
- Badge de confiance vendeur
- Filtres collapsibles mobile

---

## 9. Modération & confiance

### Règles d'annonces

- Objets/services interdits : armes, drogues, contenu sexuel, animaux protégés, médicaments sans prescription
- Titre : 10–100 caractères
- Description : 30–3000 caractères
- Prix : obligatoire sauf "Gratuit" ou "Échange"
- Photos : minimum 1, maximum 8

### Flux de modération

```
Annonce déposée
      │
      ▼
Modération automatique (IA)
  - Détection mots interdits
  - Vérification images (nudité, violence)
  - Score de risque
      │
  ┌───▼────────────────┐
  │ Score < 0.3        │ → Publication immédiate
  │ Score 0.3–0.7      │ → File de modération humaine
  │ Score > 0.7        │ → Rejet automatique + notification
  └────────────────────┘
```

### Anti-fraude

- [ ] Limite d'annonces par compte (ex : 10/jour pour particulier)
- [ ] Vérification téléphone (SMS OTP) avant première annonce
- [ ] Détection IP / device fingerprinting
- [ ] Blocage des liens externes dans les messages
- [ ] Signalement rapide (3 signalements → examen automatique)
- [ ] Liste noire emails/téléphones bannis

### Confiance utilisateur

- [ ] Badge "Profil vérifié" (email + téléphone confirmés)
- [ ] Badge "Vendeur pro" (abonné)
- [ ] Historique de ventes visible
- [ ] Avis après transaction sécurisée
- [ ] Politique de remboursement claire

---

## 10. Monétisation

### Sources de revenus

| Source | Modèle | Montant estimé | Priorité |
|---|---|---|---|
| Options payantes (boost) | À l'acte | 500–2000 FCFA/boost | MVP |
| Abonnement Pro | Mensuel | 5 000–25 000 FCFA/mois | Post-MVP |
| Commission paiement sécurisé | % transaction | 3–5% | Post-MVP |
| Publicité display | CPM/CPC | Variable | Post-MVP |

### Tarifs suggérés (à adapter au marché local)

```
Option "Remonter en tête"     → 500 FCFA (7 jours)
Option "Annonce urgente"      → 1 000 FCFA (7 jours)
Option "Mise en avant"        → 2 500 FCFA (7 jours)
Pack 5 boosts                 → 3 500 FCFA
---
Abonnement Pro Starter        → 9 900 FCFA/mois (20 annonces)
Abonnement Pro Business       → 24 900 FCFA/mois (illimité + stats)
---
Commission paiement sécurisé  → 4% (acheteur ou vendeur)
```

---

## 11. SEO & acquisition

### Structure des URLs

```
/                           → Homepage
/annonces                   → Toutes les annonces
/annonces/[slug-categorie]  → Ex : /annonces/immobilier
/annonces/[slug-categorie]/[slug-ville]  → /annonces/immobilier/dakar
/annonce/[id]-[slug-titre]  → /annonce/a7b3-velo-tout-terrain
/profil/[username]          → Profil vendeur
/deposer-annonce            → Formulaire
```

### Optimisations SEO

- [ ] SSR / SSG avec Next.js (pages indexables)
- [ ] `<title>` et `<meta description>` dynamiques par annonce
- [ ] Schema.org `Product` et `LocalBusiness`
- [ ] Sitemap XML automatique
- [ ] Robots.txt
- [ ] Breadcrumbs structurés
- [ ] Pages catégorie optimisées (H1 = "Annonces [catégorie] à [ville]")
- [ ] Open Graph pour partage réseaux sociaux
- [ ] Core Web Vitals : LCP < 2.5s, CLS < 0.1, FID < 100ms

### Acquisition

| Canal | Actions | Coût |
|---|---|---|
| SEO organique | Contenu catégories, blog | Faible |
| Réseaux sociaux | Facebook, Instagram, TikTok | Faible |
| WhatsApp | Partage d'annonces | Gratuit |
| Bouche à oreille | Programme de parrainage | Faible |
| Partenariats | Associations, médias locaux | Moyen |
| Publicité payante | Meta Ads, Google Ads | Variable |

---

## 12. Infrastructure & déploiement

### Environnements

```
local         → développement local (Docker Compose)
staging       → test (sous-domaine staging.tonsite.com)
production    → prod (tonsite.com)
```

### Architecture de déploiement

```
DNS Cloudflare
      │
  CDN / WAF
      │
Load Balancer
  ┌───┴───┐
App1     App2       (2 instances minimum en prod)
  └───┬───┘
      │
PostgreSQL (RDS ou Supabase)
Redis (ElastiCache ou Upstash)
Elasticsearch (OpenSearch AWS ou Elastic Cloud)
S3 (images)
```

### Services recommandés

| Besoin | Service | Alternative |
|---|---|---|
| Hébergement app | Railway / Render | AWS, Fly.io |
| Base de données | Supabase | PlanetScale, Neon |
| Elasticsearch | Elastic Cloud | OpenSearch (AWS) |
| Images | Cloudinary | AWS S3 |
| Emails | Resend | SendGrid |
| DNS / CDN | Cloudflare | — |
| Monitoring | Sentry + Datadog | Logtail |
| CI/CD | GitHub Actions | GitLab CI |

### Checklist déploiement

- [ ] Variables d'environnement sécurisées (jamais dans le code)
- [ ] HTTPS obligatoire
- [ ] Backups PostgreSQL quotidiens
- [ ] Monitoring uptime (Uptime Robot ou Betterstack)
- [ ] Alertes erreurs (Sentry)
- [ ] Logs centralisés
- [ ] Rate limiting API (100 req/min/IP)

---

## 13. Sécurité

### Authentification & autorisation

- [ ] Mots de passe hashés avec bcrypt (salt rounds ≥ 12)
- [ ] JWT avec expiration courte (15min) + refresh token
- [ ] Blacklist tokens révoqués (Redis)
- [ ] Limite de tentatives de connexion (5 essais → blocage 15min)
- [ ] 2FA optionnel (TOTP)

### Sécurité API

- [ ] Validation et sanitisation de tous les inputs (Zod, Joi…)
- [ ] Protection CSRF
- [x] Headers HTTP sécurisés (Helmet.js / next.config.js)
- [ ] Rate limiting (express-rate-limit ou équivalent)
- [ ] Aucune donnée sensible dans les logs
- [ ] SQL Injection → ORM uniquement (Prisma, Sequelize)
- [ ] XSS → sanitisation HTML côté backend

### Données personnelles (RGPD / protection données)

- [ ] Politique de confidentialité claire
- [ ] Consentement cookies
- [ ] Droit à l'effacement (suppression compte + données)
- [ ] Ne jamais stocker les numéros de carte en clair
- [ ] Chiffrement données sensibles au repos

---

## 14. Roadmap & jalons

### Phase 1 — Fondations (Semaines 1–4)

- [ ] Setup projet (repo Git, CI/CD, environnements)
- [ ] Base de données + migrations
- [ ] API Auth (inscription, connexion, JWT)
- [ ] API Annonces (CRUD de base)
- [ ] Upload photos (Cloudinary)
- [ ] Frontend : Layout, navigation, homepage

### Phase 2 — MVP complet (Semaines 5–8)

- [ ] Recherche full-text (Elasticsearch)
- [ ] Filtres et tri
- [ ] Page détail annonce
- [ ] Messagerie (WebSocket)
- [ ] Favoris & signalements
- [ ] Espace Mon compte
- [ ] Administration basique
- [ ] Modération manuelle

### Phase 3 — Beta publique (Semaines 9–12)

- [ ] Tests utilisateurs (20+ bêta-testeurs)
- [ ] Corrections de bugs
- [ ] Optimisations performance (LCP, images)
- [ ] SEO (sitemap, meta, schema)
- [ ] Mentions légales, CGU, politique de confidentialité
- [ ] Onboarding utilisateur (emails de bienvenue)

### Phase 4 — Monétisation (Mois 4–6)

- [ ] Intégration paiement (Stripe / Wave)
- [ ] Options payantes (boost)
- [ ] Abonnement Pro
- [ ] Commission paiement sécurisé
- [ ] Dashboard statistiques Pro

### Phase 5 — Croissance (Mois 6+)

- [ ] Application mobile (React Native)
- [ ] Programme de parrainage
- [ ] Régie publicitaire
- [ ] Recommandations ML
- [ ] Nouvelles catégories / régions
- [ ] API publique pour partenaires

---

## 15. KPIs à suivre

### Acquisition

| Métrique | Cible M3 | Cible M6 |
|---|---|---|
| Visiteurs uniques/mois | 5 000 | 25 000 |
| Comptes créés | 500 | 3 000 |
| Taux de conversion visiteur → inscription | 5% | 8% |

### Engagement

| Métrique | Cible M3 | Cible M6 |
|---|---|---|
| Annonces actives | 1 000 | 8 000 |
| Annonces déposées/jour | 50 | 300 |
| Messages envoyés/jour | 200 | 1 500 |
| Taux de retour (D30) | 20% | 35% |

### Monétisation

| Métrique | Cible M4 | Cible M6 |
|---|---|---|
| Revenu mensuel (MRR) | 50 000 FCFA | 300 000 FCFA |
| Boosts achetés/mois | 50 | 300 |
| Abonnés Pro | 5 | 30 |

### Qualité

| Métrique | Objectif |
|---|---|
| Uptime | > 99.5% |
| Temps de réponse API | < 300ms (p95) |
| LCP homepage | < 2.5s |
| Annonces signalées / total | < 2% |
| NPS utilisateurs | > 40 |

---

## 16. Ressources & outils

### Développement

- **Framework** : [Next.js](https://nextjs.org/) — [Docs](https://nextjs.org/docs)
- **ORM** : [Prisma](https://www.prisma.io/) — gestion base de données
- **Validation** : [Zod](https://zod.dev/)
- **UI** : [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Upload images** : [Cloudinary](https://cloudinary.com/)
- **Recherche** : [Elasticsearch](https://www.elastic.co/) ou [Meilisearch](https://www.meilisearch.com/) (plus simple à démarrer)
- **Temps réel** : [Socket.io](https://socket.io/)
- **Paiement** : [Stripe](https://stripe.com/) / [Wave](https://www.wave.com/)

### Design

- **Maquettes** : Figma
- **Icônes** : [Lucide](https://lucide.dev/) ou [Tabler Icons](https://tabler.io/icons)
- **Polices** : [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
- **Images placeholder** : [Unsplash](https://unsplash.com/)

### Gestion de projet

- **Kanban** : Notion, Trello ou Linear
- **Versioning** : GitHub / GitLab
- **Communication équipe** : Slack ou WhatsApp

### Légal (à consulter)

- CGU (Conditions Générales d'Utilisation)
- Politique de confidentialité (données personnelles)
- Mentions légales obligatoires
- Conditions de vente pour le paiement sécurisé

---

## Journal des mises à jour

| Date | Auteur | Modification |
|---|---|---|
| 2026-06-14 | — | Création du document |
| 2026-06-14 | — | Ajout module Boutiques complet (section 7) — BDD, flux commande, dashboard, monétisation, pages, composants |
| 2026-06-14 | Antigravity | Mise à jour de l'implémentation UI/UX, tableau de bord, système de recherche, et sécurisation PWA |

---

*Document vivant — à mettre à jour à chaque étape du projet.*
