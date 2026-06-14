# 👑 PLAN D'IMPLÉMENTATION — TABLEAU DE BORD SUPER ADMIN
## Annonce.ID — Konnecta Groupe | Niveau : ENTREPRISE

> **Version** : 2.0 Pro  
> **Propriétaire** : Konnecta Groupe  
> **Stack** : Next.js 14 (App Router) · Supabase · Tailwind CSS · Shadcn/UI  
> **Statut** : Prêt à déployer

---

## 📐 VISION GLOBALE

Le panneau Super Admin est le **centre nerveux souverain** d'Annonce.ID. Il offre à Konnecta Groupe une visibilité totale, un contrôle opérationnel complet et des outils de monétisation avancés — accessible uniquement par l'administrateur certifié.

```
annonce-id/
└── app/
    └── yamanetech/
        └── super-admin/
            ├── layout.tsx              ← Layout dédié (Sidebar Noire/Gold)
            ├── page.tsx                ← Dashboard principal (Vue d'ensemble)
            ├── moderation/
            │   └── page.tsx            ← File d'attente des annonces
            ├── publicites/
            │   └── page.tsx            ← Gestion des campagnes bannières
            ├── utilisateurs/
            │   └── page.tsx            ← Gestion des boutiques/comptes
            ├── finances/
            │   └── page.tsx            ← Revenus & transactions
            ├── categories/
            │   └── page.tsx            ← Gestion des catégories
            ├── parametres/
            │   └── page.tsx            ← Config système
            └── _components/
                ├── AdminSidebar.tsx
                ├── StatsCard.tsx
                ├── AnnonceRow.tsx
                ├── PubliciteRow.tsx
                └── UserRow.tsx
```

---

## 🔐 MODULE 1 — ARCHITECTURE & SÉCURITÉ

### 1.1 Middleware de Protection

```typescript
// middleware.ts (racine du projet)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL // ← Variable d'environnement sécurisée

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  if (req.nextUrl.pathname.startsWith('/yamanetech/super-admin')) {
    // Aucune session → login
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    // Session mais pas l'admin → accueil (accès silencieusement refusé)
    if (session.user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }
  return res
}

export const config = {
  matcher: ['/yamanetech/super-admin/:path*'],
}
```

### 1.2 Variables d'Environnement

```env
# .env.local (NE JAMAIS committer sur Git)
SUPER_ADMIN_EMAIL=votre-email@konnecta.com
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   ← Clé secrète pour opérations admin
```

### 1.3 Layout Sidebar Noire/Gold

```typescript
// app/yamanetech/super-admin/layout.tsx
import AdminSidebar from './_components/AdminSidebar'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-[#111111]">
        {children}
      </main>
    </div>
  )
}
```

**Design Sidebar :**
- Fond : `#0D0D0D` (noir absolu)
- Accent / icônes actifs : `#D4AF37` (gold)
- Typographie : Inter 600 pour les titres de section
- Logo Konnecta Groupe en haut (avec badge "SUPER ADMIN")
- Séparateurs subtils gold entre les sections

---

## 📊 MODULE 2 — DASHBOARD VUE D'ENSEMBLE

### 2.1 KPIs Temps Réel (Cartes Statistiques)

| Métrique | Source DB | Icône | Couleur |
|----------|-----------|-------|---------|
| Total Annonces | `COUNT(annonces)` | 📋 | Bleu |
| En Attente | `WHERE statut='pending'` | ⏳ | Orange |
| Utilisateurs Inscrits | `COUNT(profiles)` | 👥 | Vert |
| Annonces Actives | `WHERE statut='approved'` | ✅ | Vert émeraude |
| Campagnes Pub Actives | `WHERE pub.active=true` | 📢 | Gold |
| Boutiques Vérifiées | `WHERE badge_verifie=true` | ⭐ | Gold |

### 2.2 Graphique d'Activité Hebdomadaire

```typescript
// Utiliser Recharts pour le graphe
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// Requête Supabase
const { data } = await supabase
  .from('annonces')
  .select('created_at')
  .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

// Grouper par jour → afficher courbe de publications
```

### 2.3 Alertes Prioritaires

- 🔴 **Annonces signalées** par des utilisateurs (modération urgente)
- 🟡 **Campagnes pubs expirées** à renouveler
- 🟢 **Nouveaux utilisateurs** inscrits aujourd'hui

---

## 🗂️ MODULE 3 — MODÉRATION DES ANNONCES ⚡ PRIORITÉ #1

C'est le cœur opérationnel. Une annonce ne doit **jamais** être visible sans validation admin.

### 3.1 Schéma de la Table `annonces`

```sql
-- Table Supabase
CREATE TABLE annonces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES profiles(id),
  titre         TEXT NOT NULL,
  description   TEXT,
  categorie     TEXT,
  prix          NUMERIC,
  localisation  TEXT,
  photos        TEXT[],           -- Tableau d'URLs Supabase Storage
  statut        TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected' | 'featured'
  motif_rejet   TEXT,             -- Rempli si rejeté
  is_featured   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
```

### 3.2 API Routes de Modération

```typescript
// app/api/admin/annonces/[id]/route.ts

// APPROUVER
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { action, motif } = await req.json()
  const supabase = createAdminClient() // utilise SERVICE_ROLE_KEY

  const updates = {
    approuver:  { statut: 'approved', updated_at: new Date() },
    rejeter:    { statut: 'rejected', motif_rejet: motif, updated_at: new Date() },
    mettre_en_avant: { statut: 'featured', is_featured: true, updated_at: new Date() },
  }

  const { error } = await supabase
    .from('annonces')
    .update(updates[action])
    .eq('id', params.id)

  if (error) return Response.json({ error }, { status: 500 })
  return Response.json({ success: true })
}
```

### 3.3 Interface File d'Attente

```
┌─────────────────────────────────────────────────────────────────┐
│  🗂️ MODÉRATION DES ANNONCES                    [47 en attente]  │
├─────────────────────────────────────────────────────────────────┤
│  Filtres: [Toutes ▼] [Catégorie ▼] [Date ▼]    🔍 Rechercher  │
├──────┬───────────────────────┬──────────┬────────┬─────────────┤
│ IMG  │ TITRE & AUTEUR        │ CATÉG.   │ PRIX   │ ACTIONS     │
├──────┼───────────────────────┼──────────┼────────┼─────────────┤
│ [📷] │ iPhone 15 Pro Max     │ 📱 Tech  │ 450k   │ ✅ ❌ ⭐ 👁 │
│      │ Par: Mamadou D.       │          │ FCFA   │             │
├──────┼───────────────────────┼──────────┼────────┼─────────────┤
│ [📷] │ Villa 4 pièces Dakar  │ 🏠 Immo  │ 2.5M   │ ✅ ❌ ⭐ 👁 │
│      │ Par: Fatou K.         │          │ FCFA   │             │
└──────┴───────────────────────┴──────────┴────────┴─────────────┘
```

**Actions disponibles par annonce :**
- `✅ Approuver` → statut = `approved`, notification à l'auteur
- `❌ Rejeter` → Modal avec motif obligatoire, statut = `rejected`
- `⭐ Mettre en avant` → statut = `featured`, badge visible sur l'annonce
- `👁 Aperçu` → Slide-over latéral avec photos + description complète

### 3.4 Modal de Rejet (UX Pro)

```typescript
// Modal avec motifs prédéfinis
const MOTIFS_REJET = [
  "Photos de mauvaise qualité",
  "Prix non renseigné",
  "Contenu inapproprié ou interdit",
  "Informations insuffisantes",
  "Doublon d'une annonce existante",
  "Autre (préciser ci-dessous)",
]
```

---

## 📢 MODULE 4 — GESTION DES PUBLICITÉS

### 4.1 Schéma Table `campagnes_pub`

```sql
CREATE TABLE campagnes_pub (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annonceur_id    UUID REFERENCES profiles(id),
  nom_campagne    TEXT NOT NULL,
  banniere_url    TEXT NOT NULL,    -- URL Supabase Storage
  lien_cible      TEXT,             -- URL de destination au clic
  emplacement     TEXT,             -- 'header' | 'sidebar' | 'feed' | 'footer'
  date_debut      DATE NOT NULL,
  date_fin        DATE NOT NULL,
  active          BOOLEAN DEFAULT false,  -- Activé manuellement après paiement
  paiement_recu   BOOLEAN DEFAULT false,
  mode_paiement   TEXT,             -- 'Orange Money' | 'Wave' | 'Free Money' | 'Espèces'
  montant         NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 4.2 Workflow de Validation

```
1. Client soumet bannière via Dashboard Annonceur
         ↓
2. Campagne créée avec active=false, paiement_recu=false
         ↓
3. Super Admin reçoit notification + voit dans la liste
         ↓
4. Client effectue paiement (Orange Money / Wave / Espèces)
         ↓
5. Super Admin coche "Paiement reçu" → active=true
         ↓
6. Bannière apparaît automatiquement sur la plateforme
```

### 4.3 Vue Calendrier des Campagnes

```
Juillet 2025
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│  Lun │  Mar │  Mer │  Jeu │  Ven │  Sam │  Dim │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│      │   1  │   2  │   3  │   4  │   5  │   6  │
│      │ [DIALLO ELEC ████████████████████]       │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│   7  │   8  │   9  │  10  │  11  │  12  │  13  │
│      │      │ [BOUTIQUE MODE ████████████]      │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

Implémentation avec `react-big-calendar` ou vue custom en grid CSS.

---

## 👥 MODULE 5 — GESTION DES UTILISATEURS & BOUTIQUES

### 5.1 Champs Profil Enrichis

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  badge_verifie     BOOLEAN DEFAULT false,
  statut_compte     TEXT DEFAULT 'actif',  -- 'actif' | 'suspendu' | 'banni'
  motif_suspension  TEXT,
  date_suspension   TIMESTAMPTZ,
  nombre_annonces   INT DEFAULT 0,
  signalements      INT DEFAULT 0,
  type_compte       TEXT DEFAULT 'particulier'; -- 'particulier' | 'boutique' | 'pro'
```

### 5.2 Actions Admin sur les Comptes

| Action | Condition déclenchante | Effet |
|--------|------------------------|-------|
| ✔️ Certifier Boutique | Vérification documents | Badge "Boutique Vérifiée" visible |
| ⏸️ Suspendre | Signalements multiples | Compte inactif temporairement |
| 🚫 Bannir | Fraude avérée | Compte définitivement bloqué |
| 📩 Contacter | Communication directe | Email via système admin |

### 5.3 Interface Liste Utilisateurs

```
┌──────────────────────────────────────────────────────────────────┐
│  👥 GESTION DES UTILISATEURS               [1,247 comptes]       │
├──────────────────────────────────────────────────────────────────┤
│  🔍 Rechercher par nom, email...   Filtre: [Tous ▼] [Statut ▼]  │
├─────────────────────┬──────────┬────────┬──────────┬────────────┤
│ UTILISATEUR         │ TYPE     │ ANNONCES│ STATUT  │ ACTIONS    │
├─────────────────────┼──────────┼────────┼──────────┼────────────┤
│ Mamadou Diallo      │ Boutique │   23   │ ✅ Actif │ ✔ ⏸ 🚫 📩 │
│ mamadou@gmail.com   │          │        │          │            │
├─────────────────────┼──────────┼────────┼──────────┼────────────┤
│ Fatou Keïta         │ Particulier│  5   │ ⏸ Susp. │ ✔ ▶ 🚫 📩 │
│ fatou@yahoo.fr      │          │        │          │            │
└─────────────────────┴──────────┴────────┴──────────┴────────────┘
```

---

## 💰 MODULE 6 — TABLEAU DES FINANCES

### 6.1 Vue Revenus (Estimés)

```typescript
// Calcul revenus estimés par source
const revenues = {
  boosts_annonces: await supabase
    .from('annonces')
    .select('prix_boost')
    .eq('is_featured', true),
  
  campagnes_pub: await supabase
    .from('campagnes_pub')
    .select('montant')
    .eq('paiement_recu', true),
}
```

**Affichage :**
- Total mensuel estimé en FCFA
- Répartition : Boosts vs Publicités vs Abonnements (futur)
- Export CSV des transactions

---

## 🗂️ MODULE 7 — GESTION DES CATÉGORIES

Permet d'ajouter, modifier, réordonner et désactiver les catégories d'annonces directement depuis le panneau sans toucher au code.

```sql
CREATE TABLE categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom       TEXT NOT NULL,
  slug      TEXT UNIQUE NOT NULL,
  icone     TEXT,              -- Emoji ou nom d'icône Lucide
  ordre     INT DEFAULT 0,
  active    BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES categories(id)  -- Pour sous-catégories
);
```

---

## ⚙️ MODULE 8 — PARAMÈTRES SYSTÈME

| Paramètre | Description |
|-----------|-------------|
| `annonce_auto_approve` | ON/OFF approbation automatique |
| `max_photos_par_annonce` | Nombre max de photos (défaut: 5) |
| `duree_annonce_jours` | Durée de vie d'une annonce (défaut: 30j) |
| `boost_price_fcfa` | Prix d'une mise en avant |
| `message_accueil` | Bannière message sur la homepage |
| `maintenance_mode` | Mettre le site en maintenance |

---

## 🗓️ PLAN D'ATTAQUE — SPRINTS

### SPRINT 1 — FONDATIONS SÉCURISÉES (Semaine 1)

- [ ] Middleware d'authentification super admin
- [ ] Layout Sidebar noire/gold avec navigation
- [ ] Page dashboard vide avec structure
- [ ] Variables d'environnement configurées
- [ ] Route `/yamanetech/super-admin` protégée et testée

### SPRINT 2 — MODÉRATION ⚡ (Semaine 2)

- [ ] File d'attente des annonces `pending`
- [ ] Boutons Approuver / Rejeter / Mettre en avant
- [ ] Modal de rejet avec motifs
- [ ] Aperçu rapide (slide-over) photos + description
- [ ] Notifications utilisateur après modération

### SPRINT 3 — PUBLICITÉS (Semaine 3)

- [ ] Liste des campagnes bannières soumises
- [ ] Activation/désactivation manuelle
- [ ] Case "Paiement reçu" + mode de paiement
- [ ] Vue calendrier des semaines occupées

### SPRINT 4 — UTILISATEURS (Semaine 4)

- [ ] Liste de tous les comptes avec search/filter
- [ ] Attribution badge "Boutique Vérifiée"
- [ ] Suspension et bannissement
- [ ] Historique des actions admin (audit log)

### SPRINT 5 — FINITIONS PRO (Semaine 5)

- [ ] Dashboard vue d'ensemble avec KPIs en temps réel
- [ ] Graphiques Recharts (activité hebdomadaire)
- [ ] Module finances (revenus estimés)
- [ ] Gestion catégories drag-and-drop
- [ ] Paramètres système
- [ ] Export CSV des données

---

## 🎨 DESIGN SYSTEM — SUPER ADMIN

```css
/* Palette Exclusive Super Admin */
--sa-bg-primary:    #0A0A0A;   /* Fond principal */
--sa-bg-card:       #141414;   /* Cartes & panels */
--sa-bg-sidebar:    #0D0D0D;   /* Sidebar */
--sa-gold:          #D4AF37;   /* Accent principal */
--sa-gold-light:    #F0CC60;   /* Hover gold */
--sa-gold-dark:     #A8892A;   /* Gold foncé */
--sa-success:       #22C55E;   /* Approuvé */
--sa-danger:        #EF4444;   /* Rejeté / Banni */
--sa-warning:       #F59E0B;   /* En attente / Alertes */
--sa-text:          #F5F5F5;   /* Texte principal */
--sa-text-muted:    #9CA3AF;   /* Texte secondaire */
--sa-border:        #2A2A2A;   /* Bordures */
```

---

## 🔔 SYSTÈME DE NOTIFICATIONS ADMIN

```typescript
// Triggers Supabase Realtime pour alertes temps réel
const channel = supabase
  .channel('admin-alerts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'annonces',
    filter: "statut=eq.pending"
  }, (payload) => {
    toast.warning(`Nouvelle annonce à modérer: ${payload.new.titre}`)
  })
  .subscribe()
```

**Types de notifications :**
- 🔴 Nouvelle annonce en attente
- 🟡 Campagne pub soumise (paiement en attente)
- 🟠 Utilisateur signalé 3+ fois
- 🟢 Paiement mobile money reçu (intégration future)

---

## 📋 CHECKLIST FINALE AVANT LANCEMENT

### Sécurité
- [ ] Email super admin configuré en variable d'environnement (jamais en dur dans le code)
- [ ] Middleware testé : accès refusé pour tout autre email
- [ ] `SUPABASE_SERVICE_ROLE_KEY` utilisée uniquement côté serveur
- [ ] RLS (Row Level Security) activé sur toutes les tables Supabase
- [ ] Audit log de toutes les actions admin

### Performance
- [ ] Pagination sur toutes les listes (max 20 items/page)
- [ ] Index sur `statut`, `created_at`, `user_id` dans la table annonces
- [ ] Optimistic updates pour les actions de modération

### UX
- [ ] Confirmation avant toute action destructive (bannir, supprimer)
- [ ] Loading states sur tous les boutons d'action
- [ ] Toast notifications pour feedback immédiat
- [ ] Responsive (fonctionne sur tablette pour modération mobile)

---

## 🚀 COMMANDE DE LANCEMENT

**Pour démarrer l'implémentation, fournir :**

1. **L'email exact du Super Admin** → sera stocké dans `.env.local`
2. **Confirmation** : "Lance le Super Admin"

Puis exécution dans l'ordre : Sprint 1 → 2 → 3 → 4 → 5

---

*Plan rédigé pour Konnecta Groupe — Annonce.ID Platform*  
*Architecture : Next.js 14 App Router + Supabase + Tailwind CSS*  
*Niveau : Production Enterprise*
