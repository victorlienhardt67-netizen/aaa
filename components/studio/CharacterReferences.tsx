"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, RefreshCw, Sparkles, Users, Wand2 } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import { CharacterReference } from "@/types";
import { characterReferenceKey, slugify } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { falGenerateImage } from "@/lib/fal";
import { refineCharacterPrompt } from "@/lib/claude";
import { buildCharacterSheetPrompt } from "@/lib/prompts";
import { ImageDownloadButton } from "./ImageDownloadButton";

const PROPOSAL_VARIANTS = [
  "Interprétation 1 : expression douce et posture détendue.",
  "Interprétation 2 : expression confiante et posture affirmée.",
  "Interprétation 3 : expression enjouée et posture dynamique.",
];

interface ProposalSlot {
  prompt: string;
  url?: string;
  loading: boolean;
  error: boolean;
}

function CharacterCard({
  refKey,
  reference,
  avantReference,
}: {
  refKey: string;
  reference: CharacterReference;
  /** Fiche AVANT validée du même personnage — fournie uniquement quand `reference.variant === "après"`, pour chaîner l'identité. */
  avantReference?: CharacterReference;
}) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateCharacterReference = useProjectStore((s) => s.updateCharacterReference);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const [editing, setEditing] = useState(false);
  const [promptDraft, setPromptDraft] = useState(reference.prompt);
  const [proposalsOpen, setProposalsOpen] = useState(false);
  const [proposals, setProposals] = useState<ProposalSlot[]>([]);
  const [basePrompt, setBasePrompt] = useState(reference.prompt);
  const [modificationText, setModificationText] = useState("");
  const [refining, setRefining] = useState(false);

  const originalPhoto = brand?.characterPhotos.find((p) => p.id === reference.assetId);
  const isGenerating = reference.status === "generating";
  const isValidated = reference.status === "validated";
  const displayName = reference.variant ? `${reference.name} — ${reference.variant}` : reference.name;
  // L'état "après" doit chaîner sur l'identité validée de l'état "avant" — jamais réinventer le visage.
  const chainedReferenceUrls = [
    originalPhoto?.url,
    reference.variant === "après" && avantReference?.status === "validated" ? avantReference.sheetUrl : undefined,
  ].filter((u): u is string => !!u);

  // Tant que la fenêtre de propositions est fermée, la base repart du prompt
  // persisté — une modification non validée (pas de clic "Choisir") est donc abandonnée.
  useEffect(() => {
    if (!proposalsOpen) setBasePrompt(reference.prompt);
  }, [reference.prompt, proposalsOpen]);

  async function runGeneration(prompt: string) {
    updateCharacterReference(refKey, { status: "generating" });
    const referenceUrls = chainedReferenceUrls.length > 0 ? chainedReferenceUrls : undefined;
    const result = await falGenerateImage(prompt, "nano_banana", apiKeys.falApiKey, referenceUrls);
    updateCharacterReference(refKey, {
      sheetUrl: result.url,
      status: "generated",
      prompt,
    });
  }

  async function generateSlot(prompt: string, idx: number) {
    setProposals((prev) => prev.map((p, i) => (i === idx ? { ...p, loading: true, error: false } : p)));
    const referenceUrls = chainedReferenceUrls.length > 0 ? chainedReferenceUrls : undefined;
    try {
      const result = await falGenerateImage(prompt, "nano_banana", apiKeys.falApiKey, referenceUrls);
      setProposals((prev) => prev.map((p, i) => (i === idx ? { ...p, url: result.url, loading: false, error: false } : p)));
    } catch {
      setProposals((prev) => prev.map((p, i) => (i === idx ? { ...p, loading: false, error: true } : p)));
    }
  }

  function runProposals(fromPrompt: string) {
    setProposalsOpen(true);
    const slots: ProposalSlot[] = PROPOSAL_VARIANTS.map((variant) => ({
      prompt: `${fromPrompt} ${variant}`,
      loading: true,
      error: false,
    }));
    setProposals(slots);
    slots.forEach((slot, i) => {
      void generateSlot(slot.prompt, i);
    });
  }

  async function handleModify() {
    if (!modificationText.trim()) return;
    setRefining(true);
    try {
      const refined = await refineCharacterPrompt(basePrompt, modificationText.trim(), apiKeys.claudeApiKey);
      setBasePrompt(refined);
      setModificationText("");
      runProposals(refined);
    } finally {
      setRefining(false);
    }
  }

  function choseProposal(proposal: ProposalSlot) {
    if (!proposal.url) return;
    updateCharacterReference(refKey, {
      sheetUrl: proposal.url,
      status: "generated",
      prompt: proposal.prompt,
    });
    setProposalsOpen(false);
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-gold-light flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> {reference.name}
          {reference.variant && (
            <Badge tone={reference.variant === "avant" ? "danger" : "success"}>
              {reference.variant === "avant" ? "AVANT" : "APRÈS"}
            </Badge>
          )}
        </span>
        <Badge tone={isValidated ? "success" : reference.status === "generated" ? "gold" : "neutral"}>
          {isValidated ? "Validé" : reference.status === "generated" ? "À valider" : isGenerating ? "Génération..." : "En attente"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {originalPhoto && (
          <div>
            <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1">Photo de référence</p>
            <div className="aspect-[9/16] bg-surface2 border border-border rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalPhoto.url} alt={reference.name} className="w-full h-full object-cover" />
            </div>
          </div>
        )}
        <div>
          <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1">Fiche casting</p>
          <div className="aspect-[9/16] bg-surface2 border border-border rounded overflow-hidden flex items-center justify-center relative">
            {isGenerating && (
              <div className="flex flex-col items-center gap-2 text-ink-secondary">
                <RefreshCw className="w-5 h-5 animate-spin text-gold" />
                <span className="text-[10px] font-mono">génération...</span>
              </div>
            )}
            {!isGenerating && reference.sheetUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={reference.sheetUrl} alt={`${displayName} sheet`} className="w-full h-full object-cover" />
                <ImageDownloadButton url={reference.sheetUrl} filename={`${slugify(displayName)}-fiche-casting.jpg`} />
              </>
            )}
            {!isGenerating && !reference.sheetUrl && (
              <span className="text-xs text-ink-secondary px-3 text-center">Aucune fiche générée</span>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea rows={3} value={promptDraft} onChange={(e) => setPromptDraft(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { setEditing(false); runGeneration(promptDraft); }}>
              Régénérer avec ce prompt
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-ink-secondary line-clamp-2">{reference.prompt}</p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {!reference.sheetUrl && (
          <>
            <Button size="sm" onClick={() => runGeneration(reference.prompt)} disabled={isGenerating}>
              <Sparkles className="w-3.5 h-3.5" /> Générer la fiche casting
            </Button>
            <Button size="sm" variant="secondary" onClick={() => runProposals(basePrompt)} disabled={isGenerating}>
              <Sparkles className="w-3.5 h-3.5" /> Proposer 3 apparences
            </Button>
          </>
        )}
        {reference.sheetUrl && !isGenerating && (
          <>
            {isValidated ? (
              <Button size="sm" variant="secondary" disabled>
                <Check className="w-3.5 h-3.5" /> Validé
              </Button>
            ) : (
              <Button size="sm" onClick={() => updateCharacterReference(refKey, { status: "validated" })}>
                <Check className="w-3.5 h-3.5" /> Valider
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => runGeneration(reference.prompt)}>
              <RefreshCw className="w-3.5 h-3.5" /> Régénérer
            </Button>
            <Button size="sm" variant="secondary" onClick={() => runProposals(basePrompt)}>
              <Sparkles className="w-3.5 h-3.5" /> Proposer 3 apparences
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Modifier le prompt
            </Button>
          </>
        )}
      </div>

      <Modal
        open={proposalsOpen}
        onClose={() => setProposalsOpen(false)}
        title={`3 apparences pour ${displayName}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex gap-4 overflow-x-auto sm:grid sm:grid-cols-3 sm:overflow-visible pb-2">
            {proposals.map((proposal, i) => (
              <div key={i} className="space-y-2 w-[220px] sm:w-auto shrink-0 sm:shrink">
                <div className="aspect-[9/16] bg-surface2 border border-border rounded overflow-hidden flex items-center justify-center relative">
                  {proposal.loading && (
                    <div className="flex flex-col items-center gap-2 text-ink-secondary">
                      <RefreshCw className="w-5 h-5 animate-spin text-gold" />
                      <span className="text-[10px] font-mono">génération...</span>
                    </div>
                  )}
                  {!proposal.loading && proposal.error && (
                    <div className="flex flex-col items-center gap-2 text-red-400 px-3 text-center">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-xs">Génération échouée</span>
                    </div>
                  )}
                  {!proposal.loading && !proposal.error && proposal.url && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proposal.url} alt={`Proposition ${i + 1}`} className="w-full h-full object-cover" />
                      <ImageDownloadButton url={proposal.url} filename={`${slugify(displayName)}-proposition-${i + 1}.jpg`} />
                    </>
                  )}
                </div>
                {proposal.error ? (
                  <Button size="sm" variant="secondary" className="w-full" onClick={() => void generateSlot(proposal.prompt, i)}>
                    <RefreshCw className="w-3.5 h-3.5" /> Réessayer
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={proposal.loading || !proposal.url}
                    onClick={() => choseProposal(proposal)}
                  >
                    Choisir celle-ci
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs text-ink-secondary">
              Aucune ne convient ? Décris la modification (ex : option 2 mais cheveux blonds, option 1 mais plus
              jeune)...
            </p>
            <div className="flex gap-2">
              <Textarea
                rows={2}
                className="flex-1"
                value={modificationText}
                onChange={(e) => setModificationText(e.target.value)}
                placeholder="Décris la modification..."
              />
              <Button onClick={handleModify} disabled={!modificationText.trim() || refining} className="self-end">
                <Wand2 className="w-3.5 h-3.5" /> {refining ? "Modification..." : "Modifier"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export function CharacterReferences() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const initCharacterReferences = useProjectStore((s) => s.initCharacterReferences);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const styles = useStyleStore((s) => s.styles);
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];

  const plan = currentProject?.plan;
  // Un personnage récurrent = une seule identité fixe, sauf transformation
  // physique durable détectée (variant "avant"/"après") — jamais plus de 2
  // fiches, jamais pour un état émotionnel passager.
  const distinctPairs = Array.from(
    new Map(
      (plan?.scenes ?? []).flatMap((s) =>
        s.characters.map((assetId) => {
          const key = characterReferenceKey(assetId, s.characterVariant);
          return [key, { key, assetId, variant: s.characterVariant }] as const;
        })
      )
    ).values()
  );

  useEffect(() => {
    if (!currentProject || distinctPairs.length === 0) return;
    const missing = distinctPairs.filter((p) => !currentProject.characterReferences?.[p.key]);
    if (missing.length === 0) return;
    const refs = missing.map(({ assetId, variant }) => {
      const photo = brand?.characterPhotos.find((p) => p.id === assetId);
      const name = photo?.name || plan?.characterNames?.[assetId] || "Personnage";
      const profile = plan?.characterProfiles?.[assetId];
      const physicalState = variant === "avant" ? profile?.etatAvant : variant === "après" ? profile?.etatApres : undefined;
      return {
        assetId,
        name,
        variant,
        prompt: buildCharacterSheetPrompt(name, style, variant, physicalState),
        status: "pending" as const,
      };
    });
    initCharacterReferences(refs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, distinctPairs.map((p) => p.key).join(",")]);

  useEffect(() => {
    if (currentProject && distinctPairs.length === 0) {
      setStatus("frames");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id, distinctPairs.length]);

  if (!currentProject || !plan || distinctPairs.length === 0) return null;

  const references = distinctPairs
    .map((p) => ({ key: p.key, ref: currentProject.characterReferences?.[p.key] }))
    .filter((r): r is { key: string; ref: CharacterReference } => !!r.ref);
  const allValidated = references.length > 0 && references.every((r) => r.ref.status === "validated");

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Références personnages</h1>
        <p className="text-sm text-ink-secondary">
          Étape obligatoire avant les frames — chaque personnage récurrent doit avoir une fiche casting validée
          (une seule identité visuelle fixe) pour rester cohérent d&apos;un plan à l&apos;autre. Choisis parmi 3
          propositions d&apos;apparence celle qui correspond le mieux au script.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {references.map(({ key, ref }) => {
          const avantReference =
            ref.variant === "après"
              ? currentProject.characterReferences?.[characterReferenceKey(ref.assetId, "avant")]
              : undefined;
          return <CharacterCard key={key} refKey={key} reference={ref} avantReference={avantReference} />;
        })}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={() => setStatus("frames")} disabled={!allValidated}>
          Continuer vers les frames
        </Button>
      </div>
    </div>
  );
}
