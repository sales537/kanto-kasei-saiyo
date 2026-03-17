document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "kantoKaseiLP";

  // ===== Section navigation =====
  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  const sections = document.querySelectorAll(".admin-section");
  const topbarTitle = document.getElementById("topbar-title");

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      showSection(sectionId);
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
      target.offsetHeight; // force reflow
      target.style.animation = "";
    }
    if (activeLink) {
      activeLink.classList.add("active");
      topbarTitle.textContent = activeLink.textContent.trim();
    }

    // Close mobile sidebar
    closeMobileSidebar();
  }

  // ===== Mobile sidebar toggle =====
  const sidebar = document.getElementById("sidebar");
  const topbarMenu = document.getElementById("topbar-menu");
  let overlay = document.createElement("div");
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

  // ===== Load saved data into form =====
  loadSavedData();

  function loadSavedData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const data = JSON.parse(saved);

      document.querySelectorAll("[data-field]").forEach((field) => {
        const path = field.dataset.field;
        const value = getNestedValue(data, path);
        if (value !== undefined) {
          if (field.tagName === "TEXTAREA") {
            field.value = value;
          } else {
            field.value = value;
          }
        }
      });

      // Trigger image previews
      document.querySelectorAll("[data-preview]").forEach((preview) => {
        const fieldKey = preview.dataset.preview;
        const input = document.querySelector('[data-field="' + fieldKey + '"]');
        if (input && input.value) {
          showImagePreview(preview, input.value);
        }
      });

      // Trigger video previews
      document.querySelectorAll("[data-video-preview]").forEach((preview) => {
        const fieldKey = preview.dataset.videoPreview;
        const input = document.querySelector('[data-field="' + fieldKey + '"]');
        if (input && input.value) {
          showVideoPreview(preview, input.value);
        }
      });

      showStatus("保存データを読み込みました");
    } catch (e) {
      // Ignore parse errors
    }
  }

  // ===== Save =====
  const btnSave = document.getElementById("btn-save");

  btnSave.addEventListener("click", saveData);

  // Ctrl+S / Cmd+S shortcut
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveData();
    }
  });

  function saveData() {
    const data = { texts: {}, images: {}, videos: {}, stats: {} };

    document.querySelectorAll("[data-field]").forEach((field) => {
      const path = field.dataset.field;
      const value = field.value;
      setNestedValue(data, path, value);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showToast("保存しました");
    showStatus("最終保存: " + new Date().toLocaleTimeString("ja-JP"));
  }

  // ===== Preview =====
  const btnPreview = document.getElementById("btn-preview");
  btnPreview.addEventListener("click", () => {
    saveData();
    window.open("index.html", "_blank");
  });

  // ===== Export =====
  const btnExport = document.getElementById("btn-export");
  btnExport.addEventListener("click", () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      showToast("保存データがありません。先に保存してください。");
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        loadSavedData();
        showToast("インポートしました");
      } catch (err) {
        showToast("JSONの読み込みに失敗しました");
      }
    };
    reader.readAsText(file);
    btnImport.value = "";
  });

  // ===== Real-time image preview =====
  document.querySelectorAll("[data-preview]").forEach((preview) => {
    const fieldKey = preview.dataset.preview;
    const input = document.querySelector('[data-field="' + fieldKey + '"]');
    if (!input) return;

    input.addEventListener("input", () => {
      showImagePreview(preview, input.value);
    });
  });

  function showImagePreview(container, url) {
    if (!url) {
      container.classList.remove("has-image");
      container.innerHTML = "";
      return;
    }

    const img = new Image();
    img.onload = () => {
      container.innerHTML = "";
      container.appendChild(img);
      container.classList.add("has-image");
    };
    img.onerror = () => {
      container.classList.remove("has-image");
      container.innerHTML = "";
    };
    img.src = url;
  }

  // ===== Real-time video preview =====
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
    if (!url) {
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

  // ===== Utility functions =====
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
