// ============================================================
// Interfaces providers — le "réel" se branche ici.
// Chaque brique (image/vidéo/TTS/lip-sync/LLM) a une interface
// stable ; l'app appelle ces fonctions sans connaître le provider.
// Adaptateurs actuels : mock. À remplacer par KIE / HeyGen / etc.
// ============================================================
import type { NarrativeTag, RunMode } from "../types";

export interface GenResult {
  url: string;
  provider: string;
  model: string;
  costCredits: number;
  seed?: number;
  duration?: number;
}

export interface ImageParams {
  prompt: string;
  styleKey: string;
  aspect: string;
  model: string;
  refImage?: string; // cohérence personnage
  seed?: number;
  label?: string; // ex. "SC-01"
  accent?: string;
}

export interface VideoParams {
  frameUrl: string;
  prompt?: string;
  duration: number;
  model: string;
  styleKey: string;
  accent?: string;
  label?: string;
}

export interface TTSParams {
  text: string;
  voiceId: string;
}

export interface LipSyncParams {
  frameUrl: string;
  audioUrl: string;
}

// ---- Résultat d'analyse de script ----
export interface AnalyzedScene {
  tag: NarrativeTag;
  framing: string;
  voLine: string;
  duration: number;
  isDialogue: boolean;
  speaker?: string; // nom du perso détecté si dialogue
  line?: string; // réplique détectée
  suggestedCharacter?: string;
}

export interface AnalyzedCharacter {
  name: string;
  wearing?: string;
}

export interface AnalyzeResult {
  scenes: AnalyzedScene[];
  characters: AnalyzedCharacter[];
  voDuration: number;
}

export interface AnalyzeParams {
  script: string;
  brandDna: string;
  mode: RunMode;
  styleKey: string;
  voDuration?: number;
}

export interface Providers {
  analyze(p: AnalyzeParams): Promise<AnalyzeResult>;
  image(p: ImageParams): Promise<GenResult>;
  video(p: VideoParams): Promise<GenResult>;
  tts(p: TTSParams): Promise<GenResult>;
  lipsync(p: LipSyncParams): Promise<GenResult>;
}
