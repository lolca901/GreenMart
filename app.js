document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const PROJECTS = Array.isArray(window.PORTFOLIO_PROJECTS) ? window.PORTFOLIO_PROJECTS : [];
  const PREF_THEME = "gfolio_theme_v1";
  const LOADER_MIN_MS = 650;
  const LOADER_FAILSAFE_MS = 4200;
  const LOADER_HIDE_MS = 320;

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

  const themeNow = loadTheme();
  applyTheme(themeNow);

  const themeToggle = $("#themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      saveTheme(next);
    });
  }

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
    const reduceMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    const minDelay = reduceMotion ? 0 : LOADER_MIN_MS;
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
  renderFeatured();
  renderProjectsPage();
  renderCasePage();
  bindContactForm();
  bindReveal();
});
