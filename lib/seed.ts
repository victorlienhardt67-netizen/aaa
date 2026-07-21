// ============================================================
// GULDUST STUDIO — données de départ (catalogue de styles,
// marque d'exemple Lynae, voix, taux de coûts).
// ============================================================
import type { Style, Brand, Voice, CostRate } from "./types";

export const STYLES: Style[] = [
  {
    id: "clay-motion", key: "clay-motion", group: "video",
    name: "Clay Motion", subtitle: "Stop-motion pâte à modeler · packshot réel",
    emoji: "◆", accent: "#c98a4b",
    description: "Stop-motion pâte à modeler, personnages charmants, packshot produit réel intégré.",
    basePrompt: "claymation stop-motion, handmade polymer clay characters, tactile fingerprints, soft studio light, shallow depth of field, 9:16",
    renderLocks: "matière pâte à modeler visible · éclairage doux · produit réel net · pas de texte incrusté",
    presets: [], imageModel: "Nano Banana 2", videoModel: "Omni",
  },
  {
    id: "paper-cut", key: "paper-cut", group: "video",
    name: "Paper Cut", subtitle: "Collage papier animé · texte découpé",
    emoji: "▣", accent: "#b9784e",
    description: "Collage papier animé, textures découpées, typographie kraft, transitions stop-motion.",
    basePrompt: "paper cut collage, layered cardstock, torn edges, kraft textures, hand-lettered cutout type, 9:16",
    renderLocks: "grain papier · ombres portées douces · palette kraft · 1 beat = 1 collage",
    presets: [], imageModel: "Nano Banana 2", videoModel: "Omni + SFX",
  },
  {
    id: "disney", key: "disney", group: "video",
    name: "Disney", subtitle: "Ultra-Réaliste · Coco Skeleton · Baby Boss",
    emoji: "◑", accent: "#5b7a9e",
    description: "Rendu 3D façon studio d'animation, émotion sincère, gros plans expressifs.",
    basePrompt: "pixar-style 3D animation, expressive character, cinematic subsurface skin, warm rim light, 9:16",
    renderLocks: "visage expressif · yeux vivants · rendu 3D premium · cohérence perso stricte",
    presets: [
      { id: "ultra-realiste", name: "Ultra-Réaliste", emoji: "✨", description: "Héros humain type film moderne — gros plans émotionnels, le visage vend." },
      { id: "coco-skeleton", name: "Coco Skeleton", emoji: "💀", description: "Squelettes charmants Día de los Muertos — sujets gênants dédramatisés." },
      { id: "baby-boss", name: "Baby Boss", emoji: "👶", description: "Bébé toddler en costume, autorité d'adulte — punchline cash, ton meme." },
    ],
    imageModel: "Nano Banana 2", videoModel: "Omni",
  },
  {
    id: "talking-objects", key: "talking-objects", group: "video",
    name: "Talking Objects", subtitle: "Objets qui parlent · lip-sync Omni",
    emoji: "☺", accent: "#c9a24b",
    description: "Objets et produits anthropomorphes qui parlent, yeux et bouche animés, lip-sync.",
    basePrompt: "anthropomorphic talking product, expressive face on object, glossy studio render, 9:16",
    renderLocks: "bouche lip-sync propre · yeux vivants · produit reconnaissable",
    presets: [], imageModel: "Nano Banana 2", videoModel: "Omni",
  },
  {
    id: "jouet", key: "jouet", group: "video",
    name: "Jouet", subtitle: "LEGO · Playmobil · Barbie",
    emoji: "◈", accent: "#c4553b",
    description: "Univers jouet — figurines LEGO / Playmobil / poupée, plastique brillant, décors miniatures.",
    basePrompt: "toy photography, LEGO minifigure / dollhouse scale, glossy plastic, miniature diorama set, 9:16",
    renderLocks: "échelle jouet · plastique brillant · décor miniature crédible",
    presets: [], imageModel: "Nano Banana 2", videoModel: "Omni",
  },
  {
    id: "minecraft", key: "minecraft", group: "video",
    name: "Minecraft", subtitle: "Minecraft · Voxel",
    emoji: "◼", accent: "#5e8c6a",
    description: "Univers voxel Minecraft, blocs, personnages cubiques, biomes.",
    basePrompt: "minecraft voxel world, blocky characters, cube biomes, pixel textures, 9:16",
    renderLocks: "géométrie cubique stricte · textures pixel · pas de smoothing",
    presets: [], imageModel: "Nano Banana 2", videoModel: "Omni",
  },
  {
    id: "ecorche", key: "ecorche", group: "video",
    name: "Écorché", subtitle: "Héros anatomique · visage cartoon",
    emoji: "◔", accent: "#c4553b",
    description: "Héros anatomique écorché, muscles apparents, visage cartoon dédramatisant.",
    basePrompt: "anatomical écorché hero, visible muscles, cartoon expressive face, medical-illustration meets character design, 9:16",
    renderLocks: "anatomie lisible · visage cartoon non-gore · éclairage studio",
    presets: [], imageModel: "Nano Banana 2", videoModel: "Omni",
  },
  {
    id: "b-roll", key: "b-roll", group: "video",
    name: "B-Roll", subtitle: "Stills produit · animation Kling",
    emoji: "▦", accent: "#8e8c84",
    description: "Plans produit réels, ambiance lifestyle, animation subtile (Kling).",
    basePrompt: "premium product b-roll, lifestyle setting, natural light, macro details, shallow DOF, 9:16",
    renderLocks: "produit réel fidèle · lumière naturelle · pas de personnage clay",
    presets: [], imageModel: "Nano Banana 2", videoModel: "Kling",
  },
  {
    id: "avatar-video", key: "avatar-video", group: "video",
    name: "Avatar Video", subtitle: "UGC talking-head · lip-sync HeyGen",
    emoji: "◉", accent: "#5b7a9e",
    description: "Avatar UGC réaliste qui parle face caméra, lip-sync, format témoignage.",
    basePrompt: "realistic UGC talking-head avatar, handheld selfie framing, natural indoor light, 9:16",
    renderLocks: "avatar réaliste cohérent · lip-sync HeyGen · cadrage selfie",
    presets: [], imageModel: "Nano Banana 2", videoModel: "HeyGen",
  },
  // --- CRÉATION ---
  {
    id: "create-avatar", key: "create-avatar", group: "creation",
    name: "Create Avatar", subtitle: "Avatars UGC · femme + produit en 1 gen",
    emoji: "✦", accent: "#c9a24b",
    description: "Génère un avatar UGC cohérent (femme + produit) réutilisable sur tout un run.",
    basePrompt: "consistent UGC female avatar holding product, neutral studio, front + 3/4 reference sheet, 9:16",
    renderLocks: "cohérence faciale · tenue verrouillée · produit tenu",
    presets: [], imageModel: "Nano Banana 2", videoModel: "—",
  },
  {
    id: "native-ads", key: "native-ads", group: "creation",
    name: "Native Ads", subtitle: "Recrée X images à ta marque",
    emoji: "▤", accent: "#d08a3e",
    description: "Recrée un lot d'images publicitaires natives déclinées à l'identité de la marque.",
    basePrompt: "native ad creative, brand-consistent, editorial layout, product hero, 4:5",
    renderLocks: "identité marque respectée · claims conformes · lisibilité mobile",
    presets: [], imageModel: "Nano Banana 2", videoModel: "—",
  },
  {
    id: "adapt-crea", key: "adapt-crea", group: "creation",
    name: "Adapt Créa", subtitle: "Adapte une créa gagnante à ta marque",
    emoji: "✎", accent: "#8a5a8c",
    description: "Reprend une créa performante et l'adapte au produit et à la marque active.",
    basePrompt: "adapt reference ad creative to brand product, same layout new brand, 4:5",
    renderLocks: "structure de la créa source conservée · produit et claims remplacés",
    presets: [], imageModel: "Nano Banana 2", videoModel: "—",
  },
];

export const LYNAE_DNA = `# BRAND DNA — LYNAE
*Drainage lymphatique & légèreté · Compléments alimentaires botaniques · Formulé en France*

---

## Essence
Lynae aide les femmes à relancer leur drainage lymphatique naturel avec un geste de dix secondes par jour : une pipette de plantes titrées dans un verre d'eau. Pas de lutte contre son corps, pas de diurétique agressif — on accompagne le corps à libérer l'eau qu'il retient, pour retrouver la légèreté.

## Positionnement
Complément alimentaire drainant premium, entre les tisanes détox inefficaces et les diurétiques agressifs. La différence : une synergie de 4 plantes titrées (dont le gaillet gratteron, LA plante de la lymphe), format liquide sublingual à absorption rapide, 0 % alcool, goût miel, rituel de 10 secondes. Douceur + constance > choc ponctuel.

## Produit
- Format : flacon compte-gouttes, prise sublinguale
- Actifs : gaillet gratteron, frêne, vigne rouge, reine-des-prés (titrés)
- 0 % alcool · goût miel · sans sucre
- Rituel : une pipette le matin dans un verre d'eau, 10 secondes

## Persona
Femme 35-55 ans, jambes lourdes en fin de journée, visage bouffi au réveil, sensation de rétention. A déjà essayé tisanes détox et draineurs sans résultat. Cherche douceur et constance, pas un choc.

## Claims autorisés
- Contribue au drainage / à l'élimination (allégations plantes)
- Sensation de légèreté, jambes plus légères le soir
- Rituel de 10 secondes, absorption rapide sublinguale
> ⚠ Pas d'allégation de perte de poids ni thérapeutique.

## Rendering locks
- Le flacon Lynae réel doit apparaître net et fidèle (étiquette lisible)
- Ambiance douce, matin, lumière naturelle
- Peau et jambes réalistes, jamais caricaturales

## B-Roll shot direction
- Pipette qui verse dans un verre d'eau (macro, contre-jour)
- Femme sereine au réveil, fenêtre lumineuse
- Jambes légères, mouvement fluide
`;

export const SEED_BRANDS: Brand[] = [
  {
    id: "lynae",
    name: "Lynae",
    dna: LYNAE_DNA,
    productImages: [],
    active: true,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
];

export const VOICES: Voice[] = [
  { id: "miel-fr", name: "Miel", provider: "mock", lang: "fr-FR", gender: "f" },
  { id: "claire-fr", name: "Claire", provider: "mock", lang: "fr-FR", gender: "f" },
  { id: "sonia-fr", name: "Sonia", provider: "mock", lang: "fr-FR", gender: "f" },
  { id: "leo-fr", name: "Léo", provider: "mock", lang: "fr-FR", gender: "m" },
  { id: "grace-us", name: "Grace", provider: "mock", lang: "en-US", gender: "f" },
  { id: "noah-us", name: "Noah", provider: "mock", lang: "en-US", gender: "m" },
];

export const COST_RATES: CostRate[] = [
  { provider: "kie", usdPerCredit: 0.005 },
  { provider: "heygen", usdPerCredit: 0.01 },
  { provider: "mock", usdPerCredit: 0.005 },
];

// coûts unitaires simulés (crédits) par type de génération
export const MOCK_COSTS = {
  frame: 8,
  clip: 90,
  tts: 4,
  lipsync: 40,
  avatar: 20,
  analyze: 0,
};

export const FRAMINGS = [
  "A CRAMPED MINIATURE", "AN AIRY PASTEL SCENE", "A BRIGHT CLAY CHECK",
  "A WARM MINIMAL SET", "A COZY MORNING NOOK", "A SOFT WINDOW LIGHT",
  "A CLEAN PRODUCT HERO", "A TENDER CLOSE-UP", "A WIDE ESTABLISHING",
  "A DREAMY UPLIFT", "A KITCHEN COUNTER", "A BATHROOM SHELF",
];

export const SFX_SUGGESTIONS = [
  "tiny clay cabinet door creak, soft clay thud",
  "gentle water pour, glass clink",
  "soft paper rustle, kraft fold",
  "morning ambience, distant birds",
  "light dropper squeeze, liquid drip",
  "warm whoosh transition, soft chime",
];
