import sharp from "sharp";
import path from "node:path";
import type { GridRequest } from "../types.js";

const DEFAULT_CELL_SIZE = 1080;

/**
 * Arranges images into a rows x cols grid on a single canvas.
 * With rows=1 this behaves as a horizontal panel (vertical photos combined into a landscape row).
 * With cols=1 this behaves as a vertical panel (horizontal photos combined into a portrait column).
 */
export async function composeGrid(uploadsDir: string, req: GridRequest): Promise<Buffer> {
  const { images, rows, cols, gap = 0, background = "#ffffff" } = req;
  const cellWidth = req.cellWidth ?? DEFAULT_CELL_SIZE;
  const cellHeight = req.cellHeight ?? DEFAULT_CELL_SIZE;
  const needed = rows * cols;

  if (images.length !== needed) {
    throw new Error(`Grid ${rows}x${cols} requires exactly ${needed} images, got ${images.length}`);
  }

  const canvasWidth = cols * cellWidth + (cols + 1) * gap;
  const canvasHeight = rows * cellHeight + (rows + 1) * gap;

  const tiles = await Promise.all(
    images.map((file) =>
      sharp(path.join(uploadsDir, file))
        .resize(cellWidth, cellHeight, { fit: "cover", position: "attention" })
        .toBuffer()
    )
  );

  const composites = tiles.map((buf, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    return {
      input: buf,
      left: gap + c * (cellWidth + gap),
      top: gap + r * (cellHeight + gap),
    };
  });

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background,
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}
