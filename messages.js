/*
 * ✏️  Le seul fichier à modifier pour changer les mots du bocal.
 *
 * Chaque mot : { id, categorie, texte, photo? }
 *   - id        : numéro unique (ne pas réutiliser deux fois le même)
 *   - categorie : Tendre · Drôle · Souvenir · Promesse · Ouvre quand… · Défi
 *                 (pour « Ouvre quand… », écrire la suite : "Ouvre quand… tu doutes")
 *   - texte     : le mot doux
 *   - photo     : (facultatif) chemin d'une photo, ex. "photos/photo1.jpg"
 *   - dernier   : (facultatif) true = ce mot sort toujours en dernier, juste avant le papier doré
 *
 * Après une modification, changer VERSION dans service-worker.js
 * pour que le téléphone récupère la nouvelle version.
 */

// Réponses acceptées à « Dis-moi comment je t'appelle » (majuscules et accents ignorés).
const SURNOMS = ["Sandra", "Ma doubehi", "Ma petite", "Ma femme", "Mme Balet", "Madame Balet"];

const MESSAGES = [
  { id: 1, categorie: "Tendre", texte: "Ma doubehi, si je devais écrire toutes les raisons de t'aimer, il me faudrait un bocal plus grand. J'ai fait ce que j'ai pu." },
  { id: 2, categorie: "Tendre", texte: "Ton sourire a un pouvoir secret : il remet mes batteries à 100 %, même après une garde de nuit.", photo: "photos/photo1.jpg" },
  { id: 3, categorie: "Drôle", texte: "Mme Balet, je le dis officiellement : le meilleur diagnostic de ma carrière, c'est « fou amoureux de toi ». Aucun traitement n'est prévu." },
  { id: 4, categorie: "Tendre", texte: "Ma petite, tu es ma plus belle décision. Zéro effet secondaire, 100 % de bonheur." },
  { id: 5, categorie: "Tendre", texte: "Tu rends les jours ordinaires beaucoup plus doux. Je ne sais pas comment tu fais, mais continue." },
  { id: 6, categorie: "Drôle", texte: "Ordonnance du jour : un câlin de 20 secondes, à renouveler autant que nécessaire. Aucune contre-indication." },
  { id: 7, categorie: "Tendre", texte: "Ma femme, merci d'être patiente avec moi quand je te parle de mes projets pendant deux heures. Tu écoutes avec ton cœur." },
  { id: 8, categorie: "Tendre", texte: "Ton rire est mon bruit préféré. Désolé, la musique." },
  { id: 9, categorie: "Drôle", texte: "Je t'aime même quand tu me prends la meilleure part du plat. Surtout quand tu me prends la meilleure part.", photo: "photos/photo3.jpg" },
  { id: 10, categorie: "Ouvre quand… tu es fatiguée", texte: "Repose-toi, ma doubehi. Le monde peut attendre. Moi, je suis là, et le câlin aussi." },
  { id: 11, categorie: "Ouvre quand… tu doutes", texte: "Tu es plus forte, plus belle et plus douée que tu ne le crois. Je le sais, je te regarde tous les jours." },
  { id: 12, categorie: "Ouvre quand… je te manque", texte: "Ferme les yeux, imagine mes bras. Voilà, je suis là. Je rentre vite." },
  { id: 13, categorie: "Ouvre quand… tu es triste", texte: "Tu as le droit de pleurer, ma petite. Mais j'ai gardé un câlin pour toi, il t'attend." },
  { id: 14, categorie: "Promesse", texte: "Je serai toujours ton premier supporter. Même quand tu auras tort, je dirai que « c'est discutable »." },
  { id: 15, categorie: "Tendre", texte: "Mme Balet, ce nom te va tellement bien que je ne te laisserai jamais le rendre." },
  { id: 16, categorie: "Défi", texte: "Envoie-moi un selfie avec ta plus belle grimace. Je veux le mettre en fond d'écran." },
  { id: 17, categorie: "Tendre", texte: "Avec toi, même attendre dans une file devient un bon moment. Imagine le reste." },
  { id: 18, categorie: "Tendre", texte: "Tu es mon endroit calme dans le bruit du monde." },
  { id: 19, categorie: "Tendre", texte: "Je t'aime plus qu'hier, moins que demain. Et c'est valable tous les jours." },
  { id: 20, categorie: "Tendre", texte: "Petit rappel : tu es belle. Pas « un peu ». Pas « quand tu t'arranges ». Tout le temps.", photo: "photos/photo4.jpg" },
  { id: 21, categorie: "Drôle", texte: "Merci de vivre avec un médecin qui rentre fatigué et raconte sa journée avec trop de détails. Tu es une sainte." },
  { id: 22, categorie: "Drôle", texte: "Tu veux un compliment ? Tu es intelligente, drôle, courageuse, et tu sens bon. Fin de la liste, je n'ai plus de place." },
  { id: 23, categorie: "Promesse", texte: "Je te promets de te faire rire au moins une fois par jour. Aujourd'hui, c'est fait." },
  { id: 24, categorie: "Tendre", texte: "Tu me rends meilleur, et aucune formation au monde ne m'a appris à le faire." },
  { id: 25, categorie: "Souvenir", texte: "[À PERSONNALISER : le jour où je t'ai vue pour la première fois]. Tu avais déjà gagné avant même de le savoir." },
  { id: 26, categorie: "Tendre", texte: "Quand ton nom s'affiche sur mon téléphone, mon visage sourit sans me demander la permission.", photo: "photos/photo2.jpg" },
  { id: 27, categorie: "Tendre", texte: "Quand tu dis « on rentre », j'entends « chez nous ». Et c'est ma phrase préférée." },
  { id: 28, categorie: "Défi", texte: "Ce soir, pas de dossier, pas de téléphone pro. Rien que toi, moi et un grand sourire." },
  { id: 29, categorie: "Promesse", texte: "Ma petite, je te choisis. Aujourd'hui, demain, dans dix ans. Et au moindre doute, je te choisis encore." },
  { id: 30, categorie: "Drôle", texte: "Dernier papier avant le doré : tu viens de lire 29 mots doux. Ta récompense : un vrai bisou, valable ce soir.", dernier: true },
];

// Le papier doré : s'ouvre quand tous les mots ont été lus.
const LETTRE_FINALE = `Sandra, ma doubehi, ma petite, ma femme, Mme Balet,

Si tu lis ceci, c'est que tu as vidé tout le bocal. Chaque papier était vrai, même les blagues (surtout les blagues).

Je ne sais pas écrire tout ce que tu représentes pour moi, alors j'ai fait un bocal. Mais retiens une chose : [À PERSONNALISER : une phrase à toi, qui vient du cœur].

Merci d'être toi. Merci d'être là. Je t'aime aujourd'hui, demain, et bien après la fin du bocal.`;

const SIGNATURE = "Ton Romaric";
