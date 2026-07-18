"use client";

import { useState } from "react";
import { Check, RefreshCw, Sparkles, SplitSquareHorizontal } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Scene } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { falGenerateImage } from "@/lib/fal";
import { buildImagePrompt } from "@/lib/prompts";
import { formatCost } from "@/lib/utils";
import { Brand, CharacterReference, Project, Scene as SceneType } from "@/types";

/**
 * Rassemble les images de référence (fiches casting validées + photo produit
 * réelle) à injecter dans la génération de frame pour garder personnages et
 * produit visuellement cohérents, et indique au prompt lesquelles sont
 * réellement fournies (pour ne jamais affirmer une consigne qui ne s'applique pas).
 */
function getReferenceImageInfo(
  scene: Pick<SceneType, "characters" | "hasProduct" | "productAssetId">,
  currentProject: Pick<Project, "characterReferences"> | undefined,
  brand: Brand | undefined
): { urls: string[]; hasCharacterReference: boolean; hasProductReference: boolean } {
  const characterUrls = scene.characters
    .map((id) => currentProject?.characterReferences?.[id])
    .filter((ref): ref is CharacterReference => ref?.status === "validated" && !!ref.sheetUrl)
    .map((ref) => ref.sheetUrl!);
  const productUrl =
    scene.hasProduct && scene.productAssetId
      ? brand?.productPhotos.find((p) => p.id === scene.productAssetId)?.url
      : undefined;
  return {
    urls: [...characterUrls, ...(productUrl ? [productUrl] : [])],
    hasCharacterReference: characterUrls.length > 0,
    hasProductReference: !!productUrl,
  };
}

function SceneFrameCard({ scene }: { scene: Scene }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateScene = useProjectStore((s) => s.updateScene);
  const recalcTotalCost = useProjectStore((s) => s.recalcTotalCost);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const styles = useStyleStore((s) => s.styles);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const mandatoryImageRules = useSettingsStore((s) => s.advancedPrompts.mandatoryImageRules);
  const [editing, setEditing] = useState(false);
  const [promptDraft, setPromptDraft] = useState(scene.imagePrompt);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareResults, setCompareResults] = useState<{ engine: string; url: string }[]>([]);
  const [comparing, setComparing] = useState(false);

  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];
  const { urls: referenceImageUrls, hasCharacterReference, hasProductReference } = getReferenceImageInfo(
    scene,
    currentProject ?? undefined,
    brand
  );

  async function runGeneration(prompt: string) {
    updateScene(scene.id, { frameStatus: "frame_generating" });
    const engine = currentProject?.imageEngine ?? "auto";
    const fullPrompt = buildImagePrompt({ imagePrompt: prompt }, style, brand, {
      hasCharacterReference,
      hasProductReference,
      customRules: mandatoryImageRules,
    });
    const result = await falGenerateImage(
      fullPrompt,
      engine,
      apiKeys.falApiKey,
      referenceImageUrls.length > 0 ? referenceImageUrls : undefined
    );
    updateScene(scene.id, {
      frameUrl: result.url,
      frameStatus: "frame_generated",
      frameHistory: [...scene.frameHistory, result.url],
      imageCostEstimate: "costEstimate" in result ? result.costEstimate : 0.02,
      imagePrompt: prompt,
    });
    recalcTotalCost();
  }

  async function handleCompare() {
    setComparing(true);
    setCompareOpen(true);
    const fullPrompt = buildImagePrompt({ imagePrompt: scene.imagePrompt }, style, brand, {
      hasCharacterReference,
      hasProductReference,
      customRules: mandatoryImageRules,
    });
    const [a, b] = await Promise.all([
      falGenerateImage(fullPrompt, "flux_pro", apiKeys.falApiKey),
      falGenerateImage(fullPrompt, "nano_banana", apiKeys.falApiKey),
    ]);
    setCompareResults([
      { engine: "Flux Pro", url: a.url },
      { engine: "Nano Banana", url: b.url },
    ]);
    setComparing(false);
  }

  function chooseCompareResult(url: string) {
    updateScene(scene.id, {
      frameUrl: url,
      frameStatus: "frame_generated",
      frameHistory: [...scene.frameHistory, url],
    });
    setCompareOpen(false);
  }

  const isGenerating = scene.frameStatus === "frame_generating";
  const isValidated = scene.frameStatus === "frame_validated";

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-gold-light">Scène #{scene.index}</span>
        <Badge tone={isValidated ? "success" : scene.frameStatus === "frame_generated" ? "gold" : "neutral"}>
          {isValidated ? "Validée" : scene.frameStatus === "frame_generated" ? "À valider" : isGenerating ? "Génération..." : "En attente"}
        </Badge>
      </div>

      <div className="aspect-[9/16] bg-surface2 border border-border rounded overflow-hidden flex items-center justify-center relative">
        {isGenerating && (
          <div className="flex flex-col items-center gap-2 text-ink-secondary">
            <RefreshCw className="w-5 h-5 animate-spin text-gold" />
            <span className="text-xs font-mono">~2-3s estimées</span>
          </div>
        )}
        {!isGenerating && scene.frameUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scene.frameUrl} alt={`Frame scène ${scene.index}`} className="w-full h-full object-cover" />
        )}
        {!isGenerating && !scene.frameUrl && (
          <span className="text-xs text-ink-secondary px-4 text-center">Aucune frame générée</span>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea rows={3} value={promptDraft} onChange={(e) => setPromptDraft(e.target.value)} />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                setEditing(false);
                runGeneration(promptDraft);
              }}
            >
              Régénérer avec ce prompt
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-secondary line-clamp-2">{scene.imagePrompt}</p>
      )}

      <div className="flex items-center justify-between text-[11px] font-mono text-ink-secondary">
        <span>{scene.imageCostEstimate ? formatCost(scene.imageCostEstimate) : "—"}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {!scene.frameUrl && (
          <Button size="sm" onClick={() => runGeneration(scene.imagePrompt)} disabled={isGenerating}>
            <Sparkles className="w-3.5 h-3.5" /> Générer la frame
          </Button>
        )}
        {scene.frameUrl && !isGenerating && (
          <>
            {isValidated ? (
              <Button size="sm" variant="secondary" disabled>
                <Check className="w-3.5 h-3.5" /> Validée
              </Button>
            ) : (
              <Button size="sm" onClick={() => updateScene(scene.id, { frameStatus: "frame_validated" })}>
                <Check className="w-3.5 h-3.5" /> Valider
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => runGeneration(scene.imagePrompt)}>
              <RefreshCw className="w-3.5 h-3.5" /> Régénérer
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Modifier le prompt
            </Button>
          </>
        )}
        <Button size="sm" variant="ghost" onClick={handleCompare}>
          <SplitSquareHorizontal className="w-3.5 h-3.5" /> Comparer
        </Button>
      </div>

      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} title={`Comparaison — Scène #${scene.index}`} size="lg">
        {comparing ? (
          <div className="py-12 flex flex-col items-center gap-3 text-ink-secondary">
            <RefreshCw className="w-6 h-6 animate-spin text-gold" />
            Génération des deux variantes...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {compareResults.map((r) => (
              <div key={r.engine} className="space-y-2">
                <div className="aspect-[9/16] bg-surface2 border border-border rounded overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.url} alt={r.engine} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between">
                  <Badge tone="neutral">{r.engine}</Badge>
                  <Button size="sm" onClick={() => chooseCompareResult(r.url)}>
                    Choisir celui-ci
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </Card>
  );
}

export function FrameGenerator() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateScene = useProjectStore((s) => s.updateScene);
  const setStatus = useProjectStore((s) => s.setStatus);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const styles = useStyleStore((s) => s.styles);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const mandatoryImageRules = useSettingsStore((s) => s.advancedPrompts.mandatoryImageRules);
  const recalcTotalCost = useProjectStore((s) => s.recalcTotalCost);
  const [generatingAll, setGeneratingAll] = useState(false);

  const plan = currentProject?.plan;
  if (!plan) return null;

  const framedScenes = plan.scenes.filter((s) => s.needsFrame);
  const validatedCount = framedScenes.filter((s) => s.frameStatus === "frame_validated").length;
  const allValidated = framedScenes.length > 0 && validatedCount === framedScenes.length;
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];

  async function handleGenerateAll() {
    setGeneratingAll(true);
    const engine = currentProject?.imageEngine ?? "auto";
    await Promise.all(
      framedScenes
        .filter((s) => !s.frameUrl)
        .map(async (scene) => {
          updateScene(scene.id, { frameStatus: "frame_generating" });
          const { urls: referenceImageUrls, hasCharacterReference, hasProductReference } = getReferenceImageInfo(
            scene,
            currentProject ?? undefined,
            brand
          );
          const fullPrompt = buildImagePrompt({ imagePrompt: scene.imagePrompt }, style, brand, {
            hasCharacterReference,
            hasProductReference,
            customRules: mandatoryImageRules,
          });
          const result = await falGenerateImage(
            fullPrompt,
            engine,
            apiKeys.falApiKey,
            referenceImageUrls.length > 0 ? referenceImageUrls : undefined
          );
          updateScene(scene.id, {
            frameUrl: result.url,
            frameStatus: "frame_generated",
            frameHistory: [result.url],
            imageCostEstimate: "costEstimate" in result ? result.costEstimate : 0.02,
          });
        })
    );
    recalcTotalCost();
    setGeneratingAll(false);
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink mb-1">Génération des frames</h1>
          <p className="text-sm text-ink-secondary">
            {validatedCount}/{framedScenes.length} frames validées
          </p>
        </div>
        <Button onClick={handleGenerateAll} disabled={generatingAll} variant="secondary">
          <Sparkles className="w-4 h-4" /> {generatingAll ? "Génération en cours..." : "Générer toutes les frames"}
        </Button>
      </div>

      <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-500"
          style={{ width: `${framedScenes.length ? (validatedCount / framedScenes.length) * 100 : 0}%` }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {framedScenes.map((scene) => (
          <SceneFrameCard key={scene.id} scene={scene} />
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={() => setStatus("videos")} disabled={!allValidated}>
          Lancer la génération vidéo
        </Button>
      </div>
    </div>
  );
}
