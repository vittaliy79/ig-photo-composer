import sharp from "sharp";
import path from "node:path";
import type { StoryBlurRequest } from "../types.js";
import { ASPECT_DIMENSIONS } from "../types.js";

/**
 * Fits any photo into a target aspect ratio (e.g. 9:16 story) by placing it centered
 * over a blurred, cropped-to-cover copy of itself as background filler.
 */
export async function composeStoryBlur(uploadsDir: string, req: StoryBlurRequest): Promise<Buffer> {
  const { image, aspect, blurSigma = 40 } = req;
  const { width, height } = ASPECT_DIMENSIONS[aspect];
  const srcPath = path.join(uploadsDir, image);

  const background = await sharp(srcPath)
    .resize(width, height, { fit: "cover", position: "attention" })
    .blur(blurSigma)
    .modulate({ brightness: 0.85 })
    .toBuffer();

  const foreground = await sharp(srcPath)
    .resize(width, height, { fit: "inside" })
    .toBuffer();

  const fgMeta = await sharp(foreground).metadata();
  const left = Math.round((width - (fgMeta.width ?? width)) / 2);
  const top = Math.round((height - (fgMeta.height ?? height)) / 2);

  return sharp(background)
    .composite([{ input: foreground, left, top }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
