import sharp from "sharp";
import path from "node:path";
import type { PhotoCarouselRequest } from "../types.js";
import { resolveAspectDimensions } from "../types.js";

const MAX_SLIDES = 20;

/** Formats each selected photo as one ordered Instagram carousel slide. */
export async function composePhotoCarousel(uploadsDir: string, req: PhotoCarouselRequest): Promise<Buffer[]> {
  if (req.images.length < 2 || req.images.length > MAX_SLIDES) {
    throw new Error(`A photo carousel requires between 2 and ${MAX_SLIDES} photos.`);
  }

  const orientation = req.aspect === "1.91:1" ? "landscape" : "portrait";
  const { width, height } = resolveAspectDimensions(req.aspect, orientation);
  return Promise.all(
    req.images.map((image) =>
      sharp(path.join(uploadsDir, image))
        .resize(width, height, { fit: "cover", position: "attention" })
        .jpeg({ quality: 92 })
        .toBuffer()
    )
  );
}