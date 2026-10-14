const state = {
  uploaded: [], // {id, url}
  selectedOrder: [], // ids in click order
};

const TEMPLATES = {
  "grid-2x2": { mode: "grid", rows: 2, cols: 2, count: 4 },
  "grid-3x3": { mode: "grid", rows: 3, cols: 3, count: 9 },
  "stack-vertical": { mode: "grid", rows: "variable", cols: 1, defaultCount: 3 },
  "stack-horizontal": { mode: "grid", rows: 1, cols: "variable", defaultCount: 3 },
  diptych: { mode: "grid", rows: 1, cols: 2, count: 2 },
  triptych: { mode: "grid", rows: 1, cols: 3, count: 3 },
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

const fileInput = document.getElementById("fileInput");
const thumbsEl = document.getElementById("thumbs");
const templateSelect = document.getElementById("templateSelect");
const optionsEl = document.getElementById("options");
const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
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
      renderThumbs();
      renderCarouselPreview();
    });
    thumbsEl.appendChild(div);
  }
}

function renderOptions() {
  const key = templateSelect.value;
  const tpl = TEMPLATES[key];
  optionsEl.innerHTML = "";

  if (tpl.mode === "grid") {
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

    renderResults(data.images);
    statusEl.textContent = "Done.";
  } catch (err) {
    statusEl.textContent = err.message;
  } finally {
    generateBtn.disabled = false;
  }
});

function renderResults(urls) {
  resultsEl.innerHTML = "";
  for (const [index, url] of urls.entries()) {
    const fig = document.createElement("figure");
    fig.innerHTML = `
      <img src="${url}" alt="result" />
      <figcaption>${urls.length > 1 ? `Slide ${index + 1} · ` : ""}<a href="${url}" download>Download</a></figcaption>`;
    fig.querySelector("img").addEventListener("click", () => openLightbox(url));
    resultsEl.appendChild(fig);
  }
}
