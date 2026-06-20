# Publication automatique sur les réseaux (gratuit, natif Next.js)

Plus besoin de Make.com payant : la plateforme génère les textes avec **Gemini 1.5 Flash (gratuit)**
et publie directement les annonces via les **API gratuites** de chaque réseau.

## 1. Variables d'environnement (`.env.local`)

```env
# IA (gratuit) — https://aistudio.google.com/app/apikey
GEMINI_API_KEY=...            # vide = repli automatique sur des textes templates

# Telegram (100% gratuit) — bot via @BotFather, mis admin du canal
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHANNEL_ID=@moncanal  # ou id numérique -100...

# Facebook Page (Graph API gratuite)
META_PAGE_ID=...
META_ACCESS_TOKEN=...           # token de Page longue durée (pages_manage_posts)

# Sécurité
CRON_SECRET=...                 # protège le cron Vercel
CAMPAIGN_WEBHOOK_SECRET=...     # protège le déclenchement manuel (header x-campaign-secret)
CAMPAIGN_BATCH_SIZE=3           # nb d'annonces publiées par exécution
```

> Aucun réseau configuré = rien n'est publié (le moteur l'indique clairement).
> Chaque réseau est indépendant : on peut n'activer que Telegram pour démarrer.

## 2. Comment ça marche

Le moteur partagé (`lib/campaign-engine.ts`) tourne en **deux phases**, appelé par le cron
`/api/campaign/auto-publish` (GET) et par le bouton admin (action `campaignAutoPublish`) :

**Phase 1 — posts planifiés à échéance** (rend le calendrier fonctionnel)
- prend les `campaign_posts` `status = scheduled` dont `scheduled_at` est passé ;
- publie sur la plateforme choisie (ou tous les réseaux si « Tous ») ;
- passe la ligne en `published` (ou `failed`).

**Phase 2 — nouvelles annonces sans post**
1. récupère les annonces **actives** sans post associé (max `CAMPAIGN_BATCH_SIZE`) ;
2. génère une légende vendeuse avec **Gemini** (repli template si pas de clé) ;
3. publie sur **tous les réseaux configurés** (`lib/social/`) ;
4. enregistre chaque résultat dans `campaign_posts` (`published` ou `failed`).

## 3. Déclenchement

- **Automatique** : cron Vercel (`vercel.json`) à 9h, 15h et 21h.
  Sur Vercel Hobby, les crons sont limités (≈ 1×/jour) — passer en Pro pour la fréquence ci-dessus.
- **Manuel** : bouton **« 🚀 Publier maintenant »** dans l'admin → *Campagne IA*.

## 4. Ajouter un réseau (Instagram, WhatsApp, X…)

1. créer `lib/social/<reseau>.ts` qui exporte un `Publisher` (voir `telegram.ts`) ;
2. l'ajouter au tableau `PUBLISHERS` dans `lib/social/index.ts`.

Le moteur et l'enregistrement en base fonctionnent automatiquement.
