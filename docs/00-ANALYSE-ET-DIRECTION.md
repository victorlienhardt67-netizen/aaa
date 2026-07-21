# GULDUST STUDIO — Analyse de la V1, questions & direction

> Document d'ÉTAPE 0. Rédigé **avant toute ligne de code applicatif**.
> À valider par Victor avant de commencer l'implémentation.
> Basé sur les ~20 screenshots de la V1 (« E-CORP STUDIO ») fournis dans la conversation.
> _Note : le dossier `./references/` n'existait pas dans le repo — j'ai travaillé à partir des captures envoyées dans le chat._

---

## 1. Analyse des screenshots, un par un

### 1.1 — Écran de connexion (« E-CORP STUDIO »)
- **Layout** : carte centrée sur fond noir quasi pur. Logo carré « E », wordmark, sous-titre « PRODUCTION STUDIO », badge `● profil LYNAE`.
- **Composants** : champ user (`lynae`), champ mot de passe, bouton « Entrer dans le studio », mention « Connecté pendant 30 jours sur cet appareil ».
- **Flow déduit** : un gate d'accès **par profil de marque** (le profil sélectionné = « LYNAE »), avec session persistée 30 jours (cookie/localStorage local). Ce n'est pas un vrai multi-tenant SaaS ; c'est un verrou local par profil.
- **Données** : un « profil » (identité de studio) → une marque active par défaut → session locale.

### 1.2 — Dashboard d'accueil (« Bonjour 👋 · Ton studio de production d'ads IA »)
- **Layout** : sidebar gauche + zone principale. En tête, barre d'onglets de runs ouverts (Clay motion 15/15, Paper cut 14/14, Lynae 16/16). Sous le titre, **4 tuiles de stats**.
- **Tuiles** : `CRÉDITS KIE` (vide, « ajoute ta clé dans Réglages »), `HEYGEN` (« abonnement lip-sync »), `DÉPENSÉ AUJOURD'HUI` (3584 cr ≈ $17.92, cumul 7 j, 88 générations), `GÉNÉRATIONS EN COURS` (0, disque : 28.8 Go libres sur 40).
- **Reprendre un projet** : 3 cartes (Disney/Lynae 17 img · 16 clips, Clay 21 img · 15 clips, Paper Cut 14 img · 14 clips) avec vignette, style, heure.
- **Nouveau projet** : grille de grandes cartes visuelles par style (Paper Cut, Talking Objects, Clay Motion, Disney, Jouet…).
- **Flow déduit** : point d'entrée central. Reprendre un run existant OU démarrer un nouveau run en choisissant un style. Les stats sont branchées sur la conso réelle par provider + l'état disque local.
- **Données** : crédits par provider · dépenses agrégées (jour/7j) · nb générations · générations actives · espace disque · liste des runs récents (métadonnées : style, timestamp, #frames, #clips, marque).

### 1.3 — Sidebar (navigation complète)
- **MARQUE ACTIVE** en haut (sélecteur « Lynae »).
- **Sections** : `Accueil / Historique` — `CRÉATION` (Create Avatar, Native Ads, Visualiseur, Adapt Créa) — `VIDÉO` (B-Roll, Avatar Video, Paper Cut, Talking Objects, Clay Motion, Disney, Jouet, Minecraft, Écorché, puis « UGC Anglais SOON », « Talk Objects EN SOON », « Talk Disney EN SOON ») — `OUTILS` (Voix, Scripts, Copy Ads) — `MARQUES` (Brands).
- Chaque style **VIDÉO** est dépliable : montre les runs en cours avec compteur (`Paper cut ✓14/14`, `Clay motion ✓15/15`, `Lynae ✓16/16`).
- **Pied de sidebar** : état des clés `KIE ✓ · Claude ✓ · HeyGen ✗`, bouton « Gérer mes clés API », carte profil (`Lynae · profil lynae · e-corp.studio`).
- **Flow déduit** : la sidebar est à la fois navigation ET état système. Les modules « SOON » sont visibles mais désactivés. La distinction CRÉATION / VIDÉO / OUTILS structure les capacités.
- **Données** : styles (statiques + custom), runs actifs par style, statut des clés, marque active, profil.

### 1.4 — Catalogue de styles (grandes cartes « NOUVEAU PROJET »)
- Cartes visuelles pleine largeur avec illustration + nom + sous-titre descriptif :
  - Minecraft (« Minecraft · Voxel »), Écorché (« Héros anatomique · visage cartoon »), B-Roll (« Stills produit · animation Kling »), Create Avatar (« Avatars UGC · femme + produit en 1 gen »), Native Ads (« Recrée X images à ta marque »), Adapt Créa, Paper Cut (« Collage papier animé · texte découpé »), Talking Objects (« Objets qui parlent · lip-sync Omni »), Clay Motion (« Stop-motion pâte à modeler · packshot réel »), Disney (« Ultra-Réaliste · Coco Skeleton · Baby Boss »), Jouet (« LEGO · Playmobil · Barbie »).
- **Flow déduit** : chaque style porte un **prompt de base + une identité de rendu + parfois des sous-presets**. Choisir une carte démarre un run configuré pour ce style.
- **Données** : catalogue de styles = { nom, sous-titre, vignette, prompt de base, presets, modèle image/vidéo suggéré, contraintes de rendu }.

### 1.5 — Barre d'outils d'un run (canvas)
- Onglets de runs en haut. Sous eux, une barre : `Lynae` (marque) · `Style Clay Motion` · `Voix drop MP3` · `Image Nano Banana 2` · `Vidéo Omni` · `9:16` · `15/15 · 🖼15/15 · ✔` (progression frames/vidéos) · « Tout générer » · « Tout animer » · « Reprendre ».
- Note d'aide : « 1 idée VO = 1 scène = 1 décor · glisse les blocs ».
- Variante Paper Cut : `Voix drop MP3 · cale les plans` · `Vidéo Omni + SFX` · « 1 beat = 1 collage · glisse les blocs · ⌘+molette = zoom ».
- **Flow déduit** : la barre = config globale du run + actions de masse. Le run est un **canvas zoomable** de cartes glissables.
- **Données** : run = { marque, style, presets, provider voix, modèle image, modèle vidéo, format, état d'avancement }.

### 1.6 — Bloc « Script + cadrage » (panneau gauche du canvas)
- En-tête « Script + cadrage · Claude + DNA ». Champ « Nom du projet (optionnel) ». Grande zone de texte pour le script. Ligne « Ta VO finale (.mp3) — **obligatoire** ». Sélecteur de ton (« tendre / complice »). Bouton **« + Analyser → moodboard + casting »**.
- Une capture montre le **preset de style** (Ultra-Réaliste / Coco Skeleton / Baby Boss) sélectionnable en un clic, « un seul pour toute la pub ».
- **Flow déduit** : c'est l'étape d'entrée d'un run. Le script + la VO mp3 sont analysés par Claude (avec le Brand DNA en contexte) pour produire le découpage.
- **Données** : { nom projet, script brut, fichier VO mp3, ton, style, preset } → analyse.

### 1.7 — Script segmenté par couleur (résultat d'analyse)
- Le script est **surligné segment par segment** selon un code couleur : `Hook` (jaune/or) · `Problème` (rouge) · `Agitation` (orange) · `Solution` (vert) · `Preuve` (bleu) · `CTA` (violet). Légende en bas.
- **Flow déduit** : l'analyse tague chaque phrase selon sa fonction narrative (framework copywriting). Sert à structurer le storyboard et à visualiser le rythme de la pub.
- **Données** : segments = [{ texte, tag, couleur }].

### 1.8 — Bloc « Voix off » (lignes numérotées)
- « Voix off · drop ton MP3 ». Lignes numérotées `01 / 02 / 03 / 04…` avec le texte de chaque réplique VO. Mention « VO 58.91 s · durées calées ». Bouton « Re-drop ta VO (.mp3) ».
- **Flow déduit** : la VO mp3 est découpée en **lignes calées sur leur durée réelle** (probablement via transcription/alignement). Chaque ligne VO = une scène = un décor.
- **Données** : lignes VO = [{ index, texte, début, durée }], durée totale.

### 1.9 — Bloc « Casting » (avatars du run)
- « Casting clay · avatar + éléments ». « BIBLIOTHÈQUE D'AVATARS » avec case « + nouveau depuis photo ». « CASTING DU RUN » : carte d'avatar (« EXEMPLE AVATAR JA », « Tenue de la photo », visage clay d'une femme en brassière + legging).
- Dropdown « TON PERSONNAGE » : `EXEMPLE AVATAR JA`, `LA TISANE MOLLE`, `LA GÉLULE RATÉE`, `LA GOUTTE MIEL`, `LA LÉGÈRETÉ`, `Sans perso (décor)`.
- **Flow déduit** : l'analyse propose un casting de personnages nommés (souvent des métaphores produit). Chaque personnage a une **identité visuelle réutilisable** (référence pour la cohérence). Assignable par scène.
- **Données** : casting = [{ id, nom, image de référence, source (photo/généré), tenue/wearing }].

### 1.10 — Carte de scène (frame)
- Structure : `N° · tag coloré (HOOK) · nom du cadrage (« A CRAMPED MINIATUR »/« AN AIRY PASTEL CLA »/« A BRIGHT CLAY CHEC »/« A WARM MINIMAL CLA ») · la ligne VO en citation · la frame générée avec ID (SC-01) · avertissement de conformité (« ⚠ Produit de régime absent : aucun p… ») · sélecteur TON PERSONNAGE · checkbox « Afficher le produit dans la scène » + choix « Star du plan » / « En fond » · champ « Ta vision / prompt custom » · bouton « Régénérer avec ma vision » + coût (~8).
- **Flow déduit** : unité atomique du storyboard. Chaque scène = 1 ligne VO + 1 cadrage + 1 perso (ou décor) + placement produit + prompt custom. Les avertissements de conformité vérifient que les claims/produit sont respectés.
- **Données** : scène = { index, tag, nom cadrage, ligne VO, frame (url + id + statut + coût), perso assigné, produit {affiché, rôle}, prompt custom, warnings[] }.

### 1.11 — Carte de vidéo (animation)
- « Vidéo · SC-01 · Omni · 4s ». Champ « Ta vision pour la vidéo (optionnel) — action, caméra, ambiance, transition… sinon AUTO ». Aperçu vidéo (player). Suggestion sound design (« tiny clay cabinet door creak, soft clay thud »). Sélecteur durée `4s / 6s / 8s / 10s`. Bouton « Régénérer la vidéo ~90 ».
- **Flow déduit** : la rangée du bas = animation de chaque frame validée. Durée réglable par plan, prompt mouvement optionnel, SFX suggéré, coût affiché.
- **Données** : clip = { scène liée, frame source, durée, prompt mouvement, sfx suggéré, url vidéo, statut, coût }.

### 1.12 — Canvas complet (2 rangées reliées)
- Rangée du haut = **frames** ; rangée du bas = **vidéos** correspondantes ; liaisons visuelles verticales frame→vidéo. Vignettes de personnages/objets sur le côté gauche.
- **Flow déduit** : mapping strict 1 frame ↔ 1 vidéo. On valide toute la rangée du haut, puis on anime toute la rangée du bas.
- **Données** : run.scenes[] chacune portant { frame, clip }.

### 1.13 — Bloc « Livraison »
- « Livraison · VO + montage ». « ✅ Prêt pour le montage — 15 clips ». « 🔒 Ce run a coûté 1149 cr = $5.75 ». « ⬇ Télécharger le run (.zip) ». « ✨ Nouveau clay motion ».
- **Flow déduit** : sortie finale. Export .zip (clips + assets + probablement VO + métadonnées de montage). Coût total consolidé. Relance d'un nouveau run du même style.
- **Données** : livrable = { clips[], vo, manifest de montage, coût total }.

### 1.14 — Historique
- Titre « Historique · Toutes tes générations, tous onglets confondus ». Filtres : `Tous / B-Roll / Disney / Clay / Paper Cut / Adapt`. Regroupement par jour (« MARDI 21 JUILLET · 10 générations »). Grille de vignettes, chacune taguée par style + heure ; certaines cartes de run (« 17 img · 16 clips · lynae »). « Clic sur une vignette pour l'agrandir, ↵ pour reprendre le run ».
- **Flow déduit** : mémoire globale de production, filtrable, reprenable. Distingue générations unitaires et runs complets.
- **Données** : historique = flux de générations + runs, indexé par jour/style/marque.

### 1.15 — Page Brands
- Onglets de runs en haut (persistants sur toute l'app). Titre « Lynae · ACTIVE ». Champ « NOM DE LA MARQUE ». Grand champ markdown « BRAND DNA — colle ton markdown (ton, persona, produit, wearing-rule…) » montrant `# BRAND DNA — LYNAE`, `## Essence`, `## Positionnement`. Bouton « Enregistrer ». Section « IMAGES PRODUIT — réutilisées en B-Roll & Avatar · drag & drop » avec vignette produit + case « + ajouter ». Colonne gauche « MES MARQUES » (Lynae, active · 1 image) + « Importer un DNA (fichier) ».
- **Flow déduit** : gestion des marques. Le Brand DNA (markdown structuré) est le **contexte injecté** dans toutes les analyses/générations. Les images produit alimentent B-Roll et Avatar.
- **Données** : marque = { id, nom, dna markdown, images produit[], actif }.

### 1.16 — Import Brand DNA (modal)
- « 📄 Importer un Brand DNA ». « Dépose le brand book / DNA du client — l'IA le convertit au format exact du tool (Produit · Persona · claims · ⭐ RENDERING LOCKS · B-Roll Shot Direction) **sans rien inventer ni perdre** : le non-mappé est gardé en fin de DNA (« DÉTAILS SOURCE »). » Zone drop `PDF · .txt · .md — max 20 Mo`. Champs « Nom de la marque * » et « Langue du DNA final (défaut : langue du fichier) ». Boutons « Annuler » / « Convertir au format du tool ».
- **Flow déduit** : ingestion d'un brand book hétérogène → normalisation stricte via Claude vers le schéma DNA du tool, **sans perte** (résidu en « DÉTAILS SOURCE »).
- **Données** : import = { fichier, nom marque, langue cible } → dna normalisé.

### 1.17 — Réglages · Clés API
- « Réglages — Clés API · Stockées **en local sur la machine**, jamais en clair dans le code, jamais en ligne ». Entrées : `CLÉ KIE · 1623c••••d3ef`, `CLÉ ANTHROPIC / CLAUDE · sk-an••••2QAA`, `MODÈLE CLAUDE — claude-opus-4-8 (défaut)`, `CLÉ HEYGEN`. Bloc « HeyGen MCP — génère sur tes crédits d'abo (~3× moins cher) · non connecté · Connecter (1 clic navigateur) ». Boutons « Fermer » / « Enregistrer ».
- **Flow déduit** : gestion locale des secrets par provider, avec masquage, choix de modèle par défaut, et une intégration MCP HeyGen alternative (moins chère) connectable en 1 clic.
- **Données** : secrets = { provider → { clé masquée, modèle par défaut } }, connexions MCP.

### 1.18 — Onglets de runs (barre supérieure)
- Plusieurs runs ouverts en parallèle, chacun : icône de style, nom, sous-libellé de style, compteur `✓15/15`, croix de fermeture. Un onglet actif surligné.
- **Flow déduit** : navigation multi-runs facon éditeur (à la IDE). État conservé par onglet.
- **Données** : onglets ouverts = [runId], run actif.

---

## 2. Restitution — ma compréhension du produit

**GULDUST STUDIO** est une **application desktop/web locale** qui industrialise la production de publicités vidéo IA, marque par marque, style par style, scène par scène.

**Objets de premier ordre :**
- **Profil / Studio** — l'identité globale (login, préférences, clés).
- **Marque (Brand)** — nom + **Brand DNA** markdown (essence, positionnement, ton, persona, produit, claims, wearing rules, rendering locks, B-Roll shot direction) + images produit. Une marque est *active* à tout moment et son DNA est injecté partout.
- **Style** — recette de rendu (prompt de base, sous-presets, modèles image/vidéo suggérés, contraintes/locks, vignette). Catalogue fourni + **styles custom créés/édités par l'utilisateur**.
- **Run / Projet** — instance de production : une marque × un style × un script × une VO. Contient scènes, frames, clips, casting, coûts, livrable. Ouvrable en onglet, reprenable après fermeture.
- **Scène** — 1 ligne VO (ou 1 réplique dialogue) = 1 décor = { cadrage, tag narratif, perso assigné, placement produit, prompt custom, frame, clip }.
- **Personnage / Avatar** — identité visuelle (et bientôt **vocale**) réutilisable, cohérente sur tout le run.
- **Génération** — unité traçée (frame, clip, TTS, lip-sync) avec provider, statut, coût.

**Le flux nominal** : choisir marque → choisir style (+ preset) → coller script + déposer VO mp3 + ton → **Analyser** (Claude découpe en scènes, tague Hook/Problème/Agitation/Solution/Preuve/CTA, cale les lignes VO sur la durée réelle, propose moodboard + casting) → assigner persos/produit par scène → **Tout générer** les frames → valider → **Tout animer** les vidéos (durée, mouvement, SFX par plan) → **Livraison** (.zip + coût total).

**Nouveauté V2 — mode Dialogue** : au-delà de la VO illustrative, des personnages qui **parlent à l'écran** (TTS + lip-sync), avec voix persistante par personnage, mélangeables avec la VO dans un même run (VO seule / Dialogue seul / Mixte), détection auto des passages dialogués à l'analyse.

**Données qui circulent** : `Brand DNA` (contexte omniprésent) → `analyse` (segments + lignes VO + casting) → `scènes` → `frames` → `clips` → `livrable`. Transversal : `coûts` (par génération → par run → agrégé jour/7j), `secrets` (par provider, local), `historique` (toutes générations).

---

## 3. Mes questions (à valider avant tout code)

> Réponds dans le désordre, en vrac, comme tu veux — je réordonne ensuite. Les ⭐ sont bloquantes pour démarrer.

### A. Architecture & runtime
1. ⭐ **Cible exacte** : desktop natif (Electron/Tauri) **ou** web servi en local (`next dev` / app packagée) ? La V1 semble être une web-app locale. Tauri = binaire léger + accès disque/FS propre ; Next local = plus simple à itérer. Quelle préférence ?
2. ⭐ Un seul utilisateur sur une seule machine, ou plusieurs postes qui partagent des projets ? (impacte stockage local vs partagé)
3. L'écran de login est-il un vrai contrôle d'accès ou juste un sélecteur de profil ? Faut-il un mot de passe réel ?
4. Les appels providers (image/vidéo/TTS) partent-ils **directement du navigateur** ou d'un **backend local** (Node) qui détient les clés ? (sécurité des secrets + CORS)
5. Besoin d'un mode hors-ligne / reprise après crash pendant une génération longue ? Faut-il une **file d'attente de jobs** persistée ?
6. Combien de générations en parallèle max ? Faut-il un throttle/queue global (par provider) ?
7. Faut-il conserver la stack actuelle (**Next.js 14 App Router + Tailwind + Zustand**) ou tu es ouvert à un changement ?

### B. Modèle de données & stockage
8. ⭐ Où vivent les données ? Système de fichiers (dossier par run) + un index JSON/SQLite ? Tu veux pouvoir **inspecter/éditer les fichiers à la main** ?
9. ⭐ Format de persistance des runs : SQLite (requêtable, robuste) ou JSON par projet (lisible, versionnable) ? J'ai un avis (SQLite pour l'index + fichiers médias sur disque), mais je veux ton contrainte.
10. Structure de dossier souhaitée pour un run livré ? (ex. `runs/<marque>/<date-slug>/frames/`, `/clips/`, `manifest.json`, `vo.mp3`)
11. Les médias générés (frames, clips) : stockés en local **et/ou** on garde les URLs provider ? Les URLs provider expirent-elles ?
12. Rétention : on purge l'historique au bout de X jours ? Limite de disque (le tableau montre « 28.8 Go / 40 ») — c'est un quota que tu veux gérer dans l'app ?
13. Faut-il un **export/import de projet** (partager un run entre machines) ?
14. Versionnement des styles et du Brand DNA (historique des éditions) — utile ou superflu ?

### C. Providers & APIs
15. ⭐ **Liste exacte des providers** et leurs rôles. J'ai repéré : **KIE** (crédits — image ? « Nano Banana 2 » ?), **Anthropic/Claude** (analyse/scripts), **HeyGen** (lip-sync, + MCP), **Higgsfield** (dispo dans cette session — image/vidéo ?), **Omni** (modèle vidéo ?), **Kling** (cité pour B-Roll). Peux-tu me donner la **liste définitive + doc de chaque API** ?
16. ⭐ Quel provider pour **quoi**, par défaut : frames (Nano Banana 2 = ? via KIE ?), vidéo (Omni / Kling / Higgsfield ?), TTS (?), lip-sync (HeyGen / Omni ?), transcription-alignement VO (?) ?
17. « Nano Banana 2 », « Omni », « Omni + SFX » : ce sont des modèles chez quel provider ? Mapping nom affiché → endpoint réel ?
18. Le découpage/alignement de la VO mp3 en lignes calées : quel outil ? (Whisper local ? API de transcription ? alignement forcé ?)
19. HeyGen **MCP** vs clé HeyGen classique : je gère les deux chemins ? Le MCP est « ~3× moins cher » — priorité au MCP quand connecté ?
20. Higgsfield est branché dans cette session (MCP `higg`). Tu veux l'utiliser comme provider image/vidéo de prod, ou c'est juste pour mes tests ?
21. Conversion crédits → $ : taux par provider (ex. KIE 3584 cr ≈ $17.92 ⇒ ~$0.005/cr). Où je récupère ces taux — fixes en config, ou lus via l'API du provider ?
22. Gestion des erreurs/retries providers : politique souhaitée (backoff, nb d'essais, coût des essais ratés facturés ?).

### D. Analyse (Claude) & contenu
23. ⭐ Le découpage en scènes : **strictement 1 ligne VO = 1 scène = 1 décor** (comme la note d'aide), ou l'IA peut regrouper/scinder ? Qui a le dernier mot (auto vs édition manuelle) ?
24. Le framework de tags est-il **fixe** (Hook/Problème/Agitation/Solution/Preuve/CTA) ou configurable par marque/style ?
25. Les « warnings de conformité » (ex. « Produit de régime absent ») : quelles règles ? Dérivées du Brand DNA (claims, rendering locks) ? Bloquantes ou indicatives ?
26. Le « nom de cadrage » (« A CRAMPED MINIATUR ») est généré par l'IA ? Sert-il de base au prompt image ?
27. Le moodboard : c'est quoi concrètement dans la V2 (images de réf générées ? palette ? références externes ?) — je ne l'ai pas vu en détail.
28. Langue : l'app gère FR **et** US. Le DNA, le script, la VO, l'UI — tout suit la langue de la marque, ou l'UI reste en FR ?

### E. Casting, personnages & cohérence
29. ⭐ Comment garantir la **cohérence d'un personnage** entre scènes techniquement ? (image de référence réinjectée en img2img / IP-Adapter / « reference elements » façon Higgsfield / seed fixe / character LoRA ?) — dépend du provider retenu.
30. « Nouveau depuis photo » : upload d'une vraie photo → stylisation dans le style du run ? Une seule photo suffit ?
31. Un personnage est-il **global à la marque** (bibliothèque persistante) ou **local au run** ? Le dropdown montre les deux (« BIBLIOTHÈQUE » vs « CASTING DU RUN »).
32. Les noms de perso (« La Goutte Miel ») sont proposés par l'IA — éditables, réutilisables d'un run à l'autre ?

### F. Mode Dialogue (V2)
33. ⭐ **Scène mixte VO + perso qui parle** : les deux audios se superposent (VO en fond + réplique par-dessus) ou la réplique remplace la VO sur ce plan ? Comment tu montes ça ?
34. ⭐ **Ordre TTS/frames** : je génère le TTS **avant** les frames (pour caler la durée du plan sur la réplique) — tu confirmes ? Cas où la VO globale dicte déjà le timing : priorité à qui ?
35. Personnage **hors-champ** qui parle : autorisé ? (voix off d'un perso sans le montrer → pas de lip-sync, juste TTS)
36. Deux persos qui se répondent dans une scène : **un seul plan à deux** ou **découpage champ/contrechamp auto** en deux sous-plans ? Préférence par défaut ?
37. **Voix par personnage** : d'où viennent les voix ? (bibliothèque de voix du provider TTS, clonage depuis un sample, choix manuel ?) Une voix est verrouillée sur le perso pour tout le run ?
38. **Upload d'une piste audio custom** pour une réplique (au lieu du TTS) : format, et on lip-sync dessus directement ?
39. **Réparer un lip-sync raté** sans tout régénérer : on garde la frame + le TTS et on relance seulement l'étape lip-sync ? Tu veux un bouton dédié « refaire le lip-sync » ?
40. Détection auto des dialogues (guillemets, tirets cadratins, « elle dit : », didascalies) : je propose un toggle par segment que tu valides — OK sur ce principe ?

### G. UI / design / interactions
41. ⭐ Le canvas de run : **vrai canvas zoomable/pannable** (⌘+molette, drag des blocs) comme la V1, ou une grille plus sage ? Le libre-déplacement des cartes a-t-il une utilité fonctionnelle (réordonner les scènes) ou c'est cosmétique ?
42. Format : 9:16 par défaut — besoin d'autres ratios (1:1, 16:9, 4:5) par run ?
43. Densité : tu bosses sur grand écran (le canvas est très dense). Je vise desktop-first, mobile non prioritaire — OK ?
44. Le doré comme fil conducteur : je propose une direction précise (cf. §5). Tu as des interdits (couleurs à éviter, logo existant, police imposée) ?
45. Un logo GULDUST existe-t-il déjà, ou je le crée (wordmark) ?
46. Raccourcis clavier attendus (à la IDE) : lesquels sont importants pour ton workflow ?

### H. Workflow, coûts, livraison
47. Le montage final : l'app **assemble-t-elle la vidéo** (concat clips + VO + SFX) ou livre-t-elle juste les rushes .zip pour un montage externe (CapCut/Premiere) ? La V1 dit « Prêt pour le montage » → j'imagine rushes only. Tu veux un vrai rendu final dans l'app (ffmpeg) ?
48. Le .zip contient quoi exactement ? (clips numérotés, VO, SFX, manifest EDL/JSON, frames ?)
49. Budget/garde-fou : plafond de dépense par run avec confirmation avant « Tout générer » ? Estimation de coût **avant** lancement ?
50. Modules « CRÉATION » (Create Avatar, Native Ads, Visualiseur, Adapt Créa) et « OUTILS » (Voix, Scripts, Copy Ads) : **dans le périmètre V2** ou on les met en « SOON » et on livre d'abord le cœur (Brands → Style → Run → Livraison) ? ⭐ (ça change beaucoup le scope)
51. Priorité de livraison : si je dois livrer par tranches, quel est le **premier flux end-to-end** que tu veux voir tourner ? (ma reco : Brands + 1 style + analyse + frames + vidéos + zip, en VO seule, puis on ajoute Dialogue)

---

## 4. Proposition d'architecture technique (à débattre)

> Hypothèses par défaut (modifiables selon tes réponses A/B/C).

**Forme** : app **web locale Next.js 14 (App Router)** — on garde la stack en place — avec un **backend local** (Route Handlers Next côté serveur) qui **détient les clés** et parle aux providers. Option d'empaquetage **Tauri** plus tard pour un vrai binaire desktop + accès FS natif, sans réécrire l'UI.

**Pourquoi un backend local et pas des appels navigateur directs** : les clés ne doivent jamais transiter par le client ni être exposées dans le bundle ; le serveur local centralise secrets, retries, comptabilité des coûts, et la **file de jobs**.

**Couches** :
- **UI** (React/Tailwind/Zustand) — canvas, onglets, cartes de scène, panneaux.
- **State** — Zustand pour l'état d'édition (runs ouverts, sélection) ; **TanStack Query** (à ajouter) pour l'état serveur (jobs, listes) — je proposerai, à valider.
- **API locale** (`app/api/*`) — endpoints : `brands`, `styles`, `runs`, `analyze`, `frames`, `clips`, `tts`, `lipsync`, `costs`, `keys`.
- **Provider layer** — une interface `ImageProvider / VideoProvider / TTSProvider / LipSyncProvider / LLMProvider`, avec adaptateurs (KIE, HeyGen, Higgsfield, Anthropic…). Un **registry** mappe « Nano Banana 2 / Omni » → adaptateur+modèle. Ça isole les changements de provider.
- **Jobs** — file persistée (statut `queued/running/done/error`, coût, retries). Reprise après fermeture.
- **Persistance** — **SQLite** (via `better-sqlite3` ou Prisma) pour l'index (marques, styles, runs, scènes, générations, coûts) + **fichiers sur disque** pour les médias (`~/GuldustStudio/runs/<brand>/<run>/…`). Les secrets dans un store local chiffré (jamais en base commitée, jamais loggés).
- **Cost engine** — chaque appel provider renvoie { crédits, $ } ; agrégation par run et par jour ; taux de conversion en config par provider.

**Sécurité secrets** : clés dans un fichier local hors repo (`~/.guldust/keys.json`, chmod 600) ou keychain OS si Tauri ; jamais dans `.env` commité, jamais loggées, masquées à l'affichage (`1623c••••d3ef`).

**Points ouverts qui dépendent de toi** : Next-local vs Tauri (Q1), SQLite vs JSON (Q9), liste providers (Q15-17), moteur d'alignement VO (Q18), stratégie de cohérence perso (Q29).

---

## 5. Direction de design GULDUST (argumentée)

> Je te livre une **maquette visuelle** séparée (artifact) pour la voir en vrai. Résumé de la thèse ci-dessous.

**Le sujet** : un **studio de production** — pas un dashboard SaaS. La métaphore juste n'est pas « analytics » mais **table de montage / banc de mixage / atelier**. GULDUST = « poussière d'or » → l'or n'est pas une couleur d'accent posée sur du Bootstrap, c'est la **matière** du studio : un or **patiné, métallique, discret**, jamais criard.

**Ce que je fuis** (les 3 clichés IA) : le near-black + accent acid-green ; le cream + serif + terracotta ; le broadsheet hairline. Et surtout je fuis le look « V1 » (gris plats, cartes Bootstrap, doré fluo). L'écart avec la V1 doit se **voir**.

**Palette** (near-black chaud, or patiné — l'or est rare et signifiant) :
- `--obsidian #0B0B0D` (fond, très légèrement bleuté-noir)
- `--graphite #141417` / `--slate #1C1C21` (surfaces, cartes)
- `--hairline #2A2A31` (filets)
- `--gold #C9A24B` (or patiné — accent principal, **utilisé avec parcimonie** : états actifs, valeur, marque)
- `--gold-leaf #E8CC7A` (or clair — highlights, focus)
- `--gold-deep #8A6D2E` (or profond — ombres/gradients d'or)
- `--ink #F3F1EA` (texte, blanc chaud légèrement doré) / `--ink-muted #8E8C84`
- Sémantiques **distinctes de l'accent** : les 6 tags narratifs ont leur propre échelle (Hook or / Problème rouge brique `#C4553B` / Agitation ambre `#D08A3E` / Solution vert sauge `#5E8C6A` / Preuve bleu ardoise `#5B7A9E` / CTA prune `#8A5A8C`) — désaturés pour cohabiter sur le noir sans crier.

**Typographie** (personnalité portée par le type, pas neutre) :
- **Display** : une grotesque à fort caractère, large et un peu mécanique — je propose **Space Grotesk** ou, plus distinctif, **une antique/grotesque condensée** pour les titres de studio et le wordmark. Le wordmark « GULDUST » en capitales espacées, avec un traitement or-métal (léger gradient + fin liseré).
- **Body/UI** : **Inter** (lisibilité UI dense) — assumé, c'est un outil.
- **Mono/data** : **JetBrains Mono** pour les chiffres de coût, IDs (SC-01), timecodes, compteurs — les données ont leur voix.
- Échelle stricte, `tabular-nums` partout où des chiffres s'alignent (coûts, durées, progression).

**Signature** (l'élément mémorable, unique à GULDUST) : le **fil d'or** — une fine ligne dorée qui relie physiquement chaque **frame** à sa **vidéo** sur le canvas (la « chaîne de production » rendue littérale), et qui sert aussi de barre de progression vivante (le fil se « dore » à mesure que les scènes se génèrent). Le doré n'est jamais un aplat décoratif : il **matérialise le flux de production**. Les états actifs (onglet, scène sélectionnée, run en cours) sont marqués d'un **liseré d'or 1px** + halo très doux, façon estampe, jamais de gros glow néon.

**Traitement UI** : dark, dense, desktop-first. Cartes à coins peu arrondis (6px), filets `--hairline`, ombres portées quasi nulles (on est sur du noir mat) — la hiérarchie vient du **contraste de surface** (`graphite` vs `slate`) et de l'or, pas des ombres. Micro-interactions sobres : le fil d'or qui se remplit, un léger « shimmer » métal au survol des actions primaires, transitions courtes. `prefers-reduced-motion` respecté.

**Pourquoi c'est « nettement mieux » que la V1** : identité matérielle (l'or = flux de prod, pas déco), système de couleurs sémantiques désaturé et cohérent, type-scale et données mono soignées, un signature element fonctionnel (le fil d'or) au lieu de cartes génériques.

---

## 6. Ce dont j'ai besoin de toi pour démarrer le code

**Bloquant (⭐)** : Q1 (cible runtime), Q8/9 (stockage), Q15-16 (providers + rôles), Q23 (règle de découpage), Q29 (cohérence perso), Q33-34 (dialogue timing/ordre), Q50-51 (scope V1 & premier flux end-to-end).

Dès que tu réponds à ces ~8 points, je peux poser les fondations (schéma de données + provider layer + shell UI) et livrer un premier flux **Brands → Style → Analyse → Frames → Vidéos → Zip** en VO seule, puis brancher le mode Dialogue.
