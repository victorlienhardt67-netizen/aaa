"use client";

import { useEffect, useState } from "react";
import { Check, RefreshCw, Sparkles, Users } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import { CharacterReference } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { falGenerateImage } from "@/lib/fal";
import { buildCharacterSheetPrompt } from "@/lib/prompts";
import { characterReferenceKey } from "@/lib/utils";

const PROPOSAL_VARIANTS = [
  "Interprétation 1 : expression douce et posture détendue.",
  "Interprétation 2 : expression confiante et posture affirmée.",
  "Interprétation 3 : expression enjouée et posture dynamique.",
];

function CharacterCard({ refKey, reference }: { refKey: string; reference: CharacterReference }) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateCharacterReference = useProjectStore((s) => s.updateCharacterReference);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const [editing, setEditing] = useState(false);
  const [promptDraft, setPromptDraft] = useState(reference.prompt);
  const [proposalsOpen, setProposalsOpen] = useState(false);
  const [proposals, setProposals] = useState<{ url: string; prompt: string }[]>([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);

  const originalPhoto = brand?.characterPhotos.find((p) => p.id === reference.assetId);
  const isGenerating = reference.status === "generating";
  const isValidated = reference.status === "validated";
  const displayName = reference.state ? `${reference.name} — ${reference.state}` : reference.name;

  async function runGeneration(prompt: string) {
    updateCharacterReference(refKey, { status: "generating" });
    const referenceUrls = originalPhoto ? [originalPhoto.url] : undefined;
    const result = await falGenerateImage(prompt, "nano_banana", apiKeys.falApiKey, referenceUrls);
    updateCharacterReference(refKey, {
      sheetUrl: result.url,
      status: "generated",
      prompt,
    });
  }

  async function runProposals() {
    setProposalsOpen(true);
    setProposalsLoading(true);
    const referenceUrls = originalPhoto ? [originalPhoto.url] : undefined;
    const results = await Promise.all(
      PROPOSAL_VARIANTS.map(async (variant) => {
        const prompt = `${reference.prompt} ${variant}`;
        const result = await falGenerateImage(prompt, "nano_banana", apiKeys.falApiKey, referenceUrls);
        return { url: result.url, prompt };
      })
    );
    setProposals(results);
    setProposalsLoading(false);
  }

  function choseProposal(proposal: { url: string; prompt: string }) {
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
          <Users className="w-3.5 h-3.5" /> {displayName}
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
          <p className="text-[10px] font-mono uppercase text-ink-secondary mb-1">Character sheet</p>
          <div className="aspect-[9/16] bg-surface2 border border-border rounded overflow-hidden flex items-center justify-center">
            {isGenerating && (
              <div className="flex flex-col items-center gap-2 text-ink-secondary">
                <RefreshCw className="w-5 h-5 animate-spin text-gold" />
                <span className="text-[10px] font-mono">génération...</span>
              </div>
            )}
            {!isGenerating && reference.sheetUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={reference.sheetUrl} alt={`${displayName} sheet`} className="w-full h-full object-cover" />
            )}
            {!isGenerating && !reference.sheetUrl && (
              <span className="text-xs text-ink-secondary px-3 text-center">Aucun sheet généré</span>
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
              <Sparkles className="w-3.5 h-3.5" /> Générer le character sheet
            </Button>
            <Button size="sm" variant="secondary" onClick={runProposals} disabled={isGenerating}>
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
            <Button size="sm" variant="secondary" onClick={runProposals}>
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
        {proposalsLoading ? (
          <div className="py-12 flex flex-col items-center gap-3 text-ink-secondary">
            <RefreshCw className="w-6 h-6 animate-spin text-gold" />
            Génération des 3 propositions...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {proposals.map((proposal, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[9/16] bg-surface2 border border-border rounded overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proposal.url} alt={`Proposition ${i + 1}`} className="w-full h-full object-cover" />
                </div>
                <Button size="sm" className="w-full" onClick={() => choseProposal(proposal)}>
                  Choisir celle-ci
                </Button>
              </div>
            ))}
          </div>
        )}
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
  // Chaque paire distincte (personnage, état) a son propre character sheet.
  const distinctPairs = Array.from(
    new Map(
      (plan?.scenes ?? []).flatMap((s) =>
        s.characters.map((assetId) => {
          const key = characterReferenceKey(assetId, s.characterState);
          return [key, { key, assetId, state: s.characterState }] as const;
        })
      )
    ).values()
  );

  useEffect(() => {
    if (!currentProject || distinctPairs.length === 0) return;
    const missing = distinctPairs.filter((p) => !currentProject.characterReferences?.[p.key]);
    if (missing.length === 0) return;
    const refs = missing.map(({ assetId, state }) => {
      const photo = brand?.characterPhotos.find((p) => p.id === assetId);
      const name = photo?.name || "Personnage";
      return {
        assetId,
        name,
        state,
        prompt: buildCharacterSheetPrompt(name, style, state),
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
          Étape obligatoire avant les frames — chaque personnage récurrent (et chaque état distinct, ex.
          avant/après) doit avoir un character sheet validé pour rester cohérent d&apos;un plan à l&apos;autre.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {references.map(({ key, ref }) => (
          <CharacterCard key={key} refKey={key} reference={ref} />
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={() => setStatus("frames")} disabled={!allValidated}>
          Continuer vers les frames
        </Button>
      </div>
    </div>
  );
}
