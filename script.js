document.addEventListener("DOMContentLoaded", () => {
  // ===== Load saved content from localStorage =====
  loadContent();

  // ===== Header scroll effect =====
  const header = document.getElementById("header");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 50);
  });

  // ===== Mobile menu toggle =====
  const menuToggle = document.getElementById("menu-toggle");
  const nav = document.querySelector(".nav");

  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("active");
    menuToggle.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    menuToggle.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
  });

  nav.addEventListener("click", (e) => {
    if (e.target.classList.contains("nav-link")) {
      nav.classList.remove("active");
      menuToggle.classList.remove("active");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "メニューを開く");
    }
  });

  // ===== Scroll animations =====
  const animateObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animated");
          animateObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll("[data-animate]").forEach((el) => {
    animateObserver.observe(el);
  });

  // ===== Counter animation =====
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll(".stat-number").forEach((el) => {
    counterObserver.observe(el);
  });

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    }
    requestAnimationFrame(update);
  }

  // ===== Smooth scroll =====
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (targetId === "#") return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
});

// ===== Content Management System =====
function loadContent() {
  const saved = localStorage.getItem("kantoKaseiLP");
  if (!saved) return;

  try {
    const data = JSON.parse(saved);

    // Load text content
    if (data.texts) {
      Object.keys(data.texts).forEach((key) => {
        const el = document.querySelector('[data-content="' + key + '"]');
        if (el) {
          el.innerHTML = data.texts[key].replace(/\n/g, "<br>");
        }
      });
    }

    // Load images
    if (data.images) {
      Object.keys(data.images).forEach((key) => {
        const el = document.querySelector('[data-content-img="' + key + '"]');
        if (el && data.images[key]) {
          el.src = data.images[key];
        }
      });
    }

    // Load videos
    if (data.videos) {
      Object.keys(data.videos).forEach((key) => {
        const container = document.querySelector('[data-video-id="' + key + '"]');
        if (container && data.videos[key]) {
          embedVideo(container, data.videos[key]);
        }
      });
    }

    // Load stat targets
    if (data.stats) {
      Object.keys(data.stats).forEach((key) => {
        const el = document.querySelector('[data-content-attr="' + key + '"]');
        if (el) {
          el.dataset.target = data.stats[key];
        }
      });
    }

    // Load entry link
    if (data.entryLink) {
      const entryEl = document.getElementById("entry-link");
      if (entryEl) entryEl.href = data.entryLink;
    }

    // Load logo image
    if (data.logoImage) {
      const logoImg = document.getElementById("logo-img");
      const logoTextWrap = document.getElementById("logo-text-wrap");
      if (logoImg) {
        logoImg.src = data.logoImage;
        logoImg.style.display = "block";
        if (logoTextWrap) logoTextWrap.style.display = "none";
      }
    }

    // Load hero background video
    if (data.heroVideo) {
      const heroImg = document.getElementById("hero-bg-img");
      const heroVid = document.getElementById("hero-bg-video");
      if (heroVid && data.heroVideo) {
        heroVid.src = data.heroVideo;
        heroVid.style.display = "block";
        if (heroImg) heroImg.style.display = "none";
      }
    }
  } catch (e) {
    // Silently fail - use default content
  }
}

function embedVideo(container, url) {
  let embedUrl = "";

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (ytMatch) {
    embedUrl = "https://www.youtube.com/embed/" + ytMatch[1];
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    embedUrl = "https://player.vimeo.com/video/" + vimeoMatch[1];
  }

  if (embedUrl) {
    let iframe = container.querySelector("iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
      container.insertBefore(iframe, container.firstChild);
    }
    iframe.src = embedUrl;
    container.classList.add("has-video");
  }
}
