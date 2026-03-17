document.addEventListener("DOMContentLoaded", () => {
  // ===== Loading Screen =====
  const loadingScreen = document.querySelector(".loading-screen");
  if (loadingScreen) {
    document.body.classList.add("loading");
    window.addEventListener("load", () => {
      setTimeout(() => {
        loadingScreen.classList.add("hidden");
        document.body.classList.remove("loading");
        initHeroAnimations();
      }, 2200);
    });
    // Fallback if load event already fired
    if (document.readyState === "complete") {
      setTimeout(() => {
        loadingScreen.classList.add("hidden");
        document.body.classList.remove("loading");
        initHeroAnimations();
      }, 2200);
    }
  } else {
    initHeroAnimations();
  }

  // ===== Load saved content from localStorage =====
  loadContent();

  // ===== Header scroll effect with hide/show =====
  const header = document.getElementById("header");
  let lastScrollY = 0;
  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        header.classList.toggle("scrolled", currentScrollY > 50);

        // Hide header on scroll down, show on scroll up
        if (currentScrollY > 300 && currentScrollY > lastScrollY) {
          header.classList.add("header-hidden");
        } else {
          header.classList.remove("header-hidden");
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
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

  // ===== Scroll Progress Bar =====
  const progressBar = document.querySelector(".scroll-progress");
  if (progressBar) {
    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      progressBar.style.width = scrollPercent + "%";
    });
  }

  // ===== Back to Top Button =====
  const backToTop = document.querySelector(".back-to-top");
  if (backToTop) {
    window.addEventListener("scroll", () => {
      backToTop.classList.toggle("visible", window.scrollY > 500);
    });
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // ===== Scroll animations - Enhanced with directions =====
  const animateObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animated");
          animateObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );

  document.querySelectorAll("[data-animate]").forEach((el) => {
    animateObserver.observe(el);
  });

  // ===== Stagger animation for grid containers =====
  const staggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const children = entry.target.children;
          Array.from(children).forEach((child, i) => {
            setTimeout(() => {
              child.classList.add("animated");
            }, i * 120);
          });
          staggerObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll("[data-stagger]").forEach((el) => {
    // Set initial state for children
    Array.from(el.children).forEach((child) => {
      child.style.opacity = "0";
      child.style.transform = "translateY(30px)";
      child.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    });
    staggerObserver.observe(el);
  });

  // Add animated class handling for stagger children
  const style = document.createElement("style");
  style.textContent = "[data-stagger] > .animated { opacity: 1 !important; transform: translateY(0) !important; }";
  document.head.appendChild(style);

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

  // ===== Parallax effect on scroll =====
  const parallaxElements = document.querySelectorAll("[data-parallax]");
  if (parallaxElements.length > 0) {
    window.addEventListener("scroll", () => {
      requestAnimationFrame(() => {
        parallaxElements.forEach((el) => {
          const speed = parseFloat(el.dataset.parallax) || 0.3;
          const rect = el.getBoundingClientRect();
          const scrolled = window.scrollY;
          const yPos = -(scrolled * speed);
          el.style.transform = "translate3d(0, " + yPos + "px, 0)";
        });
      });
    });
  }

  // ===== Tilt effect on cards =====
  document.querySelectorAll(".work-card, .education-card, .activity-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      card.style.transform = "perspective(800px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-8px)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });

  // ===== Magnetic effect on buttons =====
  document.querySelectorAll(".btn, .btn-entry").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btn.style.setProperty("--ripple-x", x + "px");
      btn.style.setProperty("--ripple-y", y + "px");
    });
  });

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

  // ===== Active nav link highlight =====
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link:not(.nav-link--cta)");

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            link.style.color = "";
            if (link.getAttribute("href") === "#" + entry.target.id) {
              link.style.fontWeight = "700";
            } else {
              link.style.fontWeight = "";
            }
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach((section) => {
    sectionObserver.observe(section);
  });
});

// ===== Hero Text Animations =====
function initHeroAnimations() {
  // Split hero-catch text into characters
  const heroCatch = document.querySelector(".hero-catch");
  if (heroCatch) {
    splitTextToChars(heroCatch, 0.05, 0.3);
  }

  // Split hero-title text into characters
  const heroTitle = document.querySelector(".hero-title");
  if (heroTitle) {
    splitTextToChars(heroTitle, 0.04, 0.8);
  }
}

function splitTextToChars(el, delayStep, baseDelay) {
  const html = el.innerHTML;
  // Handle <br> tags
  const parts = html.split(/<br\s*\/?>/gi);
  let result = "";
  let charIndex = 0;

  parts.forEach((part, partIndex) => {
    const text = part.replace(/<[^>]*>/g, "");
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === " ") {
        result += " ";
      } else {
        const delay = baseDelay + charIndex * delayStep;
        result += '<span class="char" style="animation-delay: ' + delay + 's">' + char + "</span>";
      }
      charIndex++;
    }
    if (partIndex < parts.length - 1) {
      result += "<br>";
    }
  });

  el.innerHTML = result;
}

// ===== Hero Particles =====
function createParticles() {
  const container = document.querySelector(".hero-particles");
  if (!container) return;

  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    particle.style.left = Math.random() * 100 + "%";
    particle.style.width = (Math.random() * 4 + 2) + "px";
    particle.style.height = particle.style.width;
    particle.style.animationDuration = (Math.random() * 10 + 8) + "s";
    particle.style.animationDelay = (Math.random() * 10) + "s";
    container.appendChild(particle);
  }
}

// Run particle creation
createParticles();

// ===== Content Management System =====
function loadContent() {
  // Check if we're in preview mode (draft)
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get("preview") === "draft";

  let dataStr;
  if (isPreview) {
    dataStr = localStorage.getItem("kantoKaseiLP_draft") || localStorage.getItem("kantoKaseiLP");
  } else {
    dataStr = localStorage.getItem("kantoKaseiLP");
  }

  if (!dataStr) return;

  try {
    const data = JSON.parse(dataStr);
    applyContentData(data);

    // Show preview banner if in preview mode
    if (isPreview) {
      const banner = document.createElement("div");
      banner.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:9999;background:#f59e0b;color:#1a1a2e;text-align:center;padding:0.5rem;font-size:0.85rem;font-weight:600;";
      banner.textContent = "プレビューモード（未公開の下書きを表示中）";
      document.body.appendChild(banner);
      document.documentElement.style.scrollPaddingTop = "calc(var(--header-h) + 36px)";
    }
  } catch (e) {
    // Silently fail - use default content
  }
}

function applyContentData(data) {
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
