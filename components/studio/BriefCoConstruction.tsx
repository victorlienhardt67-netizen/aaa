"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MessageSquare, RefreshCw, Send, Sparkles } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useBrandStore } from "@/store/brandStore";
import { useStyleStore } from "@/store/styleStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useLearningStore } from "@/store/learningStore";
import { CoConstructionMessage } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { coConstructBrief, analyzeBrief } from "@/lib/claude";
import { buildLearningContext } from "@/lib/prompts";
import { cn } from "@/lib/utils";

/**
 * Étape 0 — co-construction du brief. Une vraie conversation par tours avec
 * Claude (reformulation + questions par petits blocs, jamais tout d'un coup),
 * qui se termine par une synthèse structurée soumise à validation explicite
 * avant de lancer l'analyse. Aucune logique de "bloc" n'est codée ici :
 * Claude gère lui-même sa progression via le system prompt dédié.
 */
export function BriefCoConstruction() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateCurrentProject = useProjectStore((s) => s.updateCurrentProject);
  const setStatus = useProjectStore((s) => s.setStatus);
  const brand = useBrandStore((s) => s.brands.find((b) => b.id === currentProject?.brandId));
  const styles = useStyleStore((s) => s.styles);
  const style = styles.find((s) => s.id === currentProject?.styleId) ?? styles[0];
  const settings = useSettingsStore((s) => s.generationDefaults);
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const advancedPrompts = useSettingsStore((s) => s.advancedPrompts);
  const learningEntries = useLearningStore((s) => s.entries);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const messages = currentProject?.coConstruction?.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const awaitingValidation = lastMessage?.role === "assistant" && !!lastMessage.isFinalSynthesis;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  // Premier tour : déclenché une seule fois à l'arrivée sur cette étape.
  useEffect(() => {
    if (startedRef.current || !currentProject) return;
    if (messages.length > 0) return;
    startedRef.current = true;
    void sendTurn([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]);

  async function sendTurn(historyWithNewUserTurn: CoConstructionMessage[]) {
    if (!currentProject) return;
    setSending(true);
    setError(null);
    try {
      const turn = await coConstructBrief({
        brief: currentProject.brief,
        history: historyWithNewUserTurn.map((m) => ({ role: m.role, content: m.content })),
        apiKey: apiKeys.claudeApiKey,
        systemPromptOverride: advancedPrompts.coConstructionSystemPrompt,
        styleName: style?.name,
      });
      const assistantMessage: CoConstructionMessage = {
        role: "assistant",
        content: turn.message,
        quickReplies: turn.quickReplies,
        isFinalSynthesis: turn.isFinalSynthesis,
      };
      updateCurrentProject({
        coConstruction: {
          messages: [...historyWithNewUserTurn, assistantMessage],
          synthesis: turn.isFinalSynthesis ? turn.synthesis ?? turn.message : currentProject.coConstruction?.synthesis,
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de connexion à Claude.");
    } finally {
      setSending(false);
    }
  }

  function handleSend(text: string) {
    if (!text.trim() || sending || !currentProject) return;
    const userMessage: CoConstructionMessage = { role: "user", content: text.trim() };
    const updated = [...messages, userMessage];
    updateCurrentProject({ coConstruction: { messages: updated, synthesis: currentProject.coConstruction?.synthesis } });
    setInput("");
    void sendTurn(updated);
  }

  async function handleLaunch() {
    if (!currentProject || !style) return;
    const synthesis = currentProject.coConstruction?.synthesis;
    setLaunching(true);
    setStatus("analyzing");
    try {
      const enrichedBrief = synthesis ? `${currentProject.brief}\n\n${synthesis}` : currentProject.brief;
      const plan = await analyzeBrief({
        brief: enrichedBrief,
        brand,
        style,
        lang: currentProject.lang,
        targetDuration: currentProject.targetDuration,
        motionIntensity: settings.motionIntensity,
        learningContext: buildLearningContext(learningEntries),
        apiKey: apiKeys.claudeApiKey,
        systemPromptOverride: advancedPrompts.analyzeBriefSystemPrompt,
        minSceneDurationSeconds: advancedPrompts.minSceneDurationSeconds,
        maxSceneDurationSeconds: advancedPrompts.maxSceneDurationSeconds,
      });
      updateCurrentProject({ plan, status: "plan_ready" });
      setStatus("plan_ready");
    } finally {
      setLaunching(false);
    }
  }

  if (!currentProject) return null;

  return (
    <div className="max-w-3xl mx-auto p-8 flex flex-col h-full">
      <div className="mb-4">
        <h1 className="font-display font-bold text-2xl text-ink mb-1 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gold" /> Co-construction du brief
        </h1>
        <p className="text-sm text-ink-secondary">
          Une conversation avec Claude pour éliminer toute ambiguïté avant de lancer la production — rien n&apos;est
          généré tant que tu n&apos;as pas validé la synthèse finale.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%]", m.role === "user" ? "" : "w-full")}>
              {m.role === "assistant" ? (
                <Card className={cn("p-4", m.isFinalSynthesis && "border-gold/50")}>
                  {m.isFinalSynthesis && (
                    <div className="flex items-center gap-1.5 text-gold-light text-xs font-mono uppercase mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Synthèse finale
                    </div>
                  )}
                  <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </Card>
              ) : (
                <div className="bg-gold/10 border border-gold/30 rounded-lg px-4 py-2.5">
                  <p className="text-sm text-ink">{m.content}</p>
                </div>
              )}

              {i === messages.length - 1 && m.role === "assistant" && !sending && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {m.isFinalSynthesis ? (
                    <>
                      <Button size="sm" onClick={handleLaunch} disabled={launching}>
                        <Check className="w-3.5 h-3.5" /> {launching ? "Lancement..." : "Tout est bon, on lance"}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => document.getElementById("cochat-input")?.focus()}>
                        Je veux modifier un point
                      </Button>
                    </>
                  ) : (
                    m.quickReplies?.map((qr, qi) => (
                      <Button key={qi} size="sm" variant="secondary" onClick={() => handleSend(qr)}>
                        {qr}
                      </Button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-2 text-ink-secondary text-xs font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold" /> Claude réfléchit...
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-900/50 rounded p-3 text-sm text-red-400">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 pt-3 border-t border-border">
        <Textarea
          id="cochat-input"
          rows={2}
          className="flex-1"
          placeholder={
            awaitingValidation
              ? "Décris ce que tu veux modifier dans la synthèse..."
              : "Réponds librement, ou clique une option ci-dessus..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(input);
            }
          }}
          disabled={sending}
        />
        <Button onClick={() => handleSend(input)} disabled={!input.trim() || sending} className="self-end">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
