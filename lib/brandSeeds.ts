import { Brand } from "@/types";

/**
 * Les 4 marques actives de compléments alimentaires, préchargées par défaut.
 * Aucune photo produit n'est fournie (pas de Reference Element Higgsfield
 * branché dans cette architecture fal.ai/localStorage) — l'utilisateur upload
 * la photo réelle dans /brands quand il en a besoin ; en attendant,
 * generationNotes décrit le produit avec assez de détail pour être injecté
 * tel quel dans les prompts (buildImagePrompt) sans jamais le redemander.
 */
export const DEFAULT_BRANDS: Brand[] = [
  {
    id: "brand_lynae",
    name: "Lynae",
    description: "Rétention d'eau / drainage lymphatique — marché FR. Cible : femmes 35-55 ans, santé féminine.",
    colors: { primary: "#2f6b4f", secondary: "#e8f3ec", accent: "#c9a227" },
    tone: "scientifique",
    defaultLang: "fr",
    productPhotos: [],
    characterPhotos: [],
    generationNotes:
      "Drainant Lymphatique — flacon ambré 55mL, étiquette verte, pipette noire. Reproduire fidèlement forme, bouchon et étiquette dès qu'une photo est fournie, ne jamais redessiner.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "brand_lyveen",
    name: "Lyveen",
    description: "Thyroïde / Hashimoto — marché US. Cible : women 35-55, thyroid/hormones.",
    colors: { primary: "#b45f7a", secondary: "#fbeef2", accent: "#8a5a44" },
    tone: "doux",
    defaultLang: "en",
    productPhotos: [],
    characterPhotos: [],
    generationNotes:
      "Thyroid Support — flacon dropper brun 30mL, étiquette rose pâle. Reproduire fidèlement forme, bouchon et étiquette dès qu'une photo est fournie, ne jamais redessiner.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "brand_tmen",
    name: "T-men",
    description: "Testostérone / métabolisme masculin — marché US. Cible : men 35-60, testosterone/energy.",
    colors: { primary: "#1f2937", secondary: "#e5e7eb", accent: "#c9a227" },
    tone: "direct",
    defaultLang: "en",
    productPhotos: [],
    characterPhotos: [],
    generationNotes:
      "Reproduire fidèlement le flacon dès qu'une photo produit est fournie, ne jamais redessiner.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "brand_venalys",
    name: "Venalys",
    description: "Circulation & transit / jambes lourdes — marché US. Cible : women 40-60, circulation/transit.",
    colors: { primary: "#3a6b8a", secondary: "#eaf2f7", accent: "#c99a4a" },
    tone: "scientifique",
    defaultLang: "en",
    productPhotos: [],
    characterPhotos: [],
    generationNotes:
      "Circulation & Transit — bocal ambré, couvercle doré, étiquette beige. Reproduire fidèlement forme, bouchon et étiquette dès qu'une photo est fournie, ne jamais redessiner.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
