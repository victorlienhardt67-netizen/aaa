# Catalogue des scènes et composants

Tous les temps sont en **secondes SOURCE**. Un `Scene` démarre à `from` et dure jusqu'à la scène suivante.

```ts
{ kind: "fc", from, caps: CapSpec[], zooms?, extra?, card?, capY? }   // face caméra
{ kind: "md" | "tx", from, node: <Composant …/> }                      // motion / texte seul
```

`CapSpec = { from, small?, big, accent?, smallBelow? }` : petite ligne (SF Pro) + grand mot (Helvetica Bold), `accent` = vert.

## Face caméra (`src/scenes/FaceCam.tsx`) : variations

| Variation | Usage | Exemple |
|---|---|---|
| `zooms: [{at, scale, push?}]` | coupe franche entre deux niveaux de zoom (masque les jump cuts) ou poussée progressive (`push` en frames) | partout |
| `PopCutout` | objet détouré qui apparaît à côté de la tête sur le mot | clés, cerveau |
| `MorningPhone` | téléphone écran de verrouillage 7:00 + alarme « Réveil » | « dès le matin au réveil » |
| `Chips` | notifications qui montent (like, message, abonné) | dopamine, récompense |
| `RecFrame` | coins de cadre caméra + REC clignotant | moment solennel, conseil |
| `FaceRing` | cercle + étiquette autour du visage. **À éviter seul : peu lisible sans le son** | — |
| `card: {at, out}` | la face caméra se réduit en carte sur fond grille | respiration avant un texte |
| `Moon` | petite lune verte | nuit, dormir |

## Motion design : `src/scenes/Motion.tsx` (Reel 01)

| Scène | Procédé (référence) | Pour dire… |
|---|---|---|
| `MdHook` | téléphone qui monte du flou, fil qui défile, titre, arc pointillé, légende sur l'écran (a8d5) | réseaux, scroll, hook |
| `MdHormones` | titre à droite → objet détouré → chaîne → mot encadré avec jauge qui se vide (a8d5) | perte, vider, baisser |
| `MdHypno` | courbe éveil → sommeil + fenêtre pointillée | phase, moment clé, fenêtre |
| `MdSleep` | objet détouré + branches vers deux étiquettes (a8d5) | deux catégories |
| `MdInsta` | page 1 téléphone, page 2 grille 3×3 + chaîne + statue (a8d5) | « c'est toi le produit » |
| `MdRules` | phrase avec images insérées qui écartent les mots (7014), papier clair | règles, liste d'interdits |
| `MdRat` | détouré N&B + puces cœur + « encore » empilé | répétition, addiction |

## Motion design : `src/scenes/Story.tsx` (Robin 02, récit)

| Scène | Procédé | Pour dire… |
|---|---|---|
| `MdBoard` | tableau des départs à palettes, statut qui bascule | voyage annulé, changement de plan |
| `MdChat` | conversation de groupe sur téléphone, bulles + « en train d'écrire » | ce que quelqu'un a dit / conseillé |
| `Stamps` | mots tamponnés en biais avec secousse (texte seul) | préjugés, étiquettes |
| `MdSearch` | barre de recherche + cartes floues qui deviennent nettes | perception vs réalité |
| `MdSky` | chute libre au-dessus d'une vue aérienne, traînées de vent | sauter, se lancer |
| `MdCalendar` | jours qui se remplissent | une durée |
| `MdMap` | plan de rues, épingle, lien vers un lieu | lieu, adresse |
| `MdTower` | objet qui descend du ciel dans un faisceau et se pose | arrivée, révélation, « posé » |
| `MdSwap` | valeur barrée remplacée par une autre | chute, retournement final |

## Motion design : `src/scenes/Rant.tsx` (Robin 04, coup de gueule)

| Scène | Procédé | Pour dire… |
|---|---|---|
| `MdChain` | étiquettes reliées en chaîne verticale + durée + mot final en pavé vert | « mis bout à bout », accumulation |
| `MdNews` | téléphone qui monte, notification d'alerte sur l'écran de verrouillage | actualité, « en ce moment » |
| `MdRoots` | point central + branches vers des étiquettes + objet détouré, fondu au noir final | attaches, ce qui compte, fin |

## Texte seul (Poppins SemiBold)

| Composant | Procédé (référence) |
|---|---|
| `WordFlash` | un mot par temps fort, le fond bascule clair / vert / noir, poussières (2a9c) |
| `GhostWords` | ligne centrée + mot fantôme géant qui dérive (0b99) |
| `StackList` | liste qui s'empile, les termes précédents s'atténuent (`size` pour les termes longs) |
| `Stamps` | voir plus haut |

## Briques

- `Txt` / `TypeText` : texte positionné, lettre par lettre. Rôles : `sec`, `secInk`, `strong`, `strongLime`, `strongInk`, `strongItalic`, `caps`, `capsLime`.
- `DarkGridBg`, `LightGridBg` : fonds.
- `Curve`, `DashedArc`, `VLine`, `Branch`, `LabelBox` : éléments graphiques.
- `DuoCutout` : détouré en bichromie verte (`duotone={false}` pour l'image d'origine).
- `Phone`, `Feed`, `PostGrid` : téléphone et interface générique (aucun vrai compte, aucun faux chiffre).

Pour créer une nouvelle scène, reprendre une scène existante comme modèle, garder les couleurs et les polices, et **ajouter la ligne correspondante à ce catalogue**.
