import sharp from "sharp";
import path from "node:path";
import type { CarouselRequest } from "../types.js";
import { resolveAspectDimensions } from "../types.js";

/**
 * Splits one wide image into N equal Instagram carousel slides.
 * The source is scaled/cropped to cover a canvas of (slices * slideWidth) x slideHeight,
 * then cut into vertical strips.
 */
export async function composeCarousel(uploadsDir: string, req: CarouselRequest): Promise<Buffer[]> {
  const { image, slices, aspect } = req;
  const { width: slideWidth, height: slideHeight } = resolveAspectDimensions(aspect, "portrait");
  const canvasWidth = slideWidth * slices;

  const flat = await sharp(path.join(uploadsDir, image))
    .resize(canvasWidth, slideHeight, { fit: "cover", position: "attention" })
    .toBuffer();

  const slides: Buffer[] = [];
  for (let i = 0; i < slices; i++) {
    const slide = await sharp(flat)
      .extract({ left: i * slideWidth, top: 0, width: slideWidth, height: slideHeight })
      .png()
      .toBuffer();
    slides.push(slide);
  }
  return slides;
}
