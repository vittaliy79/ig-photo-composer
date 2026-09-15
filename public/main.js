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
  carousel: { mode: "carousel" },
  "story-blur": { mode: "story-blur" },
};

const fileInput = document.getElementById("fileInput");
const thumbsEl = document.getElementById("thumbs");
const templateSelect = document.getElementById("templateSelect");
const optionsEl = document.getElementById("options");
const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
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
  } else if (tpl.mode === "carousel") {
    optionsEl.innerHTML = `
      <label>Slides
        <input type="number" id="optSlices" min="2" max="10" value="3" />
      </label>
      <label>Aspect
        <select id="optAspect">
          <option value="4:5">4:5 (portrait)</option>
          <option value="1:1">1:1 (square)</option>
          <option value="9:16">9:16 (story)</option>
        </select>
      </label>`;
  } else if (tpl.mode === "story-blur") {
    optionsEl.innerHTML = `
      <label>Aspect
        <select id="optAspect">
          <option value="9:16">9:16 (story/reel)</option>
          <option value="4:5">4:5 (feed portrait)</option>
          <option value="1:1">1:1 (square)</option>
        </select>
      </label>
      <label>Blur
        <input type="number" id="optBlur" min="5" max="80" value="40" />
      </label>`;
  }
}

templateSelect.addEventListener("change", renderOptions);
renderOptions();

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
    } else if (tpl.mode === "carousel") {
      if (selected.length !== 1) throw new Error("Select exactly 1 photo for the carousel splitter.");
      payload = {
        type: "carousel",
        image: selected[0],
        slices: Number(document.getElementById("optSlices").value),
        aspect: document.getElementById("optAspect").value,
      };
    } else if (tpl.mode === "story-blur") {
      if (selected.length !== 1) throw new Error("Select exactly 1 photo for the story cover.");
      payload = {
        type: "story-blur",
        image: selected[0],
        aspect: document.getElementById("optAspect").value,
        blurSigma: Number(document.getElementById("optBlur").value),
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
  for (const url of urls) {
    const fig = document.createElement("figure");
    fig.innerHTML = `
      <img src="${url}" alt="result" />
      <figcaption><a href="${url}" download>Download</a></figcaption>`;
    fig.querySelector("img").addEventListener("click", () => openLightbox(url));
    resultsEl.appendChild(fig);
  }
}
