# Système de montage Reels — style et provenance

Ce document dit d'où vient chaque procédé, ce qui reprend la référence à l'identique, ce qui est adapté et ce qui reste une approximation.

## Direction artistique (consigne du 29/10)

- Couleurs : vert vif `#D5FF38` (accent), noir profond, blanc. Le rouge et le violet des références sont **remplacés** par le vert.
- Polices demandées → polices utilisées :
  | Demandée | Utilisée | Statut |
  |---|---|---|
  | Helvetica Bold (sous-titres, mots forts) | **Nimbus Sans Bold** (URW, clone métrique d'Helvetica) | Approximation très proche. Helvetica n'est pas libre de droits. Remplacer `public/fonts/NimbusSans-*.otf` par vos fichiers Helvetica si vous avez la licence. |
  | SF Pro (textes secondaires) | **Inter** | Approximation. La licence de SF Pro limite son usage aux plateformes Apple. |
  | Poppins SemiBold (séquences typographiques) | **Poppins SemiBold** (Google Fonts) | Police exacte. |

## Procédés repris des références

| Procédé | Référence | Où dans Reel 01 |
|---|---|---|
| Fond noir texturé (tissage carbone + grain + vignette), grille de 2 verticales et 3 horizontales, courbe blanche fine tracée puis en dérive lente | a8d5 | MdHook, MdHormones, MdHypno, MdSleep, MdInsta |
| Lettres qui arrivent une par une (~1 lettre/frame) depuis le bas-droite, agrandies et floues, et se posent en ~6 frames | a8d5 (« highli·ghts », « LAS·T ») | tous les titres `Txt` |
| Hiérarchie : petit mot fin en italique + grand mot gras collé dessous, dégradé vertical métallique sur chaque mot | a8d5 | tous les titres |
| Téléphone qui monte du flou au centre de cercles concentriques, arc pointillé d'accent, légende en deux tailles sur l'écran | a8d5 0:40–0:43 | MdHook, MdInsta page 1 |
| Le téléphone se résout en grille 3×3, puis une chaîne verticale se construit : mot accent → grand gras italique → trait → mot encadré, statue détourée qui monte en bas | a8d5 0:43–0:48 | MdInsta page 2, MdHormones |
| Branches courbes vers deux étiquettes | a8d5 « CONSISTENT BRANDING » | MdSleep |
| Fond papier quadrillé clair | a8d5 (scènes blanches) | MdRules, MdRat |
| Fond qui change à chaque idée, mot serré, petit mot posé sur le grand, poussières | 2a9c | TX « encore pire » |
| Mot fantôme géant qui dérive derrière une ligne centrée | 0b99 | TX « débiles / tête / dormir » |
| Images insérées dans la phrase, qui écartent les mots en s'ouvrant | 7014 | MdRules |
| Sous-titres face caméra : grand mot + petite ligne collée, apparition mot à mot avec flou, posés sur la poitrine | 0b82, 467e | toutes les séquences face caméra |
| Cercle autour du visage + étiquette, cadre caméra REC | 467e | variations face caméra |
| Objet détouré en bichromie | a8d5 (David rouge) → recoloré en vert | cerveau, statue |

## Ce qui n'est pas une reproduction exacte

- **Helvetica Neue** (a8d5) et la police géométrique serrée des sous-titres (0b82/2a9c, proche de Gilroy) : ni identifiables avec certitude ni libres de droits. Elles sont remplacées par les polices de votre direction artistique.
- Le « #3 » métallique extrudé de a8d5 n'est pas reproduit (pas d'équivalent dans le texte parlé).
- Le flou de mouvement est simulé : un flou proportionnel à la vitesse, pas un vrai flou directionnel.
- La musique et les effets sonores des références ne sont pas reproduits : aucune piste fournie.

## Visuels utilisés (provenance)

Les banques d'images (Pexels, Unsplash, Wikimedia, Pixabay) sont bloquées par le réseau du conteneur de production. Tous les visuels ci-dessous ont été **générés par IA** via ElevenLabs (flow « Reel test – transcription 28-48s ») et ne représentent aucune personne réelle :

| Fichier | Modèle | Usage |
|---|---|---|
| `img/statue.png` | Seedream 5 Pro + détourage BiRefNet v2 | « c'est toi le produit » |
| `img/rat.png` | Seedream 5 Pro + BiRefNet v2 | « comme un rat dans sa cage » |
| `img/brain.png` | Seedream 5 Pro + BiRefNet v2 | cerveau |
| `img/tile01–18.jpg` | GPT Image 2 (deux grilles découpées) | photos du fil dans le téléphone |

Aucun chiffre, aucune statistique et aucune preuve n'ont été ajoutés. Les puces « +1 like / nouveau message / +1 abonné » illustrent des notifications génériques ; ce ne sont pas des données.

## Robin 02 (podcast Bali → Dubaï)

- Source 16:9 multi-caméra recadrée en 9:16 par `tools/reframe.py` + `src/edit/robin02.shots.json` (un cadrage par plan ; les plans en écran partagé sont empilés invité en haut / Robin en bas, filet vert). L'agrandissement 720p → 1920 rend l'image un peu plus douce que la source.
- Hésitations retirées : « euh », « J'avais rendu, » (faux départ), « de, », « J'avais— ».
- Visuels générés par IA (ElevenLabs, Seedream 5 Pro + détourage BiRefNet v2) : `keys.png`, `skydiver.png`, `burj.png`, `palm.jpg` (vue aérienne de la Palm Jumeirah). Ce ne sont pas des photos réelles.
- Éléments graphiques construits en code : tableau des départs (BALI · PRÉVU → FERMÉ), conversation « Les potes », calendrier (21 jours = « trois semaines »), plan de rues avec épingle « Airbnb ».

## Robin 04 (podcast « le pays »)

- Source 16:9 avec sous-titres incrustés mot à mot : retirés par `tools/clean_subs.py` (inpainting sur la bande centrale), puis recadrés en 9:16 par `tools/reframe.py` + `src/edit/robin04.shots.json`. De légères traces restent par endroits sous nos sous-titres.
- Coupes : « et qui se trouve » (phrase reprise), « Tu sens que la France a… » (faux départ).
- Visuels générés par IA (ElevenLabs Seedream 5 Pro), dans la règle « tons neutres + touche de vert » : `eiffel.png` (tour graphite, fanion vert, détourage local), `bust_lime.png` (buste en marbre au cerveau vert), `tv.png` (TV vintage, bouton vert), `padlock.png` (cadenas, étiquette verte), `vest.png` (gilet haute visibilité) — détourage BiRefNet v2.
- v2 (après retour) : plus aucun objet sur la face caméra ; les cinq scènes de motion sont reconstruites autour de ces visuels (`src/scenes/Objects.tsx`).

## Robin 05 (podcast « 2,5 millions par mois »)

- Source 16:9 720p avec sous-titres incrustés : `tools/clean_subs.py` (bande 395–478) — la détection prend maintenant aussi les lettres blanc pur posées sur une chemise blanche. Légère trace sur le haut du micro. Recadrage 9:16 par plan (`robin05.shots.json`) ; l'agrandissement 720p → 1920 rend l'image plus douce.
- Coupes : « euh », « Ouais, ouais » (relance de Robin).
- Visuels IA (Seedream 5 Pro + BiRefNet v2) : `gauge.png` (compteur sans aiguille, aiguille animée en code), `jar.png`, `unicorn.png`, `cart.png`. Gélules et colis dessinés en code.
