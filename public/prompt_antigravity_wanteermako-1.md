# PROMPT — Intégration Campagne IA wanteermako.com (Page Admin)

Tu es un développeur fullstack expert. Tu travailles sur le projet **wanteermako.com** (site de petites annonces sénégalais). Le site tourne sur **Antigravity** et possède déjà :
- Une base de données d'annonces existante
- Des plans d'abonnement déjà intégrés (ne pas les modifier, ne pas les recréer)
- Une page admin existante

---

## MISSION

Intègre dans la **page admin existante** un nouveau module "Campagne IA 2025" qui permet de piloter une stratégie de croissance sur Facebook, Instagram et WhatsApp, entièrement automatisée via Make.com + ChatGPT + Canva + Buffer.

---

## RÈGLES ABSOLUES

1. **NE PAS toucher** aux plans d'annonces existants dans la BDD
2. **NE PAS recréer** de système de paiement — utiliser celui déjà en place
3. **NE PAS modifier** la structure des tables existantes
4. Ajouter uniquement de **nouvelles tables** préfixées `campaign_`
5. Tous les CTAs de monétisation doivent **pointer vers les plans existants** du site

---

## NOUVELLES TABLES À CRÉER

```sql
-- Statistiques sociales quotidiennes
CREATE TABLE campaign_daily_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  platform ENUM('facebook','instagram','whatsapp') NOT NULL,
  views INT DEFAULT 0,
  new_followers INT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  clicks_to_site INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts publiés via Make.com
CREATE TABLE campaign_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  annonce_id INT,  -- FK vers la table annonces existante
  platform ENUM('facebook','instagram','whatsapp','all') NOT NULL,
  caption TEXT,
  image_url VARCHAR(500),
  scheduled_at DATETIME,
  published_at DATETIME,
  status ENUM('draft','scheduled','published','boosted') DEFAULT 'draft',
  reach INT DEFAULT 0,
  reactions INT DEFAULT 0,
  shares INT DEFAULT 0,
  make_scenario_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Boosts sponsorisés vendus
CREATE TABLE campaign_boosts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  annonce_id INT,  -- FK vers annonces existante
  user_id INT,     -- FK vers users existante
  plan_existant_id INT,  -- FK vers les plans EXISTANTS du site
  duration_days INT DEFAULT 7,
  budget_fcfa INT DEFAULT 5000,
  platform ENUM('facebook','instagram','both') DEFAULT 'both',
  status ENUM('pending','active','completed') DEFAULT 'pending',
  started_at DATETIME,
  ended_at DATETIME,
  reach_total INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performances influenceurs
CREATE TABLE campaign_influenceurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100),
  plateforme VARCHAR(50),
  handle VARCHAR(100),
  followers INT,
  collaboration_type ENUM('barter','paid') DEFAULT 'barter',
  cout_fcfa INT DEFAULT 0,
  status ENUM('contacte','actif','termine') DEFAULT 'contacte',
  reach_genere INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rapport hebdomadaire auto (alimenté par Make.com)
CREATE TABLE campaign_weekly_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_start DATE,
  total_views INT DEFAULT 0,
  total_new_followers INT DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
  total_clicks INT DEFAULT 0,
  best_post_id INT,
  revenue_fcfa INT DEFAULT 0,
  boosts_sold INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## MODULE ADMIN — INTERFACE À CRÉER

### 1. Dashboard KPIs (vue principale)

Afficher 6 cartes métriques en temps réel :
- **Vues / jour** (objectif : 10 000+)
- **Nouveaux abonnés / semaine** (objectif : +500)
- **Taux d'engagement moyen** (objectif : 5–8%)
- **Clics vers wanteermako.com** (depuis Meta)
- **Abonnés Canal WhatsApp** (objectif : 1 000)
- **Revenus boosts (FCFA)** — lié aux plans existants

Chaque carte = valeur actuelle + barre de progression vers l'objectif + flèche tendance vs semaine précédente.

---

### 2. Tableau de Suivi des Posts

Colonnes : Annonce | Plateforme | Statut | Reach | Réactions | Partages | Date publication | Actions

Filtres : par plateforme / par statut / par semaine

Actions disponibles :
- **Voir le post** (lien direct FB/IG)
- **Booster** → ouvre modal avec les plans existants du site
- **Republier** → renvoie à Make.com via webhook

---

### 3. Planning Hebdomadaire (vue calendrier)

Grille 7 jours × 3 créneaux (07h / 12h30 / 20h WAT) :
- Cases vertes = post publié
- Cases orange = post schedulé
- Cases grises = vide (à remplir)
- Cliquer sur une case = voir ou créer un post

---

### 4. Gestion Influenceurs

Table CRUD complète sur `campaign_influenceurs`.
Afficher : nom, handle cliquable, followers, type collab, statut, reach généré.
Bouton "Contacter" → ouvre template DM pré-rempli.

---

### 5. Rapports Hebdomadaires

Tableau des rapports avec graphiques :
- Courbe de croissance abonnés (semaine par semaine)
- Histogramme vues par plateforme (FB / IG / WA)
- Top 5 posts de la semaine (par reach)
- Revenus générés via boosts

---

### 6. Configuration Outils (Settings)

Champs de configuration à sauvegarder en BDD ou .env :
```
MAKE_WEBHOOK_URL=         (URL du webhook Make.com pour déclencher un post)
MAKE_MONITOR_WEBHOOK=     (URL pour le scénario de monitoring)
META_PAGE_ID=             (ID de la Page Facebook wanteermako)
META_ACCESS_TOKEN=        (Token Meta Business API)
BUFFER_ACCESS_TOKEN=      (Token Buffer API)
MANYCHAT_API_KEY=         (Clé ManyChat pour WhatsApp)
OPENAI_API_KEY=           (Clé ChatGPT pour génération captions)
CANVA_ACCESS_TOKEN=       (Token Canva API)
CANVA_TEMPLATE_IMMO=      (Template ID Canva — immobilier)
CANVA_TEMPLATE_AUTO=      (Template ID Canva — voitures)
CANVA_TEMPLATE_EMPLOI=    (Template ID Canva — emploi)
```

---

## WORKFLOW MAKE.COM — ENDPOINTS À EXPOSER

Créer ces routes API que Make.com appellera :

```
POST /api/campaign/post-published
  Body: { annonce_id, platform, caption, image_url, reach, make_scenario_id }
  Action: insère dans campaign_posts avec status='published'

POST /api/campaign/stats-update
  Body: { date, platform, views, new_followers, engagement_rate, clicks_to_site }
  Action: upsert dans campaign_daily_stats

POST /api/campaign/weekly-report
  Body: { week_start, total_views, total_new_followers, avg_engagement, total_clicks, revenue_fcfa }
  Action: insère dans campaign_weekly_reports

GET /api/campaign/pending-annonces
  Action: retourne les 10 dernières annonces sans post associé dans campaign_posts
  (Make.com appelle cet endpoint toutes les 15 min pour déclencher le workflow)

POST /api/campaign/boost-request
  Body: { annonce_id, user_id, plan_existant_id, duration_days, platform }
  Action: insère dans campaign_boosts + déclenche Make webhook pour Meta Ads
```

---

## LOGIQUE MÉTIER

### Génération automatique de post via Make.com

Quand une nouvelle annonce est publiée sur wanteermako.com :
1. Make.com appelle `GET /api/campaign/pending-annonces`
2. Pour chaque annonce → ChatGPT génère une caption (français + 1 phrase wolof)
3. Canva API crée le visuel avec le template de la catégorie
4. Buffer schedule le post aux créneaux WAT (07h / 12h30 / 20h)
5. Make.com appelle `POST /api/campaign/post-published` pour mettre à jour l'admin

### Boost d'annonce

Quand un utilisateur achète un boost via les **plans existants du site** :
1. Le paiement est géré par le système existant (ne pas modifier)
2. Appeler `POST /api/campaign/boost-request` avec le plan_existant_id
3. L'admin affiche le boost en statut "pending" → "active" → "completed"

### Monitoring viral

Make.com vérifie les stats Meta toutes les 6h.
Si un post dépasse 200 interactions → Make appelle `POST /api/campaign/stats-update` avec flag `is_viral=true`.
L'admin affiche une alerte "🔥 Post viral détecté" avec bouton "Booster maintenant".

---

## OBJECTIFS KPIs (à afficher comme cibles dans l'admin)

| Métrique | Semaine 1 | Semaine 2 | Semaine 4 | Objectif final |
|---|---|---|---|---|
| Vues / jour | 500–1K | 2K–5K | 10K+ | 10 000+ |
| Nouveaux abonnés FB | +50 | +150 | +500 | +500/sem |
| Taux engagement | 2–3% | 4–5% | 5–8% | 5–8% |
| Canal WA abonnés | 0–100 | 100–300 | 1 000+ | 1 000+ |
| Clics vers site | 200–500 | 1K–2K | 5K+ | 5 000+/sem |
| Revenus boosts (FCFA) | 0 | 20 000 | 100 000+ | 200 000+/mois |

---

## STACK TECHNIQUE

Utilise le stack existant du projet Antigravity (ne pas changer).
Si besoin de graphiques : utiliser Chart.js (léger, pas de dépendance lourde).
Design : rester cohérent avec l'admin existant, ajouter une couleur d'accent `#00C853` pour les éléments de la campagne.

---

*wanteermako.com · Campagne IA 2025 · Prompt généré pour intégration Antigravity*
