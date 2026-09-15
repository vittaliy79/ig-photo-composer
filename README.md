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
- **Carousel splitter**: cuts one wide photo into N equal Instagram carousel slides.
- **Story/Reel cover**: fits a photo into 9:16 (or other aspect) with a blurred, cropped
  copy of itself as background filler — no ugly letterboxing.

All templates share three server-side primitives: `composeGrid`, `composeCarousel`, and
`composeStoryBlur` (see [server/src/compositions](server/src/compositions)).
