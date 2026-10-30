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
| `split: {at, out}` | l'image se fend en deux moitiés qui s'écartent autour d'une fissure verte | séparation, rupture |

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
| `MdHalves`, `MdTwins`, `MdFinal` | *(brouillon Robin 07, texte + UI : ne plus utiliser, remplacés par Marina.tsx)* | — |

## Motion design : `src/scenes/Objects.tsx` (Robin 04 v2, scènes bâties autour d'un visuel)

| Scène | Procédé (référence) | Visuel | Pour dire… |
|---|---|---|---|
| `MdEurope` | collage éditorial sur papier, découpe à bord blanc, titre en bloc noir rayé d'un scotch vert, dézoom + cercle d'étoiles (6177) | `eiffel.png` | pas X mais Y, élargir |
| `MdBust` | objet qui monte du flou dans un halo, flèche pointillée, le détail vert s'allume + onde (96c1) | `bust_lime.png` | tête, idée imposée, conditionnement |
| `MdDomino` | dominos étiquetés qui tombent l'un après l'autre, compteur qui roule, objet qui tombe avec secousse et poussière (082a) | `vest.png` | enchaînement, accumulation, durée |
| `MdTV` | TV vintage qui s'allume (trait CRT), bandeau d'info défilant, vibration de chaleur (082a) | `tv.png` | actualité, « en ce moment », c'est chaud |
| `MdLock` | objet suspendu à une chaîne qui se balance sous un projecteur, étiquettes qui pendent, monument qui monte derrière, fondu final | `padlock.png`, `eiffel.png` | attache, ce qui compte, fin |

Briques : `PaperBg`, `ConcreteBg`, `HaloBg` (fonds texturés sans grille), `BlockTitle` (titre en bloc de couleur).

## Motion design : `src/scenes/Growth.tsx` (Robin 05, business / croissance)

| Scène | Procédé | Visuel | Pour dire… |
|---|---|---|---|
| `MdGauge` | fond studio clair, compteur qui tombe, aiguille verte qui grimpe pendant que le chiffre défile, pastille durée | `gauge.png` | chiffre qui monte, croissance, vitesse |
| `MdJar` | sol noir brillant avec reflet, pluie de gélules qui s'entassent, gélules-étiquettes qui jaillissent du pot | `jar.png` | produit, ce qu'il rapporte |
| `ZoomWord` | texte seul : le mot grossit jusqu'à remplir l'écran, fond qui bascule au vert | — | énorme, choc |
| `MdVitrine` | objet rare sous cloche de musée, cartel qui pivote (A → B), écho de l'autre intervenant | `unicorn.png` | rare, inhabituel, comparaison de pays |
| `MdCart` | piste en perspective qui défile, objet qui déboule et freine, colis qui tombent dedans | `cart.png` | e-commerce, achat, vente |

## Motion design : `src/scenes/Simple.tsx` (Robin 06, simplicité)

| Scène | Procédé | Visuel | Pour dire… |
|---|---|---|---|
| `MdOverload` | objet surchargé, cotes techniques qui envahissent l'écran, étiquettes reliées à l'objet par des repères verts | `remote_complex.png` | complexité, trop de choses |
| `MdReceipt` | ticket de caisse qui sort d'une imprimante, lignes « + … » | — | liste de bénéfices attendus |
| `TxFlip` | texte seul : la phrase se retourne à 180°, le fond bascule | — | « tout le contraire » |
| `TxQuote` | texte seul : fond vert, grands guillemets, citation mot à mot | — | citation |
| `MdStrip` | l'objet complexe tremble, ses boutons volent en éclats, son jumeau simple apparaît, onde sur le bouton | `remote_complex.png`, `remote_simple.png` | simplifier, avant / après |
| `MdMaze` | curseur qui erre dans un labyrinthe, qui devient une ligne droite verte | `cursor.png` | parcours, UX, simplifier un chemin |
| `MdPress` | final : l'objet monte, on appuie sur le bouton, ondes vertes, fondu | `remote_simple.png` | conclusion, l'essentiel |

## Motion design : `src/scenes/Rant.tsx` (Robin 04 v1, remplacé — procédés jugés trop proches de Robin 02)

| Scène | Procédé | Pour dire… |
|---|---|---|
| `MdChain` | étiquettes reliées en chaîne verticale + durée + mot final en pavé vert | « mis bout à bout », accumulation |
| `MdNews` | téléphone qui monte, notification d'alerte sur l'écran de verrouillage | actualité, « en ce moment » |
| `MdRoots` | point central + branches vers des étiquettes + objet détouré, fondu au noir final | attaches, ce qui compte, fin |

## Motion design : `src/scenes/Marina.tsx` (Robin 07, « Marina, cinq ans plus tard »)

| Scène | Procédé | Visuel | Pour dire… |
|---|---|---|---|
| `MdTiltUp` | travelling vertical le long d'une tour jusqu'au dernier étage qui s'allume, ciel de crépuscule, étiquette en bloc | `tower_marina.png` | un lieu, « en haut », arriver quelque part |
| `MdHourglass` | sablier qui tombe, rebondit puis se retourne ; deux étiquettes en bloc (la première s'éteint) | `hourglass.png` | partage du temps, alternance, « 6 mois / 6 mois » |
| `MdLoupe` | deux tirages photo sur béton, une loupe grossit le détail de l'un puis de l'autre, ellipse verte qui les réunit | `loupe.png`, `tower_marina.png` | comparer deux choses presque identiques |
| `MdLightsOut` | tour de nuit, recul de caméra, la lumière du dernier étage vacille et s'éteint sur le mot final | `tower_marina.png` | malaise, fin d'un chapitre, chute |

## Texte seul (Poppins SemiBold)

| Composant | Procédé (référence) |
|---|---|
| `WordFlash` | un mot par temps fort, le fond bascule clair / vert / noir, poussières (2a9c) |
| `GhostWords` | ligne centrée + mot fantôme géant qui dérive (0b99) |
| `StackList` | liste qui s'empile, les termes précédents s'atténuent (`size` pour les termes longs) |
| `Stamps` | voir plus haut |
| `TxMarker` | phrase posée, les mots clés passent sous un trait de surligneur vert (Marina.tsx) |
| `TxSqueeze` | deux mâchoires vertes compriment les mots (Marina.tsx) |

## Briques

- `Txt` / `TypeText` : texte positionné, lettre par lettre. Rôles : `sec`, `secInk`, `strong`, `strongLime`, `strongInk`, `strongItalic`, `caps`, `capsLime`.
- `DarkGridBg`, `LightGridBg` : fonds.
- `Curve`, `DashedArc`, `VLine`, `Branch`, `LabelBox` : éléments graphiques.
- `DuoCutout` : détouré en bichromie verte (`duotone={false}` pour l'image d'origine).
- `Phone`, `Feed`, `PostGrid` : téléphone et interface générique (aucun vrai compte, aucun faux chiffre).

Pour créer une nouvelle scène, reprendre une scène existante comme modèle, garder les couleurs et les polices, et **ajouter la ligne correspondante à ce catalogue**.
