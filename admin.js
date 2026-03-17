document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY_PUBLISHED = "kantoKaseiLP";
  const STORAGE_KEY_DRAFT = "kantoKaseiLP_draft";

  // Track uploaded file data (base64)
  const uploadedFiles = {};

  // ===== Section navigation =====
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const sections = document.querySelectorAll(".admin-section");
  const topbarTitle = document.getElementById("topbar-title");

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      showSection(link.dataset.section);
    });
  });

  function showSection(sectionId) {
    sections.forEach((s) => (s.style.display = "none"));
    sidebarLinks.forEach((l) => l.classList.remove("active"));

    const target = document.getElementById(sectionId);
    const activeLink = document.querySelector('[data-section="' + sectionId + '"]');

    if (target) {
      target.style.display = "block";
      target.style.animation = "none";
      target.offsetHeight;
      target.style.animation = "";
    }
    if (activeLink) {
      activeLink.classList.add("active");
      topbarTitle.textContent = activeLink.textContent.trim();
    }
    closeMobileSidebar();
  }

  // ===== Mobile sidebar toggle =====
  const sidebar = document.getElementById("sidebar");
  const topbarMenu = document.getElementById("topbar-menu");
  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  document.body.appendChild(overlay);

  topbarMenu.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });

  overlay.addEventListener("click", closeMobileSidebar);

  function closeMobileSidebar() {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  }

  // ===== File Upload Zones =====
  document.querySelectorAll(".upload-zone").forEach((zone) => {
    const fieldKey = zone.dataset.upload;
    const acceptTypes = zone.dataset.accept || "*/*";
    const contentEl = zone.querySelector(".upload-zone-content");
    const previewEl = zone.querySelector(".upload-zone-preview");
    const removeBtn = zone.querySelector(".upload-zone-remove");

    // Create hidden file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = acceptTypes;
    fileInput.hidden = true;
    zone.appendChild(fileInput);

    // Click to upload
    zone.addEventListener("click", (e) => {
      if (e.target === removeBtn || e.target.closest(".upload-zone-remove")) return;
      fileInput.click();
    });

    // File selected
    fileInput.addEventListener("change", () => {
      if (fileInput.files[0]) {
        handleFileUpload(zone, fieldKey, fileInput.files[0]);
      }
    });

    // Drag and drop
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("drag-over");
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      if (e.dataTransfer.files[0]) {
        handleFileUpload(zone, fieldKey, e.dataTransfer.files[0]);
      }
    });

    // Remove button
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      clearUpload(zone, fieldKey);
    });
  });

  function handleFileUpload(zone, fieldKey, file) {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      showToast("ファイルサイズが大きすぎます（最大" + (isVideo ? "20" : "5") + "MB）");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      uploadedFiles[fieldKey] = dataUrl;

      const previewEl = zone.querySelector(".upload-zone-preview");
      const contentEl = zone.querySelector(".upload-zone-content");
      const removeBtn = zone.querySelector(".upload-zone-remove");

      if (isImage) {
        previewEl.innerHTML = '<img src="' + dataUrl + '" alt="プレビュー">';
      } else if (isVideo) {
        previewEl.innerHTML = '<video src="' + dataUrl + '" controls muted style="width:100%;height:100%;object-fit:cover;"></video>';
      }

      contentEl.style.display = "none";
      previewEl.style.display = "block";
      removeBtn.style.display = "flex";
      zone.classList.add("has-file");

      showToast(file.name + " をアップロードしました");
    };
    reader.readAsDataURL(file);
  }

  function clearUpload(zone, fieldKey) {
    const previewEl = zone.querySelector(".upload-zone-preview");
    const contentEl = zone.querySelector(".upload-zone-content");
    const removeBtn = zone.querySelector(".upload-zone-remove");

    delete uploadedFiles[fieldKey];
    previewEl.innerHTML = "";
    previewEl.style.display = "none";
    contentEl.style.display = "";
    removeBtn.style.display = "none";
    zone.classList.remove("has-file");
  }

  // ===== Load saved data =====
  loadSavedData();
  updateBadges();

  function loadSavedData() {
    // Load draft first, fall back to published
    const draft = localStorage.getItem(STORAGE_KEY_DRAFT);
    const published = localStorage.getItem(STORAGE_KEY_PUBLISHED);
    const data = draft || published;
    if (!data) return;

    try {
      const parsed = JSON.parse(data);
      applyDataToForm(parsed);
      showStatus(draft ? "下書きデータを読み込みました" : "公開データを読み込みました");
    } catch (e) {
      // Ignore
    }
  }

  function applyDataToForm(data) {
    // Text fields
    document.querySelectorAll("[data-field]").forEach((field) => {
      const path = field.dataset.field;
      const value = getNestedValue(data, path);
      if (value !== undefined) {
        field.value = value;
      }
    });

    // Uploaded images/videos
    if (data.images) {
      Object.keys(data.images).forEach((key) => {
        const url = data.images[key];
        if (url) {
          uploadedFiles["images." + key] = url;
          const zone = document.querySelector('[data-upload="images.' + key + '"]');
          if (zone) {
            showUploadPreview(zone, url, "images." + key);
          }
        }
      });
    }

    if (data.heroVideo) {
      uploadedFiles["heroVideo"] = data.heroVideo;
      const zone = document.querySelector('[data-upload="heroVideo"]');
      if (zone && data.heroVideo.startsWith("data:")) {
        showUploadPreview(zone, data.heroVideo, "heroVideo");
      }
    }

    // Video preview for URL-based videos
    document.querySelectorAll("[data-video-preview]").forEach((preview) => {
      const fieldKey = preview.dataset.videoPreview;
      const input = document.querySelector('[data-field="' + fieldKey + '"]');
      if (input && input.value && !input.value.startsWith("data:")) {
        showVideoPreview(preview, input.value);
      }
    });
  }

  function showUploadPreview(zone, url, fieldKey) {
    const previewEl = zone.querySelector(".upload-zone-preview");
    const contentEl = zone.querySelector(".upload-zone-content");
    const removeBtn = zone.querySelector(".upload-zone-remove");

    if (url.startsWith("data:video") || (url.endsWith(".mp4") || url.endsWith(".webm"))) {
      previewEl.innerHTML = '<video src="' + url + '" controls muted style="width:100%;height:100%;object-fit:cover;"></video>';
    } else {
      previewEl.innerHTML = '<img src="' + url + '" alt="プレビュー">';
    }

    contentEl.style.display = "none";
    previewEl.style.display = "block";
    removeBtn.style.display = "flex";
    zone.classList.add("has-file");
  }

  // ===== Collect form data =====
  function collectFormData() {
    const data = { texts: {}, images: {}, videos: {}, stats: {} };

    // Text/URL fields
    document.querySelectorAll("[data-field]").forEach((field) => {
      const path = field.dataset.field;
      const value = field.value;
      setNestedValue(data, path, value);
    });

    // Uploaded files (override URL values)
    Object.keys(uploadedFiles).forEach((key) => {
      setNestedValue(data, key, uploadedFiles[key]);
    });

    return data;
  }

  // ===== Draft (一時保存) =====
  const btnDraft = document.getElementById("btn-draft");
  btnDraft.addEventListener("click", saveDraft);

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveDraft();
    }
  });

  function saveDraft() {
    const data = collectFormData();
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(data));
      showToast("一時保存しました");
      showStatus("一時保存: " + new Date().toLocaleTimeString("ja-JP"));
      updateBadges();
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        showToast("保存容量を超えました。画像サイズを小さくしてください。");
      } else {
        showToast("保存に失敗しました");
      }
    }
  }

  // ===== Preview (プレビュー) =====
  const btnPreview = document.getElementById("btn-preview");
  btnPreview.addEventListener("click", () => {
    const data = collectFormData();
    // Save as temporary preview data
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(data));
      // Open preview with draft flag
      window.open("index.html?preview=draft", "_blank");
      showToast("プレビューを開きました");
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        showToast("保存容量を超えました。画像サイズを小さくしてください。");
      }
    }
  });

  // ===== Publish (本公開) =====
  const btnPublish = document.getElementById("btn-publish");
  const publishModal = document.getElementById("publish-modal");
  const publishCancel = document.getElementById("publish-cancel");
  const publishConfirm = document.getElementById("publish-confirm");

  btnPublish.addEventListener("click", () => {
    publishModal.style.display = "flex";
  });

  publishCancel.addEventListener("click", () => {
    publishModal.style.display = "none";
  });

  publishModal.addEventListener("click", (e) => {
    if (e.target === publishModal) publishModal.style.display = "none";
  });

  publishConfirm.addEventListener("click", () => {
    const data = collectFormData();
    try {
      localStorage.setItem(STORAGE_KEY_PUBLISHED, JSON.stringify(data));
      // Clear draft after publishing
      localStorage.removeItem(STORAGE_KEY_DRAFT);
      publishModal.style.display = "none";
      showToast("公開しました！");
      showStatus("公開完了: " + new Date().toLocaleTimeString("ja-JP"));
      updateBadges();
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        showToast("保存容量を超えました。画像サイズを小さくしてください。");
      }
    }
  });

  // ===== Badges =====
  function updateBadges() {
    const badgeDraft = document.getElementById("badge-draft");
    const badgePublished = document.getElementById("badge-published");
    const hasDraft = !!localStorage.getItem(STORAGE_KEY_DRAFT);
    const hasPublished = !!localStorage.getItem(STORAGE_KEY_PUBLISHED);

    badgeDraft.style.display = hasDraft ? "inline-block" : "none";
    badgePublished.style.display = hasPublished ? "inline-block" : "none";
  }

  // ===== Export =====
  const btnExport = document.getElementById("btn-export");
  btnExport.addEventListener("click", () => {
    const data = localStorage.getItem(STORAGE_KEY_PUBLISHED) || localStorage.getItem(STORAGE_KEY_DRAFT);
    if (!data) {
      showToast("保存データがありません。");
      return;
    }

    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kanto-kasei-lp-data.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("JSONをエクスポートしました");
  });

  // ===== Import =====
  const btnImport = document.getElementById("btn-import");
  btnImport.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(data));
        applyDataToForm(data);
        showToast("インポートしました（下書きとして保存）");
        updateBadges();
      } catch (err) {
        showToast("JSONの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
    btnImport.value = "";
  });

  // ===== Video URL preview =====
  document.querySelectorAll("[data-video-preview]").forEach((preview) => {
    const fieldKey = preview.dataset.videoPreview;
    const input = document.querySelector('[data-field="' + fieldKey + '"]');
    if (!input) return;

    let debounceTimer;
    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        showVideoPreview(preview, input.value);
      }, 500);
    });
  });

  function showVideoPreview(container, url) {
    if (!url || url.startsWith("data:")) {
      container.classList.remove("has-video");
      container.innerHTML = "";
      return;
    }

    let embedUrl = "";
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (ytMatch) embedUrl = "https://www.youtube.com/embed/" + ytMatch[1];

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) embedUrl = "https://player.vimeo.com/video/" + vimeoMatch[1];

    if (embedUrl) {
      container.innerHTML = '<iframe src="' + embedUrl + '" allowfullscreen></iframe>';
      container.classList.add("has-video");
    } else {
      container.classList.remove("has-video");
      container.innerHTML = "";
    }
  }

  // ===== Toast =====
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

  // ===== Status =====
  function showStatus(text) {
    const status = document.getElementById("topbar-status");
    if (status) status.textContent = text;
  }

  // ===== Utility =====
  function getNestedValue(obj, path) {
    return path.split(".").reduce((o, key) => (o && o[key] !== undefined ? o[key] : undefined), obj);
  }

  function setNestedValue(obj, path, value) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
});
