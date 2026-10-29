---
name: montage-reels
description: Monter un Reel Instagram 9:16 à partir d'un rush face caméra ou podcast avec le système Remotion de reels/ (direction artistique validée : vert #D5FF38 / noir / blanc). Utiliser dès qu'une nouvelle vidéo à monter est fournie.
---

# Montage Reels — process validé (Reel 01, 29/10)

Le système vit dans `reels/`. Lire `reels/STYLE.md` (provenance des procédés, approximations) et `reels/README.md` (commandes).

## Direction artistique validée — ne pas en dévier sans demande
- Couleurs : vert `#D5FF38` (mots clés, détails, mouvements importants), noir profond, blanc. Jamais de rouge ni de violet.
- Polices : Helvetica Bold → Nimbus Sans Bold (sous-titres, mots forts) · SF Pro → Inter (secondaire) · Poppins SemiBold (séquences typographiques).
- Langage de motion : référence a8d5 (fond carbone + grille + courbe blanche, lettres qui arrivent une par une avec flou, petit italique + grand gras, téléphone, grille 3×3, chaîne verticale avec un mot encadré, branches, objets détourés en bichromie verte).

## Étapes
1. **Analyser le rush** : planche contact (1 img/s), format, nombre de plans et de personnes, éléments incrustés à retirer.
2. **Nettoyer / recadrer** en 1080×1920 (`reels/tools/`). Ne jamais abîmer le visage ; signaler tout défaut résiduel.
3. **Transcrire mot à mot** (ElevenLabs Scribe via MCP : upload mp3 → `creative_transcribe_audio`) → `src/edit/<reel>.words.json` au format `[{t,s,e}]`. Vérifier les mots douteux et les signaler.
4. **Resserrer les blancs** (`computeKeeps`) : pauses > 0,3 s ramenées à ~0,2 s ; aucun mot coupé ; si le fichier s'arrête au milieu d'un mot, finir sur la dernière phrase complète.
5. **Écrire le plan** (`src/edit/<reel>.tsx`, temps SOURCE) en alternant :
   - face caméra + sous-titres (grand mot Helvetica + petite ligne SF, mot clé vert) ;
   - séquences de texte seul (Poppins) ;
   - motion design.
   Règles :
   - pas plus de 3–4 s de face caméra sans variation (zoom, objet détouré, téléphone, puces, cadre REC, image en carte) ;
   - jamais deux fois le même procédé ;
   - chaque visuel doit **se comprendre sans le son** (retour du 29/10 : le cercle autour du visage sur « dès le matin » ne voulait rien dire → téléphone écran de verrouillage 7:00 + alarme « Réveil ») ;
   - au moins ~0,6 s de lecture par texte ; pas de scène qui s'ouvre sur un écran vide.
6. **Contrôler** : rendu `--scale=0.4`, planches à 2 img/s, corriger (accents, chevauchements, débordements, temps de lecture), puis rendu final `--crf=17`.
7. **Livrer** : le mp4 + la liste des changements de structure, des approximations et des visuels générés (provenance). Aucun chiffre ni aucune preuve inventés.

Visuels : les banques d'images sont bloquées dans le conteneur → génération ElevenLabs (Seedream 5 Pro, GPT Image 2) + détourage BiRefNet v2, à déclarer comme IA.
