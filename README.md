# Le bocal de Sandra

Mini-app web (PWA) : un bocal rempli de petits papiers. Chaque tap en fait sortir un au hasard, sans répétition.
Quand le bocal est vide, un papier doré s'ouvre sur la lettre finale.

## Installer sur l'iPhone de Sandra (une seule fois)
L'installation se fait **sur son iPhone, dans Safari** (pas depuis un autre téléphone) :
1. Ouvrir le lien du site dans **Safari**.
2. Bouton **Partager** (carré avec une flèche) → **Sur l'écran d'accueil** → Ajouter.
3. Ouvrir ensuite le bocal **depuis l'icône** et taper son petit nom.

L'app installée et Safari ne partagent pas leur mémoire : c'est l'icône qui garde la progression.
Après ça, plus besoin de toucher son téléphone.

## Ajouter des mots (depuis chez toi, quand tu veux)
1. Sur GitHub (site ou appli mobile), ouvrir **`messages.js`** sur la branche `main` → crayon ✏️.
2. Ajouter une ligne à la fin de la liste, avant `];`, avec un **nouvel id** :
   ```js
   { id: 31, categorie: "Tendre", texte: "Ton nouveau mot ici." },
   ```
3. **Commit changes**. Le site se met à jour en 1 à 2 minutes.

La prochaine fois que Sandra ouvre le bocal (ou y revient), les nouveaux papiers sont dedans
et l'accueil affiche « ✨ 2 nouveaux mots pour toi ». Même si elle avait tout lu, le bocal se remplit à nouveau.

Règles :
- Ne jamais réutiliser ni changer l'`id` d'un mot existant (c'est lui qui retient « déjà lu »).
- Garder les guillemets droits `"` autour du texte ; pour une apostrophe, `'` fonctionne tel quel.
- Une photo ? L'envoyer dans `photos/` puis ajouter `photo: "photos/nom.jpg"` au mot.
- On peut aussi modifier la lettre finale (`LETTRE_FINALE`) de la même façon.

Rien d'autre à changer : l'app va chercher la dernière version toute seule quand elle est en ligne,
et garde une copie pour fonctionner hors ligne.

## Photos
Voir `photos/LISEZ-MOI.md`.

## Tester sur l'ordinateur
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000

## Mettre en ligne (GitHub Pages)
1. Fusionner la PR dans `main`.
2. Sur GitHub : Settings → Pages → Source « Deploy from a branch » → `main` / `(root)`.
3. Le lien sera du type `https://<compte>.github.io/<dépôt>/`.

## Détails
- Progression, favoris et mots déjà connus gardés sur son téléphone (`localStorage`).
- « Recommencer le bocal » se trouve en bas de l'écran « Mes mots ».
- Le mot marqué `dernier: true` (n° 30) sort toujours en dernier parmi les mots présents.
- Sur iPhone, pas de vibration (Safari ne le permet pas) ; le son passe si le mode silencieux est coupé.
