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
