# 🔐 Dashboard Administrateur — AnnoncesWest
### Spécification technique complète · YamaneTech
**Version 1.0 · Document de référence pour développement production**

> **À l'agent de développement :** Ce document décrit le tableau de bord administrateur de la plateforme AnnoncesWest. La démo `admin_dashboard.html` accompagne ce document et sert de maquette interactive. Reproduire fidèlement en production (React/Next.js + Supabase/PostgreSQL).

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#1)
2. [Système de design](#2)
3. [Architecture & Layout](#3)
4. [Navigation Sidebar](#4)
5. [Topbar](#5)
6. [Page : Vue d'ensemble](#6)
7. [Page : Analytique](#7)
8. [Page : Modération](#8)
9. [Page : Annonces](#9)
10. [Page : Utilisateurs](#10)
11. [Page : Finances](#11)
12. [Page : Publicités](#12)
13. [Page : Boosts](#13)
14. [Page : Pays 27](#14)
15. [Page : Rapports](#15)
16. [Page : Paramètres](#16)
17. [Composants réutilisables](#17)
18. [API & Endpoints](#18)
19. [Sécurité admin](#19)
20. [Checklist de livraison](#20)

---

## 1. VUE D'ENSEMBLE

| Propriété | Valeur |
|-----------|--------|
| Nom | Dashboard Administrateur AnnoncesWest |
| Créateur | YamaneTech |
| Route | `/yamanetech` |
| Email admin | `admin@yamanetech.com` |
| Mot de passe | Variable serveur `ADMIN_PASSWORD` |
| Code 2FA démo | `1234` |
| Type | SPA — navigation sans rechargement |

### Différence Admin vs Vendeur

| Dashboard Admin `/yamanetech` | Dashboard Vendeur `/dashboard` |
|-------------------------------|-------------------------------|
| Gestion globale de la plateforme | Gestion de ses propres annonces |
| Modération de TOUTES les annonces | Ses messages et favoris |
| Statistiques globales | Ses statistiques personnelles |
| Gestion des 27 pays | Son profil vendeur |
| Gestion des publicités annonceurs | Ses paiements |
| Finances totales de la plateforme | Ses boosts actifs |
| Bannir / vérifier des utilisateurs | — |
| Paramètres système | — |

---

## 2. SYSTÈME DE DESIGN

### 2.1 Palette de couleurs

```css
/* ══ FONDS ══ */
--bg:    #F0F2F8;   /* fond général */
--surf:  #FFFFFF;   /* cartes */
--surf2: #F7F9FC;   /* fond secondaire */
--line:  #E8ECF4;   /* bordures */

/* ══ TEXTE ══ */
--ink:   #1A1F36;   /* principal */
--ink2:  #6B7280;   /* secondaire */
--ink3:  #A0AEC0;   /* tertiaire */

/* ══ ACCENT ══ */
--p:     #6366F1;   /* indigo */
--p-d:   #4F46E5;
--p-l:   #EEF2FF;

/* ══ ÉTATS ══ */
--red:   #EF4444;
--amber: #F59E0B;
--green: #10B981;
--blue:  #3B82F6;

/* ══ GRADIENTS KPI ══ */
--g1: linear-gradient(135deg, #667EEA, #764BA2);  /* indigo-violet */
--g2: linear-gradient(135deg, #F093FB, #F5576C);  /* rose-rouge    */
--g3: linear-gradient(135deg, #4FACFE, #00F2FE);  /* cyan-bleu     */
--g4: linear-gradient(135deg, #43E97B, #38F9D7);  /* vert-teal     */
--g5: linear-gradient(135deg, #FA709A, #FEE140);  /* rose-jaune    */
--g6: linear-gradient(135deg, #FF9A56, #FF6A88);  /* orange-rose   */
--g7: linear-gradient(135deg, #A18CD1, #FBC2EB);  /* lavande       */
--g8: linear-gradient(135deg, #0BA360, #3CBA92);  /* vert profond  */
```

### 2.2 Typographie
- **Police** : `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  *(Police système — zéro connexion internet requise)*
- Titres de page : `1.4rem / 800`
- Titres cartes : `0.97rem / 800`
- Corps : `0.83–0.85rem / 400–600`
- Valeurs KPI : `1.75rem / 800`
- Labels tableaux : `0.7rem / 700 / UPPERCASE`

### 2.3 Rayons & Ombres
```css
--r:    12px;   /* boutons, inputs */
--r-lg: 18px;   /* cartes */
--r-xl: 26px;   /* éléments hero */

--sh:    0 2px 8px rgba(20,30,80,.07);
--sh-lg: 0 12px 40px rgba(20,30,80,.13);
```

### 2.4 Breakpoints
```
Mobile   < 560px    grille 1 colonne, KPI empilés
Tablet   < 1024px   sidebar masquée (burger), grilles 2 colonnes
Desktop  ≥ 1024px   sidebar visible, layout complet
```

---

## 3. ARCHITECTURE & LAYOUT

```
┌──────────────────────────────────────────────────────┐
│ SIDEBAR (240px fixe)  │ TOPBAR sticky                │
│ ─────────────────────   ────────────────────────── ─ │
│ Logo AnnoncesWest     │ Recherche · Date · Notifs    │
│ Profil Super Admin    │ Mode sombre · ⬇ Exporter     │
│ ─────────────────────   ──────────────────────────   │
│ TABLEAU DE BORD       │                              │
│  ▶ Vue d'ensemble     │   CONTENU DE LA PAGE         │
│  • Analytique         │   (scroll vertical)           │
│                       │                              │
│ CONTENU               │  Alertes                     │
│  • Modération [8]     │  → KPI (4 cartes)            │
│  • Annonces           │  → Graphiques                │
│  • Utilisateurs       │  → Tableaux                  │
│  • Messages [5]       │  → Feed d'activité           │
│                       │                              │
│ MONÉTISATION          │                              │
│  • Finances           │                              │
│  • Publicités         │                              │
│  • Boosts             │                              │
│                       │                              │
│ SYSTÈME               │                              │
│  • Pays (27)          │                              │
│  • Rapports           │                              │
│  • Paramètres         │                              │
│ ─────────────────────   │                              │
│ 🚪 Déconnexion        │                              │
└──────────────────────────────────────────────────────┘
```

---

## 4. NAVIGATION SIDEBAR

### Éléments
- **Logo** : carré dégradé `--g1` « AW » + « AnnoncesWest / Administration »
- **Profil admin** : initiales colorées + point vert (en ligne) + nom + rôle « Super Admin »
- **Navigation** groupée en 4 sections avec icônes
- **Item actif** : fond dégradé `--g1` + ombre colorée + texte blanc
- **Badges notification** : rouge — Modération (8), Messages (5)
- **Déconnexion** : texte rouge en pied de sidebar

### Comportement responsive
- **Desktop ≥ 1024px** : toujours visible, fixe
- **Mobile < 1024px** : cachée, s'ouvre via burger → slide gauche + overlay sombre
- Fermeture auto au clic overlay ou à la navigation

### Routes
| Label | ID | Icône | Badge |
|-------|----|----|-------|
| Vue d'ensemble | overview | 📊 | — |
| Analytique | analytics | 📈 | — |
| Modération | moderation | 🛡️ | 8 |
| Annonces | listings | 📋 | — |
| Utilisateurs | users | 👥 | — |
| Messages | messages | 💬 | 5 |
| Finances | finance | 💰 | — |
| Publicités | ads | 📢 | — |
| Boosts | boosts | ✦ | — |
| Pays (27) | countries | 🌍 | — |
| Rapports | reports | 📄 | — |
| Paramètres | settings | ⚙️ | — |

---

## 5. TOPBAR

Barre collante — fond blanc avec `backdrop-filter: blur(16px)`.

| Élément | Détail |
|---------|--------|
| ☰ Burger | Visible < 1024px · ouvre la sidebar |
| 🔍 Recherche | « Rechercher utilisateurs, annonces, transactions… » |
| Date | Format court `mar. 16 juin` · caché < 640px |
| 🔔 Notifs | Badge rouge · alertes système |
| ✉️ Messages | Badge rouge · messages internes |
| 🌙 Mode sombre | Toggle clair/sombre |
| ⬇ Exporter | Bouton gradient · export PDF global |

---

## 6. PAGE : VUE D'ENSEMBLE

### Alertes prioritaires
```
⚠️ [Fond jaune]  8 annonces en attente — lien direct vers modération
🚨 [Fond rouge]  3 signalements critiques — action immédiate requise
```

### KPI — 4 cartes en gradient
| Indicateur | Gradient | Valeur | Tendance |
|-----------|----------|--------|----------|
| Utilisateurs actifs | `--g1` bleu-violet | 48 320 | ↑ 12% |
| Annonces en ligne | `--g2` rose-rouge | 256 891 | ↑ 8% |
| Revenus FCFA | `--g3` cyan | 124M | ↑ 18% |
| Taux de conformité | `--g4` vert | 98% | ↑ 5% |

*Compteurs animés au chargement.*

### Graphique revenus (2/3 largeur)
- Courbe SVG double : revenus réels (plein) vs objectif (pointillés)
- Dégradé de remplissage sous chaque courbe
- Points interactifs avec tooltip au survol
- Sélecteur : **7J / 30J / 12M**

### Donut sources de revenus (1/3 largeur)
| Source | % | Couleur |
|--------|---|---------|
| Boosts | 66% | Indigo |
| Publicités | 25% | Rose |
| Abonnements Pro | 9% | Vert |

### Stats mini (4 indicateurs)
| Indicateur | Valeur | Trend |
|-----------|--------|-------|
| Inscriptions ce mois | 1 240 | ↑ +12% |
| Nouvelles annonces | 8 450 | ↑ +8% |
| Transactions | 2 380 | ↑ +23% |
| Note plateforme | 4.8/5 | ↑ Excellent |

### Table transactions récentes
Colonnes : Client · ID · Offre · Montant · Statut · Action

### Feed activité temps réel
| Icône | Événement |
|-------|-----------|
| 🆕 | Nouvelle inscription |
| 💰 | Paiement reçu |
| 🛡️ | Annonce signalée |
| 📋 | Annonce approuvée |
| 👑 | Vendeur Pro validé |
| ⚠️ | Tentative login suspecte bloquée |

### Barres hebdomadaires
Annonces publiées vs signalées sur 7 jours — 2 séries, 2 couleurs.

### Objectifs du mois (barres de progression)
Inscriptions 78% · Revenus 92% · Modération 65% · Satisfaction 88% · Annonces Pro 54%

---

## 7. PAGE : ANALYTIQUE

| Composant | Détail |
|-----------|--------|
| KPI × 4 | Pages vues · Visiteurs uniques · Durée session · Taux de rebond |
| Graphique 7J | Trafic journalier (2 courbes) |
| Top catégories | Barres de progression — vues par catégorie |

---

## 8. PAGE : MODÉRATION

### Alerte
Bandeau jaune : **N annonces attendent validation (délai max 24h)**.

### File de modération — par annonce
```
[Icône catégorie]  Titre de l'annonce
                   Raison du signalement · Catégorie
         [✓ Approuver]  [✕ Rejeter]  [ℹ Info]
```

Bouton **« ✓ Tout approuver »** en haut à droite.

### API modération
```
GET    /admin/moderation/queue
POST   /admin/moderation/:id/approve
POST   /admin/moderation/:id/reject      { reason }
POST   /admin/moderation/:id/request-info { message }
POST   /admin/moderation/approve-all
```

---

## 9. PAGE : ANNONCES

Tableau complet avec filtres et pagination.

| Colonne | Détail |
|---------|--------|
| Annonce | Avatar initiales + titre |
| Catégorie | — |
| Prix | Gras |
| Vues | Nombre |
| Boost | ✦ À la Une / ⭐ Premium / Gratuit |
| Statut | ✅ Active / ⏳ En attente / ❌ Expirée |
| Actions | ✏ Modifier · ⏸ Suspendre |

---

## 10. PAGE : UTILISATEURS

### KPI
| Indicateur | Valeur |
|-----------|--------|
| Actifs | 46 210 |
| Vendeurs Pro | 1 240 |
| En attente vérification | 820 |
| Bannis | 50 |

### Tableau utilisateurs
| Colonne | Détail |
|---------|--------|
| Utilisateur | Avatar + nom |
| Téléphone | Avec indicatif pays |
| Pays | Drapeau + nom |
| Annonces | Nombre total |
| Inscrit le | Date |
| Statut | Pro · Vérifié · Actif · Nouveau |
| Actions | 👁 Voir · 🚫 Bannir (avec confirmation) |

---

## 11. PAGE : FINANCES

### KPI
| Indicateur | Gradient | Valeur |
|-----------|----------|--------|
| Revenus totaux | `--g1` | 124M FCFA |
| Revenus boosts | `--g8` | 82M FCFA |
| Revenus publicités | `--g5` | 31M FCFA |
| Abonnements Pro | `--g3` | 11M FCFA |

### Graphique évolution
Courbe SVG sur 6 ans (2020→2025).

### Donut méthodes de paiement
| Méthode | Part |
|---------|------|
| Orange Money | 45% |
| Wave | 28% |
| MTN MoMo | 15% |
| Carte bancaire | 8% |
| Moov Money | 4% |

### Historique transactions
Date · Utilisateur · Type · Montant · Méthode · Statut

---

## 12. PAGE : PUBLICITÉS ANNONCEURS

### Tableau des 10 zones
| Colonne | Détail |
|---------|--------|
| Slot | A1 Hero Banner, A2 In-feed… |
| Annonceur | Nom marque |
| Pays ciblés | Drapeaux |
| Impressions | Total |
| Clics | Total |
| CTR | % en vert |
| Statut | 🟢 Active · 🟡 Planifiée · 🔵 Nouveau |
| Actions | ✏ Modifier · ⏸ Suspendre |

### Zones définies
| Zone | Emplacement | Format |
|------|-------------|--------|
| A1 | Hero Banner accueil | 1200×200 |
| A2 | In-feed Home | Native card |
| A3 | Sidebar Listing | 300×250 |
| A4 | In-grid Listing | Carte sponsorisée |
| A5 | Page Annonce | 300×250 |
| A6 | Bas page annonce | 728×90 |
| A7 | Footer | Bannière large |
| A8 | Interstitiel | Plein écran |
| A9 | Catégorie sponsor | Bannière |
| A10 | Notification push | Push |

---

## 13. PAGE : BOOSTS

### KPI actifs
| Type | Valeur |
|------|--------|
| ⭐ Premium | 1 840 |
| 🏆 À la Une | 420 |
| 👑 Pack Pro | 210 |

### Tarifs configurables
| Boost | Prix par défaut |
|-------|----------------|
| ⭐ Premium | 3 500 FCFA |
| 🏆 À la Une | 9 000 FCFA |
| 👑 Pack Pro | 15 000 FCFA |

---

## 14. PAGE : PAYS (27)

Grille avec pour chaque pays : drapeau · nom · nombre d'annonces actives.

**27 pays :** Sénégal · Côte d'Ivoire · Mali · Bénin · Burkina Faso · Togo · Niger · Guinée · Guinée-Bissau · Ghana · Nigéria · Sierra Leone · Liberia · Gambie · Cap-Vert · Mauritanie · Cameroun · Gabon · Congo · RD Congo · Tchad · Centrafrique · Guinée Éq. · Maroc · Algérie · Tunisie · Madagascar

**Actions production :** Activer/Désactiver · Configurer devise · Configurer opérateurs mobile money

---

## 15. PAGE : RAPPORTS

| Rapport | Format | Contenu |
|---------|--------|---------|
| Mensuel complet | PDF | Toutes statistiques |
| Utilisateurs & Inscriptions | CSV | Données démographiques |
| Transactions financières | PDF / CSV | Historique complet |
| Annonces par catégorie | Excel | Répartition détaillée |
| Signalements & Modération | PDF | Journal des actions |
| Performance publicitaire | PDF | CTR et impressions |

---

## 16. PAGE : PARAMÈTRES

### Configuration plateforme
| Paramètre | Valeur par défaut |
|-----------|-------------------|
| Nom plateforme | AnnoncesWest |
| Email support | support@annonceswest.com |
| Limite annonces gratuites | 10 |
| Durée annonce gratuite (jours) | 30 |

### Toggles système
| Toggle | État |
|--------|------|
| Mode maintenance | Désactivé |
| Inscriptions ouvertes | Activé |
| Paiements actifs | Activé |
| Modération automatique | Activé |
| Notifications push | Activé |

---

## 17. COMPOSANTS RÉUTILISABLES

### KPICard
```jsx
<KPICard
  gradient="--g1"
  icon="👥"
  value={48320}
  label="Utilisateurs actifs"
  trend="+12%"
  animated
/>
```

### AreaChart
```jsx
<AreaChart
  data={revenueData}
  series={[
    { key: 'revenus', color: '#667EEA', filled: true },
    { key: 'objectif', color: '#F5576C', dashed: true },
  ]}
  xAxis={months}
  height={220}
  tooltip
/>
```

### DonutChart
```jsx
<DonutChart
  data={[
    { label: 'Boosts',       value: 66, color: '#667EEA' },
    { label: 'Publicités',   value: 25, color: '#F093FB' },
    { label: 'Abonnements',  value:  9, color: '#43E97B' },
  ]}
  size={140}
  strokeWidth={18}
  centerLabel="100%"
/>
```

### DataTable
```jsx
<DataTable
  columns={columns}
  data={rows}
  pagination
  searchable
  actions={['view', 'edit', 'ban', 'delete']}
/>
```

### StatusBadge
```jsx
<StatusBadge status="active"  />  // ✅ vert
<StatusBadge status="pending" />  // ⏳ ambre
<StatusBadge status="failed"  />  // ❌ rouge
<StatusBadge status="pro"     />  // 👑 violet
```

### ProgressBar
```jsx
<ProgressBar label="Inscriptions" value={78} color="#667EEA" />
```

### Alert
```jsx
<Alert type="warning">⚠️ Message...</Alert>
<Alert type="danger" >🚨 Message...</Alert>
<Alert type="info"   >ℹ️ Message...</Alert>
<Alert type="success">✅ Message...</Alert>
```

---

## 18. API & ENDPOINTS

### Vue d'ensemble
```
GET  /admin/stats/overview
GET  /admin/stats/revenue?range=30d
GET  /admin/transactions/recent
WS   /admin/activity/live          ← WebSocket temps réel
```

### Modération
```
GET   /admin/moderation/queue
POST  /admin/moderation/:id/approve
POST  /admin/moderation/:id/reject        { reason }
POST  /admin/moderation/:id/request-info  { message }
POST  /admin/moderation/approve-all
```

### Annonces
```
GET   /admin/listings?page&limit&status&category
PUT   /admin/listings/:id
POST  /admin/listings/:id/suspend
DELETE /admin/listings/:id
```

### Utilisateurs
```
GET   /admin/users?page&limit
GET   /admin/users/:id
POST  /admin/users/:id/ban
POST  /admin/users/:id/unban
POST  /admin/users/:id/verify
POST  /admin/users/:id/make-pro
```

### Finances
```
GET   /admin/finance/kpis
GET   /admin/finance/revenue?range=12m
GET   /admin/finance/transactions?page
GET   /admin/finance/payment-methods
```

### Publicités
```
GET   /admin/ads/banners
POST  /admin/ads/banners
PUT   /admin/ads/banners/:id
DELETE /admin/ads/banners/:id
```

### Pays
```
GET   /admin/countries
PUT   /admin/countries/:code     { active, currency, operators[] }
```

### Paramètres
```
GET   /admin/settings
PUT   /admin/settings
PUT   /admin/settings/toggles
```

### WebSocket — Feed temps réel
```javascript
const ws = new WebSocket('wss://api.annonceswest.com/admin/live');
ws.onmessage = ({ data }) => {
  const event = JSON.parse(data);
  // Types : new_user | payment | listing_flagged |
  //         listing_approved | login_suspicious | pro_validated
  appendToFeed(event);
};
```

---

## 19. SÉCURITÉ ADMIN

### Authentification
| Niveau | Méthode |
|--------|---------|
| 1 | Email + Mot de passe (bcrypt) |
| 2 | 2FA TOTP (Google Authenticator) ou SMS |
| Session | JWT access 15 min + refresh 7 jours (httpOnly) |
| Rate limit | 5 tentatives / 15 min / IP |

### Autorisation (RBAC)
```sql
role ENUM('user', 'moderator', 'admin', 'super_admin')

-- moderator   → approuver/rejeter annonces
-- admin       → tout sauf modifier autres admins
-- super_admin → accès complet
```

### Journalisation — toutes les actions admin
```sql
admin_logs (
  id, admin_id, action, target_type,
  target_id, payload JSONB, ip, user_agent, created_at
)
```

### Protection route
- Middleware Next.js protège `/yamanetech/*`
- Redirection vers `/yamanetech/login` si non authentifié
- Vérification rôle à chaque requête API
- CSRF protection sur mutations
- Alertes sur tentatives suspectes

### En production — changer les identifiants
```env
ADMIN_EMAIL=<email_secret>
ADMIN_PASSWORD_HASH=<bcrypt_hash>
ADMIN_2FA_SECRET=<totp_secret>
```

---

## 20. CHECKLIST DE LIVRAISON

### Design & UX
- [ ] Sidebar responsive (burger, overlay, animation)
- [ ] Topbar sticky avec backdrop blur
- [ ] KPI cartes gradients + compteurs animés
- [ ] Graphique aire SVG — tooltip + sélecteur période
- [ ] Donut multi-segments
- [ ] Barres groupées hebdomadaires
- [ ] Barres de progression objectifs
- [ ] Tableaux : tri, pagination, recherche
- [ ] File de modération avec 3 actions par annonce
- [ ] Alertes colorées (danger / warning / info / success)
- [ ] Feed activité temps réel (WebSocket)
- [ ] Badges notification sur nav
- [ ] Mode sombre toggle
- [ ] Responsive mobile parfait

### Fonctionnel
- [ ] Auth 2FA + JWT
- [ ] 12 pages fonctionnelles
- [ ] Modération (approuver / rejeter / demander info)
- [ ] Bannissement avec confirmation
- [ ] Génération rapports PDF / CSV / Excel
- [ ] Export global
- [ ] Sauvegarde paramètres et tarifs
- [ ] Toggles système
- [ ] Gestion 27 pays
- [ ] Gestion 10 zones publicitaires

### Technique
- [ ] WebSocket feed temps réel
- [ ] Toutes les API connectées
- [ ] Logs actions admin
- [ ] Protection route serveur
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Zéro dépendance externe (polices système)
- [ ] Lighthouse Performance > 90

---

## 📁 FICHIERS LIVRÉS

| Fichier | Description |
|---------|-------------|
| `admin_dashboard.html` | Démo interactive complète (56 Ko — 0 dépendance externe) |
| `ADMIN_DASHBOARD_SPEC.md` | Ce document de spécification |

---

*YamaneTech · AnnoncesWest Admin Dashboard v1.0*
*La démo HTML est 100% autonome — fonctionne sans connexion internet*
