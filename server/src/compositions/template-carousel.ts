import sharp from "sharp";
import type { OverlayOptions } from "sharp";
import path from "node:path";
import type { AspectRatioId, CarouselCompositionId, CompositionCarouselRequest } from "../types.js";
import { resolveAspectDimensions } from "../types.js";

interface PhotoSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  framed?: boolean;
}

interface Composition {
  slides: number;
  columns: number;
  rows: number;
  slots: PhotoSlot[];
}

const COMPOSITIONS: Record<CarouselCompositionId, Composition> = {
  panorama: { slides: 2, columns: 2, rows: 1, slots: [{ x: 0, y: 0, width: 2, height: 1 }] },
  "feature-pair": {
    slides: 2,
    columns: 2,
    rows: 1,
    slots: [
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 0, width: 1, height: 0.5 },
      { x: 1, y: 0.5, width: 1, height: 0.5 },
    ],
  },
  "magazine-spread": {
    slides: 2,
    columns: 2,
    rows: 1,
    slots: [
      { x: 0.05, y: 0.06, width: 0.9, height: 0.88 },
      { x: 1.05, y: 0.06, width: 0.9, height: 0.43 },
      { x: 1.05, y: 0.53, width: 0.43, height: 0.41 },
      { x: 1.52, y: 0.53, width: 0.43, height: 0.41 },
    ],
  },
  "photo-journal": {
    slides: 3,
    columns: 3,
    rows: 1,
    slots: [
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 0, width: 1, height: 1 },
      { x: 2, y: 0, width: 0.48, height: 1 },
      { x: 2.52, y: 0, width: 0.48, height: 1 },
    ],
  },
  "profile-grid": {
    slides: 9,
    columns: 3,
    rows: 3,
    slots: Array.from({ length: 9 }, (_, index) => ({
      x: index % 3,
      y: Math.floor(index / 3),
      width: 1,
      height: 1,
    })),
  },
  "layered-story": {
    slides: 2,
    columns: 2,
    rows: 1,
    slots: [
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 0.15, y: 0.13, width: 0.72, height: 0.72, framed: true },
      { x: 1.12, y: 0.17, width: 0.72, height: 0.67, framed: true },
    ],
  },
};

/** Composes a preset across one wide canvas, then exports its individual carousel slides. */
export async function composeTemplateCarousel(
  uploadsDir: string,
  req: CompositionCarouselRequest
): Promise<Buffer[]> {
  const composition = COMPOSITIONS[req.composition];
  if (!composition) throw new Error("Choose a valid carousel composition.");
  if (req.images.length !== composition.slots.length) {
    throw new Error(`${req.composition} requires exactly ${composition.slots.length} photos.`);
  }

  const orientation = req.aspect === "1.91:1" ? "landscape" : "portrait";
  const { width, height } = resolveAspectDimensions(req.aspect, orientation);
  const canvasWidth = width * composition.columns;
  const canvasHeight = height * composition.rows;
  const composites: OverlayOptions[] = [];

  for (const [index, slot] of composition.slots.entries()) {
    const left = Math.round(slot.x * width);
    const top = Math.round(slot.y * height);
    const slotWidth = Math.round(slot.width * width);
    const slotHeight = Math.round(slot.height * height);
    const frame = slot.framed ? Math.max(8, Math.round(width * 0.018)) : 0;

    if (frame) {
      const backing = await sharp({
        create: { width: slotWidth, height: slotHeight, channels: 4, background: "#ffffff" },
      })
        .png()
        .toBuffer();
      composites.push({ input: backing, left, top });
    }

    const photo = await sharp(path.join(uploadsDir, req.images[index]))
      .resize(slotWidth - frame * 2, slotHeight - frame * 2, { fit: "cover", position: "attention" })
      .jpeg({ quality: 92 })
      .toBuffer();
    composites.push({ input: photo, left: left + frame, top: top + frame });
  }

  const canvas = await sharp({
    create: { width: canvasWidth, height: canvasHeight, channels: 3, background: "#f5f4f0" },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return Promise.all(
    Array.from({ length: composition.slides }, (_, index) =>
      sharp(canvas)
        .extract({
          left: (index % composition.columns) * width,
          top: Math.floor(index / composition.columns) * height,
          width,
          height,
        })
        .jpeg({ quality: 92 })
        .toBuffer()
    )
  );
}