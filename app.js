document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const PROJECTS = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];
  const PREF_THEME = "gfolio_theme_v2";
  const PREF_STYLE = "gfolio_style_v2";
  const LOADER_MIN_MS = 650;
  const LOADER_FAILSAFE_MS = 4200;
  const LOADER_HIDE_MS = 320;
  const prefersReducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const supportsFinePointer = Boolean(window.matchMedia?.("(pointer: fine)")?.matches);
  const STYLE_VALUES = new Set(["corporate", "premium", "enterprise", "showcase"]);

  const escapeHtml = (str) =>
    String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const loadTheme = () => {
    try {
      const value = localStorage.getItem(PREF_THEME);
      return value === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  };

  const saveTheme = (theme) => {
    try {
      localStorage.setItem(PREF_THEME, theme);
    } catch {
      // ignore
    }
  };

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    const btn = $("#themeToggle");
    if (btn) btn.textContent = theme === "dark" ? "Светлая тема" : "Тёмная тема";
  };

  const loadStyle = () => {
    try {
      const value = localStorage.getItem(PREF_STYLE);
      if (value === "company" || value === "classic" || value === "serious") return "corporate";
      if (value === "glass") return "showcase";
      if (value && STYLE_VALUES.has(value)) return value;
      return "showcase";
    } catch {
      return "showcase";
    }
  };

  const saveStyle = (style) => {
    try {
      localStorage.setItem(PREF_STYLE, style);
    } catch {
      // ignore
    }
  };

  const applyStyle = (style) => {
    const safeStyle = STYLE_VALUES.has(style) ? style : "corporate";
    document.documentElement.dataset.style = safeStyle;
    const select = $("#styleSelect");
    if (select && select.value !== safeStyle) select.value = safeStyle;
  };

  const isInteractiveStyle = () => document.documentElement.dataset.style === "showcase";

  const themeNow = loadTheme();
  applyTheme(themeNow);
  const styleNow = loadStyle();
  applyStyle(styleNow);

  const themeToggle = $("#themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      saveTheme(next);
    });
  }

  const styleSelect = $("#styleSelect");
  if (styleSelect) {
    styleSelect.value = styleNow;
    styleSelect.addEventListener("change", () => {
      const next = String(styleSelect.value || "corporate");
      if (!STYLE_VALUES.has(next)) return;
      applyStyle(next);
      saveStyle(next);
    });
  }

  const resolveBasePath = () => {
    const { protocol, hostname, pathname } = window.location;
    if (protocol === "file:") return "";
    if (hostname.endsWith(".github.io")) {
      const first = pathname.split("/").filter(Boolean)[0];
      return first ? `/${first}/` : "/";
    }
    return "/";
  };

  const bindInternalRoutes = () => {
    const base = resolveBasePath();
    const routes = {
      home: "?home=1",
      projects: "shop.html",
      case: "product.html?id=neonpuff-redesign",
      contacts: "cart.html",
    };
    $$("[data-route]").forEach((link) => {
      const key = link.getAttribute("data-route");
      const path = key ? routes[key] : null;
      if (!path) return;
      const target = `${base}${path}`;
      link.setAttribute("href", target);
      if (link.dataset.routeBound === "1") return;
      link.dataset.routeBound = "1";
      link.addEventListener("click", (event) => {
        const isPrimary = event.button === 0;
        const noMods = !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
        if (!isPrimary || !noMods) return;
        event.preventDefault();
        window.location.assign(target);
      });
    });
  };

  const ensureLoader = () => {
    let loader = $("#siteLoader");
    if (loader) return loader;

    loader = document.createElement("div");
    loader.id = "siteLoader";
    loader.className = "site-loader";
    loader.setAttribute("aria-hidden", "true");
    loader.innerHTML =
      `<div class="site-loader__box">` +
      `<div class="site-loader__line"></div>` +
      `<p>Загрузка портфолио...</p>` +
      `</div>`;
    document.body.appendChild(loader);
    return loader;
  };

  const bootLoader = () => {
    const minDelay = prefersReducedMotion ? 0 : LOADER_MIN_MS;
    const start = Date.now();

    document.body.classList.add("is-loading");
    const loader = ensureLoader();

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = Date.now() - start;
      const wait = Math.max(0, minDelay - elapsed);
      window.setTimeout(() => {
        document.body.classList.remove("is-loading");
        document.body.classList.add("is-ready");
        loader.classList.add("site-loader--hide");
        window.setTimeout(() => loader.remove(), LOADER_HIDE_MS);
      }, wait);
    };

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    window.setTimeout(finish, LOADER_FAILSAFE_MS);
  };

  bootLoader();

  const bindScrollProgress = () => {
    if ($("#scrollProgress")) return;
    const bar = document.createElement("div");
    bar.id = "scrollProgress";
    bar.className = "scroll-progress";
    document.body.appendChild(bar);

    let ticking = false;
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      bar.style.transform = `scaleX(${progress})`;
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    update();
  };

  const bindPointerGlow = () => {
    if (prefersReducedMotion || !supportsFinePointer) return;
    if ($("#cursorGlow")) return;

    const glow = document.createElement("div");
    glow.id = "cursorGlow";
    glow.className = "cursor-glow";
    document.body.appendChild(glow);

    const rootStyle = document.documentElement.style;
    let tx = window.innerWidth * 0.5;
    let ty = window.innerHeight * 0.5;
    let x = tx;
    let y = ty;
    let mx = 50;
    let my = 40;
    let varsTick = false;

    const frame = () => {
      if (!isInteractiveStyle()) {
        glow.classList.remove("is-visible");
      }
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      window.requestAnimationFrame(frame);
    };

    const pushVars = () => {
      varsTick = false;
      rootStyle.setProperty("--mx", `${mx.toFixed(2)}%`);
      rootStyle.setProperty("--my", `${my.toFixed(2)}%`);
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        if (!isInteractiveStyle()) return;
        tx = event.clientX;
        ty = event.clientY;
        mx = (tx / Math.max(1, window.innerWidth)) * 100;
        my = (ty / Math.max(1, window.innerHeight)) * 100;
        if (!varsTick) {
          varsTick = true;
          window.requestAnimationFrame(pushVars);
        }
        glow.classList.add("is-visible");
      },
      { passive: true },
    );

    window.addEventListener("pointerdown", () => glow.classList.add("is-press"));
    window.addEventListener("pointerup", () => glow.classList.remove("is-press"));
    window.addEventListener("blur", () => glow.classList.remove("is-visible"));

    frame();
  };

  const bindMagnetic = (root = document) => {
    if (prefersReducedMotion || !supportsFinePointer) return;
    const targets = $$(".btn, .theme-toggle, .filter-btn, .nav-link", root);
    targets.forEach((el) => {
      if (el.dataset.magnetic === "1") return;
      el.dataset.magnetic = "1";
      let tx = 0;
      let ty = 0;
      let raf = 0;
      el.classList.add("is-magnetic");

      const paint = () => {
        raf = 0;
        if (!isInteractiveStyle()) {
          el.style.transform = "";
          return;
        }
        el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      };

      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width * 0.5;
        const y = event.clientY - rect.top - rect.height * 0.5;
        tx = x * 0.06;
        ty = y * 0.08;
        if (!raf) raf = window.requestAnimationFrame(paint);
      });

      el.addEventListener("pointerleave", () => {
        tx = 0;
        ty = 0;
        if (!raf) raf = window.requestAnimationFrame(paint);
      });
    });
  };

  const bindTiltCards = (root = document) => {
    if (prefersReducedMotion || !supportsFinePointer) return;
    const cards = $$(".hero-card, .stat, .timeline-item, .case-card, .contact-card", root);

    cards.forEach((card) => {
      if (card.dataset.tiltBound === "1") return;
      card.dataset.tiltBound = "1";
      card.classList.add("is-tilt");
      let rx = 0;
      let ry = 0;
      let tz = 0;
      let raf = 0;

      const paint = () => {
        raf = 0;
        if (!isInteractiveStyle()) {
          card.style.transform = "";
          return;
        }
        card.style.transform =
          `perspective(980px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(${tz.toFixed(2)}px)`;
      };

      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        rx = ((event.clientY - rect.top) / rect.height - 0.5) * -5;
        ry = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
        tz = -2;
        if (!raf) raf = window.requestAnimationFrame(paint);
      });

      card.addEventListener("pointerleave", () => {
        rx = 0;
        ry = 0;
        tz = 0;
        if (!raf) raf = window.requestAnimationFrame(paint);
      });
    });
  };

  const bindHeroLetters = () => {
    const title = $(".hero__title");
    if (!title || title.dataset.charsBound === "1") return;

    const source = title.innerHTML.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "");
    const text = source.trim();
    if (!text) return;

    title.dataset.charsBound = "1";
    title.setAttribute("aria-label", text.replace(/\n/g, " "));
    title.textContent = "";

    const fragment = document.createDocumentFragment();
    let index = 0;
    text.split("").forEach((char) => {
      if (char === "\n") {
        fragment.appendChild(document.createElement("br"));
        return;
      }
      const span = document.createElement("span");
      span.className = "hero-char";
      span.textContent = char === " " ? "\u00A0" : char;
      span.style.setProperty("--char-delay", `${index * 22}ms`);
      fragment.appendChild(span);
      index += 1;
    });

    title.appendChild(fragment);
  };

  const bindSparkClicks = () => {
    if (prefersReducedMotion) return;
    if (document.body.dataset.sparkBound === "1") return;
    document.body.dataset.sparkBound = "1";

    const burst = (x, y) => {
      const count = 10;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const distance = 14 + Math.random() * 24;
        const spark = document.createElement("span");
        spark.className = "spark";
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
        spark.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
        spark.style.setProperty("--hue", `${Math.floor(Math.random() * 360)}deg`);
        document.body.appendChild(spark);
        window.setTimeout(() => spark.remove(), 760);
      }
    };

    document.addEventListener("click", (event) => {
      if (!isInteractiveStyle()) return;
      const target = event.target instanceof Element ? event.target.closest(".btn, .theme-toggle, .project-link") : null;
      if (!target) return;
      burst(event.clientX, event.clientY);
    });
  };

  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            });
          },
          { threshold: 0.12 },
        )
      : null;

  const bindReveal = (root = document) => {
    const nodes = $$(".reveal", root);
    nodes.forEach((node, index) => {
      if (node.dataset.revealBound) return;
      node.dataset.revealBound = "1";
      node.style.setProperty("--delay", `${Math.min(index, 8) * 60}ms`);
      if (observer) observer.observe(node);
      else node.classList.add("is-visible");
    });
  };

  const projectCardHtml = (project) => {
    const tags = (project.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    return `
      <article class="project-card reveal" data-id="${escapeHtml(project.id)}" data-cat="${escapeHtml(project.category)}">
        <a class="project-link" href="product.html?id=${encodeURIComponent(project.id)}">
          <div class="project-cover ${escapeHtml(project.cover || "cover-neon")}">
            <span class="project-meta">${escapeHtml(project.year)} · ${escapeHtml(project.role)}</span>
            <strong>${escapeHtml(project.title)}</strong>
          </div>
          <div class="project-body">
            <p>${escapeHtml(project.summary)}</p>
            <div class="project-tags">${tags}</div>
            <div class="project-result">${escapeHtml(project.result)}</div>
          </div>
        </a>
      </article>
    `;
  };

  const renderFeatured = () => {
    const root = $("#featuredProjects");
    if (!root) return;
    const items = PROJECTS.slice(0, 3);
    root.innerHTML = items.map(projectCardHtml).join("");
    bindReveal(root);
    bindTiltCards(root);
    bindMagnetic(root);
  };

  const renderProjectsPage = () => {
    const root = $("#projectsGrid");
    if (!root) return;

    const searchInput = $("#projectSearch");
    const filterButtons = $$("[data-filter]");

    const state = {
      filter: "all",
      search: "",
    };

    const applyButtons = () => {
      filterButtons.forEach((btn) => {
        btn.classList.toggle("is-active", btn.getAttribute("data-filter") === state.filter);
      });
    };

    const getVisible = () => {
      const query = state.search.trim().toLowerCase();
      return PROJECTS.filter((project) => {
        if (state.filter !== "all" && project.category !== state.filter) return false;
        if (!query) return true;
        const text = `${project.title} ${project.summary} ${(project.tags || []).join(" ")}`.toLowerCase();
        return text.includes(query);
      });
    };

    const render = () => {
      const list = getVisible();
      if (list.length === 0) {
        root.innerHTML = `<div class="empty-state reveal">Ничего не найдено. Попробуй другой запрос.</div>`;
        bindReveal(root);
        return;
      }
      root.innerHTML = list.map(projectCardHtml).join("");
      bindReveal(root);
      bindTiltCards(root);
      bindMagnetic(root);
    };

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.filter = btn.getAttribute("data-filter") || "all";
        applyButtons();
        render();
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        state.search = searchInput.value;
        render();
      });
    }

    const hash = (window.location.hash || "").replace("#", "").trim();
    if (hash && ["web", "ecommerce", "branding"].includes(hash)) {
      state.filter = hash;
    }

    applyButtons();
    render();
  };

  const renderCasePage = () => {
    const root = $("#caseStudy");
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || "";
    const project = PROJECTS.find((item) => item.id === id) || PROJECTS[0];

    if (!project) {
      root.innerHTML = `<div class="empty-state reveal">Нет данных для отображения кейса.</div>`;
      bindReveal(root);
      return;
    }

    document.title = `${project.title} — GFolio`;

    root.innerHTML = `
      <article class="case-hero reveal">
        <div class="project-cover ${escapeHtml(project.cover || "cover-neon")} case-cover">
          <span class="project-meta">${escapeHtml(project.year)} · ${escapeHtml(project.role)}</span>
          <strong>${escapeHtml(project.title)}</strong>
        </div>
        <p>${escapeHtml(project.summary)}</p>
      </article>

      <section class="case-grid">
        <article class="case-card reveal">
          <h2>Задача</h2>
          <p>${escapeHtml(project.challenge)}</p>
        </article>
        <article class="case-card reveal">
          <h2>Решение</h2>
          <p>${escapeHtml(project.solution)}</p>
        </article>
        <article class="case-card reveal">
          <h2>Результат</h2>
          <p>${escapeHtml(project.impact)}</p>
        </article>
      </section>

      <section class="stack reveal">
        <h2>Стек и артефакты</h2>
        <div class="project-tags">${(project.stack || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
        <p class="case-result">${escapeHtml(project.result)}</p>
      </section>
    `;

    bindReveal(root);
    bindTiltCards(root);
    bindMagnetic(root);
  };

  const toast = (text) => {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));
    window.setTimeout(() => el.classList.remove("is-visible"), 2200);
    window.setTimeout(() => el.remove(), 2700);
  };

  const bindContactForm = () => {
    const form = $("#contactForm");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.reset();
      toast("Заявка принята. Отвечу в ближайшее время.");
    });
  };

  const setYear = () => {
    const year = String(new Date().getFullYear());
    $$("#yearNow").forEach((el) => {
      el.textContent = year;
    });
  };

  setYear();
  bindInternalRoutes();
  bindScrollProgress();
  bindPointerGlow();
  bindHeroLetters();
  bindSparkClicks();
  renderFeatured();
  renderProjectsPage();
  renderCasePage();
  bindContactForm();
  bindReveal();
  bindTiltCards();
  bindMagnetic();
});
