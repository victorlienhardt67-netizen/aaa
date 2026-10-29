---
name: montage-reels
description: Monter automatiquement un Reel Instagram 9:16 (1080×1920) à partir d'un rush face caméra ou d'un extrait de podcast, avec le moteur Remotion fourni et la direction artistique validée (vert #D5FF38 / noir / blanc, Helvetica Bold + SF Pro + Poppins SemiBold, motion design éditorial). Utiliser dès que l'utilisateur fournit une vidéo à monter en Reel, demande un « montage », un « test de montage » ou « la même chose que d'habitude ».
---

# Montage Reels — process validé

Tu montes des Reels qui alternent **face caméra sous-titrée**, **séquences de texte seul** et **motion design**, à partir des vidéos de l'utilisateur. Le style est figé et validé par l'utilisateur. Ne le réinvente pas, applique-le.

## 0. Ce qu'il te faut (à vérifier avant de commencer)

| Élément | Où | Rôle |
|---|---|---|
| Le moteur Remotion | `template/` (dans le repo d'origine : `reels/`) | Composants, scènes, découpe, rendu |
| Node 18+, ffmpeg, Python 3 (opencv, numpy, pillow) | machine | `template/tools/setup.sh` installe le reste |
| Un Chromium | Remotion le télécharge lui-même. Si le téléchargement est bloqué, utiliser `REMOTION_BROWSER=/chemin/chrome-headless-shell` | rendu |
| **Connecteur ElevenLabs** (MCP) | compte de l'utilisateur | transcription mot à mot (Scribe) + génération/détourage d'images |
| `references/` (ce dossier) | skill | STYLE, catalogue des scènes, leçons, analyse des références |
| (optionnel) les vidéos de référence | `refs/` fourni à part | réanalyser un procédé si besoin |

Sans ElevenLabs : transcrire avec `faster-whisper` (modèle `small`, `word_timestamps=True`, langue `fr`), puis convertir au format `[{t,s,e}]`. Sans génération d'images : utiliser des photos fournies par l'utilisateur ou des banques libres, détourées.

Première fois : `cd template && bash tools/setup.sh`.

## 1. Direction artistique — ne pas en dévier sans demande explicite

- **Couleurs** : vert vif `#D5FF38` pour les mots clés, détails et mouvements importants ; noir profond ; blanc. **Jamais de rouge ni de violet.**
- **Polices** :
  - Helvetica Bold pour les sous-titres et les mots forts → *Nimbus Sans Bold* (clone libre) ;
  - SF Pro pour le texte secondaire → *Inter* ;
  - Poppins SemiBold pour les séquences typographiques (police réelle).

  Si l'utilisateur fournit les fichiers sous licence, les déposer dans `public/fonts/` et adapter `src/lib/fonts.ts`.
- **Langage de motion** (référence a8d5, détaillé dans `references/STYLE.md`) :
  - fond carbone avec grille et courbe blanche fine ;
  - lettres qui arrivent une par une avec flou ;
  - petit mot en italique au-dessus d'un grand mot gras, avec dégradé métallique ;
  - téléphone, grille 3×3, chaîne verticale avec un mot encadré, branches ;
  - objets détourés réalistes aux tons neutres (noir, blanc, gris, argent) avec **une petite touche de vert `#D5FF38`** sur un détail (sangle, étiquette, drapeau), affichés en couleurs naturelles (`duotone={false}`) ;
  - grain discret.

## 2. Process (dans cet ordre)

1. **Analyser le rush.**
   - Faire une planche contact à 1 image/s : `ffmpeg -i rush.mp4 -vf "fps=1,scale=160:-1,tile=12x4" -frames:v 1 sheet.png`, puis la regarder.
   - Noter le format (9:16 ou 16:9), le nombre de personnes et de plans, et tout élément incrusté à retirer (bandeau, sous-titres).
   - Repérer qui parle.
2. **Produire le master 1080×1920** dans `public/media/` :
   - face caméra 9:16 avec un bandeau incrusté → `tools/clean_facecam.py` (inpainting + léger recadrage ; régler `Y0`) ;
   - podcast 16:9 multi-caméra → `python3 -I tools/shots.py src.mp4 shots/` pour lister les plans et poser une image par plan avec repères de 10 %. Écrire `src/edit/<reel>.shots.json` (centre `x` du visage par plan, `"stack": true` pour les écrans partagés), puis lancer `tools/reframe.py`.
   - Ne jamais abîmer le visage. Signaler tout défaut résiduel.
3. **Transcrire mot à mot.**
   - Extraire l'audio en mp3 (`ffmpeg -i rush.mp4 -ac 1 -ar 16000 -b:a 96k a.mp3`).
   - ElevenLabs : `creative_create_asset_upload` → PUT du fichier → `creative_finalize_asset_upload` (avec `flow_id`) → `creative_transcribe_audio` (`eleven_scribe_v1`) → télécharger `words_download_url`.
   - Convertir : `tools/scribe_to_words.py raw.json src/edit/<reel>.words.json`.
   - Relire les mots douteux et les signaler à l'utilisateur (ex. « quarantièsepième » = « quarante-septième »).
4. **Découper.** Dans `src/edit/<reel>.tsx` :
   - `DROP` = hésitations et faux départs (« euh », phrase reprise) ;
   - `computeKeeps(words, {start, end, drop})` ramène les pauses de plus de 0,3 s à ~0,2 s, sans jamais couper un mot ;
   - si le fichier s'arrête au milieu d'un mot, finir sur la dernière phrase complète, sans inventer la suite.
5. **Écrire le plan** : la liste `SCENES`, en **temps SOURCE**, chaque scène durant jusqu'à la suivante (voir `references/CATALOGUE.md`). Règles :
   - pas plus de **3–4 s de face caméra sans variation** (zoom, objet détouré, téléphone, puces, cadre REC, image en carte, changement d'angle) ;
   - **jamais deux fois le même procédé** dans un Reel ;
   - chaque visuel doit **se comprendre sans le son** (voir `references/LESSONS.md`) ;
   - au moins ~0,6 s de lecture par texte, aucun visuel qui clignote une fraction de seconde, aucune scène qui s'ouvre sur un écran vide ;
   - textes calés sur le mot prononcé : `at(tempsSource)`, avec un léger décalage de -1 frame ;
   - le premier visuel doit accrocher (motion design ou phrase forte), car c'est le hook.
6. **Visuels.**
   - D'abord ceux de l'utilisateur.
   - Sinon, génération ElevenLabs (`bytedance-seedream-5-pro`, prompt « neutral black/white/silver tones, with one small neon lime-green (#D5FF38) detail as the only colour accent, isolated on a pure flat white background ») puis détourage `birefnet-v2-bg-removal` (épingler la variante choisie avec `creative_add_flow_asset_node`).
   - Rogner au canal alpha, puis déposer dans `public/img/`.
   - Déclarer à l'utilisateur tout visuel généré par IA.
   - **Aucun chiffre, aucune statistique, aucune preuve inventés.**
7. **Enregistrer** la config dans `src/Root.tsx` (`makeReel(CONFIG)`), puis vérifier avec `npx tsc -p .`.
8. **Contrôler** avec `tools/qc.sh <Id>`, qui produit des planches à 2 images/s. Les lire **toutes** et corriger :
   - accents coupés ;
   - chevauchements, débordements hors cadre ;
   - textes trop brefs ;
   - objets posés sur le visage ;
   - scènes vides ;
   - mots synchronisés trop tôt ou trop tard.

   Répéter jusqu'à ce que tout soit propre.
9. **Rendu final** : `npx remotion render src/index.ts <Id> out/<reel>.mp4 --crf=17 --audio-bitrate=256k`.
10. **Livrer** :
    - le mp4 ;
    - les changements de structure (coupes, fin) ;
    - les approximations (polices, recadrage, inpainting) ;
    - les visuels générés et leur coût.

    Ajouter une ligne à `references/LESSONS.md` pour chaque retour de l'utilisateur.

## 3. Pièges connus

- `background-clip:text` coupe les accents des majuscules : `TypeText` ajoute une marge intérieure. Garder ce mécanisme si tu crées un autre composant de texte en dégradé.
- Sous-titres (`CapSpec`) : chaque mot affiché est associé, dans l'ordre, à un mot prononcé à partir de `from`. Il faut donc **autant de mots affichés que de mots prononcés**. Ne pas séparer la ponctuation par une espace (« dit : » compte pour 2).
- Un plan source très court (moins de 5 frames) qui tombe dans le montage doit être couvert par une scène graphique.
- Sur un écran partagé empilé, placer les sous-titres sur le filet (`capY: 860`), pas sur le visage du bas.
- Dans `MdTower` et les animations « qui se posent », caler l'arrivée sur le mot qui la décrit, pas sur le début de la phrase.
