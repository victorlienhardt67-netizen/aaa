import { Brand, CharacterReference, LocationReference, Project, Scene as SceneType } from "@/types";

/**
 * Rassemble les images de référence (fiches personnages validées + référence
 * de décor validée + photo produit réelle) à injecter dans la génération de
 * frame pour garder personnages, décor et produit visuellement cohérents, et
 * indique au prompt lesquelles sont réellement fournies (pour ne jamais
 * affirmer une consigne qui ne s'applique pas). Partagée par MediaCanvas
 * (composants/studio-agent) pour la génération individuelle et en batch.
 */
export function getReferenceImageInfo(
  scene: Pick<SceneType, "characters" | "locationId" | "hasProduct" | "productAssetId">,
  currentProject: Pick<Project, "characterReferences" | "locationReferences"> | undefined,
  brand: Brand | undefined
): { urls: string[]; hasCharacterReference: boolean; hasProductReference: boolean; hasLocationReference: boolean } {
  const characterUrls = scene.characters
    .map((id) => currentProject?.characterReferences?.[id])
    .filter((ref): ref is CharacterReference => ref?.status === "validated" && !!ref.sheetUrl)
    .map((ref) => ref.sheetUrl!);
  const locationRef = scene.locationId ? currentProject?.locationReferences?.[scene.locationId] : undefined;
  const locationUrl = locationRef?.status === "validated" && locationRef.sheetUrl ? locationRef.sheetUrl : undefined;
  const productUrl =
    scene.hasProduct && scene.productAssetId
      ? brand?.productPhotos.find((p) => p.id === scene.productAssetId)?.url
      : undefined;
  return {
    urls: [...characterUrls, ...(locationUrl ? [locationUrl] : []), ...(productUrl ? [productUrl] : [])],
    hasCharacterReference: characterUrls.length > 0,
    hasProductReference: !!productUrl,
    hasLocationReference: !!locationUrl,
  };
}
