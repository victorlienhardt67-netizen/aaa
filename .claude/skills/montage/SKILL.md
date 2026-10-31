---
name: montage
description: /montage <vidéo.mp4> — monte automatiquement, de bout en bout et sans poser de questions, un Reel Instagram 9:16 à partir de la vidéo fournie, avec le process et la direction artistique validés (skill montage-reels). Livre le mp4 final et un court compte rendu.
argument-hint: "<chemin ou vidéo jointe .mp4> [consignes optionnelles]"
---

# /montage — montage automatique

Arguments reçus : `$ARGUMENTS`

Tu exécutes **tout le montage d'un seul trait**, sans demander de validation intermédiaire. L'utilisateur ne veut que le résultat. Ne t'arrête que si c'est impossible : vidéo introuvable, ou environnement sans Node/ffmpeg.

## 1. Trouver la vidéo
- Si `$ARGUMENTS` contient un chemin vers un fichier vidéo, l'utiliser.
- Sinon, prendre la dernière vidéo jointe dans la conversation (fichier `.mp4`/`.mov` le plus récent parmi les pièces jointes ou les uploads).
- Le reste de `$ARGUMENTS` = consignes particulières de l'utilisateur. Elles priment sur les choix par défaut, jamais sur la direction artistique, sauf si l'utilisateur la change explicitement.
- Identifiant du Reel : nom du fichier en PascalCase, sans espaces ni caractères spéciaux, préfixé si besoin (ex. `Test_robin.mp4` → `TestRobin`).

## 2. Préparer le moteur
- Si `reels/` existe dans le projet courant (avec `package.json` et `src/Reel.tsx`), l'utiliser.
- Sinon, copier `../montage-reels/template/` (le dossier frère de cette skill) vers `./reels/`, puis lancer `bash reels/tools/setup.sh`.
- Si `node_modules` est absent, lancer `npm install` dans `reels/`.
- Si Remotion ne peut pas télécharger son navigateur, chercher un `chrome-headless-shell` local (ex. `/opt/pw-browsers/*/chrome-headless-shell-linux64/chrome-headless-shell`) et l'exporter dans `REMOTION_BROWSER`, à passer en `--browser-executable`.

## 3. Monter
Lire puis appliquer **intégralement** `../montage-reels/SKILL.md` (étapes 1 à 10), ainsi que `references/CATALOGUE.md`, `references/LESSONS.md` et `references/STYLE.md` de cette même skill. Rappels non négociables :
- **Direction artistique :**
  - couleurs : vert `#D5FF38`, noir, blanc ; jamais de rouge ni de violet ;
  - polices : Helvetica Bold (Nimbus Sans), SF Pro (Inter), Poppins SemiBold.
- **Rythme :**
  - alterner face caméra sous-titrée, texte seul et motion design ;
  - pas plus de 3–4 s de face caméra sans variation ;
  - jamais deux fois le même procédé dans un Reel.
- **Lisibilité :**
  - chaque visuel doit se comprendre sans le son ;
  - textes synchronisés au mot ;
  - assez de temps de lecture ;
  - aucun flash, aucun écran vide.
- **Fidélité au discours :**
  - garder les phrases et le sens ;
  - retirer les « euh », les faux départs et les blancs ;
  - ne jamais inventer de suite, de chiffre ou de preuve.
- **Livraison :** n'envoyer le rendu final qu'après le contrôle sur planches (`tools/qc.sh`) et la correction de tout ce qui cloche.
- **Visuels manquants :** les générer via ElevenLabs (détourés) sans demander. Les déclarer dans le compte rendu.

Créer `reels/src/edit/<reel>.tsx` (+ `.words.json`, + `.shots.json` si le rush est en 16:9), puis l'enregistrer dans `reels/src/Root.tsx`.

## 4. Livrer
1. Rendre `reels/out/<reel>.mp4` avec `--crf=17 --audio-bitrate=256k`.
2. Envoyer le mp4 à l'utilisateur.
3. Écrire un compte rendu de 10 lignes maximum :
   - durée ;
   - coupes faites (hésitations retirées, fin choisie) ;
   - liste des séquences graphiques ;
   - approximations (recadrage, polices) ;
   - visuels générés par IA et coût approximatif en crédits ;
   - mots de transcription douteux.
4. Si le projet est un repo git, committer `reels/` (sans médias ni rendus) et pousser sur la branche de travail.
5. Ajouter dans `../montage-reels/references/LESSONS.md` la ligne « <date>, <reel> : en attente de retour ».
