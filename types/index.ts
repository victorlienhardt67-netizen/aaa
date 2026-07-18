// Golddust Studio — Types globaux

export type Lang = "fr" | "en";

export type BrandTone =
  | "luxe"
  | "scientifique"
  | "fun"
  | "doux"
  | "direct";

export const BRAND_TONE_LABELS: Record<BrandTone, string> = {
  luxe: "Luxe & Premium",
  scientifique: "Scientifique & Crédible",
  fun: "Fun & Énergique",
  doux: "Doux & Naturel",
  direct: "Direct & Percutant",
};

export interface BrandAsset {
  id: string;
  url: string; // base64 or storage URL
  name?: string; // nom du personnage (pour photos modèles)
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  tone: BrandTone;
  defaultLang: Lang;
  productPhotos: BrandAsset[];
  characterPhotos: BrandAsset[];
  generationNotes: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export type ImageEngine = "auto" | "nano_banana" | "flux_pro" | "ideogram_v3";
export type VideoEngine = "auto" | "kling_3_0" | "grok_video" | "wan_2_6" | "seedance_2_0";

export const IMAGE_ENGINE_LABELS: Record<ImageEngine, string> = {
  auto: "Auto",
  nano_banana: "Nano Banana",
  flux_pro: "Flux Pro",
  ideogram_v3: "Ideogram v3",
};

export const VIDEO_ENGINE_LABELS: Record<VideoEngine, string> = {
  auto: "Auto",
  kling_3_0: "Kling 3.0",
  grok_video: "Grok Video",
  wan_2_6: "Wan 2.6",
  seedance_2_0: "Seedance 2.0",
};

export interface StylePreset {
  id: string;
  name: string;
  icon: string; // lucide icon name
  shortDescription: string;
  positivePrompt: string;
  negativePrompt: string;
  recommendedImageEngine: ImageEngine;
  recommendedVideoEngine: VideoEngine;
  bestFor: Lang[]; // "Best for FR" / "Best for EN"
  isCustom: boolean;
  createdAt: string;
}

export type CameraMovement =
  | "push_in"
  | "whip_pan"
  | "orbit_360"
  | "crane_up"
  | "handheld_shake"
  | "zoom_explosif"
  | "tilt_reveal"
  | "dolly_out"
  | "static_pan";

export const CAMERA_MOVEMENT_LABELS: Record<CameraMovement, string> = {
  push_in: "Push-in dramatique",
  whip_pan: "Whip pan",
  orbit_360: "Orbit 360°",
  crane_up: "Crane up",
  handheld_shake: "Handheld shake",
  zoom_explosif: "Zoom explosif",
  tilt_reveal: "Tilt reveal",
  dolly_out: "Dolly out",
  static_pan: "Pan latéral lent",
};

export type MotionIntensity = "doux" | "equilibre" | "dynamique" | "extreme";

export const MOTION_INTENSITY_LABELS: Record<MotionIntensity, string> = {
  doux: "Doux",
  equilibre: "Équilibré",
  dynamique: "Dynamique",
  extreme: "Extrême",
};

export type SceneStatus =
  | "draft"
  | "frame_pending"
  | "frame_generating"
  | "frame_generated"
  | "frame_validated"
  | "video_pending"
  | "video_generating"
  | "video_generated"
  | "video_validated"
  | "error";

export interface VoiceOver {
  enabled: boolean;
  text: string;
  voiceId?: string;
  lang: Lang;
  audioUrl?: string;
}

export interface SceneFeedback {
  id: string;
  sceneId: string;
  rating: "up" | "down";
  reason?: string;
  comment?: string;
  engine?: string;
  createdAt: string;
}

export interface Scene {
  id: string;
  index: number;
  description: string;
  durationSeconds: number;
  cameraMovement: CameraMovement;
  characters: string[]; // references to BrandAsset ids
  hasProduct: boolean;
  productAssetId?: string;
  needsFrame: boolean;
  imagePrompt: string;
  videoPrompt: string;
  dialogueLang?: Lang;
  voiceOver?: VoiceOver;

  frameUrl?: string;
  frameStatus: SceneStatus;
  frameHistory: string[];

  videoUrl?: string;
  videoStatus: SceneStatus;
  videoCostEstimate?: number;
  imageCostEstimate?: number;

  feedback?: SceneFeedback;
}

export interface ProductionPlan {
  scenes: Scene[];
  detectedLang: Lang;
  generatedAt: string;
}

export type ProjectStatus =
  | "brief"
  | "analyzing"
  | "plan_ready"
  | "frames"
  | "videos"
  | "export"
  | "completed";

export interface Project {
  id: string;
  name: string;
  brandId: string;
  styleId: string;
  lang: Lang;
  targetDuration: number; // seconds
  imageEngine: ImageEngine;
  videoEngine: VideoEngine;
  brief: string;
  referenceImages: string[];
  plan?: ProductionPlan;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  totalCostEstimate: number;
  templateSourceId?: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  structure: string; // narrative structure prefill for brief
  recommendedScenes: number;
  recommendedDuration: number;
  isCustom: boolean;
  createdAt: string;
}

export interface ApiKeys {
  falApiKey: string;
  higgsfieldApiKey: string;
  claudeApiKey: string;
}

export interface GenerationDefaults {
  imageEngine: ImageEngine;
  videoEngine: VideoEngine;
  defaultStyleId?: string;
  defaultLang: Lang;
  motionIntensity: MotionIntensity;
}

export interface LearningEntry {
  id: string;
  engine: string;
  reason: string;
  comment?: string;
  createdAt: string;
}
