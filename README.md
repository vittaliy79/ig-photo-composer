# IG Photo Composer

Local web app for composing Instagram-ready photo combinations: grid collages, carousels,
horizontal-to-vertical / vertical-to-horizontal panels, diptychs/triptychs, and blurred-fill
story/reel covers. Everything runs locally with `sharp`.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:4321

## Build

```bash
npm run build
npm start
```

## How it works

1. Upload photos.
2. Click thumbnails in the order you want them to appear (order number shown on each).
3. Pick a composition template and adjust its options.
4. Generate — results appear with download links.

## Composition types

- **Grid collage** (2x2, 3x3): arranges photos in a fixed grid.
- **Horizontal → vertical panel**: stacks photos in a single column (portrait canvas).
- **Vertical → horizontal panel**: arranges photos in a single row (landscape canvas).
- **Diptych / Triptych**: 2 or 3 photos side by side with adjustable gap/background.
- **Photo carousel**: formats 2–20 selected photos as ordered, individual carousel slides;
  reorder the sequence in the preview before generating.
- **Composition templates**: choose from panorama, feature-and-pair, magazine-spread,
  photo-journal, layered-story, and 3×3 profile-grid layouts; each exports its canvas
  as individual slides or tiles.
- **Carousel splitter**: cuts one wide photo into N equal Instagram carousel slides.
- **Fit without cropping**: fits each selected photo into a chosen aspect ratio and
  orientation (portrait/landscape) with no cropping of the subject — fills the rest of
  the canvas with either a blurred copy of the photo or a solid color of your choice.
  Produces one output per selected photo (batch).

## Aspect ratios & sizes

Ratios and pixel sizes follow current Instagram recommendations; pick an orientation to
swap width/height (not applicable to the square ratio):

| Ratio    | Native use          | Pixel size (native orientation) |
| -------- | ------------------- | -------------------------------- |
| 1:1      | Square feed post     | 1080 × 1080                      |
| 4:5      | Portrait feed post    | 1080 × 1350                      |
| 1.91:1   | Landscape feed post   | 1080 × 566                       |
| 9:16     | Story / Reel          | 1080 × 1920                      |

All templates share server-side primitives: `composeGrid`, `composeCarousel`, and
`composeFit` (see [server/src/compositions](server/src/compositions)).
