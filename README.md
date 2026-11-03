# Le bocal de Sandra

Mini-app web (PWA) : un bocal rempli de 30 petits papiers. Chaque tap en fait sortir un au hasard, sans répétition.
Quand le bocal est vide, un papier doré s'ouvre sur la lettre finale.

## Modifier les mots
Tout est dans **`messages.js`** : les 30 mots, la lettre finale, la signature et les surnoms acceptés à l'entrée.
Penser à remplacer les deux `[À PERSONNALISER]` (mot n° 25 et lettre finale).

Après chaque modification, changer `VERSION` dans `service-worker.js` (ex. `bocal-v2`)
pour que le téléphone récupère la nouvelle version.

## Photos
Voir `photos/LISEZ-MOI.md`.

## Tester sur l'ordinateur
```
python3 -m http.server 8000
```
puis ouvrir http://localhost:8000

## Mettre en ligne (GitHub Pages)
1. Fusionner cette branche dans `main`.
2. Sur GitHub : Settings → Pages → Source « Deploy from a branch » → `main` / `(root)`.
3. Le lien sera du type `https://<compte>.github.io/<dépôt>/`.

Sur le téléphone : ouvrir le lien dans Chrome, puis menu ⋮ → « Ajouter à l'écran d'accueil ».

## Détails
- Progression, favoris et dernière visite gardés dans le `localStorage` du téléphone.
- Fonctionne hors ligne après la première visite.
- « Recommencer le bocal » se trouve en bas de l'écran « Mes mots ».
- Le mot marqué `dernier: true` (n° 30) sort toujours en dernier, puisqu'il annonce le papier doré.
