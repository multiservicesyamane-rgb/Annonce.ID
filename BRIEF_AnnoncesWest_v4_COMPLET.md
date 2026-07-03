# 🔍 DIAGNOSTIC COMPLET & PLAN D'ÉVOLUTION — AnnoncesWest
### Audit de la version actuelle + feuille de route pour atteindre le niveau des grandes plateformes mondiales

> **À l'agent :** Cette section d'audit précède le brief technique. Elle liste tous les manquements identifiés et les standards des leaders mondiaux (Jiji, OLX, Avito, Leboncoin, Facebook Marketplace, Dubizzle) à atteindre. Implémente ces améliorations EN PLUS du brief qui suit.

---

> **✅ ÉTAT DE LA DÉMO HTML (AnnoncesWest_v4.html) :** Les fonctionnalités suivantes du diagnostic sont DÉJÀ implémentées dans la démo et servent de référence visuelle : **chat in-app temps réel** (bulles, réponse auto, mobile/desktop), **vue carte interactive** (pins de prix cliquables), **boutique vendeur Pro** (bannière, stats, catalogue), **centre de notifications** (cloche header), **« Vus récemment »**, **skeleton loaders**, **modales de confirmation** (suppression annonce/compte), **partage natif Web Share API**, **fallback images dégradés par catégorie**, **compteurs animés**, **apparition au scroll**, **mode sombre 🌙 (toggle header)**, **comparateur d'annonces (jusqu'à 3, tableau côte à côte)**, **suggestion de prix IA dans le wizard (fourchette par catégorie + alerte)**, **recherches sauvegardées avec alerte (🔖)**, **états vides avec CTA (favoris)**. L'agent doit les reproduire en production avec de vraies données + WebSocket.

## 1. AUDIT : CE QUI MANQUE OU EST MAL GÉRÉ

### 1.1 Pages — manquements identifiés
| Page | Manquement actuel | À corriger |
|------|-------------------|-----------|
| **Accueil** | Pas de personnalisation, pas de géolocalisation auto, pas de section « vues récemment » | Feed personnalisé, détection ville auto, historique de navigation |
| **Annonce** | Pas de chat en temps réel, pas de signalement détaillé, pas d'annonces du même vendeur | Chat live, modal signalement multi-motifs, carrousel « autres annonces du vendeur » |
| **Listing** | Pas de carte interactive, pas de sauvegarde de recherche, pas d'alertes | Vue carte (map), recherches sauvegardées + alertes email/push |
| **Recherche** | Autocomplétion basique, pas de correction orthographique | Recherche floue (fuzzy), « vouliez-vous dire… », filtres par attribut dynamique |
| **Wizard** | Pas de sauvegarde brouillon, pas de détection doublon | Auto-save brouillon, détection annonce similaire, suggestion de prix IA |
| **Dashboard** | Stats limitées, pas d'export, pas de réponses rapides | Export CSV/PDF, réponses messages préenregistrées, comparaison de performance |
| **Auth** | OTP seulement, pas de biométrie | Ajout email/password optionnel, WebAuthn, Google/Apple login |
| **Paiement** | Pas de portefeuille, pas de facturation | Wallet interne, historique factures PDF, abonnements récurrents |
| **Admin** | Pas de logs détaillés, pas d'analytics temps réel | Dashboard temps réel, logs d'audit, A/B testing, gestion équipe admin |

### 1.2 Actions & interactions — mal gérées
- ❌ **Pas de feedback de chargement** → Ajouter skeleton loaders partout
- ❌ **Pas de gestion d'erreur visible** → Toasts d'erreur, retry automatique
- ❌ **Pas d'états vides** (empty states) → Illustrations + CTA quand 0 résultat
- ❌ **Pas de confirmation avant action destructive** → Modales de confirmation
- ❌ **Pas de pagination infinie fluide** → Infinite scroll + bouton « charger plus »
- ❌ **Favoris non persistants** → Sauvegarde réelle (localStorage démo / DB prod)
- ❌ **Pas de partage natif** → Web Share API sur mobile
- ❌ **Pas de mode hors-ligne** → PWA avec service worker, cache
- ❌ **Pas de notifications** → Push web + centre de notifications in-app
- ❌ **Pas de comparateur** → Comparer plusieurs annonces côte à côte

### 1.3 Design — à rendre plus attractif (niveau mondial)
| Élément | Standard mondial | Action |
|---------|------------------|--------|
| **Cartes** | Ombres douces, hover fluide, ratio image cohérent (Jiji/OLX) | Élévation au survol, transition image, badges colorés |
| **Couleurs** | Palette cohérente, accents vifs maîtrisés (Leboncoin orange, OLX violet) | Système néon hybride déjà défini — appliquer partout |
| **Typographie** | Hiérarchie claire, gros titres (Airbnb) | Titres plus grands, line-height généreux |
| **Espacement** | Air, respiration (Apple, Airbnb) | Padding section augmenté, grille aérée |
| **Micro-animations** | Transitions de page, reveal scroll (Facebook MP) | Fade-up au scroll, compteurs animés, skeleton |
| **Images** | Toujours un visuel, jamais de vide | Fallback dégradé coloré par catégorie + emoji |
| **Confiance** | Badges, notes, vérifications visibles (Dubizzle) | Badges vérifié/pro, système d'avis étoilé partout |
| **Dark mode** | Optionnel mais apprécié | Toggle clair/sombre |

### 1.4 Fonctionnalités des leaders mondiaux à ajouter
**Inspirées de Jiji, OLX, Avito, Leboncoin, Facebook Marketplace, Dubizzle :**

1. **Chat intégré temps réel** (WebSocket) — messagerie acheteur/vendeur in-app
2. **Recherches sauvegardées + alertes** — notif quand nouvelle annonce correspond
3. **Vue carte** — annonces géolocalisées sur une carte interactive
4. **Boutiques vendeurs Pro** — vitrine personnalisée avec logo, bannière, catalogue
5. **Système d'avis & réputation** — notes vendeur/acheteur après transaction
6. **Livraison intégrée** (optionnel) — partenariat logistique pour envoi
7. **Paiement sécurisé / séquestre** (escrow) — option « paiement protégé »
8. **Vérification d'identité** — badge « ID vérifiée » via pièce + selfie
9. **Annonces vidéo** — ajout de courtes vidéos en plus des photos
10. **Suggestion de prix IA** — fourchette de prix recommandée par catégorie
11. **Comparateur** — comparer 2-4 annonces
12. **Historique « vu récemment »** — reprendre la navigation
13. **Wishlist / collections** — organiser ses favoris en listes
14. **Programme de parrainage** — inviter des amis, gagner des boosts
15. **Multi-langue** — FR/EN/Wolof/Arabe selon le pays
16. **PWA installable** — app mobile sans store
17. **Mode hors-ligne** — consulter ses favoris sans connexion
18. **Statistiques avancées vendeur** — heatmap des vues, démographie
19. **Promotions/Codes promo** — système de réductions sur les boosts
20. **Modération IA** — détection auto arnaques, contenus interdits, prix anormaux

---

## 2. ROADMAP — ÉVOLUTION SUR LES PROCHAINS MOIS

> Plan pour rendre la plateforme progressivement plus puissante.

### Mois 1 — Fondations solides (MVP renforcé)
- Toutes les pages du brief technique (voir ci-dessous)
- Système de fallback images, skeleton loaders, états vides
- Chat in-app basique, favoris persistants, recherches sauvegardées
- PWA installable

### Mois 2 — Confiance & engagement
- Système d'avis & réputation complet
- Vérification d'identité (badge ID)
- Boutiques vendeurs Pro
- Vue carte interactive
- Notifications push

### Mois 3 — Monétisation avancée
- Wallet interne + facturation PDF
- Abonnements Pro récurrents
- Codes promo & programme parrainage
- Régie publicitaire self-service pour annonceurs (les 10 zones)
- Suggestion de prix IA

### Mois 4 — Différenciation
- Annonces vidéo
- Paiement séquestre (escrow) optionnel
- Livraison intégrée (partenaires)
- Multi-langue (EN, Wolof, Arabe)
- Comparateur d'annonces

### Mois 5-6 — Scale & intelligence
- Modération IA (anti-arnaque)
- Recommandations personnalisées (ML)
- Analytics temps réel admin
- A/B testing
- API publique pour partenaires
- Application mobile native (React Native / Flutter) si besoin

---

## 3. STANDARDS TECHNIQUES DE NIVEAU MONDIAL

- **Performance** : Lighthouse > 95, LCP < 2s, images WebP/AVIF, CDN edge
- **Temps réel** : WebSocket (chat, notifs), optimistic UI
- **Recherche** : Elasticsearch / Algolia / Meilisearch (fuzzy, facettes, typo-tolerance)
- **Scalabilité** : architecture modulaire, cache Redis, queue (jobs async)
- **Observabilité** : Sentry (erreurs), analytics (Plausible/PostHog)
- **Tests** : unitaires + E2E (Playwright), CI/CD
- **Accessibilité** : WCAG 2.1 AA complet
- **Sécurité** : voir section dédiée du brief + rate limiting, WAF, audit régulier

---

*Diagnostic réalisé pour AnnoncesWest v4 · Suivi du brief technique complet ci-dessous*

---
---

# 🚀 AnnoncesWest — Brief Technique Complet pour Agent IA
### Plateforme de Petites Annonces Premium · Afrique de l'Ouest
**Document de construction destiné à un agent de développement autonome (Antigravity / Claude Agent)**
**Version 3.0 · Brief exhaustif · À implémenter intégralement**

---

> **⚡ INSTRUCTION À L'AGENT :** Ce document est ton cahier des charges complet. Construis une plateforme web **production-ready**, responsive mobile-first, au design **ultra-premium** (néon + gradients sur fond sombre pour le hero, fond clair pour les listings). Respecte chaque section. Ne saute aucune fonctionnalité. À la fin, livre un code propre, commenté, modulaire. Stack recommandée : **Next.js 14 (App Router) + TailwindCSS + Supabase (auth + DB + storage)** OU une stack équivalente que tu maîtrises. Si tu fais une démo statique d'abord, tout doit être un **site multi-pages réel** (pas de modales pour les pages principales).

---

## 📋 TABLE DES MATIÈRES

1. [Audit des erreurs à corriger](#1-audit-des-erreurs-à-corriger)
2. [Vision & Positionnement](#2-vision--positionnement)
3. [Les 25+ pays couverts](#3-les-25-pays-couverts)
4. [Système de Design Ultra-Premium](#4-système-de-design-ultra-premium)
5. [Architecture complète des pages](#5-architecture-complète-des-pages)
6. [Page d'accueil](#6-page-daccueil)
7. [Zone de recherche moderne](#7-zone-de-recherche-moderne)
8. [Page Listing / Catégorie](#8-page-listing--catégorie)
9. [Page Annonce — PLEIN ÉCRAN](#9-page-annonce--plein-écran)
10. [Wizard de publication](#10-wizard-de-publication)
11. [Dashboard vendeur](#11-dashboard-vendeur)
12. [Authentification & OTP](#12-authentification--otp)
13. [Paiement Mobile Money](#13-paiement-mobile-money)
14. [Espace Administrateur /yamanetech](#14-espace-administrateur-yamanetech)
15. [Zones stratégiques pour annonceurs](#15-zones-stratégiques-pour-annonceurs)
16. [Base de données (schéma)](#16-base-de-données-schéma)
17. [Sécurité](#17-sécurité)
18. [SEO & Performance](#18-seo--performance)
19. [Checklist de livraison](#19-checklist-de-livraison)

---

## 1. AUDIT DES ERREURS À CORRIGER

Voici les défauts identifiés dans la version précédente. **L'agent doit tous les corriger.**

### 1.1 ❌ Page annonce en modale → ✅ Page plein écran
**Problème :** La page de détail d'une annonce s'ouvrait dans une fenêtre modale (popup).
**Correction :** Chaque annonce doit avoir sa **propre URL et sa propre page complète** (`/annonce/[id]/[slug]`), comme Jumia, OLX, Expat-Dakar. La page occupe tout l'écran, est partageable, indexable par Google, avec galerie photo grand format, panneau contact sticky, description, caractéristiques, carte, annonces similaires en bas.

### 1.2 ❌ Présence implicite d'un panier → ✅ Aucun panier
**Problème :** Le modèle e-commerce avec panier n'est pas adapté.
**Correction :** **PAS DE PANIER.** C'est une plateforme de mise en relation. Le bouton principal est **« Contacter le vendeur »** (WhatsApp / Appel / Message). L'acheteur et le vendeur traitent directement entre eux. Aucun checkout produit, aucun ajout au panier.

### 1.3 ❌ OTP SMS non reçu → ✅ Code démo + vraie intégration documentée
**Problème :** Aucun SMS n'arrivait (normal en démo statique).
**Correction démo :** Afficher un **code fixe `1234`** visible à l'écran avec mention « Code démo : 1234 ».
**Correction production :** Intégrer un vrai fournisseur SMS adapté à l'Afrique de l'Ouest : **Twilio**, **Orange SMS API**, ou **Africa's Talking** (recommandé, couvre toute l'Afrique de l'Ouest). Webhook + table `otp_codes` (code, phone, expires_at, used).

### 1.4 ❌ Trop peu de pays → ✅ 25+ pays
Voir [section 3](#3-les-25-pays-couverts). Le sélecteur de pays ne doit **pas prendre de place en haut** : le déplacer **en bas de page** (footer) ou dans un menu déroulant discret.

### 1.5 ❌ Zone de recherche basique → ✅ Recherche moderne et complète
Voir [section 7](#7-zone-de-recherche-moderne). Recherche avec autocomplétion, suggestions, filtres rapides, géolocalisation, recherches récentes.

### 1.6 ❌ Design plat → ✅ Ultra-premium néon + gradients
Voir [section 4](#4-système-de-design-ultra-premium). Effets néon, gradients animés, glassmorphism, ombres colorées, micro-interactions, transitions fluides.

### 1.7 ❌ Pas d'espace admin → ✅ /yamanetech
Voir [section 14](#14-espace-administrateur-yamanetech). Tableau de bord administrateur complet avec identifiants fournis.

### 1.8 ❌ Pas de zones stratégiques annonceurs → ✅ Emplacements pub définis
Voir [section 15](#15-zones-stratégiques-pour-annonceurs).

---

## 2. VISION & POSITIONNEMENT

### 2.1 Mission
AnnoncesWest est **la** plateforme de petites annonces de référence pour l'Afrique de l'Ouest et l'Afrique francophone, pensée mobile-first, avec contact direct (WhatsApp/Appel), paiement mobile money natif, et un design qui inspire confiance et modernité.

### 2.2 Modèle économique (sources de revenus)
1. **Boost d'annonces** : Premium (3 500 FCFA), À la Une (9 000 FCFA), Pack Pro (15 000 FCFA)
2. **Abonnements vendeurs Pro** : forfaits mensuels (annonces illimitées, badge Pro, boutique)
3. **Espaces publicitaires** : bannières pour annonceurs tiers (voir section 15)
4. **Mise en avant catégorielle** : top de catégorie payant
5. **Services premium** : vérification d'identité payante, statistiques avancées

### 2.3 Persona cible
- **Vendeur particulier** : vend un objet/véhicule/bien occasionnellement
- **Vendeur Pro** : concessionnaire, agence immobilière, boutique
- **Acheteur** : cherche un bien, contacte directement, mobile à 85%
- **Annonceur** : marque qui veut de la visibilité (banques, télécoms, e-commerce)

### 2.4 Benchmarks
Jumia (cartes produit, galerie), Expat-Dakar (annonces locales, page détail), OLX/Jiji (filtres, confiance vendeur), LeBonCoin (simplicité), Coinafrique (Afrique de l'Ouest).

---

## 3. LES 25+ PAYS COUVERTS

> **Affichage :** Le sélecteur de pays NE doit PAS occuper le haut de page. Le placer **en bas (footer)** sous forme de grille discrète, OU dans un petit menu déroulant avec drapeau dans le header. La devise s'adapte au pays (FCFA pour la zone UEMOA/CEMAC, autres devises sinon).

### Afrique de l'Ouest (priorité)
| # | Pays | Code | Indicatif | Capitale | Devise |
|---|------|------|-----------|----------|--------|
| 1 | Sénégal | SN | +221 | Dakar | FCFA (XOF) |
| 2 | Côte d'Ivoire | CI | +225 | Abidjan | FCFA (XOF) |
| 3 | Mali | ML | +223 | Bamako | FCFA (XOF) |
| 4 | Bénin | BJ | +229 | Cotonou | FCFA (XOF) |
| 5 | Burkina Faso | BF | +226 | Ouagadougou | FCFA (XOF) |
| 6 | Togo | TG | +228 | Lomé | FCFA (XOF) |
| 7 | Niger | NE | +227 | Niamey | FCFA (XOF) |
| 8 | Guinée | GN | +224 | Conakry | GNF |
| 9 | Guinée-Bissau | GW | +245 | Bissau | FCFA (XOF) |
| 10 | Ghana | GH | +233 | Accra | GHS |
| 11 | Nigéria | NG | +234 | Abuja | NGN |
| 12 | Sierra Leone | SL | +232 | Freetown | SLL |
| 13 | Liberia | LR | +231 | Monrovia | LRD |
| 14 | Gambie | GM | +220 | Banjul | GMD |
| 15 | Cap-Vert | CV | +238 | Praia | CVE |
| 16 | Mauritanie | MR | +222 | Nouakchott | MRU |

### Afrique Centrale & autres (extension)
| # | Pays | Code | Indicatif | Capitale | Devise |
|---|------|------|-----------|----------|--------|
| 17 | Cameroun | CM | +237 | Yaoundé | FCFA (XAF) |
| 18 | Gabon | GA | +241 | Libreville | FCFA (XAF) |
| 19 | Congo | CG | +242 | Brazzaville | FCFA (XAF) |
| 20 | RD Congo | CD | +243 | Kinshasa | CDF |
| 21 | Tchad | TD | +235 | N'Djaména | FCFA (XAF) |
| 22 | Centrafrique | CF | +236 | Bangui | FCFA (XAF) |
| 23 | Guinée Équatoriale | GQ | +240 | Malabo | FCFA (XAF) |
| 24 | Maroc | MA | +212 | Rabat | MAD |
| 25 | Algérie | DZ | +213 | Alger | DZD |
| 26 | Tunisie | TN | +216 | Tunis | TND |
| 27 | Madagascar | MG | +261 | Antananarivo | MGA |

**Total : 27 pays.** Le système doit être extensible facilement (table `countries` en base).

---

## 4. SYSTÈME DE DESIGN ULTRA-PREMIUM

### 4.1 Philosophie visuelle
**Hybride :** Hero et sections phares sur **fond sombre avec néons et gradients animés**. Listings et contenus sur **fond clair** pour la lisibilité. L'identité visuelle mêle l'or africain, le vert profond, et des accents néon (cyan/magenta) pour la modernité.

### 4.2 Palette de couleurs
```css
/* === FOND SOMBRE (hero, header premium, admin) === */
--dark-900:    #0A0E14;   /* fond le plus sombre */
--dark-800:    #111722;   /* cartes sombres */
--dark-700:    #1A2231;   /* surfaces élevées */
--dark-border: #243044;   /* bordures sur sombre */

/* === FOND CLAIR (listings, formulaires) === */
--light-bg:    #FAFAF8;   /* fond clair principal */
--white:       #FFFFFF;
--gray-50:     #F4F4F2;
--gray-100:    #E8E8E4;
--gray-500:    #7C7C78;
--gray-900:    #141412;

/* === COULEURS DE MARQUE === */
--gold:        #F5A623;   /* or africain — accent principal */
--gold-light:  #FFD166;
--green:       #1B4332;   /* vert forêt */
--green-mid:   #2D6A4F;

/* === NÉONS (accents premium) === */
--neon-gold:   #FFC93C;   /* néon doré */
--neon-cyan:   #2DE2E6;   /* néon cyan */
--neon-magenta:#FF2A6D;   /* néon magenta/rose */
--neon-green:  #05FFA1;   /* néon vert */

/* === GRADIENTS === */
--grad-hero:   linear-gradient(135deg, #0A0E14 0%, #1A2231 50%, #1B4332 100%);
--grad-gold:   linear-gradient(135deg, #F5A623 0%, #FFD166 50%, #F5A623 100%);
--grad-neon:   linear-gradient(135deg, #FF2A6D 0%, #F5A623 50%, #2DE2E6 100%);
--grad-premium:linear-gradient(135deg, #FFC93C 0%, #FF8C42 100%);
--grad-mesh:   radial-gradient(at 20% 30%, rgba(245,166,35,.25) 0px, transparent 50%),
               radial-gradient(at 80% 20%, rgba(45,226,230,.18) 0px, transparent 50%),
               radial-gradient(at 60% 80%, rgba(255,42,109,.15) 0px, transparent 50%);
```

### 4.3 Effets néon (CSS à implémenter)
```css
/* Glow néon doré sur boutons premium */
.neon-gold {
  box-shadow: 0 0 5px rgba(255,201,60,.5),
              0 0 20px rgba(255,201,60,.3),
              0 0 40px rgba(255,201,60,.15);
}
/* Texte néon */
.neon-text {
  text-shadow: 0 0 8px rgba(255,201,60,.6), 0 0 20px rgba(255,201,60,.3);
}
/* Bordure néon animée (badge À la Une) */
@keyframes neon-pulse {
  0%,100% { box-shadow: 0 0 8px var(--neon-gold), 0 0 16px rgba(255,201,60,.4); }
  50%     { box-shadow: 0 0 16px var(--neon-gold), 0 0 32px rgba(255,201,60,.6); }
}
/* Gradient animé en mouvement */
@keyframes grad-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
.animated-gradient {
  background: var(--grad-neon);
  background-size: 200% 200%;
  animation: grad-shift 6s ease infinite;
}
```

### 4.4 Glassmorphism (cartes flottantes sur hero sombre)
```css
.glass {
  background: rgba(255,255,255,.06);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
}
```

### 4.5 Typographie
```
Display (H1/H2)  : "Sora" ou "Clash Display" — 800/700, néon sur titres hero
Body             : "Inter" — 400/500/600
Chiffres/Prix    : "Sora" 700 — gradient or sur les prix premium
Échelle :
  hero: clamp(2rem, 5vw, 4rem)   — avec text-shadow néon
  h1: 1.8rem / h2: 1.4rem / h3: 1.1rem
  body: 0.95rem / small: 0.8rem
```

### 4.6 Images en carré (comme Jumia)
Toutes les vignettes d'annonces : **ratio 1:1** (`aspect-ratio: 1/1; object-fit: cover`). Page détail : galerie 4:3 ou 16:10 grand format avec miniatures carrées dessous.

### 4.7 Micro-interactions obligatoires
- Hover cartes : élévation + glow doré subtil + scale image 1.04
- Boutons : ripple effect ou glow au survol
- Apparition au scroll : fade-in + translateY (Intersection Observer ou Framer Motion)
- Skeleton loaders pendant le chargement
- Transitions de page fluides
- Compteur animé sur les stats (250K+ qui s'incrémente)
- Badge « À la Une » : animation néon-pulse

### 4.8 Composants signature
- **Carte annonce premium** : bordure dégradée or animée, badge néon
- **Hero** : fond sombre + mesh gradient + particules ou formes flottantes + barre de recherche glassmorphism
- **Barre de recherche** : grande, avec icônes, autocomplétion (voir section 7)
- **Boutons WhatsApp** : vert #25D366 avec glow au hover

---

## 5. ARCHITECTURE COMPLÈTE DES PAGES

```
/                         → Accueil (hero sombre + listings clairs)
/recherche?q=...          → Résultats de recherche
/categorie/[slug]         → Listing par catégorie
/annonce/[id]/[slug]      → PAGE ANNONCE PLEIN ÉCRAN (pas modale)
/publier                  → Wizard de publication (5 étapes)
/connexion                → Auth (téléphone + OTP)
/inscription              → Création de compte
/paiement                 → Paiement boost (mobile money)
/dashboard                → Espace vendeur
  /dashboard/annonces     → Mes annonces
  /dashboard/messages     → Messagerie
  /dashboard/favoris      → Favoris
  /dashboard/stats        → Statistiques
  /dashboard/paiements    → Historique paiements
  /dashboard/profil       → Profil
  /dashboard/securite     → Sécurité
/boutique/[vendeur]       → Page profil/boutique vendeur Pro
/yamanetech               → ESPACE ADMIN (voir section 14)
/aide, /securite, /cgu    → Pages statiques
```

Toutes ces routes sont de **vraies pages** avec leur URL. Seuls les éléments réellement transitoires (confirmation, galerie fullscreen, menu mobile) peuvent être des overlays.

## 6. PAGE D'ACCUEIL

### 6.1 Structure verticale
```
┌─────────────────────────────────────────────┐
│ HEADER (sticky) — logo, recherche, actions    │  ← fond sombre translucide
├─────────────────────────────────────────────┤
│ HERO (fond sombre + mesh gradient + néon)     │
│   - Titre accrocheur néon                      │
│   - Grande barre de recherche glassmorphism    │
│   - Stats animées (250K+ annonces…)            │
│   - Catégories rapides en pilules              │
├─────────────────────────────────────────────┤
│ BANNIÈRE PUB (annonceur) — zone stratégique 1  │  ← voir section 15
├─────────────────────────────────────────────┤
│ ✦ ANNONCES À LA UNE (fond clair)               │
│   - 1 grande carte + grille (effet néon badge) │
├─────────────────────────────────────────────┤
│ 👑 ANNONCES PREMIUM (carrousel horizontal)     │
├─────────────────────────────────────────────┤
│ CATÉGORIES POPULAIRES (grille d'icônes)        │
├─────────────────────────────────────────────┤
│ BANNIÈRE PUB — zone stratégique 2              │
├─────────────────────────────────────────────┤
│ ANNONCES RÉCENTES (grille + filtres rapides)   │
├─────────────────────────────────────────────┤
│ POURQUOI ANNONCESWEST (3-4 atouts confiance)   │
├─────────────────────────────────────────────┤
│ CTA — Publier / Devenir Pro                    │  ← fond sombre néon
├─────────────────────────────────────────────┤
│ FOOTER (avec SÉLECTEUR 27 PAYS en bas)         │  ← fond sombre
└─────────────────────────────────────────────┘
+ Bottom nav mobile fixe (Accueil/Chercher/Publier/Messages/Compte)
```

### 6.2 Hero détaillé
- Fond `--grad-hero` + couche `--grad-mesh` + éventuellement particules/blobs animés
- Titre : « Le marché de **l'Afrique de l'Ouest** » avec « l'Afrique de l'Ouest » en néon doré
- Sous-titre court
- **Barre de recherche centrale** (voir section 7) en glassmorphism, large
- 4 stats avec compteurs animés : Annonces, Pays (27), Utilisateurs, Satisfaction
- Pilules de catégories rapides cliquables

### 6.3 Section À la Une
- Disposition : 1 grande carte (2 colonnes) + petites cartes
- Badge **« ✦ À la Une »** avec animation néon-pulse dorée
- Image carré/large, overlay gradient sombre en bas, prix en gradient or

---

## 7. ZONE DE RECHERCHE MODERNE

> **Exigence : recherche « plus plus moderne et complète ».** C'est un élément central.

### 7.1 Composants de la barre de recherche
```
┌──────────────────────────────────────────────────────────┐
│ [🔍]  Que recherchez-vous ?            [📁 Catégorie ▾] [📍 Ville ▾] [Chercher] │
└──────────────────────────────────────────────────────────┘
   ↓ (au focus, panneau déroulant)
   ┌────────────────────────────────────┐
   │ 🕐 Recherches récentes              │
   │   • iPhone 14 Dakar                 │
   │   • Villa Almadies                  │
   │ 🔥 Tendances                        │
   │   • Toyota Corolla • Terrain Saly   │
   │ 💡 Suggestions (autocomplétion live)│
   │   • iPhone 15 Pro Max (1 240)       │
   │   • iPhone 13 (890)                 │
   └────────────────────────────────────┘
```

### 7.2 Fonctionnalités requises
- **Autocomplétion en temps réel** (debounce 250ms) avec nombre de résultats par suggestion
- **Recherches récentes** (localStorage côté démo / table en prod)
- **Tendances / recherches populaires**
- **Filtre catégorie** déroulant (avec icônes)
- **Filtre localisation** : pays → ville → quartier (cascade), bouton « 📍 Autour de moi » (géolocalisation)
- **Recherche vocale** (icône micro, optionnel — Web Speech API)
- **Filtres rapides** sous la barre : Prix, État (Neuf/Occasion), Type (Vente/Location), Premium uniquement
- **Tri** : Pertinence, Plus récent, Prix ↑, Prix ↓, Plus de vues
- Sur mobile : barre compacte qui ouvre un panneau de recherche plein écran

### 7.3 Page résultats
- Affiche le terme recherché + nombre de résultats
- Chips de filtres actifs (retirables)
- Grille d'annonces + sidebar filtres (desktop) / drawer (mobile)
- Pagination ou scroll infini

---

## 8. PAGE LISTING / CATÉGORIE

### 8.1 Layout
- **Breadcrumb** : Accueil › Catégorie › Sous-catégorie › Ville
- **Sidebar filtres** (desktop, sticky) / **drawer** (mobile) :
  - Localisation (pays/ville/quartier cascade)
  - Sous-catégories (arborescence)
  - Prix (slider double min/max + saisie)
  - État, Type de transaction
  - Type vendeur (Particulier/Pro)
  - Premium uniquement (toggle)
  - Date de publication
- **Toolbar** : nombre de résultats, tri, bascule grille/liste
- **Grille d'annonces** : cartes carré 1:1, 2 cols mobile → 4-5 cols desktop
- **Pagination** ou scroll infini
- Cartes premium = bordure dégradée or animée + badge néon

### 8.2 Carte annonce (composant réutilisable)
```
┌──────────────────┐
│ [IMG CARRÉ 1:1]  │ ♡  ← favoris (toggle rouge)
│   badge ✦/🔥/Neuf │
├──────────────────┤
│ CATÉGORIE         │
│ Titre (2 lignes)  │
│ PRIX (gradient or)│
│ ────────────────  │
│ 📍 Ville  ·  Date │
└──────────────────┘
```

---

## 9. PAGE ANNONCE — PLEIN ÉCRAN

> **⚠️ CRUCIAL : Ceci est une PAGE COMPLÈTE avec son URL, PAS une modale.** URL : `/annonce/[id]/[slug]`. Style inspiré de Jumia/Expat-Dakar mais **sans panier**.

### 9.1 Layout desktop (2 colonnes)
```
[Breadcrumb : Accueil › Immobilier › Dakar › Villa F5 Almadies]

┌───────────────────────────────┬──────────────────────┐
│  GALERIE (60%)                 │  PANNEAU CONTACT (40%)│
│  ┌─────────────────────────┐   │  ┌─────────────────┐  │
│  │  Image principale grande │   │  │ ✦ PREMIUM ✅    │  │  ← badge néon
│  │  (4:3 ou 16:10)          │   │  │                 │  │
│  │  ‹ navigation ›  [3/8]   │   │  │ 280 000 000 FCFA│  │  ← prix gradient or
│  └─────────────────────────┘   │  │ ⟳ Négociable    │  │
│  [▫][▫][▫][▫][▫] miniatures    │  │                 │  │
│  carrées scrollables           │  │ [💬 WhatsApp]   │  │  ← glow vert
│                                │  │ [📞 Appeler]    │  │
│  ── DESCRIPTION ──             │  │ [✉ Message]     │  │
│  Texte complet…                │  │                 │  │
│                                │  │ ─ VENDEUR ─     │  │
│  ── CARACTÉRISTIQUES ──        │  │ [avatar] Moussa │  │
│  (tableau clé/valeur selon     │  │ ⭐4.8 ·127 ventes│  │
│   la catégorie)                │  │ ✅ Vérifié      │  │
│                                │  │ [Voir boutique] │  │
│  ── LOCALISATION (carte) ──    │  │                 │  │
│                                │  │ [🔗][❤][🚩]    │  │
└───────────────────────────────┴──────────────────────┘

── ANNONCES SIMILAIRES (carrousel) ──
── BANNIÈRE PUB (zone stratégique) ──
[FOOTER]
```

### 9.2 Mobile : empilé
Galerie en haut (swipe), puis prix + boutons contact, puis vendeur, description, caractéristiques, carte, similaires. **Barre contact sticky en bas** (WhatsApp + Appeler toujours visibles).

### 9.3 Éléments obligatoires
- Galerie : image principale grand format + miniatures carrées + **mode plein écran/zoom** au clic (lightbox, ce overlay est acceptable)
- Prix en gros, gradient or, mention négociable/fixe
- **3 boutons contact** : WhatsApp (vert glow), Appeler, Message interne
- **PAS de bouton « Ajouter au panier »** ni « Acheter »
- Bloc vendeur : avatar, note, nombre de ventes, badges (✅ Vérifié, PRO), lien boutique
- Compteurs : vues, favoris, date de publication
- Caractéristiques dynamiques selon catégorie (voir wizard section 10.3)
- Carte de localisation (Leaflet/Google Maps)
- Boutons : Partager (WhatsApp/Facebook/lien), Favori, Signaler
- Annonces similaires en bas
- Signaux de confiance : « Conseils de sécurité » (ne jamais payer d'avance, rencontrer en lieu public…)
- **SEO** : meta title, og:image, schema.org Product/Offer

---

## 10. WIZARD DE PUBLICATION

> Page `/publier`. 5 étapes. Formulaire **dynamique selon la catégorie**.

### 10.1 Étapes
```
[1 Catégorie] → [2 Détails] → [3 Photos] → [4 Contact] → [5 Visibilité/Boost]
                                                              ↓
                                                    [Paiement si boost]
                                                              ↓
                                                       [Confirmation]
```
Barre de progression visuelle (étapes faites = or, active = vert, à venir = gris).

### 10.2 Étape 1 — Catégorie & Localisation
- Grille de tuiles catégories (12) avec emoji/icône
- Sélection → sous-catégorie en cascade
- Pays (27) → Ville → Quartier
- **Adresse / zone précise** (champ requis pour la localisation sur carte)

### 10.3 Étape 2 — Détails (CHAMPS DYNAMIQUES PAR CATÉGORIE)

Champs communs : **Titre** (80 car max, compteur), **Description** (30-2000 car, compteur), **Prix** (+ type : fixe/négociable/gratuit/échange), **État** (Neuf/TBE/Bon/Correct).

Puis champs spécifiques injectés selon la catégorie :

| Catégorie | Champs spécifiques |
|-----------|-------------------|
| 🏠 Immobilier | Transaction, Surface m², Chambres, SDB, Meublé, Étage, Parking, Titre foncier |
| 🚗 Véhicules | Marque, Modèle, Année, Km, Carburant, Boîte, Couleur, Dédouané, Portes |
| 📱 Électronique | Marque, Modèle, Stockage, RAM, Couleur, Garantie, Facture |
| 👗 Mode & Beauté | Genre, Taille, Couleur, Matière, Marque |
| 💼 Emploi | Type contrat, Secteur, Expérience, Études, Salaire, Date limite |
| 🛋 Maison & Jardin | Type, Matière, Couleur, Dimensions, Livraison |
| 🍎 Alimentation | Type, Quantité, Unité de vente, Origine |
| 🔧 Services | Type, Disponibilité, Zone, Tarif, Expérience |
| 🐄 Animaux | Type, Âge, Sexe, Vacciné, Quantité |
| 🎓 Formation | Domaine, Niveau, Format, Durée, Certifiant |
| 🌿 Agriculture | Type, Superficie, Région, Bio, État |
| ⚽ Sport & Loisirs | Type, Marque, Taille, Couleur |

Structure recommandée : un objet/JSON `CATEGORIES` mappant chaque catégorie à ses champs (label, type, options). Le formulaire se régénère dynamiquement.

### 10.4 Étape 3 — Photos
- Upload **1 à 10 photos**, drag & drop + click
- **Recadrage carré 1:1** automatique ou manuel
- Prévisualisation grille, réorganisation par glisser (1ère = couverture)
- Suppression individuelle
- Compression côté client avant upload
- Conseils photo affichés

### 10.5 Étape 4 — Contact
- Téléphone/WhatsApp (avec indicatif pays auto)
- Modes de contact préférés (WhatsApp / Appel / Message) — cases à cocher
- Affichage numéro : en clair / masqué / WhatsApp uniquement

### 10.6 Étape 5 — Visibilité / Boost
| Option | Prix | Avantages |
|--------|------|-----------|
| Gratuit | 0 | 30 jours, position standard |
| ⭐ Premium | 3 500 FCFA | Top résultats, badge doré néon, 60 jours |
| 🏆 À la Une | 9 000 FCFA | Page d'accueil, grande bannière, 14 jours |
| 👑 Pack Pro | 15 000 FCFA | À la Une + Premium + partage réseaux, 30 jours |
- Récapitulatif de l'annonce (aperçu live)
- Si gratuit → publication immédiate. Si payant → redirection `/paiement`.

## 11. DASHBOARD VENDEUR

Route `/dashboard`. Layout : sidebar navigation (desktop) / tabs scrollables (mobile).

### 11.1 Sections
1. **Vue d'ensemble** : 4 KPIs (annonces actives, vues totales, messages, taux réponse) + graphique vues 14/30/90j + alertes (expirations, messages non lus, suggestion boost) + annonces récentes
2. **Mes annonces** : tableau (image, titre, catégorie, prix, vues, statut, expiration, actions). Statuts : 🟢 Active / 🟡 En attente / 🔴 Expirée / ⚫ Suspendue. Actions : Modifier, Renouveler, Booster, Voir, Supprimer. Filtres + tri.
3. **Messages** : liste conversations + fenêtre chat
4. **Favoris** : grille des annonces sauvegardées
5. **Statistiques** : vues détaillées, top annonces, sources de trafic, conversion
6. **Paiements** : historique + reçus PDF + plan actif
7. **Avis reçus** : note globale + répartition étoiles + liste avis
8. **Profil** : infos, photo, bio, préférences, langue
9. **Sécurité** : vérif téléphone, vérif identité, sessions actives, suppression compte

### 11.2 Vendeur Pro
- Badge PRO
- Page boutique publique `/boutique/[vendeur]`
- Annonces illimitées
- Statistiques avancées

---

## 12. AUTHENTIFICATION & OTP

### 12.1 Flux
```
Connexion : Téléphone → OTP SMS → Dashboard
Inscription : Nom + Téléphone + Pays/Ville → OTP SMS → Dashboard
```

### 12.2 OTP
- 4 cases séparées, focus auto, collage auto
- **DÉMO : code fixe `1234`** affiché à l'écran avec mention « 🔑 Code démo : 1234 » (puisque pas de serveur SMS)
- **PRODUCTION :** Africa's Talking / Twilio / Orange SMS API. Table `otp_codes` (phone, code, expires_at 5min, used bool, attempts). Rate limit 5/15min. Code à 4-6 chiffres aléatoire.
- Compte à rebours 5:00, bouton « Renvoyer »
- Connexion sociale Facebook (optionnel)

### 12.3 Sécurité auth
- JWT (access 15min + refresh 30j httpOnly cookie)
- Refresh rotation, blacklist déconnexion
- Téléphone unique par compte

---

## 13. PAIEMENT MOBILE MONEY

Route `/paiement`. **PAS de panier produit** — uniquement le paiement des boosts/abonnements.

### 13.1 Méthodes (adaptées au pays)
| Méthode | Pays | Frais |
|---------|------|-------|
| Orange Money | SN, CI, ML, BF, GN, CM | 0% |
| Wave | SN, CI | 0% |
| MTN MoMo | CI, BJ, GH, CM | 0% |
| Moov Money | BJ, BF, TG | 0% |
| Free Money | SN | 0% |
| Airtel Money | ML, NE | 0% |
| Carte bancaire | Tous | 1,5% |

### 13.2 Intégration recommandée
**CinetPay** (agrégateur Afrique de l'Ouest, couvre tous les mobile money + cartes, certifié PCI-DSS) OU **PayDunya** / **KkiaPay** / **FedaPay**. Stripe pour cartes internationales.

### 13.3 Flux
1. Récap commande (sticky) : annonce + boost choisi + total
2. Choix méthode (radio cards avec logos)
3. Mobile money : numéro → notification push opérateur → validation code secret
4. Carte : numéro (masque live), titulaire, expiration, CVV
5. **Confirmation animée** (check vert SVG) + référence + reçu PDF + partage WhatsApp

---

## 14. ESPACE ADMINISTRATEUR /yamanetech

> Route secrète `/yamanetech`. Tableau de bord d'administration complet.

### 14.1 ⚠️ Identifiants administrateur (DÉMO)
```
URL        : /yamanetech
Email      : admin@yamanetech.com
Mot de passe : variable serveur ADMIN_PASSWORD
Code 2FA (démo) : 1234
```
> **En production :** changer ces identifiants, stocker le hash bcrypt en base, activer une vraie 2FA (TOTP), restreindre par rôle (`role = 'admin'`), logger tous les accès admin. **Ne jamais committer ces identifiants dans un dépôt public.**

### 14.2 Fonctionnalités admin
1. **Tableau de bord global** : utilisateurs totaux, annonces actives, revenus du jour/mois, annonces en attente de modération, signalements
2. **Modération des annonces** : file d'attente, approuver/rejeter/suspendre, voir les signalements
3. **Gestion des utilisateurs** : liste, recherche, bannir, vérifier identité, passer Pro
4. **Gestion des catégories** : CRUD catégories et sous-catégories
5. **Gestion des pays** : activer/désactiver, devises, opérateurs mobile money
6. **Gestion des bannières publicitaires** : créer/planifier les pubs annonceurs (voir section 15)
7. **Paiements & revenus** : transactions, remboursements, statistiques financières, graphiques
8. **Boosts** : annonces À la Une / Premium actives, programmation
9. **Signalements** : annonces/utilisateurs signalés, traitement
10. **Paramètres plateforme** : tarifs des boosts, textes légaux, maintenance
11. **Statistiques avancées** : graphiques (inscriptions, annonces/jour, revenus, top catégories, top villes)
12. **Logs & audit** : journal des actions admin

### 14.3 Design admin
Fond sombre premium (`--dark-900`), accents néon, graphiques (Chart.js/Recharts), tableaux denses, sidebar de navigation. Sérieux et pro.

---

## 15. ZONES STRATÉGIQUES POUR ANNONCEURS

> Emplacements publicitaires monétisables pour les annonceurs (banques, télécoms, marques). Gérés depuis l'admin.

### 15.1 Emplacements (slots) à prévoir
| Slot | Emplacement | Format | Prix indicatif |
|------|-------------|--------|----------------|
| **A1 — Hero Banner** | Sous le hero accueil | Bannière large 1200×200 | Premium |
| **A2 — In-feed Home** | Entre À la Une et Premium | Native card | Élevé |
| **A3 — Sidebar Listing** | Colonne filtres (desktop) | Carré 300×250 | Moyen |
| **A4 — In-grid Listing** | Tous les 8 résultats | Carte sponsorisée | Moyen |
| **A5 — Page Annonce** | Sous le panneau contact | Carré 300×250 | Élevé |
| **A6 — Bas page annonce** | Avant footer | Bannière 728×90 | Moyen |
| **A7 — Footer Banner** | Au-dessus du footer | Bannière large | Faible |
| **A8 — Interstitiel** | Transition (optionnel, non intrusif) | Plein écran skippable | Premium |
| **A9 — Catégorie sponsor** | Bannière en tête de catégorie | Bannière | Moyen |
| **A10 — Notification push** | (avec consentement) | — | Premium |

### 15.2 Système de gestion
- Table `ad_banners` : titre, image, lien, slot, pays ciblés, catégories ciblées, date début/fin, impressions, clics, statut, annonceur
- Ciblage par pays, ville, catégorie
- Tracking impressions + clics (CTR)
- Rotation si plusieurs pubs sur un slot
- Mention discrète « Publicité » / « Sponsorisé »
- **Ne pas dégrader l'UX** : pubs intégrées proprement, jamais de popup agressif

### 15.3 Note de transparence
Les zones pub sont clairement identifiées comme telles. Les annonces sponsorisées dans les listings portent un label « Sponsorisé ».

---

## 16. BASE DE DONNÉES (SCHÉMA)

Schéma relationnel (PostgreSQL / Supabase). Tables principales :

```sql
users (id, phone UNIQUE, email, first_name, last_name, avatar_url,
       country_code, city, bio, is_pro, is_verified, role DEFAULT 'user',
       rating, sales_count, created_at)

otp_codes (id, phone, code, expires_at, used, attempts, created_at)

countries (code PK, name, dial_code, capital, currency, flag, is_active)

categories (id, parent_id, slug, name, icon, fields_schema JSONB, sort_order)

listings (id, user_id, category_id, title, slug, description, price,
          price_type, condition, country_code, city, district, address,
          lat, lng, attributes JSONB, status, boost_type, boost_expires_at,
          views, favorites_count, created_at, expires_at)

listing_images (id, listing_id, url, sort_order, is_cover)

favorites (id, user_id, listing_id, created_at)

messages (id, conversation_id, sender_id, receiver_id, listing_id,
          body, read, created_at)

reviews (id, listing_id, reviewer_id, seller_id, rating, comment, created_at)

payments (id, user_id, listing_id, amount, method, boost_type, status,
          provider_ref, created_at)

ad_banners (id, advertiser, title, image_url, link_url, slot,
            target_countries[], target_categories[], starts_at, ends_at,
            impressions, clicks, status)

reports (id, listing_id, reporter_id, reason, status, created_at)

admin_logs (id, admin_id, action, target_type, target_id, created_at)
```

Index sur : `listings(country_code, city, category_id, status)`, `listings(boost_type, boost_expires_at)`, recherche full-text sur `title + description`.

---

## 17. SÉCURITÉ

- **Auth** : OTP SMS, JWT access/refresh, rotation, httpOnly cookies
- **Téléphone** hashé, numéros masqués dans annonces (révélés au clic, tracking)
- **Rate limiting** : API 100 req/min/IP, OTP 5/15min
- **Captcha invisible** (Cloudflare Turnstile) sur publication et inscription
- **Modération** : auto (mots interdits, prix anormaux) + humaine (file admin) + signalements
- **Limite** : 10 annonces gratuites actives/compte
- **Paiements** : agrégateur certifié PCI-DSS, aucune donnée carte stockée, webhooks signés
- **HTTPS strict + HSTS**, CSP headers
- **RGPD / Loi sénégalaise** sur les données personnelles : consentement, droit à l'effacement
- **Storage images** : CDN (Cloudflare/Supabase Storage), validation type/taille, scan
- **Admin** : route protégée, rôle vérifié, 2FA, audit log, IP allowlist optionnelle
- **Backups** quotidiens

---

## 18. SEO & PERFORMANCE

### SEO
- URLs propres : `/annonce/12345/villa-f5-piscine-almadies-dakar`
- Meta title/description dynamiques par annonce
- Open Graph (og:image = 1ère photo) pour partage WhatsApp/Facebook
- Schema.org : Product, Offer, LocalBusiness, BreadcrumbList
- Sitemap XML auto-généré, robots.txt
- SSR/SSG (Next.js) pour indexation
- Pages catégorie/ville optimisées (« Voitures à Dakar »)

### Performance
- Images WebP/AVIF + lazy loading + responsive srcset
- Code splitting, minification
- Cache (assets 1 an, pages ISR)
- Score Lighthouse cible > 90 mobile
- Core Web Vitals : LCP < 2.5s, CLS < 0.1

### Accessibilité
- ARIA labels, contraste WCAG AA, focus visible, navigation clavier, alt sur images, `prefers-reduced-motion` respecté (désactive animations néon si demandé)

---

## 19. CHECKLIST DE LIVRAISON

L'agent doit cocher chaque point :

### Pages
- [ ] Accueil (hero sombre néon + listings clairs)
- [ ] Recherche moderne (autocomplétion, filtres, géoloc, vocal)
- [ ] Listing/Catégorie (filtres sidebar + drawer mobile)
- [ ] **Page annonce PLEIN ÉCRAN** (URL propre, pas modale, pas de panier)
- [ ] Wizard publication 5 étapes (champs dynamiques par catégorie)
- [ ] Dashboard vendeur (9 sections)
- [ ] Auth téléphone + OTP (démo 1234)
- [ ] Paiement mobile money (5 méthodes + carte + confirmation)
- [ ] **Admin /yamanetech** (12 fonctionnalités, identifiants fournis)
- [ ] Boutique vendeur Pro
- [ ] Pages statiques (aide, sécurité, CGU)

### Design
- [ ] Style hybride : sombre néon (hero) + clair (listings)
- [ ] Gradients animés, glow néon, glassmorphism
- [ ] Micro-interactions (hover, scroll reveal, compteurs, skeleton)
- [ ] Images carrées 1:1 (style Jumia)
- [ ] Responsive mobile-first parfait
- [ ] Badge À la Une animé néon-pulse

### Fonctionnel
- [ ] 27 pays (sélecteur en BAS de page, pas en haut)
- [ ] Contact direct WhatsApp/Appel/Message (PAS de panier)
- [ ] 10 zones publicitaires annonceurs (gérables en admin)
- [ ] Favoris, partage, signalement
- [ ] Recherche full-text + filtres
- [ ] Boosts (Premium/Une/Pack Pro)

### Technique
- [ ] Base de données complète (schéma fourni)
- [ ] Sécurité (OTP, JWT, rate limit, modération)
- [ ] SEO (URLs, OG, schema, sitemap)
- [ ] Performance (Lighthouse > 90)
- [ ] Code propre, modulaire, commenté

---

## 📝 NOTES FINALES POUR L'AGENT

1. **Priorité absolue** : page annonce plein écran (pas modale), aucun panier, recherche moderne, design néon premium, admin /yamanetech, 27 pays en bas.
2. Si tu construis d'abord une démo statique, prépare-la pour une migration facile vers une vraie stack (composants, données mockées dans des fichiers séparés).
3. Le contenu de démo doit être **réaliste et africain** : villas à Dakar/Abidjan, Toyota/Mercedes, iPhone, mode wax, mouton Ladoum, etc. Noms : Moussa Diallo, Aminata Koné, Ibrahim Traoré…
4. Devise par défaut FCFA, adaptée au pays sélectionné.
5. Tout en **français** (interface), extensible à l'anglais (Ghana/Nigéria) plus tard.
6. Livre un README expliquant l'installation, la config (clés API SMS/paiement), et les identifiants admin.

**Construis quelque chose d'extraordinaire. 🚀**

---
*Brief rédigé pour transmission à un agent de développement IA · AnnoncesWest v3.0*
