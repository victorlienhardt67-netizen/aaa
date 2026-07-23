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
 * Les fiches personnage sont recadrées sur leur seul panneau "FRONT" (voir
 * cropCharacterFrontPanel) avant d'être envoyées comme référence — la
 * planche 5-panneaux complète (labels, réglets) génère des artefacts dans
 * les frames produites.
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
