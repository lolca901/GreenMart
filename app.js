document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const PROJECTS = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];
  const PREF_THEME = "gfolio_theme_v2";
  const PREF_STYLE = "gfolio_style_v2";
  const pagePath = window.location.pathname || "";
  const PAGE_LANG = document.documentElement.lang === "ru" || /\.ru\.html$/i.test(pagePath) ? "ru" : "en";
  document.documentElement.lang = PAGE_LANG;
  const t = (en, ru) => (PAGE_LANG === "ru" ? ru : en);
  const LOADER_MIN_MS = 650;
  const LOADER_FAILSAFE_MS = 4200;
  const LOADER_HIDE_MS = 320;
  const prefersReducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const supportsFinePointer = Boolean(window.matchMedia?.("(pointer: fine)")?.matches);
  const prefersCoarsePointer = Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);
  const STYLE_VALUES = new Set(["corporate", "premium", "enterprise", "showcase"]);
  const STYLE_META = {
    corporate: {
      title: "Corporate Clean",
      description: t("Structured interface with restrained visuals", "Строгий интерфейс без лишних эффектов"),
    },
    premium: {
      title: "Premium Editorial",
      description: t("Warm editorial direction with rich accents", "Теплая журнальная подача и акценты"),
    },
    enterprise: {
      title: "Enterprise Grid",
      description: t("System-driven grid with clear B2B hierarchy", "Системная сетка и B2B-структура"),
    },
    showcase: {
      title: "Showcase Motion",
      description: t("Expressive showcase mode with motion details", "Динамичный витринный режим с motion"),
    },
  };
  const SHOWCASE_ACCENT_WORDS = PAGE_LANG === "ru" ? ["сайты", "скорость"] : ["websites", "flow"];

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
    if (btn) btn.textContent = theme === "dark" ? t("Light Theme", "Светлая тема") : t("Dark Theme", "Тёмная тема");
    window.dispatchEvent(new CustomEvent("gfolio:theme-change", { detail: { theme } }));
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
    if (document.body) document.body.dataset.styleActive = safeStyle;
    const select = $("#styleSelect");
    if (select && select.value !== safeStyle) select.value = safeStyle;
    if (document.body) {
      syncMotionMode();
      probeShowcasePerformance();
    }
    window.dispatchEvent(new CustomEvent("gfolio:style-change", { detail: { style: safeStyle } }));
  };

  const isInteractiveStyle = () => document.documentElement.dataset.style === "showcase";
  let runtimeLiteMotion = false;
  let perfProbeRaf = 0;

  const canUseHeavyMotion = () => {
    if (!isInteractiveStyle() || prefersReducedMotion || !supportsFinePointer) return false;
    if (window.innerWidth < 900) return false;
    if (prefersCoarsePointer) return false;
    return true;
  };

  const canUseShowcaseCursorDot = () => {
    if (!isInteractiveStyle() || prefersReducedMotion || !supportsFinePointer) return false;
    if (prefersCoarsePointer) return false;
    return true;
  };

  const syncMotionMode = () => {
    if (!document.body) return;
    document.body.classList.toggle("is-lite-motion", runtimeLiteMotion || !canUseHeavyMotion());
  };

  const cancelPerfProbe = () => {
    if (!perfProbeRaf) return;
    window.cancelAnimationFrame(perfProbeRaf);
    perfProbeRaf = 0;
  };

  const probeShowcasePerformance = () => {
    cancelPerfProbe();
    if (!document.body) return;
    if (!isInteractiveStyle()) {
      runtimeLiteMotion = false;
      syncMotionMode();
      return;
    }
    if (!canUseHeavyMotion()) {
      runtimeLiteMotion = true;
      syncMotionMode();
      return;
    }

    runtimeLiteMotion = false;
    syncMotionMode();

    let start = 0;
    let prev = 0;
    let frames = 0;
    let totalDelta = 0;

    const tick = (now) => {
      if (!isInteractiveStyle()) {
        cancelPerfProbe();
        return;
      }

      if (start === 0) {
        start = now;
        prev = now;
        perfProbeRaf = window.requestAnimationFrame(tick);
        return;
      }

      totalDelta += now - prev;
      prev = now;
      frames += 1;

      if (now - start < 1600) {
        perfProbeRaf = window.requestAnimationFrame(tick);
        return;
      }

      const avgDelta = totalDelta / Math.max(1, frames);
      runtimeLiteMotion = avgDelta > 21.5;
      syncMotionMode();
      if (runtimeLiteMotion) {
        $$(".is-magnetic, .is-tilt").forEach((node) => {
          if (node instanceof HTMLElement) node.style.transform = "";
        });
      }
      perfProbeRaf = 0;
    };

    perfProbeRaf = window.requestAnimationFrame(tick);
  };

  let syncStyleDropdownUi = () => {};

  const initStyleDropdown = () => {
    const select = $("#styleSelect");
    const picker = select?.closest(".style-picker");
    if (!select || !picker || picker.dataset.dropdownBound === "1") return;
    picker.dataset.dropdownBound = "1";
    picker.classList.add("style-picker--enhanced");

    const dropdown = document.createElement("div");
    dropdown.className = "style-dropdown";

    const button = document.createElement("button");
    button.className = "style-dropdown__button";
    button.type = "button";
    button.setAttribute("aria-haspopup", "listbox");
    button.setAttribute("aria-expanded", "false");

    const label = document.createElement("span");
    label.className = "style-dropdown__label";
    const chevron = document.createElement("span");
    chevron.className = "style-dropdown__chevron";
    button.append(label, chevron);

    const menu = document.createElement("div");
    menu.className = "style-dropdown__menu";
    menu.setAttribute("role", "listbox");
    menu.id = "styleDropdownMenu";
    button.setAttribute("aria-controls", menu.id);

    const open = () => {
      dropdown.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      dropdown.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
    };

    const toggle = () => {
      if (dropdown.classList.contains("is-open")) close();
      else open();
    };

    const options = Array.from(select.options).map((opt) => {
      const value = String(opt.value || "");
      const meta = STYLE_META[value] || null;
      return {
        value,
        text: meta?.title || opt.textContent || value,
        description: meta?.description || "",
      };
    });

    const focusOption = (node) => {
      if (node instanceof HTMLElement) node.focus();
    };

    const getOptionNodes = () => Array.from(menu.querySelectorAll(".style-dropdown__option"));

    const moveFocus = (offset) => {
      const nodes = getOptionNodes();
      if (nodes.length === 0) return;
      const current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const currentIndex = current ? nodes.indexOf(current) : -1;
      const base = currentIndex >= 0 ? currentIndex : 0;
      const next = nodes[(base + offset + nodes.length) % nodes.length];
      focusOption(next);
    };

    options.forEach((opt) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "style-dropdown__option";
      item.setAttribute("role", "option");
      item.dataset.value = opt.value;

      const mark = document.createElement("span");
      mark.className = "style-dropdown__mark";
      mark.textContent = "✓";

      const swatch = document.createElement("span");
      swatch.className = "style-dropdown__swatch";
      swatch.dataset.value = opt.value;

      const meta = document.createElement("span");
      meta.className = "style-dropdown__meta";
      const title = document.createElement("span");
      title.className = "style-dropdown__title";
      title.textContent = opt.text;
      meta.append(title);

      if (opt.description) {
        const desc = document.createElement("span");
        desc.className = "style-dropdown__desc";
        desc.textContent = opt.description;
        meta.append(desc);
      }

      item.append(mark, swatch, meta);
      item.addEventListener("click", () => {
        if (!STYLE_VALUES.has(opt.value)) return;
        select.value = opt.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        close();
      });

      item.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          moveFocus(1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          moveFocus(-1);
        } else if (event.key === "Escape") {
          event.preventDefault();
          close();
          button.focus();
        }
      });
      menu.appendChild(item);
    });

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggle();
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        open();
        const active = menu.querySelector(".style-dropdown__option.is-active") || menu.querySelector(".style-dropdown__option");
        focusOption(active);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Node)) return;
      if (!dropdown.contains(event.target)) close();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    dropdown.append(button, menu);
    picker.append(dropdown);

    syncStyleDropdownUi = () => {
      const active = document.documentElement.dataset.style || select.value || "corporate";
      const selected = options.find((opt) => opt.value === active);
      label.textContent = selected ? selected.text : t("Choose style", "Выбрать стиль");
      button.dataset.style = active;
      menu.querySelectorAll(".style-dropdown__option").forEach((node) => {
        const isActive = node instanceof HTMLElement && node.dataset.value === active;
        node.classList.toggle("is-active", Boolean(isActive));
        node.setAttribute("aria-selected", isActive ? "true" : "false");
      });
    };

    syncStyleDropdownUi();
  };

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
  initStyleDropdown();
  if (styleSelect) {
    styleSelect.value = styleNow;
    styleSelect.addEventListener("change", () => {
      const next = String(styleSelect.value || "corporate");
      if (!STYLE_VALUES.has(next)) return;
      applyStyle(next);
      saveStyle(next);
      syncStyleDropdownUi();
      bindReveal();
    });
  }
  syncStyleDropdownUi();

  syncMotionMode();
  probeShowcasePerformance();
  let resizeRaf = 0;
  window.addEventListener("resize", () => {
    if (resizeRaf) return;
    resizeRaf = window.requestAnimationFrame(() => {
      resizeRaf = 0;
      runtimeLiteMotion = false;
      syncMotionMode();
      probeShowcasePerformance();
    });
  });

  const resolveBasePath = () => {
    const { protocol, hostname, pathname } = window.location;
    if (protocol === "file:") return "";
    if (hostname.endsWith(".github.io")) {
      const first = pathname.split("/").filter(Boolean)[0];
      return first ? `/${first}/` : "/";
    }
    return "/";
  };

  const getPageNameFromPath = () => {
    const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    const matched = current.match(/^(index|shop|product|cart)(?:\.ru)?\.html$/);
    return matched ? matched[1] : "index";
  };

  const localizedFileName = (pageName, lang = PAGE_LANG) => `${pageName}${lang === "ru" ? ".ru" : ""}.html`;

  const localizedPath = (pageName, lang = PAGE_LANG, query = "") => `${resolveBasePath()}${localizedFileName(pageName, lang)}${query}`;

  const bindLanguageSwitch = () => {
    const toggle = $("#langToggle");
    if (toggle && toggle.dataset.bound !== "1") {
      toggle.dataset.bound = "1";
      const buttons = $$(".lang-toggle__btn[data-lang]", toggle);
      const sync = (lang) => {
        buttons.forEach((btn) => {
          const active = btn.getAttribute("data-lang") === lang;
          btn.classList.toggle("is-active", active);
          btn.setAttribute("aria-pressed", active ? "true" : "false");
        });
      };

      sync(PAGE_LANG);
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const nextLang = btn.getAttribute("data-lang") === "ru" ? "ru" : "en";
          if (nextLang === PAGE_LANG) return;
          const pageName = getPageNameFromPath();
          const target = `${localizedPath(pageName, nextLang)}${window.location.search}${window.location.hash}`;
          window.location.assign(target);
        });
      });
    }

    // Backward compatibility for old cached markup with <select id="langSelect">
    const select = $("#langSelect");
    if (!select || select.dataset.bound === "1") return;
    select.dataset.bound = "1";
    select.value = PAGE_LANG;
    select.addEventListener("change", () => {
      const nextLang = select.value === "ru" ? "ru" : "en";
      if (nextLang === PAGE_LANG) return;
      const pageName = getPageNameFromPath();
      const target = `${localizedPath(pageName, nextLang)}${window.location.search}${window.location.hash}`;
      window.location.assign(target);
    });
  };

  const bindInternalRoutes = () => {
    const routes = {
      home: localizedPath("index"),
      projects: localizedPath("shop"),
      case: localizedPath("product", PAGE_LANG, "?id=neonpuff-redesign"),
      contacts: localizedPath("cart"),
    };
    $$("[data-route]").forEach((link) => {
      const key = link.getAttribute("data-route");
      const path = key ? routes[key] : null;
      if (!path) return;
      const target = path;
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
      `<p>${t("Loading portfolio...", "Загрузка портфолио...")}</p>` +
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

  const bindShowcaseScrollFx = () => {
    const rootStyle = document.documentElement.style;
    let ticking = false;

    const resetVars = () => {
      rootStyle.setProperty("--showcase-hero-shift", "0px");
      rootStyle.setProperty("--showcase-bg-shift", "0px");
      rootStyle.setProperty("--showcase-glow-rotate", "0deg");
      rootStyle.setProperty("--showcase-progress", "0");
    };

    const update = () => {
      ticking = false;
      if (!isInteractiveStyle()) {
        resetVars();
        return;
      }

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const isLite = Boolean(document.body?.classList.contains("is-lite-motion"));
      const heroShift = Math.min(isLite ? 14 : 38, window.scrollY * (isLite ? 0.017 : 0.036));
      const bgShift = Math.min(isLite ? 22 : 62, window.scrollY * (isLite ? 0.026 : 0.056));
      const rotate = (isLite ? 10 : 26) * progress;

      rootStyle.setProperty("--showcase-hero-shift", `${heroShift.toFixed(2)}px`);
      rootStyle.setProperty("--showcase-bg-shift", `${bgShift.toFixed(2)}px`);
      rootStyle.setProperty("--showcase-glow-rotate", `${rotate.toFixed(2)}deg`);
      rootStyle.setProperty("--showcase-progress", progress.toFixed(4));
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("gfolio:style-change", requestUpdate);
    update();
  };

  const bindShowcaseSceneDepth = () => {
    let ticking = false;

    const reset = () => {
      $$(".showcase-depth").forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        node.style.setProperty("--scene-offset", "0px");
      });
    };

    const update = () => {
      ticking = false;
      if (!isInteractiveStyle() || runtimeLiteMotion) {
        reset();
        return;
      }

      const vh = Math.max(1, window.innerHeight);
      const centerLine = vh * 0.54;

      $$(".showcase-depth.is-visible").forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        const rect = node.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > vh + 120) {
          node.style.setProperty("--scene-offset", "0px");
          return;
        }

        const nodeCenter = rect.top + rect.height * 0.5;
        const depth = Number(node.dataset.sceneDepth || 10);
        const normalized = (centerLine - nodeCenter) / vh;
        const offset = Math.max(-depth, Math.min(depth, normalized * depth));
        node.style.setProperty("--scene-offset", `${offset.toFixed(2)}px`);
      });
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("gfolio:style-change", requestUpdate);
    window.addEventListener("gfolio:scene-refresh", requestUpdate);
    update();
  };

  const bindShowcaseReferenceScene = () => {
    if ($("#showcaseScene")) return;

    const canvas = document.createElement("canvas");
    canvas.id = "showcaseScene";
    canvas.className = "showcase-scene";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let nodes = [];
    let isRunning = false;
    let lastFrame = 0;
    let scrollY = window.scrollY || 0;
    let pointerX = window.innerWidth * 0.65;
    let pointerY = window.innerHeight * 0.38;
    let pointerActive = false;
    let resizeTick = 0;
    let scrollTick = 0;

    const getPalette = () => {
      const dark = document.documentElement.dataset.theme === "dark";
      if (dark) {
        return {
          grid: "rgba(255, 74, 74, 0.08)",
          lineRgb: "255,72,72",
          nodeRgb: "255,98,88",
          glowRgb: "255,58,58",
        };
      }
      return {
        grid: "rgba(154, 42, 34, 0.11)",
        lineRgb: "170,56,44",
        nodeRgb: "188,68,58",
        glowRgb: "206,74,62",
      };
    };

    const updateCanvasSize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      dpr = Math.min(1.75, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const buildNodes = () => {
      const areaFactor = Math.min(1.3, (width * height) / (1600 * 950));
      const baseCount = runtimeLiteMotion ? 16 : 26;
      const count = Math.round(baseCount * areaFactor);
      nodes = Array.from({ length: Math.max(14, Math.min(44, count)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() * 2 - 1) * (runtimeLiteMotion ? 0.08 : 0.18),
        vy: (Math.random() * 2 - 1) * (runtimeLiteMotion ? 0.08 : 0.18),
        radius: 0.8 + Math.random() * 1.8,
        drift: Math.random() * Math.PI * 2,
      }));
    };

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const drawFrame = (now) => {
      if (!isRunning) {
        raf = 0;
        return;
      }

      const minStep = runtimeLiteMotion ? 32 : 16;
      if (lastFrame && now - lastFrame < minStep) {
        raf = window.requestAnimationFrame(drawFrame);
        return;
      }

      const delta = clamp((now - (lastFrame || now)) / 16.67, 0.55, 2.2);
      lastFrame = now;
      const palette = getPalette();
      const lineDistance = runtimeLiteMotion ? 148 : 188;
      const lineDistanceSq = lineDistance * lineDistance;
      const pointerRadiusSq = (runtimeLiteMotion ? 84 : 120) ** 2;
      const yDrift = scrollY * (runtimeLiteMotion ? 0.015 : 0.028);
      const gridStep = runtimeLiteMotion ? 92 : 78;
      const gridOffset = (scrollY * -0.1) % gridStep;

      ctx.clearRect(0, 0, width, height);

      ctx.beginPath();
      ctx.strokeStyle = palette.grid;
      ctx.lineWidth = 1;
      for (let x = gridOffset - gridStep; x < width + gridStep; x += gridStep) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gridOffset - gridStep; y < height + gridStep; y += gridStep) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];

        node.x += node.vx * delta;
        node.y += node.vy * delta;
        node.drift += 0.004 * delta;

        if (node.x < -26) node.x = width + 26;
        else if (node.x > width + 26) node.x = -26;
        if (node.y < -26) node.y = height + 26;
        else if (node.y > height + 26) node.y = -26;

        if (pointerActive) {
          const dxp = node.x - pointerX;
          const dyp = node.y - pointerY;
          const distPointerSq = dxp * dxp + dyp * dyp;
          if (distPointerSq < pointerRadiusSq && distPointerSq > 0.01) {
            const force = (1 - distPointerSq / pointerRadiusSq) * 0.44;
            node.vx += (dxp / Math.sqrt(distPointerSq)) * force * 0.014;
            node.vy += (dyp / Math.sqrt(distPointerSq)) * force * 0.014;
          }
        }

        node.vx *= 0.994;
        node.vy *= 0.994;
      }

      for (let i = 0; i < nodes.length; i += 1) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > lineDistanceSq) continue;
          const proximity = 1 - distSq / lineDistanceSq;
          const alpha = clamp(proximity * proximity * (runtimeLiteMotion ? 0.16 : 0.24), 0, 0.26);
          ctx.strokeStyle = `rgba(${palette.lineRgb},${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y + yDrift);
          ctx.lineTo(b.x, b.y + yDrift);
          ctx.stroke();
        }
      }

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        const pulse = 0.58 + Math.sin(node.drift + now * 0.0011) * 0.24;
        const nodeY = node.y + yDrift;

        ctx.fillStyle = `rgba(${palette.nodeRgb},${clamp(0.44 + pulse * 0.32, 0.22, 0.74).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(node.x, nodeY, node.radius, 0, Math.PI * 2);
        ctx.fill();

        if (pulse > 0.6 && !runtimeLiteMotion) {
          const glow = node.radius * (1.8 + pulse);
          ctx.fillStyle = `rgba(${palette.glowRgb},${(0.08 + pulse * 0.1).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(node.x, nodeY, glow, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = window.requestAnimationFrame(drawFrame);
    };

    const stop = () => {
      isRunning = false;
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
      lastFrame = 0;
      canvas.classList.remove("is-active");
      ctx.clearRect(0, 0, width, height);
    };

    const start = () => {
      if (isRunning) return;
      isRunning = true;
      canvas.classList.add("is-active");
      raf = window.requestAnimationFrame(drawFrame);
    };

    const sync = () => {
      const enabled = isInteractiveStyle() && !prefersReducedMotion;
      canvas.classList.toggle("is-showcase", enabled);
      if (!enabled || document.hidden) {
        stop();
        return;
      }
      updateCanvasSize();
      buildNodes();
      start();
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        pointerActive = true;
      },
      { passive: true },
    );

    window.addEventListener("pointerleave", () => {
      pointerActive = false;
    });

    window.addEventListener(
      "scroll",
      () => {
        if (scrollTick) return;
        scrollTick = window.requestAnimationFrame(() => {
          scrollTick = 0;
          scrollY = window.scrollY || 0;
        });
      },
      { passive: true },
    );

    window.addEventListener("resize", () => {
      if (resizeTick) return;
      resizeTick = window.requestAnimationFrame(() => {
        resizeTick = 0;
        updateCanvasSize();
        buildNodes();
      });
    });

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("gfolio:style-change", sync);
    window.addEventListener("gfolio:theme-change", sync);
    window.addEventListener("gfolio:scene-refresh", sync);
    sync();
  };

  const bindShowcaseStageCycle = () => {
    const stages = $$(".hero-stage");
    if (stages.length < 2) return;

    const rootStyle = document.documentElement.style;
    let timer = 0;
    let progressRaf = 0;
    let phaseStartedAt = 0;
    let phaseDuration = 3400;
    let activeIndex = Math.max(0, stages.findIndex((stage) => stage.classList.contains("is-active")));

    const syncStageVars = () => {
      rootStyle.setProperty("--showcase-stage-index", String(activeIndex));
      if (document.body) document.body.dataset.showcaseStage = String(activeIndex + 1);
    };

    const stopProgress = () => {
      if (progressRaf) {
        window.cancelAnimationFrame(progressRaf);
        progressRaf = 0;
      }
      rootStyle.setProperty("--showcase-stage-progress", "0");
    };

    const paintProgress = (now) => {
      if (!isInteractiveStyle() || document.hidden) {
        progressRaf = 0;
        return;
      }
      const elapsed = Math.max(0, now - phaseStartedAt);
      const progress = Math.min(1, elapsed / Math.max(1, phaseDuration));
      rootStyle.setProperty("--showcase-stage-progress", progress.toFixed(4));
      progressRaf = window.requestAnimationFrame(paintProgress);
    };

    const restartProgress = () => {
      stopProgress();
      phaseStartedAt = performance.now();
      progressRaf = window.requestAnimationFrame(paintProgress);
    };

    const setActive = (index) => {
      activeIndex = (index + stages.length) % stages.length;
      stages.forEach((stage, stageIndex) => {
        stage.classList.toggle("is-active", stageIndex === activeIndex);
      });
      syncStageVars();
    };

    const stop = () => {
      if (!timer) return;
      window.clearInterval(timer);
      timer = 0;
      stopProgress();
    };

    const start = () => {
      stop();
      if (!isInteractiveStyle()) return;
      phaseDuration = runtimeLiteMotion ? 4700 : 3400;
      restartProgress();
      timer = window.setInterval(() => {
        setActive(activeIndex + 1);
        restartProgress();
      }, phaseDuration);
    };

    stages.forEach((stage, index) => {
      stage.addEventListener("pointerenter", () => {
        setActive(index);
        start();
      });
      stage.addEventListener("focus", () => {
        setActive(index);
        start();
      });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
    syncStageVars();
    window.addEventListener("gfolio:style-change", start);
    window.addEventListener("resize", start);
    start();
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
    let raf = 0;
    let mx = 50;
    let my = 40;
    let varsTick = false;

    const syncCursorMode = () => {
      const enableDot = canUseShowcaseCursorDot();
      document.body.classList.toggle("cursor-dot-active", enableDot);
      if (!enableDot) glow.classList.remove("is-visible", "is-press");
    };

    const paint = () => {
      raf = 0;
      glow.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
    };

    const requestPaint = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(paint);
    };

    const pushVars = () => {
      varsTick = false;
      rootStyle.setProperty("--mx", `${mx.toFixed(2)}%`);
      rootStyle.setProperty("--my", `${my.toFixed(2)}%`);
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        if (!canUseShowcaseCursorDot()) {
          glow.classList.remove("is-visible");
          return;
        }
        tx = event.clientX;
        ty = event.clientY;
        requestPaint();
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

    window.addEventListener("pointerdown", () => {
      if (!canUseShowcaseCursorDot()) return;
      glow.classList.add("is-press");
    });
    window.addEventListener("pointerup", () => glow.classList.remove("is-press"));
    window.addEventListener("blur", () => glow.classList.remove("is-visible"));
    window.addEventListener("mouseleave", () => glow.classList.remove("is-visible", "is-press"));
    window.addEventListener("resize", syncCursorMode);
    window.addEventListener("gfolio:style-change", () => {
      syncCursorMode();
    });
    syncCursorMode();
  };

  const bindMagnetic = (root = document) => {
    if (prefersReducedMotion || !supportsFinePointer) return;
    const targets = $$(".btn, .theme-toggle, .style-dropdown__button", root);
    targets.forEach((el) => {
      if (el.dataset.magnetic === "1") return;
      el.dataset.magnetic = "1";
      let tx = 0;
      let ty = 0;
      let raf = 0;
      el.classList.add("is-magnetic");

      const paint = () => {
        raf = 0;
        if (!canUseHeavyMotion()) {
          el.style.transform = "";
          return;
        }
        el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      };

      el.addEventListener("pointermove", (event) => {
        if (!canUseHeavyMotion()) return;
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
    const cards = $$(".hero-card, .case-card", root);

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
        if (!canUseHeavyMotion()) {
          card.style.transform = "";
          return;
        }
        card.style.transform =
          `perspective(980px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(${tz.toFixed(2)}px)`;
      };

      card.addEventListener("pointermove", (event) => {
        if (!canUseHeavyMotion()) return;
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
    const lockShortWords = (line) =>
      line.replace(/(^|[\s\u00A0])([A-Za-zА-Яа-яЁё])\s+(?=\S)/g, (_, start, letter) => `${start}${letter}\u00A0`);

    const plainText = text.replace(/\n/g, " ");
    const normalized = plainText.toLowerCase();
    const accentIndexes = new Set();
    SHOWCASE_ACCENT_WORDS.forEach((word) => {
      const token = word.toLowerCase();
      let from = 0;
      while (from >= 0) {
        const at = normalized.indexOf(token, from);
        if (at < 0) break;
        for (let i = at; i < at + token.length; i += 1) accentIndexes.add(i);
        from = at + token.length;
      }
    });

    title.dataset.charsBound = "1";
    title.setAttribute("aria-label", text.replace(/\n/g, " "));
    title.textContent = "";

    const fragment = document.createDocumentFragment();
    let index = 0;
    let plainIndex = 0;

    text.split("\n").forEach((line, lineIndex, lines) => {
      const preparedLine = lockShortWords(line);
      const tokens = preparedLine.match(/\S+|\s+/g) || [];

      tokens.forEach((token) => {
        if (/^\s+$/.test(token)) {
          fragment.appendChild(document.createTextNode(token));
          plainIndex += token.length;
          index += token.length;
          return;
        }

        const word = document.createElement("span");
        word.className = "hero-word";

        token.split("").forEach((char) => {
          const span = document.createElement("span");
          span.className = "hero-char";
          if (accentIndexes.has(plainIndex)) span.classList.add("hero-char--accent");
          span.textContent = char;
          span.style.setProperty("--char-delay", `${index * 22}ms`);
          word.appendChild(span);
          plainIndex += 1;
          index += 1;
        });

        fragment.appendChild(word);
      });

      if (lineIndex < lines.length - 1) {
        fragment.appendChild(document.createElement("br"));
        // Keep accent indexes aligned with plainText where newlines become spaces.
        plainIndex += 1;
        index += 1;
      }
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
      if (!canUseHeavyMotion()) return;
      const target = event.target instanceof Element ? event.target.closest(".btn--primary") : null;
      if (!target) return;
      burst(event.clientX, event.clientY);
    });
  };

  window.addEventListener("gfolio:style-change", () => {
    if (canUseHeavyMotion() && !runtimeLiteMotion) return;
    $$(".is-magnetic, .is-tilt").forEach((node) => {
      if (node instanceof HTMLElement) node.style.transform = "";
    });
  });

  const onRevealIntersect = (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      obs.unobserve(entry.target);
    });
  };

  const observer = "IntersectionObserver" in window ? new IntersectionObserver(onRevealIntersect, { threshold: 0.12 }) : null;

  const showcaseObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(onRevealIntersect, {
          threshold: 0.18,
          rootMargin: "0px 0px -8% 0px",
        })
      : null;

  const bindReveal = (root = document) => {
    const nodes = $$(".reveal", root);
    const showcaseStyle = document.documentElement.dataset.style === "showcase";
    const delayStep = showcaseStyle ? 78 : 60;
    const delayCap = showcaseStyle ? 14 : 8;
    const useShowcaseObserver = showcaseStyle && showcaseObserver && !runtimeLiteMotion;

    nodes.forEach((node, index) => {
      if (showcaseStyle) {
        node.classList.add("showcase-depth");
        if (!node.dataset.sceneDepth) {
          let depth = 10;
          if (node.classList.contains("hero-card")) depth = 18;
          else if (node.classList.contains("project-card")) depth = 14;
          else if (node.classList.contains("timeline-item")) depth = 11;
          else if (node.classList.contains("pillar-card") || node.classList.contains("faq-item")) depth = 9;
          else if (node.classList.contains("testimonial-card") || node.classList.contains("plan-card")) depth = 8;
          node.dataset.sceneDepth = String(depth);
        }
      } else {
        node.style.setProperty("--scene-offset", "0px");
      }

      node.style.setProperty("--reveal-duration", showcaseStyle ? "920ms" : "620ms");
      if (node.dataset.revealBound) return;
      node.dataset.revealBound = "1";
      node.style.setProperty("--delay", `${Math.min(index, delayCap) * delayStep}ms`);

      if (useShowcaseObserver) showcaseObserver.observe(node);
      else if (observer) observer.observe(node);
      else node.classList.add("is-visible");
    });

    window.dispatchEvent(new CustomEvent("gfolio:scene-refresh"));
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
        root.innerHTML = `<div class="empty-state reveal">${t("No projects found. Try another query.", "Ничего не найдено. Попробуй другой запрос.")}</div>`;
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
      root.innerHTML = `<div class="empty-state reveal">${t("No case data available.", "Нет данных для отображения кейса.")}</div>`;
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
          <h2>${t("Challenge", "Задача")}</h2>
          <p>${escapeHtml(project.challenge)}</p>
        </article>
        <article class="case-card reveal">
          <h2>${t("Solution", "Решение")}</h2>
          <p>${escapeHtml(project.solution)}</p>
        </article>
        <article class="case-card reveal">
          <h2>${t("Result", "Результат")}</h2>
          <p>${escapeHtml(project.impact)}</p>
        </article>
      </section>

      <section class="stack reveal">
        <h2>${t("Stack & Artifacts", "Стек и артефакты")}</h2>
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
      toast(t("Request received. I will reply soon.", "Заявка принята. Отвечу в ближайшее время."));
    });
  };

  const setYear = () => {
    const year = String(new Date().getFullYear());
    $$("#yearNow").forEach((el) => {
      el.textContent = year;
    });
  };

  setYear();
  bindLanguageSwitch();
  bindInternalRoutes();
  bindScrollProgress();
  bindShowcaseScrollFx();
  bindShowcaseSceneDepth();
  bindShowcaseReferenceScene();
  bindShowcaseStageCycle();
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
