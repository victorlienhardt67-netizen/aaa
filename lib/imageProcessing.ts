/**
 * Utilitaires de traitement d'image côté navigateur (canvas) — aucun backend.
 */

/**
 * Découpe le panneau "FRONT" (2e des 5 panneaux) d'une fiche de référence
 * personnage (voir characterSheetTemplateBlock) pour l'utiliser comme image
 * de référence de génération, au lieu de la planche entière.
 *
 * Injecter la planche complète (5 panneaux, labels, réglets de mesure,
 * lignes de séparation) comme référence provoque des artefacts visibles dans
 * les frames générées (lignes, texte résiduel, mini-panneaux fantômes) — le
 * modèle d'édition d'image reproduit parfois des fragments de la mise en
 * page de la fiche au lieu de garder uniquement l'identité du personnage.
 * Un simple portrait plein cadre est une référence beaucoup plus fiable.
 */
export async function cropCharacterFrontPanel(sheetUrl: string): Promise<string> {
  const res = await fetch(sheetUrl);
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const panelWidth = Math.floor(bitmap.width / 5);
  const canvas = document.createElement("canvas");
  canvas.width = panelWidth;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supporté par ce navigateur");
  // Panneau 2 ("FRONT", index 1) : corps entier de face, la meilleure
  // référence d'identité — plus fiable que le gros plan visage (panneau 1)
  // pour garder la silhouette/tenue cohérente sur les frames d'action.
  ctx.drawImage(bitmap, panelWidth, 0, panelWidth, bitmap.height, 0, 0, panelWidth, bitmap.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}
