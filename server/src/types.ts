export type AspectPreset = "1:1" | "4:5" | "9:16" | "16:9";

export const ASPECT_DIMENSIONS: Record<AspectPreset, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};

export interface GridRequest {
  type: "grid";
  images: string[];
  rows: number;
  cols: number;
  gap?: number;
  background?: string;
  cellWidth?: number;
  cellHeight?: number;
}

export interface CarouselRequest {
  type: "carousel";
  image: string;
  slices: number;
  aspect: AspectPreset;
}

export interface StoryBlurRequest {
  type: "story-blur";
  image: string;
  aspect: AspectPreset;
  blurSigma?: number;
}

export type ComposeRequest = GridRequest | CarouselRequest | StoryBlurRequest;
