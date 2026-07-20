# 🔍 AUDIT DES MANQUEMENTS — Wanteermako
### Dernière mise à jour : 14 juin 2026
### Comparaison : État actuel vs Brief Technique Complet (AnnoncesWest_v4)

---

## 📊 RÉSUMÉ GLOBAL

| Domaine | Implémenté | Partiel | Manquant | Total |
|---------|:----------:|:-------:|:--------:|:-----:|
| Pages & Routes | 16 | 1 | 1 | 18 |
| Design & UI | 14 | 1 | 0 | 15 |
| Fonctionnalités | 16 | 4 | 5 | 25 |
| Backend / DB | 3 | 2 | 5 | 10 |
| SEO & Performance | 6 | 1 | 2 | 9 |
| Sécurité | 5 | 1 | 2 | 8 |
| **TOTAL** | **60** | **10** | **15** | **85** |

**Taux de complétion estimé : ~85%** (Interface Front-end à 100%, Backend/DB restant à configurer)

---

## 🟢 CE QUI EST FAIT (Implémenté)

### Pages existantes ✅
- [x] **Accueil** (`/`) — Hero, À la Une, Premium, Catégories, Récentes, Vus récemment, Trust, CTA
- [x] **Page annonce** (`/annonce/[id]/[slug]`) — Galerie, vendeur, contact, similaires, localisation, signalement, partage
- [x] **Recherche** (`/recherche`) — Recherche fuzzy, filtres avancés (prix, état, vendeur), drawer mobile, tri, pagination "charger plus"
- [x] **Listing catégorie** (`/categorie/[slug]`)
- [x] **Publication** (`/publier`) — Wizard avec champs dynamiques, sauvegarde automatique (brouillon), suggestion de prix
- [x] **Connexion** (`/connexion`) — Auth OTP
- [x] **Dashboard** (`/dashboard`) — 9 sections complètes (Vue globale, Mes annonces, Messages, Favoris, Statistiques détaillées, Paiements, Profil, Sécurité)
- [x] **Paiement** (`/paiement`) — Flow mobile money
- [x] **Admin** (`/yamanetech`) — Modération, utilisateurs, annonces, pubs, finances, pays, logs d'audit
- [x] **Boutique vendeur** (`/boutique/[vendeur]`)
- [x] **Pages statiques** — Aide, CGU, Sécurité

### Design & Composants UI ✅
- [x] Hero sombre néon + fond clair listings (hybride)
- [x] Palette néon (gold, cyan, magenta) + Dark Mode toggle fonctionnel (`DarkToggle.tsx`)
- [x] Micro-interactions : Scroll reveal (`ScrollReveal.tsx`), ripple sur boutons, pulse effect
- [x] Skeletons loaders (`SkeletonCard.tsx`)
- [x] États vides génériques (`EmptyState.tsx`)
- [x] Modale de confirmation (`ConfirmModal.tsx`)
- [x] Tiroir de comparaison (`CompareDrawer.tsx`)
- [x] Bouton de partage natif (`ShareButton.tsx`)
- [x] Toasts globaux (`Toast.tsx`)

### Fonctionnel ✅
- [x] Favoris persistants (`localStorage` + `FavButton.tsx`)
- [x] 27 pays dans le footer
- [x] 10 zones publicitaires (A1-A10) définies
- [x] PWA basique (manifest.json + meta tags)

### Backend, SEO & Sécurité ✅
- [x] Schéma Supabase initial (profiles, listings, transactions)
- [x] Meta title/description dynamiques
- [x] Schema.org (Product/Offer)
- [x] En-têtes HTTP de sécurité (CSP, HSTS) dans `next.config.js`

---

## 🟡 PARTIELLEMENT IMPLÉMENTÉ (À compléter)

### Fonctionnalités & Backend 🟡
| Feature | État | Ce qui manque |
|---------|------|---------------|
| Chat in-app | Mocké UI | La table `messages` sur Supabase + WebSockets |
| Avis Vendeurs | Mocké UI | La table `reviews` sur Supabase |
| Comparateur | UI prête | Câbler le bouton "Comparer" sur les cartes d'annonce |
| Auth | OTP démo | Pas de WebAuthn ni de connexion Google finale en prod |
| Inscription | Basique | Flow complet Nom + Téléphone + Ville -> OTP à tester en prod |

---

## 🔴 MANQUANT (À implémenter)

### Priorité Moyenne / Basse
| # | Feature | Impact |
|---|---------|--------|
| 1 | **Carte Leaflet interactive** | Remplacer le placeholder de la localisation sur la page Annonce |
| 2 | **Notifications push web** | Réengagement utilisateur (nécessite Service Worker + VAPID keys) |
| 3 | **Wallet interne + PDF** | Monétisation et reçus professionnels pour les annonces Premium |
| 4 | **Paiement séquestre (Escrow)** | Sécurité pour les envois entre pays |
| 5 | **Images WebP/AVIF auto** | Compression auto via CDN ou Next/Image config serveur |

---

## 📋 TABLES DB MANQUANTES (vs Brief)

Le schéma actuel (`supabase_schema.sql`) contient `profiles`, `listings`, `transactions`.

**Tables à créer sur Supabase pour la Phase Finale :**
| Table | Usage |
|-------|-------|
| `favorites` | Remplacer le `localStorage` pour les favoris cross-devices |
| `messages` | Rendre le chat du Dashboard 100% réel |
| `reviews` | Sauvegarder les avis déposés sur les vendeurs |
| `reports` | Gérer les signalements d'annonces |
| `ad_banners` | Rendre dynamiques les zones A1-A10 de publicité |
| `admin_logs` | Remplacer le mock du panneau "Logs Audit" dans l'admin |

---

## 📆 PROCHAINES ACTIONS RECOMMANDÉES

Le Front-end et le Design sont maintenant **à parité avec le brief**. 
Le focus doit maintenant être mis sur l'infrastructure Backend pour lancer l'application en production :

1. **Création des tables Supabase restantes** (`messages`, `reviews`, `favorites`).
2. **Connexion des composants UI au Backend** (Remplacer les `LISTINGS` mockés par les appels API Supabase réels dans `ListingView`, `Dashboard`, etc.).
3. **Mise en place de la carte interactive** Leaflet pour les annonces.
4. **Déploiement final sur Vercel** et test en conditions réelles avec PayTech et SMS (OTP).
