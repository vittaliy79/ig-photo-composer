// Instagram-recommended pixel sizes (2025-2026), expressed in each ratio's native orientation.
export type AspectRatioId = "1:1" | "4:5" | "1.91:1" | "9:16";
export type Orientation = "portrait" | "landscape";

interface Dimensions {
  width: number;
  height: number;
}

const ASPECT_BASE: Record<AspectRatioId, Dimensions> = {
  "1:1": { width: 1080, height: 1080 }, // square feed post
  "4:5": { width: 1080, height: 1350 }, // portrait feed post
  "1.91:1": { width: 1080, height: 566 }, // landscape feed post
  "9:16": { width: 1080, height: 1920 }, // story / reel
};

/** Resolves an aspect ratio to pixel dimensions, swapping width/height to match the requested orientation. */
export function resolveAspectDimensions(aspect: AspectRatioId, orientation: Orientation): Dimensions {
  const base = ASPECT_BASE[aspect];
  if (aspect === "1:1") return base;
  const isNativePortrait = base.height > base.width;
  const wantsPortrait = orientation === "portrait";
  return wantsPortrait === isNativePortrait ? base : { width: base.height, height: base.width };
}

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
  aspect: AspectRatioId;
}

export interface PhotoCarouselRequest {
  type: "photo-carousel";
  images: string[];
  aspect: AspectRatioId;
}

export type CarouselCompositionId = "panorama" | "feature-pair" | "magazine-spread" | "photo-journal" | "profile-grid" | "layered-story";

export interface CompositionCarouselRequest {
  type: "composition-carousel";
  images: string[];
  aspect: AspectRatioId;
  composition: CarouselCompositionId;
  cropFocus?: Array<{ x: number; y: number }>;
  cropZoom?: number[];
}

export type FitBackground = { mode: "blur"; sigma?: number } | { mode: "color"; color: string };

export interface FitRequest {
  type: "fit";
  images: string[];
  aspect: AspectRatioId;
  orientation: Orientation;
  background: FitBackground;
}

export type ComposeRequest = GridRequest | CarouselRequest | PhotoCarouselRequest | CompositionCarouselRequest | FitRequest;
