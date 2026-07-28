import { Brand, CharacterReference, LocationReference, Project, Scene as SceneType } from "@/types";
import { cropCharacterFrontPanel } from "./imageProcessing";

/**
 * Rassemble les images de référence (fiches personnages validées + référence
 * de décor validée + photo produit réelle) à injecter dans la génération de
 * frame pour garder personnages, décor et produit visuellement cohérents, et
 * indique au prompt lesquelles sont réellement fournies (pour ne jamais
 * affirmer une consigne qui ne s'applique pas). Partagée par MediaCanvas
 * (composants/studio-agent) pour la génération individuelle et en batch.
 *
 * La référence personnage envoyée est, par ordre de fiabilité :
 * 1. le portrait unique propre généré à la validation (portraitUrl) —
 *    aucun artefact de mise en page possible ;
 * 2. à défaut (fiche validée avant l'introduction du portrait), le
 *    recadrage du panneau "FRONT" (cropCharacterFrontPanel) — fragile car
 *    purement géométrique (1/5e de largeur), la planche générée n'étant pas
 *    toujours régulière ;
 * 3. en dernier recours la planche complète (labels/réglets inclus).
 */
export async function getReferenceImageInfo(
  scene: Pick<SceneType, "characters" | "locationId" | "hasProduct" | "productAssetId">,
  currentProject: Pick<Project, "characterReferences" | "locationReferences"> | undefined,
  brand: Brand | undefined
): Promise<{
  urls: string[];
  hasCharacterReference: boolean;
  characterReferenceCount: number;
  hasProductReference: boolean;
  hasLocationReference: boolean;
}> {
  const validatedCharacterSheets = scene.characters
    .map((id) => currentProject?.characterReferences?.[id])
    .filter((ref): ref is CharacterReference => ref?.status === "validated" && !!ref.sheetUrl);

  const characterUrls = await Promise.all(
    validatedCharacterSheets.map(async (ref) => {
      if (ref.portraitUrl) return ref.portraitUrl;
      try {
        return await cropCharacterFrontPanel(ref.sheetUrl!);
      } catch {
        // Repli sur la planche complète si le découpage échoue (image inaccessible, etc.)
        return ref.sheetUrl!;
      }
    })
  );

  const locationRef = scene.locationId ? currentProject?.locationReferences?.[scene.locationId] : undefined;
  const locationUrl = locationRef?.status === "validated" && locationRef.sheetUrl ? locationRef.sheetUrl : undefined;
  const productUrl =
    scene.hasProduct && scene.productAssetId
      ? brand?.productPhotos.find((p) => p.id === scene.productAssetId)?.url
      : undefined;
  return {
    // Le produit est envoyé EN PREMIER : les modèles d'édition multi-images
    // tendent à privilégier les premières images d'une série — le mettre en
    // tête limite le risque qu'il soit dilué/ignoré face aux références
    // personnage/décor quand plusieurs images sont fournies au même appel.
    urls: [...(productUrl ? [productUrl] : []), ...characterUrls, ...(locationUrl ? [locationUrl] : [])],
    hasCharacterReference: characterUrls.length > 0,
    characterReferenceCount: characterUrls.length,
    hasProductReference: !!productUrl,
    hasLocationReference: !!locationUrl,
  };
}
