# Assistant IA WhatsApp

Cette integration repond automatiquement aux messages entrants sur un numero WhatsApp Business via Meta WhatsApp Cloud API.

## Variables d'environnement

```env
GEMINI_API_KEY=...

WHATSAPP_AI_ENABLED=true
WHATSAPP_VERIFY_TOKEN=un-token-secret-a-choisir
WHATSAPP_ACCESS_TOKEN=token-whatsapp-cloud-api
WHATSAPP_PHONE_NUMBER_ID=id-du-numero-whatsapp
WHATSAPP_APP_SECRET=secret-app-meta
WHATSAPP_GRAPH_VERSION=v20.0
```

`WHATSAPP_APP_SECRET` est optionnel en local, mais recommande en production pour verifier la signature Meta.

## Webhook Meta

Dans Meta Developers, configurer le webhook WhatsApp avec:

```text
Callback URL: https://ton-domaine.com/api/whatsapp/webhook
Verify token: la valeur de WHATSAPP_VERIFY_TOKEN
```

Puis abonner le webhook a l'evenement `messages`.

## Base de donnees

Executer `database/MIGRATION_WHATSAPP_AI.sql` dans Supabase pour garder un journal et eviter les doubles reponses si Meta renvoie le meme webhook.

Le bot fonctionne quand meme sans cette table, mais le dedoublonnage persistant est moins fort.

## Comportement

- Le bot repond uniquement aux messages entrants.
- Il cherche des annonces actives pertinentes dans Supabase et peut envoyer jusqu'a 3 liens.
- Il utilise Gemini si `GEMINI_API_KEY` est configuree.
- Sans cle IA, il repond avec un modele simple.
- Les statuts WhatsApp et les webhooks sans message sont ignores.
