import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { nanoid } from "nanoid";
import { composeGrid } from "./compositions/grid.js";
import { composeCarousel } from "./compositions/carousel.js";
import { composeFit } from "./compositions/fit.js";
import type { ComposeRequest } from "./types.js";

// Assumes the process is started from the project root (via npm scripts).
const ROOT = process.cwd();
const UPLOADS_DIR = path.join(ROOT, "uploads");
const OUTPUT_DIR = path.join(ROOT, "output");
const PUBLIC_DIR = path.join(ROOT, "public");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.static(PUBLIC_DIR));
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/output", express.static(OUTPUT_DIR));

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${nanoid(10)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

app.post("/api/upload", upload.array("photos", 30), (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  res.json({ files: files.map((f) => ({ id: f.filename, url: `/uploads/${f.filename}` })) });
});

app.post("/api/compose", async (req, res) => {
  const body = req.body as ComposeRequest;
  try {
    if (body.type === "grid") {
      const buf = await composeGrid(UPLOADS_DIR, body);
      const name = `grid-${nanoid(8)}.png`;
      fs.writeFileSync(path.join(OUTPUT_DIR, name), buf);
      res.json({ images: [`/output/${name}`] });
    } else if (body.type === "carousel") {
      const buffers = await composeCarousel(UPLOADS_DIR, body);
      const urls = buffers.map((buf, i) => {
        const name = `carousel-${nanoid(8)}-${i + 1}.png`;
        fs.writeFileSync(path.join(OUTPUT_DIR, name), buf);
        return `/output/${name}`;
      });
      res.json({ images: urls });
    } else if (body.type === "fit") {
      const buffers = await composeFit(UPLOADS_DIR, body);
      const urls = buffers.map((buf, i) => {
        const name = `fit-${nanoid(8)}-${i + 1}.jpg`;
        fs.writeFileSync(path.join(OUTPUT_DIR, name), buf);
        return `/output/${name}`;
      });
      res.json({ images: urls });
    } else {
      res.status(400).json({ error: "Unknown composition type" });
    }
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 4321;
app.listen(PORT, () => {
  console.log(`ig-photo-composer running at http://localhost:${PORT}`);
});
