const state = {
  uploaded: [], // {id, url}
  selectedOrder: [], // ids in click order
  selectedCompositionId: "feature-pair",
  compositionAssignments: [],
  cropFocusByImage: {},
  cropZoomByImage: {},
};

const TEMPLATES = {
  "grid-2x2": { mode: "grid", rows: 2, cols: 2, count: 4 },
  "grid-3x3": { mode: "grid", rows: 3, cols: 3, count: 9 },
  "stack-vertical": { mode: "grid", rows: "variable", cols: 1, defaultCount: 3 },
  "stack-horizontal": { mode: "grid", rows: 1, cols: "variable", defaultCount: 3 },
  diptych: { mode: "grid", rows: 1, cols: 2, count: 2 },
  triptych: { mode: "grid", rows: 1, cols: 3, count: 3 },
  "composition-carousel": { mode: "composition-carousel" },
  "photo-carousel": { mode: "photo-carousel" },
  carousel: { mode: "carousel" },
  fit: { mode: "fit" },
};

const ASPECT_OPTIONS = `
  <option value="1:1">1:1 — square</option>
  <option value="4:5">4:5 — portrait</option>
  <option value="1.91:1">1.91:1 — landscape</option>
  <option value="9:16">9:16 — story/reel</option>`;

const CAROUSEL_FORMAT_OPTIONS = `
  <option value="1:1">1:1 — square</option>
  <option value="4:5">4:5 — portrait</option>
  <option value="1.91:1">1.91:1 — landscape</option>`;

const COMPOSITIONS = [
  {
    id: "panorama",
    name: "Panorama",
    description: "One photo flows across two slides.",
    slides: 2,
    columns: 2,
    rows: 1,
    slots: [{ x: 0, y: 0, width: 2, height: 1 }],
  },
  {
    id: "feature-pair",
    name: "Feature + pair",
    description: "One full-height photo beside two details.",
    slides: 2,
    columns: 2,
    rows: 1,
    slots: [
      { x: 0, y: 0, width: 1, height: 1 },
      { x: 1, y: 0, width: 1, height: 0.5 },
      { x: 1, y: 0.5, width: 1, height: 0.5 },
    ],
  },
  {
    id: "magazine-spread",
    name: "Magazine spread",
    description: "A framed opener and a three-photo collage.",
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
  {
    id: "photo-journal",
    name: "Photo journal",
    description: "Two full slides followed by a split-screen finish.",
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
  {
    id: "profile-grid",
    name: "Profile grid 3×3",
    description: "Nine coordinated tiles for a profile grid.",
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
  {
    id: "layered-story",
    name: "Layered story",
    description: "A panoramic backdrop with two framed photos.",
    slides: 2,
    columns: 2,
    rows: 1,
    slots: [
      { x: 0, y: 0, width: 2, height: 1 },
      { x: 0.15, y: 0.13, width: 0.72, height: 0.72, framed: true },
      { x: 1.12, y: 0.17, width: 0.72, height: 0.67, framed: true },
    ],
  },
];

const fileInput = document.getElementById("fileInput");
const thumbsEl = document.getElementById("thumbs");
const templateSelect = document.getElementById("templateSelect");
const optionsEl = document.getElementById("options");
const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const compositionGalleryEl = document.getElementById("compositionGallery");
const compositionPreviewEl = document.getElementById("compositionPreview");
const carouselPreviewEl = document.getElementById("carouselPreview");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxDownload = document.getElementById("lightboxDownload");

function openLightbox(url) {
  lightboxImg.src = url;
  lightboxDownload.href = url;
  lightbox.classList.remove("hidden");
}

lightbox.addEventListener("click", (e) => {
  if (e.target === lightboxDownload) return;
  lightbox.classList.add("hidden");
  lightboxImg.src = "";
});

fileInput.addEventListener("change", async () => {
  const files = fileInput.files;
  if (!files || files.length === 0) return;
  const form = new FormData();
  for (const file of files) form.append("photos", file);
  statusEl.textContent = "Uploading...";
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = await res.json();
  state.uploaded.push(...data.files);
  renderThumbs();
  statusEl.textContent = "";
  fileInput.value = "";
});

function renderThumbs() {
  thumbsEl.innerHTML = "";
  for (const file of state.uploaded) {
    const div = document.createElement("div");
    const orderIndex = state.selectedOrder.indexOf(file.id);
    div.className = "thumb" + (orderIndex >= 0 ? " selected" : "");
    div.innerHTML = `<img src="${file.url}" alt="" />`;
    if (orderIndex >= 0) {
      const badge = document.createElement("span");
      badge.className = "order-badge";
      badge.textContent = orderIndex + 1;
      div.appendChild(badge);
    }
    div.addEventListener("click", () => {
      const idx = state.selectedOrder.indexOf(file.id);
      if (idx >= 0) state.selectedOrder.splice(idx, 1);
      else state.selectedOrder.push(file.id);
      syncCompositionAssignments();
      renderThumbs();
      renderCarouselPreview();
    });
    thumbsEl.appendChild(div);
  }
  renderCompositionGallery();
  renderCompositionPreview();
}

function syncCompositionAssignments() {
  const selected = new Set(state.selectedOrder);
  state.compositionAssignments = state.compositionAssignments.filter((id) => selected.has(id));
  for (const id of state.selectedOrder) {
    if (!state.compositionAssignments.includes(id)) state.compositionAssignments.push(id);
    state.cropFocusByImage[id] ??= { x: 0.5, y: 0.5 };
    state.cropZoomByImage[id] ??= 1;
  }
}

function renderOptions() {
  const key = templateSelect.value;
  const tpl = TEMPLATES[key];
  optionsEl.innerHTML = "";
  compositionGalleryEl.innerHTML = "";
  compositionPreviewEl.innerHTML = "";

  if (tpl.mode === "composition-carousel") {
    optionsEl.innerHTML = `
      <label>Slide format
        <select id="optAspect">${CAROUSEL_FORMAT_OPTIONS}</select>
      </label>
      <span class="option-hint">Choose a layout, then select its photos in order.</span>`;
    document.getElementById("optAspect").addEventListener("change", () => {
      renderCompositionGallery();
      renderCompositionPreview();
    });
    renderCompositionGallery();
    renderCompositionPreview();
  } else if (tpl.mode === "grid") {
    if (tpl.rows === "variable" || tpl.cols === "variable") {
      optionsEl.innerHTML += `
        <label>Photos count
          <input type="number" id="optCount" min="2" max="8" value="${tpl.defaultCount}" />
        </label>`;
    }
    optionsEl.innerHTML += `
      <label>Gap (px)
        <input type="number" id="optGap" min="0" max="60" value="8" />
      </label>
      <label>Background
        <input type="color" id="optBg" value="#ffffff" />
      </label>`;
  } else if (tpl.mode === "photo-carousel") {
    optionsEl.innerHTML = `
      <label>Slide format
        <select id="optAspect">${CAROUSEL_FORMAT_OPTIONS}</select>
      </label>
      <span class="option-hint">Choose 2–20 photos. Each photo becomes one slide.</span>`;
  } else if (tpl.mode === "carousel") {
    optionsEl.innerHTML = `
      <label>Slides
        <input type="number" id="optSlices" min="2" max="10" value="3" />
      </label>
      <label>Aspect
        <select id="optAspect">${ASPECT_OPTIONS}</select>
      </label>`;
  } else if (tpl.mode === "fit") {
    optionsEl.innerHTML = `
      <label>Aspect
        <select id="optAspect">${ASPECT_OPTIONS}</select>
      </label>
      <label>Orientation
        <select id="optOrientation">
          <option value="portrait">Portrait / vertical</option>
          <option value="landscape">Landscape / horizontal</option>
        </select>
      </label>
      <label>Background
        <select id="optBgMode">
          <option value="blur">Blurred photo</option>
          <option value="color">Solid color</option>
        </select>
      </label>
      <label>Blur intensity
        <input type="number" id="optBlur" min="5" max="80" value="40" />
      </label>
      <label>Color
        <input type="color" id="optColor" value="#000000" disabled />
      </label>`;

    const bgModeSelect = document.getElementById("optBgMode");
    const blurInput = document.getElementById("optBlur");
    const colorInput = document.getElementById("optColor");
    bgModeSelect.addEventListener("change", () => {
      const isBlur = bgModeSelect.value === "blur";
      blurInput.disabled = !isBlur;
      colorInput.disabled = isBlur;
    });
  }
}

templateSelect.addEventListener("change", renderOptions);
templateSelect.addEventListener("change", renderCarouselPreview);
renderOptions();
renderCarouselPreview();

function renderCompositionGallery() {
  if (templateSelect.value !== "composition-carousel") return;
  const gallery = document.createElement("div");
  gallery.className = "composition-cards";

  for (const composition of COMPOSITIONS) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "composition-card";
    card.setAttribute("aria-pressed", String(state.selectedCompositionId === composition.id));
    card.addEventListener("click", () => {
      state.selectedCompositionId = composition.id;
      renderCompositionGallery();
      renderCompositionPreview();
    });

    const miniature = document.createElement("span");
    miniature.className = "composition-miniature";
    const [aspectWidth, aspectHeight] = selectedAspectDimensions();
    miniature.style.aspectRatio = `${composition.columns * aspectWidth} / ${composition.rows * aspectHeight}`;
    composition.slots.forEach((slot, index) => {
      const block = document.createElement("span");
      block.className = "composition-block" + (slot.framed ? " framed" : "");
      Object.assign(block.style, {
        left: `${slot.x / composition.columns * 100}%`,
        top: `${slot.y / composition.rows * 100}%`,
        width: `${slot.width / composition.columns * 100}%`,
        height: `${slot.height / composition.rows * 100}%`,
      });
      const photo = state.uploaded.find((item) => item.id === state.compositionAssignments[index]);
      if (photo) block.style.backgroundImage = `url("${photo.url}")`;
      else block.textContent = "+";
      miniature.appendChild(block);
    });

    const title = document.createElement("strong");
    title.textContent = composition.name;
    const detail = document.createElement("span");
    detail.textContent = `${composition.slots.length} photos · ${composition.rows > 1 ? `${composition.columns}×${composition.rows} tiles` : `${composition.slides} slides`}`;
    card.append(miniature, title, detail);
    gallery.appendChild(card);
  }
  compositionGalleryEl.replaceChildren(gallery);
}

function renderCompositionPreview() {
  if (templateSelect.value !== "composition-carousel") {
    compositionPreviewEl.innerHTML = "";
    return;
  }

  const composition = COMPOSITIONS.find((item) => item.id === state.selectedCompositionId);
  compositionPreviewEl.innerHTML = "";
  const heading = document.createElement("h3");
  heading.textContent = `${composition.name} · ${composition.rows > 1 ? `${composition.columns}×${composition.rows} grid` : `${composition.slides} slides`} · ${composition.slots.length} photos`;
  const scroll = document.createElement("div");
  scroll.className = "composition-canvas-scroll";
  const canvas = document.createElement("div");
  canvas.className = "composition-canvas";
  canvas.dataset.columns = String(composition.columns);
  canvas.style.setProperty("--photo-frame", `${1.8 / composition.columns}%`);
  const [aspectWidth, aspectHeight] = selectedAspectDimensions();
  canvas.style.aspectRatio = `${composition.columns * aspectWidth} / ${composition.rows * aspectHeight}`;
  scroll.appendChild(canvas);

  composition.slots.forEach((slot, index) => {
    const layer = document.createElement("div");
    layer.className = "composition-layer" + (slot.framed ? " framed" : "");
    layer.dataset.slotIndex = String(index);
    layer.title = "Drag the photo to adjust its crop";
    Object.assign(layer.style, {
      left: `${slot.x / composition.columns * 100}%`,
      top: `${slot.y / composition.rows * 100}%`,
      width: `${slot.width / composition.columns * 100}%`,
      height: `${slot.height / composition.rows * 100}%`,
    });
    const imageId = state.compositionAssignments[index];
    const photo = state.uploaded.find((item) => item.id === imageId);
    if (photo) {
      const image = document.createElement("img");
      image.src = photo.url;
      image.alt = `Photo ${index + 1} in ${composition.name}`;
      image.draggable = false;
      layer.addEventListener("pointerdown", (event) => beginPhotoPan(event, layer, image, imageId));
      layer.appendChild(image);
      const swapHandle = document.createElement("button");
      swapHandle.type = "button";
      swapHandle.className = "composition-swap-handle";
      swapHandle.textContent = "⠿";
      swapHandle.title = "Drag onto another photo to swap";
      swapHandle.setAttribute("aria-label", `Move photo ${index + 1} to another frame`);
      swapHandle.draggable = true;
      swapHandle.addEventListener("dragstart", (event) => {
        event.dataTransfer?.setData("text/plain", String(index));
        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      });
      layer.appendChild(swapHandle);
      layer.addEventListener("dragover", (event) => {
        event.preventDefault();
        layer.classList.add("drop-target");
      });
      layer.addEventListener("dragleave", () => layer.classList.remove("drop-target"));
      layer.addEventListener("drop", (event) => {
        event.preventDefault();
        layer.classList.remove("drop-target");
        const sourceIndex = Number(event.dataTransfer?.getData("text/plain"));
        if (!Number.isInteger(sourceIndex) || sourceIndex === index) return;
        [state.compositionAssignments[sourceIndex], state.compositionAssignments[index]] =
          [state.compositionAssignments[index], state.compositionAssignments[sourceIndex]];
        renderCompositionGallery();
        renderCompositionPreview();
      });
    } else {
      layer.textContent = `Photo ${index + 1}`;
    }
    canvas.appendChild(layer);
    const image = layer.querySelector("img");
    if (image) updateCompositionImage(layer, image, imageId, slot.framed, composition.columns);
  });

  for (let column = 1; column < composition.columns; column++) {
    const divider = document.createElement("span");
    divider.className = "composition-divider";
    divider.style.left = `${column / composition.columns * 100}%`;
    canvas.appendChild(divider);
  }
  for (let row = 1; row < composition.rows; row++) {
    const divider = document.createElement("span");
    divider.className = "composition-divider horizontal";
    divider.style.top = `${row / composition.rows * 100}%`;
    canvas.appendChild(divider);
  }

  const slotControls = document.createElement("div");
  slotControls.className = "composition-slot-controls";
  composition.slots.forEach((slot, index) => {
    const imageId = state.compositionAssignments[index];
    if (!imageId) return;
    const row = document.createElement("div");
    row.className = "composition-slot-control";
    const label = document.createElement("label");
    label.textContent = `Frame ${index + 1}`;
    const select = document.createElement("select");
    select.setAttribute("aria-label", `Photo in frame ${index + 1}`);
    for (const selectedId of state.selectedOrder) {
      const photo = state.uploaded.find((item) => item.id === selectedId);
      if (!photo) continue;
      const option = document.createElement("option");
      option.value = selectedId;
      option.textContent = `Photo ${state.selectedOrder.indexOf(selectedId) + 1}`;
      option.selected = selectedId === imageId;
      select.appendChild(option);
    }
    select.addEventListener("change", () => {
      const targetId = select.value;
      const existingIndex = state.compositionAssignments.indexOf(targetId);
      if (existingIndex >= 0) {
        state.compositionAssignments[existingIndex] = imageId;
      }
      state.compositionAssignments[index] = targetId;
      renderCompositionGallery();
      renderCompositionPreview();
    });

    const zoomLabel = document.createElement("label");
    zoomLabel.className = "composition-zoom-control";
    zoomLabel.textContent = "Zoom";
    const zoomInput = document.createElement("input");
    zoomInput.type = "range";
    zoomInput.min = "1";
    zoomInput.max = "3";
    zoomInput.step = "0.05";
    zoomInput.value = String(state.cropZoomByImage[imageId] ?? 1);
    zoomInput.setAttribute("aria-label", `Zoom photo in frame ${index + 1}`);
    zoomInput.addEventListener("input", () => {
      state.cropZoomByImage[imageId] = Number(zoomInput.value);
      const layer = canvas.querySelector(`[data-slot-index="${index}"]`);
      const image = layer?.querySelector("img");
      if (image) updateCompositionImage(layer, image, imageId, slot.framed, composition.columns);
    });

    const focus = state.cropFocusByImage[imageId] ?? { x: 0.5, y: 0.5 };
    const positionControls = document.createElement("div");
    positionControls.className = "composition-position-controls";
    for (const axis of ["x", "y"]) {
      const positionLabel = document.createElement("label");
      positionLabel.textContent = axis === "x" ? "Horizontal" : "Vertical";
      const positionInput = document.createElement("input");
      positionInput.type = "range";
      positionInput.min = "0";
      positionInput.max = "1";
      positionInput.step = "0.01";
      positionInput.value = String(focus[axis]);
      positionInput.setAttribute("aria-label", `${axis === "x" ? "Horizontal" : "Vertical"} crop position for frame ${index + 1}`);
      positionInput.addEventListener("input", () => {
        const nextFocus = state.cropFocusByImage[imageId] ?? { x: 0.5, y: 0.5 };
        nextFocus[axis] = Number(positionInput.value);
        state.cropFocusByImage[imageId] = nextFocus;
        const layer = canvas.querySelector(`[data-slot-index="${index}"]`);
        const image = layer?.querySelector("img");
        if (image) updateCompositionImage(layer, image, imageId, slot.framed, composition.columns);
      });
      positionLabel.appendChild(positionInput);
      positionControls.appendChild(positionLabel);
    }

    row.append(label, select, zoomLabel, zoomInput, positionControls);
    slotControls.appendChild(row);
  });
  compositionPreviewEl.append(heading, scroll, slotControls);
}

function updateCompositionImage(layer, image, imageId, framed, columns) {
  const frame = framed ? layer.parentElement.clientWidth * (1.8 / columns / 100) : 0;
  const width = Math.max(1, layer.clientWidth - frame * 2);
  const height = Math.max(1, layer.clientHeight - frame * 2);
  if (!image.naturalWidth || !image.naturalHeight) {
    image.addEventListener("load", () => updateCompositionImage(layer, image, imageId, framed, columns), { once: true });
    return;
  }
  const zoom = state.cropZoomByImage[imageId] ?? 1;
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * zoom;
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;
  const focus = state.cropFocusByImage[imageId] ?? { x: 0.5, y: 0.5 };
  image.style.position = "absolute";
  image.style.width = `${imageWidth}px`;
  image.style.height = `${imageHeight}px`;
  image.style.maxWidth = "none";
  image.style.left = `${frame - (imageWidth - width) * focus.x}px`;
  image.style.top = `${frame - (imageHeight - height) * focus.y}px`;
}

function beginPhotoPan(event, layer, image, imageId) {
  if (event.target.closest(".composition-swap-handle")) return;
  event.preventDefault();
  const columns = Number(layer.parentElement.dataset.columns);
  const frame = layer.classList.contains("framed") ? layer.parentElement.clientWidth * (1.8 / columns / 100) : 0;
  const frameWidth = Math.max(1, layer.clientWidth - frame * 2);
  const frameHeight = Math.max(1, layer.clientHeight - frame * 2);
  const focus = state.cropFocusByImage[imageId] ?? { x: 0.5, y: 0.5 };
  const overflowX = Math.max(1, image.offsetWidth - frameWidth);
  const overflowY = Math.max(1, image.offsetHeight - frameHeight);
  const startX = event.clientX;
  const startY = event.clientY;
  const startFocus = { ...focus };
  layer.setPointerCapture(event.pointerId);

  const move = (moveEvent) => {
    const next = {
      x: Math.max(0, Math.min(1, startFocus.x - (moveEvent.clientX - startX) / overflowX)),
      y: Math.max(0, Math.min(1, startFocus.y - (moveEvent.clientY - startY) / overflowY)),
    };
    state.cropFocusByImage[imageId] = next;
    updateCompositionImage(layer, image, imageId, layer.classList.contains("framed"), columns);
  };
  const finish = () => {
    layer.removeEventListener("pointermove", move);
    layer.removeEventListener("pointerup", finish);
    layer.removeEventListener("pointercancel", finish);
  };
  layer.addEventListener("pointermove", move);
  layer.addEventListener("pointerup", finish);
  layer.addEventListener("pointercancel", finish);
}

function selectedAspectDimensions() {
  const aspect = document.getElementById("optAspect")?.value ?? "1:1";
  if (aspect === "4:5") return [4, 5];
  if (aspect === "1.91:1") return [1080, 566];
  return [1, 1];
}

function renderCarouselPreview() {
  if (templateSelect.value !== "photo-carousel") {
    carouselPreviewEl.innerHTML = "";
    return;
  }

  carouselPreviewEl.innerHTML = "";
  if (state.selectedOrder.length === 0) {
    carouselPreviewEl.textContent = "Select photos to build your slide sequence.";
    return;
  }

  const title = document.createElement("h3");
  title.textContent = `Slide sequence · ${state.selectedOrder.length}`;
  carouselPreviewEl.appendChild(title);

  const slides = document.createElement("ol");
  slides.className = "carousel-slides";
  state.selectedOrder.forEach((id, index) => {
    const file = state.uploaded.find((item) => item.id === id);
    if (!file) return;

    const slide = document.createElement("li");
    slide.className = "carousel-slide";
    const image = document.createElement("img");
    image.src = file.url;
    image.alt = `Slide ${index + 1} preview`;
    const number = document.createElement("span");
    number.className = "slide-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const controls = document.createElement("div");
    controls.className = "slide-controls";

    for (const [label, offset] of [["Move earlier", -1], ["Move later", 1]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = offset < 0 ? "←" : "→";
      button.setAttribute("aria-label", `${label}: slide ${index + 1}`);
      button.title = label;
      button.disabled = index + offset < 0 || index + offset >= state.selectedOrder.length;
      button.addEventListener("click", () => {
        const target = index + offset;
        [state.selectedOrder[index], state.selectedOrder[target]] = [state.selectedOrder[target], state.selectedOrder[index]];
        renderThumbs();
        renderCarouselPreview();
      });
      controls.appendChild(button);
    }

    slide.append(image, number, controls);
    slides.appendChild(slide);
  });
  carouselPreviewEl.appendChild(slides);
}

generateBtn.addEventListener("click", async () => {
  const key = templateSelect.value;
  const tpl = TEMPLATES[key];
  const selected = state.selectedOrder;

  try {
    let payload;

    if (tpl.mode === "grid") {
      let rows = tpl.rows;
      let cols = tpl.cols;
      if (rows === "variable" || cols === "variable") {
        const count = Number(document.getElementById("optCount").value);
        if (rows === "variable") rows = count;
        if (cols === "variable") cols = count;
      }
      const needed = rows * cols;
      if (selected.length !== needed) {
        throw new Error(`Select exactly ${needed} photos for this layout (in the order you want them).`);
      }
      payload = {
        type: "grid",
        images: selected,
        rows,
        cols,
        gap: Number(document.getElementById("optGap").value),
        background: document.getElementById("optBg").value,
      };
    } else if (tpl.mode === "photo-carousel") {
      if (selected.length < 2 || selected.length > 20) {
        throw new Error("Select between 2 and 20 photos for a carousel.");
      }
      payload = {
        type: "photo-carousel",
        images: selected,
        aspect: document.getElementById("optAspect").value,
      };
    } else if (tpl.mode === "composition-carousel") {
      const composition = COMPOSITIONS.find((item) => item.id === state.selectedCompositionId);
      if (state.compositionAssignments.length !== composition.slots.length) {
        throw new Error(`${composition.name} needs exactly ${composition.slots.length} selected photos.`);
      }
      payload = {
        type: "composition-carousel",
        images: state.compositionAssignments,
        aspect: document.getElementById("optAspect").value,
        composition: composition.id,
        cropFocus: state.compositionAssignments.map((imageId) => state.cropFocusByImage[imageId] ?? { x: 0.5, y: 0.5 }),
        cropZoom: state.compositionAssignments.map((imageId) => state.cropZoomByImage[imageId] ?? 1),
      };
    } else if (tpl.mode === "carousel") {
      if (selected.length !== 1) throw new Error("Select exactly 1 photo for the carousel splitter.");
      payload = {
        type: "carousel",
        image: selected[0],
        slices: Number(document.getElementById("optSlices").value),
        aspect: document.getElementById("optAspect").value,
      };
    } else if (tpl.mode === "fit") {
      if (selected.length === 0) throw new Error("Select at least 1 photo.");
      const bgMode = document.getElementById("optBgMode").value;
      const background =
        bgMode === "blur"
          ? { mode: "blur", sigma: Number(document.getElementById("optBlur").value) }
          : { mode: "color", color: document.getElementById("optColor").value };
      payload = {
        type: "fit",
        images: selected,
        aspect: document.getElementById("optAspect").value,
        orientation: document.getElementById("optOrientation").value,
        background,
      };
    }

    statusEl.textContent = "Generating...";
    generateBtn.disabled = true;

    const res = await fetch("/api/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generation failed");

    const composition = COMPOSITIONS.find((item) => item.id === state.selectedCompositionId);
    const resultUnit = tpl.mode === "composition-carousel" && composition.rows > 1 ? "Tile" : "Slide";
    renderResults(data.images, resultUnit);
    statusEl.textContent = "Done.";
  } catch (err) {
    statusEl.textContent = err.message;
  } finally {
    generateBtn.disabled = false;
  }
});

function renderResults(urls, unit = "Slide") {
  resultsEl.innerHTML = "";
  for (const [index, url] of urls.entries()) {
    const fig = document.createElement("figure");
    fig.innerHTML = `
      <img src="${url}" alt="result" />
      <figcaption>${urls.length > 1 ? `${unit} ${index + 1} · ` : ""}<a href="${url}" download>Download</a></figcaption>`;
    fig.querySelector("img").addEventListener("click", () => openLightbox(url));
    resultsEl.appendChild(fig);
  }
}
