# 👤 Dashboard Utilisateur — AnnoncesWest
### Spécification technique complète · YamaneTech
**Version 1.0 · Espace personnel du vendeur/acheteur**

> **À l'agent de développement :** Ce document décrit le dashboard personnel des utilisateurs (vendeurs/acheteurs) de la plateforme AnnoncesWest. Route `/dashboard`. La démo `user_dashboard.html` sert de maquette interactive de référence. Zéro dépendance externe — fonctionne sans connexion internet.

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Système de design](#2-système-de-design)
3. [Architecture & Layout](#3-architecture--layout)
4. [Sidebar — Profil + Navigation](#4-sidebar--profil--navigation)
5. [Topbar](#5-topbar)
6. [Page : Vue d'ensemble](#6-page--vue-densemble)
7. [Page : Mes annonces](#7-page--mes-annonces)
8. [Page : Messages & Chat](#8-page--messages--chat)
9. [Page : Mes favoris](#9-page--mes-favoris)
10. [Page : Statistiques](#10-page--statistiques)
11. [Page : Paiements & Boosts](#11-page--paiements--boosts)
12. [Page : Avis reçus](#12-page--avis-reçus)
13. [Page : Mon profil](#13-page--mon-profil)
14. [Page : Sécurité](#14-page--sécurité)
15. [Composants réutilisables](#15-composants-réutilisables)
16. [API & Endpoints](#16-api--endpoints)
17. [Checklist de livraison](#17-checklist-de-livraison)

---

## 1. VUE D'ENSEMBLE

### 1.1 Identité
| Propriété | Valeur |
|-----------|--------|
| Nom | Dashboard Utilisateur — Mon Espace |
| Route | `/dashboard` |
| Accès | Tout utilisateur authentifié |
| Type | SPA — navigation sans rechargement |

### 1.2 Différence Utilisateur vs Administrateur
| Dashboard Utilisateur `/dashboard` | Dashboard Admin `/yamanetech` |
|------------------------------------|-------------------------------|
| Ses propres annonces uniquement | Toutes les annonces de la plateforme |
| Ses messages personnels | Messagerie interne admin |
| Ses favoris sauvegardés | Gestion globale des utilisateurs |
| Ses statistiques personnelles | Statistiques globales plateforme |
| Ses paiements et boosts | Finances totales |
| Son profil vendeur | Paramètres système |
| — | Modération, pays, publicités |

### 1.3 Profil de l'utilisateur demo
```
Nom       : Moussa Diallo
Initiales : MD
Ville     : Dakar, Sénégal
Membre depuis : Janvier 2021
Annonces  : 12 actives
Note      : 4.8 / 5
Ventes    : 127
Badges    : ✅ Vérifié · 👑 Pro
Réponse   : < 1 heure
```

---

## 2. SYSTÈME DE DESIGN

### 2.1 Couleurs
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
--p:     #6366F1;   /* indigo principal */
--pd:    #4F46E5;
--pl:    #EEF2FF;

/* ══ ÉTATS ══ */
--green: #10B981;
--red:   #EF4444;
--amber: #F59E0B;
--blue:  #3B82F6;

/* ══ GRADIENTS (KPI + accents) ══ */
--g1: linear-gradient(135deg, #667EEA, #764BA2);   /* indigo-violet */
--g2: linear-gradient(135deg, #F093FB, #F5576C);   /* rose-rouge */
--g3: linear-gradient(135deg, #4FACFE, #00F2FE);   /* cyan-bleu */
--g4: linear-gradient(135deg, #43E97B, #38F9D7);   /* vert-teal */
--g5: linear-gradient(135deg, #FA709A, #FEE140);   /* rose-jaune */
--g6: linear-gradient(135deg, #FF9A56, #FF6A88);   /* orange-rose */
--g7: linear-gradient(135deg, #A18CD1, #FBC2EB);   /* lavande */
--g8: linear-gradient(135deg, #0BA360, #3CBA92);   /* vert profond */

/* ══ COULEURS PAR CATÉGORIE ══ */
Immobilier  → --g4 (vert)
Voitures    → --g1 (indigo)
Électronique→ --g3 (cyan)
Mode        → --g5 (rose)
Emploi      → --g7 (lavande)
Maison      → --g6 (orange)
```

### 2.2 Typographie
- **Police** : `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  *(Polices système — aucune connexion internet requise)*
- Titres de page : `1.35rem / 800`
- Titres cartes : `0.97rem / 800`
- Corps : `0.83–0.85rem`
- Valeurs KPI : `1.7rem / 800`
- Labels nav : `0.85rem / 600`

### 2.3 Rayons & Ombres
```css
--r:    12px;    /* boutons, inputs, petits éléments */
--rl:   18px;    /* cartes principales */
--rxl:  24px;    /* éléments hero */

--sh:   0 2px 8px rgba(20,30,80,.07);
--shl:  0 12px 40px rgba(20,30,80,.12);
```

### 2.4 Breakpoints
```
Mobile   < 560px    grilles 1 colonne, KPI empilés 2×2
Tablet   < 1024px   sidebar cachée (burger), grilles 2 colonnes
Desktop  ≥ 1024px   sidebar visible (248px fixe), layout complet
Chat     < 800px    vue liste conversations, fenêtre chat empilée
```

---

## 3. ARCHITECTURE & LAYOUT

```
┌────────────────────────────────────────────────────┐
│ SIDEBAR (248px fixe)    │ TOPBAR (sticky)           │
│ ─────────────────────── │ ─────────────────────── ─ │
│ Logo AnnoncesWest       │ Recherche · 💬 · 🔔       │
│                         │ + Publier (bouton rose)    │
│ ┌─────────────────────┐ │ ──────────────────────── │
│ │ CARTE PROFIL        │ │                           │
│ │ Gradient indigo     │ │  CONTENU DE LA PAGE       │
│ │ Avatar MD + Stats   │ │  (scroll vertical)        │
│ │ Badges ✅ 👑        │ │                           │
│ └─────────────────────┘ │  Bannière boost           │
│                         │  → Hero profil            │
│ TABLEAU DE BORD         │  → KPI (4 cartes)         │
│  ▶ Vue d'ensemble       │  → Graphiques             │
│  • Statistiques         │  → Annonces récentes      │
│                         │  → Feed d'activité        │
│ MES ANNONCES            │                           │
│  • Mes annonces         │                           │
│  • Messages [5]         │                           │
│  • Mes favoris          │                           │
│                         │                           │
│ COMPTE                  │                           │
│  • Paiements & Boosts   │                           │
│  • Avis reçus           │                           │
│  • Mon profil           │                           │
│  • Sécurité             │                           │
│ ─────────────────────── │                           │
│ [+ Publier une annonce] │                           │
│ 🚪 Déconnexion          │                           │
└────────────────────────────────────────────────────┘
```

---

## 4. SIDEBAR — PROFIL + NAVIGATION

### 4.1 En-tête logo
Logo carré dégradé « AW » + nom « AnnoncesWest / Mon Espace »

### 4.2 Carte profil (signature visuelle)
Carte avec fond gradient indigo `--g1`, cercles décoratifs en overlay.

| Élément | Détail |
|---------|--------|
| Avatar | Initiales en blanc `MD`, fond semi-transparent, coins arrondis |
| Nom | Gras blanc |
| Ville | Icône 📍 + ville |
| Stats | 3 colonnes : Annonces · Note★ · Ventes |
| Badges | `✅ Vérifié` · `👑 Pro` (fond semi-transparent blanc) |

### 4.3 Navigation groupée

| Section | Item | Icône | Badge |
|---------|------|-------|-------|
| TABLEAU DE BORD | Vue d'ensemble | 📊 | — |
| | Statistiques | 📈 | — |
| MES ANNONCES | Mes annonces | 📋 | — |
| | Messages | 💬 | 5 (rouge) |
| | Mes favoris | ❤️ | — |
| COMPTE | Paiements & Boosts | 💳 | — |
| | Avis reçus | ⭐ | — |
| | Mon profil | ⚙️ | — |
| | Sécurité | 🔒 | — |

- **Item actif** : fond dégradé `--g1` + ombre colorée + texte blanc
- **Badge** : fond rouge, texte blanc, compteur de non-lus

### 4.4 Pied de sidebar
```
[+ Publier une annonce]   ← bouton rose gradient --g5, pleine largeur
🚪 Déconnexion            ← texte rouge
```

### 4.5 Comportement responsive
- **≥ 1024px** : fixe, toujours visible
- **< 1024px** : cachée → burger → slide depuis la gauche + overlay sombre

---

## 5. TOPBAR

Barre collante, fond blanc avec `backdrop-filter: blur(16px)`.

| Élément | Détail |
|---------|--------|
| ☰ Burger | Visible < 1024px |
| 🔍 Recherche | « Chercher dans mes annonces… » |
| 💬 Messages | Icône + badge rouge → ouvre page Messages |
| 🔔 Notifications | Icône + badge rouge |
| + Publier | Bouton rose gradient — action principale |

---

## 6. PAGE : VUE D'ENSEMBLE

Page d'accueil chargée au démarrage.

### 6.1 Bannière boost (alerte contextuelle)
```
Fond gradient lavande --g7
✦ Boostez vos annonces pour +300% de vues
  Vos 3 meilleures annonces expirent dans 7 jours
                              [Voir les boosts →]
```

### 6.2 Hero profil
Structure en 2 parties :

**Bandeau supérieur** — 120px hauteur, fond dégradé `--g1`

**Corps** — fond blanc :
- Avatar 80×80px dégradé `--g1`, coins arrondis 20px, border blanc 4px, superposé sur bandeau
- Nom complet gras 1.2rem
- Méta : 📍 Ville · 📅 Membre depuis · ⏱️ Temps de réponse
- Badges : `✅ Identité vérifiée` · `👑 Vendeur Pro` · `⭐ 4.8/5`
- Boutons : 💬 Partager (WhatsApp vert) + Modifier profil (indigo)

**Barre de 4 KPIs** — grille séparée par `--line` :
| KPI | Valeur | Couleur |
|-----|--------|---------|
| Annonces actives | 12 | Indigo |
| Vues totales | 8 432 | Indigo |
| Ventes réalisées | 127 | Indigo |
| Taux de réponse | 94% | Indigo |

*Compteurs animés au chargement.*

### 6.3 KPI cards (4 cartes colorées)
| KPI | Gradient | Valeur | Détail |
|-----|----------|--------|--------|
| Annonces actives | `--g1` | 12 | +2 ce mois |
| Vues ce mois | `--g3` | 8 432 | ↑ 18% |
| Messages reçus | `--g5` | 47 | 5 non lus |
| Dépenses boosts | `--g4` | 27 500 FCFA | ↑ 23% |

### 6.4 Graphique vues (2/3 largeur)
- Double courbe SVG : vues réelles (plein) vs favoris (pointillés)
- Dégradé de remplissage sous chaque courbe
- Points avec tooltip au survol
- Sélecteur **7J / 30J / 12M**
- Axe X : labels temporels

### 6.5 Donut catégories (1/3 largeur)
| Catégorie | % | Couleur |
|-----------|---|---------|
| Immobilier | 42% | Vert |
| Voitures | 25% | Indigo |
| Électronique | 20% | Cyan |
| Autre | 13% | Rose |

### 6.6 Mes annonces récentes (2/3 largeur)
Tableau condensé des 4 dernières annonces :
Catégorie icône · Titre · Prix · Vues · Boost · Statut

### 6.7 Feed d'activité (1/3 largeur)
| Icône | Événement |
|-------|-----------|
| 💬 | Nouveau message d'un acheteur |
| 💰 | Paiement reçu — boost actif |
| 👁️ | N vues cette semaine |
| ❤️ | Favoris reçus sur une annonce |
| ⭐ | Nouvel avis reçu |
| 📋 | Annonce publiée |

---

## 7. PAGE : MES ANNONCES

### 7.1 En-tête
Compteurs : `12 actives · 2 en attente · 1 expirée`
Bouton : `+ Nouvelle annonce` (rose)

### 7.2 Filtres rapides
```
[Toutes (15)]  [🟢 Actives (12)]  [🟡 En attente (2)]  [🔴 Expirées (1)]
```

### 7.3 Tableau des annonces
| Colonne | Détail |
|---------|--------|
| Annonce | Icône catégorie colorée + Titre + Sous-catégorie |
| Prix | Gras |
| Vues | Nombre formaté |
| Boost | Badge violet (✦ À la Une / ⭐ Premium / Gratuit) |
| Statut | ✅ Active / ⏳ En attente / 🔴 Expirée |
| Actions | ✏ Modifier · ✦ Booster · 🗑 Supprimer |

### 7.4 Statuts des boosts
| Boost | Badge | Prix |
|-------|-------|------|
| ✦ À la Une | Violet | 9 000 FCFA |
| ⭐ Premium | Violet | 3 500 FCFA |
| Gratuit | Gris | — |

### 7.5 Données de démo
```javascript
const MY_ADS = [
  {titre:'Villa F5 piscine Almadies', cat:'Immobilier',
   prix:'280 000 000 FCFA', vues:1247, boost:'✦ À la Une', statut:'active'},
  {titre:'BMW X5 2022 Full options', cat:'Voitures',
   prix:'45 000 000 FCFA', vues:843, boost:'⭐ Premium', statut:'active'},
  {titre:'iPhone 15 Pro Max 256Go', cat:'Électronique',
   prix:'750 000 FCFA', vues:2134, boost:'⭐ Premium', statut:'active'},
  {titre:'Terrain Saly 500m²', cat:'Immobilier',
   prix:'18 000 000 FCFA', vues:432, boost:'Gratuit', statut:'pending'},
  {titre:'MacBook Pro M3 14"', cat:'Électronique',
   prix:'1 200 000 FCFA', vues:98, boost:'Gratuit', statut:'expired'},
  ...
]
```

---

## 8. PAGE : MESSAGES & CHAT

### 8.1 Layout bicolonnes
```
┌─────────────────────────────────────────────────────┐
│ Liste conversations (280px) │ Fenêtre de chat (flex) │
│ ──────────────────────────  │ ────────────────────── │
│ [AK] Aminata Koné      10:24│ ← Aminata Koné         │
│      Villa F5 Almadies      │  Villa F5 Almadies  💬  │
│      D'accord…              │ ────────────────────── │
│ [IT] Ibrahim Traoré    Hier │  them: La villa est-   │
│      BMW X5 2022       🟢   │  elle disponible ?     │
│      Votre meilleur…        │                        │
│ [FD] Fatou Diallo      Hier │      me: Oui, toujours │
│ [OS] Oumar Seck        Lun. │      disponible !      │
│ [MC] Mariam Coulibaly  Dim. │                        │
│                             │  them: Parfait, 15h ?  │
│                             │ ────────────────────── │
│                             │ [Écrire un message…] ➤ │
└─────────────────────────────────────────────────────┘
```

### 8.2 Liste conversations
Chaque conversation affiche :
- **Avatar coloré** (initiales, couleur unique par conversation)
- **Nom** de l'acheteur/vendeur
- **Aperçu** du dernier message (tronqué)
- **Annonce liée** (sous le nom)
- **Heure/Date** du dernier message
- **Point vert** si message non lu

### 8.3 Fenêtre de chat
- **Header** : avatar + nom + annonce liée + bouton WhatsApp
- **Corps** : bulles de messages
  - `me` → bulle indigo, alignée à droite, coin bas-droit arrondi min
  - `them` → bulle blanche bordée, alignée à gauche
  - Timestamp sous chaque bulle
- **Pied** : input `border-radius:20px` + bouton envoi rond indigo
- Réponse automatique simulée (1.4s après envoi)

### 8.4 Comportement mobile (< 800px)
- Vue liste seule par défaut
- Clic conversation → vue chat seule (liste cachée)
- Bouton ← Retour pour revenir à la liste

### 8.5 Données des conversations
```javascript
const CONVS = [
  {
    nom: 'Aminata Koné',
    apercu: 'La villa est-elle disponible ?',
    heure: '10:24',
    nonLu: true,
    annonce: 'Villa F5 Almadies',
    thread: [
      {moi: false, texte: 'La villa est-elle disponible ?', heure: '10:24'},
      {moi: true, texte: 'Oui, toujours disponible !', heure: '10:30'},
      {moi: false, texte: 'Parfait, demain 15h ?', heure: '10:32'},
    ]
  },
  // ... 4 autres conversations
]
```

---

## 9. PAGE : MES FAVORIS

### 9.1 Grille de cartes
`grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`

### 9.2 Carte favori
```
┌─────────────────────┐
│  IMAGE FOND GRAD.   │  ← emoji catégorie centré  [✕]
│  (gradient coloré   │  ← bouton supprimer haut droite
│   par catégorie)    │
├─────────────────────┤
│ CATÉGORIE           │  ← texte indigo, uppercase
│ Titre de l'annonce  │  ← gras, 2 lignes max
│ PRIX                │  ← indigo bold
│ 📍 Ville            │  ← gris
└─────────────────────┘
```

Hover : élévation + border légère

### 9.3 Suppression
Clic sur [✕] → retire la carte, toast « Retiré des favoris »
Si 0 favoris restants → état vide :
```
🤍
Aucun favori
Touchez ❤ sur une annonce pour la retrouver ici
[Explorer les annonces]
```

### 9.4 8 favoris de démo
Toyota Land Cruiser · Appt F3 Cocody · Samsung S24 · Moto YBR · Chef projet CDI · Terrain Saly · Robe wax · MacBook Air M2

---

## 10. PAGE : STATISTIQUES

### 10.1 KPI (4 cartes)
| KPI | Gradient | Valeur |
|-----|----------|--------|
| Vues ce mois | `--g1` | 3 241 |
| Clics contact | `--g3` | 284 |
| Taux de réponse | `--g5` | 87% |
| Favoris reçus | `--g8` | 156 |

### 10.2 Graphique barres 14 jours (2/3)
14 barres colorées alternées (3 couleurs : indigo/cyan/vert), hauteur proportionnelle aux vues journalières.

### 10.3 Panel droit (1/3)
**Sources de trafic** (barres de progression) :
| Source | % | Couleur |
|--------|---|---------|
| Recherche directe | 52% | Indigo |
| Réseaux sociaux | 28% | Cyan |
| Lien partagé | 12% | Rose |
| Autre | 8% | Gris |

**Top 3 annonces** par vues :
Classement numéroté, titre tronqué, vues formatées.

---

## 11. PAGE : PAIEMENTS & BOOSTS

### 11.1 Carte plan actif
Grande carte dégradé `--g1` :
```
PLAN ACTIF
👑 Vendeur Pro               [Actif jusqu'au 30/07/2025]
3 annonces boostées
Pack Pro · Renouvellement auto · 15 000 FCFA/mois
```

### 11.2 Options de boost (3 cartes)
| Option | Bordure | Prix | Avantages |
|--------|---------|------|-----------|
| 📋 Gratuit | Gris | 0 FCFA | 30 jours, standard |
| ⭐ Premium | Ambre + badge POPULAIRE | 3 500 FCFA | Top résultats, badge doré, 60J |
| 👑 Pack Pro | Indigo + fond lavande | 15 000 FCFA | À la Une + Premium + partage |

### 11.3 Historique paiements
| Colonne | Détail |
|---------|--------|
| Date | Format DD/MM/YYYY |
| Description | Boost + nom de l'annonce |
| Montant | En vert, gras |
| Méthode | Orange Money / Wave / MTN / Carte |
| Statut | ✅ Payé (vert) |

---

## 12. PAGE : AVIS REÇUS

### 12.1 Note globale
```
┌──────────────────────────────────────────────┐
│  4.8      ⭐⭐⭐⭐⭐        [Barres 1→5★]  │
│           127 avis vérifiés                  │
└──────────────────────────────────────────────┘
```

Barres de répartition (étoiles 5 à 1) :
- 5★ : 78% → 99 avis
- 4★ : 16% → 20 avis
- 3★ : 5% → 6 avis
- 2★ : 2% → 2 avis
- 1★ : 0% → 0 avis

### 12.2 Critères détaillés (barres de progression)
| Critère | Note | Couleur |
|---------|------|---------|
| Réactivité | 4.9 | Vert |
| Description honnête | 4.8 | Indigo |
| Qualité produit | 4.7 | Cyan |
| Ponctualité | 4.9 | Rose |

### 12.3 Liste des avis
Par avis :
- Avatar initiales coloré + Nom + Date + Étoiles
- Texte de l'avis
- Bouton **Répondre**

---

## 13. PAGE : MON PROFIL

### 13.1 Section photo
- Avatar 90×90 avec initiales, fond gradient, coins arrondis 22px
- Bouton « 📷 Changer la photo »
- **Barre de complétude** : `82% — Ajoutez une photo pour atteindre 100%`

### 13.2 Formulaire informations
Grille 2 colonnes, champs :
```
Prénom *         Nom *
Téléphone *      Email
Pays             Ville
Bio (pleine largeur, textarea)
```

`[Sauvegarder]`  `[Annuler]`

### 13.3 Validation production
- Téléphone : format international + indicatif pays
- Email : format valide
- Bio : max 500 caractères
- Sauvegarde via `PUT /users/me`

---

## 14. PAGE : SÉCURITÉ

### 14.1 Éléments de sécurité
| Icône | Titre | Détail | Action |
|-------|-------|--------|--------|
| 📱 vert | Téléphone vérifié | +221 77 123 45 67 · ✅ | Modifier |
| 🆔 indigo | Identité vérifiée | Pièce d'identité validée | Voir |
| 🔐 cyan | 2FA activée | Code SMS à chaque connexion | Toggle ON/OFF |
| 📧 rose | Email récupération | m*****@email.sn · Vérifié | Modifier |
| 💻 lavande | Sessions actives | 2 appareils · Dakar | Gérer |
| ⚠️ rouge | Zone dangereuse | Supprimer le compte | Supprimer + confirm |

### 14.2 Toggle 2FA
Interacteur visuel (bascule verte/grise) avec état persistant dans la session.

### 14.3 Suppression de compte
Demande confirmation JS `confirm()` avant action irréversible.
En production : modale avec re-saisie du numéro de téléphone + OTP.

---

## 15. COMPOSANTS RÉUTILISABLES

### 15.1 KPICard
```jsx
<KPICard
  gradient="--g3"
  icon="👁️"
  value={8432}
  label="Vues ce mois"
  badge="↑ 18%"
  animated
/>
```

### 15.2 ProfileCard (sidebar)
```jsx
<ProfileCard
  initials="MD"
  name="Moussa Diallo"
  city="Dakar, Sénégal"
  stats={{ listings: 12, rating: 4.8, sales: 127 }}
  badges={['✅ Vérifié', '👑 Pro']}
  gradient="--g1"
/>
```

### 15.3 AreaChart (SVG double courbe)
```jsx
<AreaChart
  data={viewsData}
  series={[
    { key: 'vues',     color: '#6366F1', filled: true },
    { key: 'favoris',  color: '#43E97B', dashed: true },
  ]}
  xAxis={labels}
  height={200}
  tooltip
  rangeSelector={['7J','30J','12M']}
/>
```

### 15.4 DonutChart
```jsx
<DonutChart
  data={[
    { label: 'Immobilier',   value: 42, color: '#43E97B' },
    { label: 'Voitures',     value: 25, color: '#667EEA' },
    { label: 'Électronique', value: 20, color: '#4FACFE' },
    { label: 'Autre',        value: 13, color: '#FA709A' },
  ]}
  size={130}
  strokeWidth={16}
  centerLabel="12"
  centerSub="annonces"
/>
```

### 15.5 ListingRow
```jsx
<ListingRow
  title="Villa F5 piscine Almadies"
  category="Immobilier"
  price="280 000 000 FCFA"
  views={1247}
  boost="À la Une"
  status="active"
  onEdit={() => {}}
  onBoost={() => {}}
  onDelete={() => {}}
/>
```

### 15.6 ChatBubble
```jsx
<ChatBubble
  text="Oui, toujours disponible !"
  time="10:30"
  isMine={true}
/>
```

### 15.7 FavoriteCard
```jsx
<FavoriteCard
  title="Toyota Land Cruiser 200 2020"
  category="Voitures"
  price="55 000 000 FCFA"
  location="Bamako, ACI 2000"
  emoji="🚗"
  gradient="--g1"
  onRemove={() => {}}
/>
```

### 15.8 ReviewItem
```jsx
<ReviewItem
  author="Aminata K."
  date="15/06/2025"
  stars={5}
  text="Excellent vendeur, très réactif."
  avatarGradient="--g5"
  onReply={() => {}}
/>
```

### 15.9 BoostOption
```jsx
<BoostOption
  icon="⭐"
  name="Premium"
  price="3 500 FCFA"
  advantages={['Top des résultats', 'Badge doré', '60 jours']}
  popular
  onSelect={() => {}}
/>
```

### 15.10 SecurityItem
```jsx
<SecurityItem
  icon="🔐"
  color="--g3"
  title="Authentification 2 facteurs"
  subtitle="Actif — Code SMS à chaque connexion"
  hasToggle
  toggleOn
  actionLabel="Configurer"
  onAction={() => {}}
/>
```

### 15.11 EmptyState
```jsx
<EmptyState
  emoji="🤍"
  title="Aucun favori"
  description="Touchez ❤ sur une annonce pour la retrouver ici"
  actionLabel="Explorer les annonces"
  onAction={() => navigate('/listing')}
/>
```

### 15.12 ProgressBar
```jsx
<ProgressBar
  label="Réactivité"
  value={4.9}
  max={5}
  color="--g4"
/>
```

---

## 16. API & ENDPOINTS

### 16.1 Profil utilisateur
```
GET   /users/me                      → profil complet
PUT   /users/me                      → modifier profil
POST  /users/me/avatar               → upload photo
GET   /users/me/stats                → statistiques personnelles
```

### 16.2 Mes annonces
```
GET   /users/me/listings             → toutes mes annonces
GET   /users/me/listings?status=active
POST  /listings                      → créer annonce
PUT   /listings/:id                  → modifier
DELETE /listings/:id                 → supprimer (confirmation)
POST  /listings/:id/boost            → activer un boost
```

### 16.3 Messages & Chat
```
GET   /users/me/conversations        → liste conversations
GET   /conversations/:id/messages    → messages d'une conversation
POST  /conversations/:id/messages    → envoyer un message

WebSocket : ws://api/users/me/chat
  ← event: {type:'message', conversation_id, sender, text, time}
  → event: {type:'send', conversation_id, text}
```

### 16.4 Favoris
```
GET   /users/me/favorites            → liste favoris
POST  /users/me/favorites/:listing_id → ajouter
DELETE /users/me/favorites/:listing_id → retirer
```

### 16.5 Statistiques
```
GET   /users/me/stats/views?range=30d  → vues par jour
GET   /users/me/stats/traffic          → sources de trafic
GET   /users/me/stats/top-listings     → top annonces par vues
```

### 16.6 Paiements & Boosts
```
GET   /users/me/payments              → historique paiements
GET   /users/me/active-plan           → plan actif
POST  /payments/boost                 → initier paiement boost
  body: { listing_id, boost_type, payment_method }
```

### 16.7 Avis
```
GET   /users/me/reviews               → avis reçus
GET   /users/me/reviews/stats         → note globale + répartition
POST  /reviews/:id/reply              → répondre à un avis
```

### 16.8 Sécurité
```
GET   /users/me/sessions              → sessions actives
DELETE /users/me/sessions/:id         → déconnecter une session
DELETE /users/me/sessions             → tout déconnecter
PATCH /users/me/2fa                   → activer/désactiver
DELETE /users/me                      → supprimer compte (confirm OTP)
```

### 16.9 Notifications (temps réel)
```javascript
// WebSocket pour feed d'activité et messages
const ws = new WebSocket('wss://api.annonceswest.com/users/me/live');
ws.onmessage = ({ data }) => {
  const event = JSON.parse(data);
  // Types : new_message | new_view | new_favorite |
  //         new_review | payment_confirmed | listing_approved
};
```

---

## 17. CHECKLIST DE LIVRAISON

### Design & UX
- [ ] Sidebar responsive (burger, overlay, animation slide)
- [ ] Carte profil en gradient avec stats dans sidebar
- [ ] Topbar sticky avec backdrop blur
- [ ] Bannière boost contextuelle
- [ ] Hero profil avec avatar, badges, 4 KPIs en grille
- [ ] 4 KPI cards colorées avec compteurs animés
- [ ] Graphique aire double courbe SVG + tooltip + sélecteur période
- [ ] Donut catégories annonces
- [ ] Tableau annonces récentes dans vue d'ensemble
- [ ] Feed d'activité chronologique
- [ ] Filtres rapides (Toutes / Actives / En attente / Expirées)
- [ ] Chat bicolonnes (liste + fenêtre) avec bulles
- [ ] Chat responsive mobile (vues alternées)
- [ ] Grille favoris supprimables + état vide animé
- [ ] Barres statistiques + sources trafic + top annonces
- [ ] Cartes d'options boost avec badge POPULAIRE
- [ ] Avis avec barres de répartition étoiles + critères
- [ ] Formulaire profil avec barre de complétude
- [ ] Éléments sécurité avec toggle 2FA
- [ ] Mode sombre (optionnel, toggle header)
- [ ] Responsive mobile parfait sur toutes les pages
- [ ] Zéro dépendance externe (polices système, pas d'images CDN)

### Fonctionnel
- [ ] Toutes les 9 pages fonctionnelles et naviguées
- [ ] Chat : envoi de messages + réponse temps réel (WebSocket)
- [ ] Suppression favoris avec état vide
- [ ] Sélecteur période graphique (7J/30J/12M) qui recalcule
- [ ] Actions annonces (modifier, booster, supprimer avec confirm)
- [ ] Toggle 2FA avec état persistant
- [ ] Suppression compte avec double confirmation
- [ ] Bouton « + Publier » accessible depuis tous les contextes
- [ ] Tooltips sur points du graphique

### Technique
- [ ] WebSocket chat temps réel
- [ ] Toutes les API REST connectées
- [ ] Upload photo de profil
- [ ] Pagination annonces (ou scroll infini)
- [ ] Notifications push (nouvelles vues, messages)
- [ ] JWT auth protège toutes les routes `/users/me/*`
- [ ] Zéro requête externe (autonome sans internet)

---

## 📁 FICHIERS LIVRÉS

| Fichier | Description |
|---------|-------------|
| `user_dashboard.html` | Démo interactive complète (64 Ko, 0 dépendance externe) |
| `USER_DASHBOARD_SPEC.md` | Ce document de spécification |
| `admin_dashboard.html` | Dashboard administrateur (56 Ko) |
| `ADMIN_DASHBOARD_SPEC.md` | Spécification admin |

---

*YamaneTech · AnnoncesWest User Dashboard v1.0*
*La démo HTML est 100% autonome — fonctionne sans connexion internet*
