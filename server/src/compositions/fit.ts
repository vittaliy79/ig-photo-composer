import sharp from "sharp";
import path from "node:path";
import type { FitRequest } from "../types.js";
import { resolveAspectDimensions } from "../types.js";

/**
 * Fits each source photo into the target aspect/orientation without cropping the subject,
 * filling the remaining canvas with either a blurred copy of the photo or a solid color.
 * Produces one output image per input image.
 */
export async function composeFit(uploadsDir: string, req: FitRequest): Promise<Buffer[]> {
  const { images, aspect, orientation, background } = req;
  const { width, height } = resolveAspectDimensions(aspect, orientation);

  const results: Buffer[] = [];
  for (const image of images) {
    const srcPath = path.join(uploadsDir, image);

    const backgroundBuf =
      background.mode === "blur"
        ? await sharp(srcPath)
            .resize(width, height, { fit: "cover", position: "attention" })
            .blur(background.sigma ?? 40)
            .modulate({ brightness: 0.85 })
            .toBuffer()
        : await sharp({ create: { width, height, channels: 4, background: background.color } }).png().toBuffer();

    const foreground = await sharp(srcPath).resize(width, height, { fit: "inside" }).toBuffer();
    const fgMeta = await sharp(foreground).metadata();
    const left = Math.round((width - (fgMeta.width ?? width)) / 2);
    const top = Math.round((height - (fgMeta.height ?? height)) / 2);

    const out = await sharp(backgroundBuf)
      .composite([{ input: foreground, left, top }])
      .jpeg({ quality: 92 })
      .toBuffer();
    results.push(out);
  }
  return results;
}
