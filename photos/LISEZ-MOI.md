# Photos

Dépose ici les 4 photos de Sandra :

- `photo1.jpg` → mot n° 2 (« Ton sourire a un pouvoir secret… »)
- `photo2.jpg` → mot n° 26 (« Quand ton nom s'affiche… »)
- `photo3.jpg` → mot n° 9 (« la meilleure part du plat »)
- `photo4.jpg` → mot n° 20 (« Petit rappel : tu es belle »)

Taille conseillée : environ 1200 px de large, JPEG compressé (moins de 300 Ko).
Avec ImageMagick : `magick photo.jpg -resize 1200x1200\> -quality 78 photo1.jpg`

Si une photo manque, le mot s'affiche simplement sans photo.
Pour changer l'association, modifier le champ `photo` dans `messages.js`.
