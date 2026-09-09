# L'application mobile Wanteermako

Une seule application pour les trois services — annonces, devis et factures,
CV et lettres. Un artisan qui fait sa facture aujourd'hui aura besoin d'un CV
dans six mois : lui demander de télécharger une deuxième application, c'est le
perdre.

---

## Ce qui est déjà fait, et ce que ça vaut

Le site **est déjà une application installable**. Pas « peut le devenir » :
`manifest.json`, `sw.js`, `PWARegister.tsx`, notifications push — tout est en
place et en ligne.

Sur Android, n'importe qui peut aujourd'hui ouvrir wanteermako.com dans Chrome,
menu → **« Installer l'application »**, et obtenir une icône sur son écran
d'accueil, en plein écran, sans barre d'adresse. Aucun store, aucun
téléchargement de 40 Mo, aucun compte Google Play.

**Sur ce marché, c'est supérieur à une application native** : personne ne
dépense son forfait data pour installer 40 Mo.

Ce que le Play Store ajoute, ce n'est pas de la technique — c'est de la
**crédibilité** et de la **découvrabilité**. C'est un argument commercial réel,
et c'est pour ça qu'on y va.

---

## Android — le chemin sûr

**TWA** (*Trusted Web Activity*) : une coquille native qui affiche le site en
plein écran. C'est le chemin que Google documente et encourage, et il passe la
validation Play sans difficulté.

### Ce qu'il faut, et que je ne peux pas faire à ta place

| Élément | Où | Coût |
|---|---|---|
| Compte Play Console | play.google.com/console | **25 $ une fois** |
| Java 17 + Android SDK | sur une machine | gratuit |

Cette machine n'a **ni Java ni le SDK Android** — j'ai vérifié. Le paquet ne
peut donc pas être fabriqué ici.

### Les étapes

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://www.wanteermako.com/manifest.json
bubblewrap build          # produit app-release-bundle.aab
```

Puis dans la Play Console : créer l'application, téléverser le `.aab`.

### L'étape que tout le monde rate

Google signe l'application et te donne une **empreinte SHA-256**
(Play Console → *Configuration* → *Intégrité de l'app*).

Pose-la dans Vercel :

```
TWA_PACKAGE_NAME         = com.wanteermako.app
TWA_SHA256_FINGERPRINTS  = AA:BB:CC:…   (celle de Google, puis celle de ta
                                         clef de téléversement, séparées par
                                         une virgule)
```

Puis **redéploie**, et vérifie :

```
https://www.wanteermako.com/.well-known/assetlinks.json
```

Sans cette empreinte, l'application fonctionne **mais affiche une barre
d'adresse en haut**. L'utilisateur voit l'URL, et ce n'est plus une
application — c'est un navigateur déguisé.

Tant que la variable est vide, l'adresse répond **404**, volontairement : un
fichier contenant une fausse empreinte est pire que pas de fichier, parce que
la vérification échoue au lieu d'être simplement absente.

---

## iOS — dis-toi la vérité avant de payer

**Apple refuse les applications qui ne sont qu'un site web emballé.** C'est la
règle 4.2 (*Minimum Functionality*), et elle est appliquée. Une coquille
WebView se fait rejeter — ce n'est pas une rumeur, c'est le motif de refus le
plus courant.

Il faut aussi :

| Élément | Coût |
|---|---|
| Apple Developer Program | **99 $ par an**, à renouveler |
| Un Mac avec Xcode | obligatoire, pas de contournement |

### Ce que je recommande

**Fais Android d'abord. Seul.**

Ton public est massivement sur Android. Tu verras le nombre réel
d'installations, et tu sauras si l'iPhone vaut 99 $ par an plus un Mac.

Si tu y vas quand même, il faudra donner à l'application iOS de vraies
fonctions natives — appareil photo pour les annonces, partage système,
notifications, un mode hors-ligne réel — sinon le refus est quasi certain.
Ce n'est plus de l'emballage, c'est un développement.

---

## L'ordre que je conseille

1. **Mettre en avant l'installation PWA** sur le site — un bandeau
   « Installer l'application ». Gratuit, immédiat, ça marche dès aujourd'hui.
2. **Android / Play Store** via TWA — 25 $, quelques heures.
3. **iOS** — seulement si les chiffres d'Android le justifient.

L'étape 1 n'est pas un lot de consolation : elle te donne des installations
dès cette semaine, pendant que le reste attend un compte développeur.
