document.addEventListener("DOMContentLoaded", () => {
  // ===== Load saved content =====
  loadContent();

  // ===== Header scroll =====
  const header = document.getElementById("header");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // ===== Mobile nav =====
  const menuToggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("nav-menu");
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }

  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.classList.toggle("active");
    overlay.classList.toggle("active");
    menuToggle.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });

  function closeNav() {
    nav.classList.remove("open");
    menuToggle.classList.remove("active");
    overlay.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  overlay.addEventListener("click", closeNav);
  nav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  // ===== Scroll animations =====
  const animEls = document.querySelectorAll("[data-animate]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  animEls.forEach((el) => observer.observe(el));

  // ===== Counter animation =====
  const counters = document.querySelectorAll("[data-target]");
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => counterObserver.observe(el));

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1500;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * ease).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  // ===== Pie chart animation =====
  const pieCharts = document.querySelectorAll(".pie-chart");
  const circumference = 2 * Math.PI * 50; // r=50

  const pieObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animatePie(entry.target);
          pieObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  pieCharts.forEach((el) => pieObserver.observe(el));

  function animatePie(chart) {
    const percent = parseFloat(chart.dataset.percent) || 0;
    const fill = chart.querySelector(".pie-fill");
    if (!fill) return;
    const offset = circumference - (circumference * percent) / 100;
    // Trigger reflow then animate
    fill.style.strokeDasharray = circumference;
    fill.style.strokeDashoffset = circumference;
    requestAnimationFrame(() => {
      fill.style.strokeDashoffset = offset;
    });
  }

  // ===== Back to top =====
  const backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("visible", window.scrollY > 400);
    });
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ===== Video embed =====
  document.querySelectorAll("[data-video-id]").forEach((container) => {
    const videoId = container.dataset.videoId;
    const field = document.querySelector('[data-content="videos.' + videoId + '"]');
    if (field) return;
  });

  // ===== Load content from IndexedDB =====
  async function loadContent() {
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("preview");

      let data;
      if (mode === "draft") {
        data = await LPStorage.getDraft();
      } else {
        data = (await LPStorage.getPublished()) || (await LPStorage.getDraft());
      }

      if (data) applyContentData(data);
    } catch (e) {
      // silent fail
    }
  }

  function applyContentData(data) {
    // Text content
    document.querySelectorAll("[data-content]").forEach((el) => {
      const key = el.dataset.content;
      const value = getNestedValue(data, key);
      if (value !== undefined && value !== "") {
        if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
          el.value = value;
        } else {
          el.textContent = value;
        }
      }
    });

    // Attribute-based content (stat targets)
    document.querySelectorAll("[data-content-attr]").forEach((el) => {
      const key = el.dataset.contentAttr;
      const value = getNestedValue(data, "stats." + key);
      if (value !== undefined && value !== "") {
        el.dataset.target = value;
      }
    });

    // Images
    document.querySelectorAll("[data-content-img]").forEach((el) => {
      const key = el.dataset.contentImg;
      const value = getNestedValue(data, "images." + key);
      if (value && value !== "") {
        el.src = value;
      }
    });

    // Videos
    document.querySelectorAll("[data-video-id]").forEach((container) => {
      const key = container.dataset.videoId;
      const url = getNestedValue(data, "videos." + key);
      if (url && url !== "") {
        embedVideo(container, url);
      }
    });

    // Entry link
    if (data.texts && data.texts.entry_url) {
      const entryLink = document.getElementById("entry-link");
      if (entryLink) entryLink.href = data.texts.entry_url;
    }

    // Logo image
    if (data.images && data.images.logo) {
      const logoImg = document.getElementById("logo-img");
      const logoWrap = document.getElementById("logo-text-wrap");
      if (logoImg && logoWrap) {
        logoImg.src = data.images.logo;
        logoImg.style.display = "block";
        logoWrap.style.display = "none";
      }
    }

    // Hero video
    if (data.videos && data.videos.hero_video) {
      const heroVideo = document.getElementById("hero-bg-video");
      const heroImg = document.getElementById("hero-bg-img");
      if (heroVideo) {
        const url = data.videos.hero_video;
        heroVideo.src = url;
        heroVideo.style.display = "block";
        if (heroImg) heroImg.style.display = "none";
      }
    }

    // Visibility toggles
    if (data.visibility) {
      document.querySelectorAll("[data-visibility]").forEach((el) => {
        const key = el.dataset.visibility;
        if (data.visibility[key] === false) {
          el.style.display = "none";
        } else {
          el.style.display = "";
        }
      });
    }
  }

  function embedVideo(container, url) {
    let embedUrl = "";
    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/
    );
    if (ytMatch) embedUrl = "https://www.youtube.com/embed/" + ytMatch[1];

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch)
      embedUrl = "https://player.vimeo.com/video/" + vimeoMatch[1];

    if (embedUrl) {
      container.innerHTML =
        '<iframe src="' +
        embedUrl +
        '" allowfullscreen loading="lazy"></iframe>';
    }
  }

  function getNestedValue(obj, path) {
    return path
      .split(".")
      .reduce(
        (o, key) => (o && o[key] !== undefined ? o[key] : undefined),
        obj
      );
  }
});
