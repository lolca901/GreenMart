document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const PRODUCTS = Array.isArray(window.STORE_PRODUCTS) ? window.STORE_PRODUCTS : [];

  // --- Preferences (lang + currency) ---
  const PREF_LANG = "neonpuff_lang_v1";
  const PREF_CUR = "neonpuff_cur_v1";
  const PREF_THEME = "neonpuff_theme_v1";
  const PREF_SECRET = "neonpuff_secret_v1";

  const supportedLangs = new Set(["ru", "uk", "en"]);
  const supportedCurrencies = new Set(["UAH", "USD", "NOK"]);
  const supportedThemes = new Set(["light", "dark"]);

  const prefs = {
    lang: "ru",
    currency: "UAH", // main currency is UAH
    theme: "dark",
  };

  const loadPrefs = () => {
    try {
      const l = localStorage.getItem(PREF_LANG);
      const c = localStorage.getItem(PREF_CUR);
      const t = localStorage.getItem(PREF_THEME);
      if (l && supportedLangs.has(l)) prefs.lang = l;
      if (c && supportedCurrencies.has(c)) prefs.currency = c;
      if (t && supportedThemes.has(t)) prefs.theme = t;
    } catch {
      // ignore
    }
  };

  const savePrefs = () => {
    try {
      localStorage.setItem(PREF_LANG, prefs.lang);
      localStorage.setItem(PREF_CUR, prefs.currency);
      localStorage.setItem(PREF_THEME, prefs.theme);
    } catch {
      // ignore
    }
  };

  loadPrefs();

  const isSecretUnlocked = () => {
    try {
      return localStorage.getItem(PREF_SECRET) === "1";
    } catch {
      return false;
    }
  };

  const unlockSecret = () => {
    try {
      localStorage.setItem(PREF_SECRET, "1");
    } catch {
      // ignore
    }
  };

  const localeForLang = (lang) => {
    if (lang === "uk") return "uk-UA";
    if (lang === "en") return "en-US";
    return "ru-RU";
  };

  // Fixed demo conversion rates from UAH.
  // If you want, tweak these numbers manually.
  const UAH_PER_USD = 40.0;
  const UAH_PER_NOK = 3.7;
  const convertFromUAH = (uah, currency) => {
    if (currency === "USD") return uah / UAH_PER_USD;
    if (currency === "NOK") return uah / UAH_PER_NOK;
    return uah;
  };

  const formatMoney = (uah) => {
    const value = convertFromUAH(Number(uah) || 0, prefs.currency);
    const locale = localeForLang(prefs.lang);
    const fractionDigits = prefs.currency === "USD" ? 2 : 0;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: prefs.currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  };

  // --- i18n ---
  const I18N = {
    ru: {
      a11y_lang: "Язык",
      a11y_currency: "Валюта",
      a11y_theme: "Тема",
      theme_light: "Светлая",
      theme_dark: "Темная",
      nav_home: "Главная",
      nav_shop: "Каталог",
      nav_cart: "Корзина",

      hero_tag: "NeonPuff",
      hero_title: "Молодёжный неон. Вкусы, которые цепляют.",
      hero_desc: "Выбирай вкус, добавляй в корзину и смотри детали — быстро, чисто и без лишних экранов.",
      hero_open_catalog: "Открыть каталог",
      hero_rules: "Смотреть вкусы",
      badge_1: "Неон + дым = вайб",
      badge_2: "Скидка уже в цене",
      badge_3: "Фильтры, поиск, корзина",
      panel_title: "Быстрые категории",
      panel_hint: "Нажми — перейдёшь на страницу каталога.",
      quick_vapes: "Одноразовые",
      quick_vapes_meta: "хиты и новинки",
      quick_acc: "Аксессуары",
      quick_acc_meta: "заряд/чехлы",

      feature_title: "Вкусы на витрине",
      feature_desc:
        "Выбирай по настроению: холодок, ягоды, кола, тропики — и секретный вкус для тех, кто знает.",

      legal_title: "Важно",
      legal_age_title: "21+ Возраст",
      legal_age_text: "Только для взрослых. Если тебе нет 21 — закрой страницу.",
      legal_demo_title: "Демо‑проект",
      legal_demo_text: "Витрина для портфолио: без оплаты, без доставки и без реальных заказов.",
      legal_nic_title: "Предупреждение",
      legal_nic_text: "Никотин вызывает зависимость. Употребление может вредить здоровью.",

      footer_fine: "21+ • Никотин вызывает зависимость.",


      shop_title: "Каталог",
      shop_sub: "Неон‑витрина вкусов: фильтры, поиск, сортировка. Открой карточку — и в корзину.",
      cat_all: "Все",
      cat_vapes: "Одноразовые",
      cat_accessories: "Аксессуары",
      field_search: "Поиск",
      ph_search: "Например: blueberry, mint, 6000",
      field_sort: "Сортировка",
      sort_default: "По умолчанию",
      sort_price_asc: "Цена: ↑",
      sort_price_desc: "Цена: ↓",

      back_to_shop: "← Назад в каталог",
      product_not_found: "Товар не найден.",
      go_to_shop: "Перейти в каталог",
      buy_btn: "В корзину",
      details_btn: "Подробнее",

      cart_title: "Корзина",
      summary_items: "Товары",
      summary_total: "Итого",
      checkout_btn: "Оформить (демо)",
      checkout_fine: "Демо‑проект: кнопка покажет уведомление и очистит корзину.",
      notice_title: "21+",
      notice_text: "Никотин вызывает зависимость. Этот сайт — учебная демонстрация.",

      toast_added: "Добавлено в корзину",
      toast_cart_empty: "Корзина пустая",
      toast_checkout: "Оформлено! (демо)",
      no_results: "Ничего не нашли. Попробуй другой вкус или число затяжек.",

      spec_puffs: "затяжек",

      easter_title: "21+ / Секретный вкус",
      easter_hint: "Введи фразу, чтобы открыть секрет.",
      easter_ph: "Фраза…",
      easter_btn: "Открыть",
      easter_ok: "Секретный вкус открыт",
      easter_bad: "Не та фраза",
    },
    uk: {
      a11y_lang: "Мова",
      a11y_currency: "Валюта",
      a11y_theme: "Тема",
      theme_light: "Світла",
      theme_dark: "Темна",
      nav_home: "Головна",
      nav_shop: "Каталог",
      nav_cart: "Кошик",

      hero_tag: "NeonPuff",
      hero_title: "Молодіжний неон. Смаки, що чіпляють.",
      hero_desc: "Обирай смак, додавай у кошик і дивись деталі — швидко, чисто й без зайвих екранів.",
      hero_open_catalog: "Відкрити каталог",
      hero_rules: "Дивитись смаки",
      badge_1: "Неон + дим = вайб",
      badge_2: "Знижка вже в ціні",
      badge_3: "Фільтри, пошук, кошик",
      panel_title: "Швидкі категорії",
      panel_hint: "Натисни — перейдеш на сторінку каталогу.",
      quick_vapes: "Одноразові",
      quick_vapes_meta: "хіти та новинки",
      quick_acc: "Аксесуари",
      quick_acc_meta: "заряд/чохли",

      feature_title: "Смаки на вітрині",
      feature_desc:
        "Обирай під настрій: холодок, ягоди, кола, тропіки — і секретний смак для тих, хто знає.",

      legal_title: "Важливо",
      legal_age_title: "21+ Вік",
      legal_age_text: "Лише для дорослих. Якщо тобі немає 21 — закрий сторінку.",
      legal_demo_title: "Демо‑проєкт",
      legal_demo_text: "Вітрина для портфоліо: без оплати, без доставки й без реальних замовлень.",
      legal_nic_title: "Попередження",
      legal_nic_text: "Нікотин викликає залежність. Вживання може шкодити здоров’ю.",

      footer_fine: "21+ • Нікотин викликає залежність.",


      shop_title: "Каталог",
      shop_sub: "Неон‑вітрина смаків: фільтри, пошук, сортування. Відкрий картку — і в кошик.",
      cat_all: "Усі",
      cat_vapes: "Одноразові",
      cat_accessories: "Аксесуари",
      field_search: "Пошук",
      ph_search: "Наприклад: blueberry, mint, 6000",
      field_sort: "Сортування",
      sort_default: "За замовчуванням",
      sort_price_asc: "Ціна: ↑",
      sort_price_desc: "Ціна: ↓",

      back_to_shop: "← Назад у каталог",
      product_not_found: "Товар не знайдено.",
      go_to_shop: "Перейти в каталог",
      buy_btn: "У кошик",
      details_btn: "Детальніше",

      cart_title: "Кошик",
      summary_items: "Товари",
      summary_total: "Разом",
      checkout_btn: "Оформити (демо)",
      checkout_fine: "Демо‑проєкт: кнопка покаже повідомлення та очистить кошик.",
      notice_title: "21+",
      notice_text: "Нікотин викликає залежність. Це навчальна демонстрація.",

      toast_added: "Додано до кошика",
      toast_cart_empty: "Кошик порожній",
      toast_checkout: "Оформлено! (демо)",
      no_results: "Нічого не знайшли. Спробуй інший смак або кількість затяжок.",

      spec_puffs: "затяжок",

      easter_title: "21+ / Секретний смак",
      easter_hint: "Введи фразу, щоб відкрити секрет.",
      easter_ph: "Фраза…",
      easter_btn: "Відкрити",
      easter_ok: "Секретний смак відкрито",
      easter_bad: "Фраза невірна",
    },
    en: {
      a11y_lang: "Language",
      a11y_currency: "Currency",
      a11y_theme: "Theme",
      theme_light: "Light",
      theme_dark: "Dark",
      nav_home: "Home",
      nav_shop: "Shop",
      nav_cart: "Cart",

      hero_tag: "NeonPuff",
      hero_title: "Youth neon. Flavors that hit the vibe.",
      hero_desc: "Pick a flavor, add to cart, open details — fast, clean, no extra steps.",
      hero_open_catalog: "Open catalog",
      hero_rules: "Browse flavors",
      badge_1: "Neon + smoke = vibe",
      badge_2: "Discount in price",
      badge_3: "Filters, search, cart",
      panel_title: "Quick categories",
      panel_hint: "Tap to jump to the catalog page.",
      quick_vapes: "Disposables",
      quick_vapes_meta: "hits & new",
      quick_acc: "Accessories",
      quick_acc_meta: "charge/cases",

      feature_title: "Flavors on display",
      feature_desc:
        "Pick by mood: ice, berries, cola, tropical — plus a secret flavor for those who know.",

      legal_title: "Important",
      legal_age_title: "21+ Age",
      legal_age_text: "Adults only. If you’re under 21, please leave this page.",
      legal_demo_title: "Demo project",
      legal_demo_text: "Portfolio storefront: no payments, no delivery, no real orders.",
      legal_nic_title: "Warning",
      legal_nic_text: "Nicotine is addictive. Use may harm your health.",

      footer_fine: "21+ • Nicotine is addictive.",


      shop_title: "Catalog",
      shop_sub: "Neon flavor storefront: filters, search, sorting. Open a card and add to cart.",
      cat_all: "All",
      cat_vapes: "Disposables",
      cat_accessories: "Accessories",
      field_search: "Search",
      ph_search: "Try: blueberry, mint, 6000",
      field_sort: "Sort",
      sort_default: "Default",
      sort_price_asc: "Price: ↑",
      sort_price_desc: "Price: ↓",

      back_to_shop: "← Back to catalog",
      product_not_found: "Product not found.",
      go_to_shop: "Go to catalog",
      buy_btn: "Add to cart",
      details_btn: "Details",

      cart_title: "Cart",
      summary_items: "Items",
      summary_total: "Total",
      checkout_btn: "Checkout (demo)",
      checkout_fine: "Demo project: the button will show a message and clear the cart.",
      notice_title: "21+",
      notice_text: "Nicotine is addictive. This website is a learning demo.",

      toast_added: "Added to cart",
      toast_cart_empty: "Cart is empty",
      toast_checkout: "Checked out! (demo)",
      no_results: "No results. Try another flavor or puff count.",

      spec_puffs: "puffs",

      easter_title: "21+ / Secret flavor",
      easter_hint: "Enter the phrase to unlock the secret.",
      easter_ph: "Phrase…",
      easter_btn: "Unlock",
      easter_ok: "Secret flavor unlocked",
      easter_bad: "Wrong phrase",
    },
  };

  const t = (key) => I18N[prefs.lang]?.[key] ?? I18N.ru[key] ?? key;

  const applyStaticI18n = () => {
    document.documentElement.lang = prefs.lang;
    $$("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (!k) return;
      el.textContent = t(k);
    });
    $$("[data-i18n-placeholder]").forEach((el) => {
      const k = el.getAttribute("data-i18n-placeholder");
      if (!k) return;
      el.setAttribute("placeholder", t(k));
    });
  };

  // --- Switchers (segmented buttons + currency select) ---
  const curSelect = $("#curSelect");

  const applyTheme = () => {
    document.documentElement.dataset.theme = prefs.theme;
  };

  applyTheme();
  applyStaticI18n();

  const applyControlActiveStates = () => {
    $$("[data-set-lang]").forEach((b) =>
      b.classList.toggle("seg__btn--active", b.getAttribute("data-set-lang") === prefs.lang),
    );
    $$("[data-set-theme]").forEach((b) =>
      b.classList.toggle("seg__btn--active", b.getAttribute("data-set-theme") === prefs.theme),
    );
  };

  if (curSelect) {
    curSelect.value = prefs.currency;
    curSelect.addEventListener("change", () => {
      const v = String(curSelect.value || "UAH");
      if (!supportedCurrencies.has(v)) return;
      prefs.currency = v;
      savePrefs();
      rerenderAll();
    });
  }

  $$("[data-set-lang]").forEach((b) => {
    b.addEventListener("click", () => {
      const v = String(b.getAttribute("data-set-lang") || "ru");
      if (!supportedLangs.has(v)) return;
      prefs.lang = v;
      savePrefs();
      applyStaticI18n();
      rerenderAll();
      applyControlActiveStates();
    });
  });

  $$("[data-set-theme]").forEach((b) => {
    b.addEventListener("click", () => {
      const v = String(b.getAttribute("data-set-theme") || "light");
      if (!supportedThemes.has(v)) return;
      prefs.theme = v;
      savePrefs();
      applyTheme();
      applyControlActiveStates();
    });
  });

  // --- Cart (localStorage) ---
  const CART_KEY = "neonpuff_cart_v1";
  const loadCart = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const saveCart = (cart) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  };

  const cart = loadCart(); // { [id]: qty }

  const cartQty = () => Object.values(cart).reduce((sum, n) => sum + (Number(n) || 0), 0);

  const sumUAH = () => {
    let sum = 0;
    for (const p of visibleProducts()) {
      const qty = Number(cart[p.id] || 0);
      if (qty > 0) sum += qty * (Number(p.price_uah) || 0);
    }
    return sum;
  };

  const setCartCount = () => {
    const el = $("#cartCount");
    if (!el) return;
    el.textContent = String(cartQty());
  };

  const addToCart = (productId, delta = 1) => {
    const prev = Number(cart[productId] || 0);
    const next = prev + delta;
    if (next <= 0) delete cart[productId];
    else cart[productId] = next;
    saveCart(cart);
    setCartCount();
  };

  setCartCount();

  // --- Product helpers ---
  const escapeHtml = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const pText = (p, field) =>
    p?.i18n?.[prefs.lang]?.[field] ??
    p?.i18n?.ru?.[field] ??
    "";

  const accentPalette = (accent) => {
    const a = String(accent || "").toLowerCase();
    if (a.includes("blue") || a.includes("berry")) return ["#4f8cff", "#7c3aed", "#0ea5e9"];
    if (a.includes("mint") || a.includes("ice")) return ["#22d3ee", "#34d399", "#38bdf8"];
    if (a.includes("trop") || a.includes("mango") || a.includes("pine")) return ["#fb7185", "#f97316", "#facc15"];
    if (a.includes("cola") || a.includes("coffee")) return ["#f59e0b", "#ef4444", "#a16207"];
    if (a.includes("grape")) return ["#a855f7", "#6366f1", "#ec4899"];
    if (a.includes("water") || a.includes("melon")) return ["#22c55e", "#fb7185", "#10b981"];
    if (a.includes("citrus") || a.includes("lemon")) return ["#facc15", "#22d3ee", "#f97316"];
    if (a.includes("secret") || a.includes("kharkiv") || a.includes("zel")) return ["#22c55e", "#00d18b", "#86efac"];
    return ["#00d18b", "#22d3ee", "#a855f7"];
  };

  const svgDataUri = (accent) => {
    const [c1, c2, c3] = accentPalette(accent);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="420" viewBox="0 0 720 420">` +
      `<defs>` +
      `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${c1}"/><stop offset="0.55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/>` +
      `</linearGradient>` +
      `<filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>` +
      `</defs>` +
      `<rect width="720" height="420" rx="44" fill="#0b0c0e"/>` +
      `<g filter="url(#b)" opacity="0.92">` +
      `<circle cx="170" cy="160" r="150" fill="${c1}"/>` +
      `<circle cx="520" cy="120" r="170" fill="${c2}"/>` +
      `<circle cx="420" cy="320" r="180" fill="${c3}"/>` +
      `</g>` +
      `<g opacity="0.22" fill="none" stroke="#ffffff" stroke-width="10">` +
      `<path d="M80 280c70-90 140-90 210 0s140 90 210 0 140-90 210 0" />` +
      `<path d="M60 230c90-80 170-80 240 0s150 80 240 0 150-80 240 0" />` +
      `</g>` +
      `<text x="36" y="386" font-family="system-ui, -apple-system, Segoe UI, Arial" font-size="76" font-weight="900" fill="rgba(255,255,255,0.18)" letter-spacing="2">PUFF</text>` +
      `</svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const puffsText = (n) => `≈${n} ${t("spec_puffs")}`;

  const specPills = (p) => {
    const parts = [];
    if (p.puffs) parts.push(puffsText(p.puffs));
    if (p.nicotine) parts.push(p.nicotine);
    const fl = pText(p, "flavor");
    if (fl) parts.push(fl);
    return parts;
  };

  const productCardHTML = (p) => {
    const specs = specPills(p);
    const specHtml = specs.length
      ? `<div class="spec-row">${specs
          .slice(0, 3)
          .map((s) => `<div class="spec">${escapeHtml(s)}</div>`)
          .join("")}</div>`
      : "";

    const unitNow = Number(p.price_uah) || 0;
    const unitOld = Number(p.old_price_uah) || 0;
    const hasSale = unitOld > unitNow;

    return `
      <article class="product-card" data-id="${escapeHtml(p.id)}">
        <a class="product-media" href="product.html?id=${encodeURIComponent(p.id)}" data-accent="${escapeHtml(p.accent || "mono")}">
          <img class="product-img" alt="" src="${svgDataUri(p.accent)}" loading="lazy" />
          <div class="product-emoji" aria-hidden="true">${escapeHtml(p.emoji || "⚡")}</div>
        </a>
        <div class="product-top">
          <div class="product-name">${escapeHtml(pText(p, "name"))}</div>
          <div class="pill">${escapeHtml(pText(p, "badge") || "—")}</div>
        </div>
        <div class="product-desc">${escapeHtml(pText(p, "desc") || "")}</div>
        ${specHtml}
        <div class="product-bottom">
          <div class="price">
            ${hasSale ? `<div class="price__old">${formatMoney(unitOld)}</div>` : ""}
            <div class="price__now">${formatMoney(unitNow)}</div>
          </div>
          <div class="card-actions">
            <a class="small-btn small-btn--subtle" href="product.html?id=${encodeURIComponent(p.id)}">${escapeHtml(t("details_btn"))}</a>
            <button class="small-btn small-btn--primary" type="button" data-action="add">${escapeHtml(t("buy_btn"))}</button>
          </div>
        </div>
      </article>
    `;
  };

  const visibleProducts = () => {
    const unlocked = isSecretUnlocked();
    return PRODUCTS.filter((p) => !(p && p.secret) || unlocked);
  };

  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
  const findVisibleProduct = (id) => visibleProducts().find((p) => p.id === id);

  // --- Toast ---
  const toast = (text) => {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("toast--in"));
    window.setTimeout(() => el.classList.remove("toast--in"), 2600);
    window.setTimeout(() => el.remove(), 3100);
  };

  // --- Easter egg: click 21+ -> enter phrase -> unlock secret flavor ---
  const ensureEasterModal = () => {
    let wrap = $("#easterModal");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "easterModal";
      wrap.className = "modal";
      wrap.innerHTML = `
        <div class="modal__backdrop" data-close="1"></div>
        <div class="modal__panel" role="dialog" aria-modal="true">
          <div class="modal__head">
            <div class="modal__title" id="easterTitle"></div>
            <button class="icon-btn" type="button" data-close="1" aria-label="Close">×</button>
          </div>
          <div class="modal__text" id="easterHint"></div>
          <div class="modal__row">
            <input id="easterInput" class="input" type="text" />
            <button id="easterBtn" class="btn" type="button"></button>
          </div>
          <div class="modal__fine" id="easterFine"></div>
        </div>
      `;
      document.body.appendChild(wrap);

      const close = () => wrap.classList.remove("modal--open");
      wrap.addEventListener("click", (e) => {
        if (e.target?.getAttribute?.("data-close")) close();
      });
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
      });

      const input = $("#easterInput", wrap);
      const btn = $("#easterBtn", wrap);
      const submit = () => {
        const raw = String(input?.value || "").trim().toLowerCase();
        const normalized = raw.replace(/[;.!?]+$/g, "").trim();
        const ok = normalized === "харьков столица мира";
        if (!ok) {
          toast(t("easter_bad"));
          return;
        }
        if (!isSecretUnlocked()) unlockSecret();
        toast(t("easter_ok"));
        close();
        rerenderAll();
      };
      if (btn) btn.addEventListener("click", submit);
      if (input) {
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") submit();
        });
      }
    }

    // Refresh copy for current language
    $("#easterTitle", wrap).textContent = t("easter_title");
    $("#easterHint", wrap).textContent = t("easter_hint");
    const input = $("#easterInput", wrap);
    if (input) input.setAttribute("placeholder", t("easter_ph"));
    $("#easterBtn", wrap).textContent = t("easter_btn");
    $("#easterFine", wrap).textContent = t("footer_fine");

    return wrap;
  };

  const bindEgg21 = () => {
    const egg = $("#egg21");
    if (!egg || egg.dataset.bound) return;
    egg.dataset.bound = "1";
    egg.addEventListener("click", () => {
      const m = ensureEasterModal();
      m.classList.add("modal--open");
      window.setTimeout(() => $("#easterInput")?.focus?.(), 60);
    });
  };

  // --- Home featured grid ---
  const featuredGrid = $("#featuredGrid");
  const renderFeatured = () => {
    if (!featuredGrid) return;
    const featured = visibleProducts().filter((p) => p.category === "vapes").slice(0, 6);
    featuredGrid.innerHTML = featured.map(productCardHTML).join("");
  };

  if (featuredGrid && !featuredGrid.dataset.bound) {
    featuredGrid.dataset.bound = "1";
    featuredGrid.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="add"]');
      if (!btn) return;
      const card = e.target.closest(".product-card");
      const id = card?.getAttribute("data-id");
      if (!id) return;
      addToCart(id, 1);
      toast(t("toast_added"));
    });
  }

  // --- Shop page ---
  const productsGrid = $("#productsGrid");
  const searchInput = $("#searchInput");
  const sortSelect = $("#sortSelect");
  const chipButtons = $$(".chip-btn");

  const shopState = {
    search: "",
    sort: "popular",
    category: "all",
  };

  const productSearchHaystack = (p) => {
    const blocks = [];
    for (const lang of ["ru", "uk", "en"]) {
      const x = p?.i18n?.[lang];
      if (!x) continue;
      blocks.push(x.name, x.desc, x.flavor, x.badge);
    }
    blocks.push(String(p.puffs || ""), String(p.nicotine || ""), p.id, p.category);
    return blocks.filter(Boolean).join(" ").toLowerCase();
  };

  const getVisibleProducts = () => {
    const q = shopState.search.trim().toLowerCase();
    let list = visibleProducts().slice();

    if (shopState.category !== "all") {
      list = list.filter((p) => p.category === shopState.category);
    }

    if (q) {
      list = list.filter((p) => productSearchHaystack(p).includes(q));
    }

    if (shopState.sort === "price_asc") list.sort((a, b) => (a.price_uah || 0) - (b.price_uah || 0));
    if (shopState.sort === "price_desc") list.sort((a, b) => (b.price_uah || 0) - (a.price_uah || 0));

    return list;
  };

  const renderShop = () => {
    if (!productsGrid) return;
    const list = getVisibleProducts();
    if (list.length === 0) {
      productsGrid.innerHTML = `<div class="cart-empty">${escapeHtml(t("no_results"))}</div>`;
      return;
    }
    productsGrid.innerHTML = list.map(productCardHTML).join("");
  };

  const setCategory = (cat) => {
    shopState.category = cat;
    chipButtons.forEach((b) =>
      b.classList.toggle("chip-btn--active", (b.getAttribute("data-cat") || "all") === cat),
    );
    renderShop();
  };

  if (productsGrid) {
    // hash shortcuts (e.g. shop.html#vapes)
    const hash = (location.hash || "").replace("#", "");
    if (hash === "vapes" || hash === "accessories") setCategory(hash);
    else renderShop();

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        shopState.search = searchInput.value;
        renderShop();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        shopState.sort = sortSelect.value;
        renderShop();
      });
    }

    chipButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-cat") || "all";
        setCategory(cat);
      });
    });

    if (!productsGrid.dataset.bound) {
      productsGrid.dataset.bound = "1";
      productsGrid.addEventListener("click", (e) => {
        const btn = e.target.closest('[data-action="add"]');
        if (!btn) return;
        const card = e.target.closest(".product-card");
        const id = card?.getAttribute("data-id");
        if (!id) return;
        addToCart(id, 1);
        toast(t("toast_added"));
      });
    }
  }

  // --- Product page ---
  const productRoot = $("#productRoot");
  const renderProduct = () => {
    if (!productRoot) return;
    const params = new URLSearchParams(location.search);
    const id = params.get("id") || "";
    const p = findVisibleProduct(id);

    if (!p) {
      productRoot.innerHTML =
        `<div class="cart-empty">${escapeHtml(t("product_not_found"))} ` +
        `<a href="shop.html">${escapeHtml(t("go_to_shop"))}</a>.</div>`;
      return;
    }

    const specs = specPills(p).map((s) => `<div class="spec">${escapeHtml(s)}</div>`).join("");
    const unitNow = Number(p.price_uah) || 0;
    const unitOld = Number(p.old_price_uah) || 0;
    const hasSale = unitOld > unitNow;

    productRoot.innerHTML = `
      <div class="product__grid">
        <div class="product__media" data-accent="${escapeHtml(p.accent || "mono")}">
          <img class="product-img" alt="" src="${svgDataUri(p.accent)}" loading="lazy" />
          <div class="product-emoji" aria-hidden="true">${escapeHtml(p.emoji || "⚡")}</div>
        </div>
        <div>
          <div class="product-top">
            <div class="product__title">${escapeHtml(pText(p, "name"))}</div>
            <div class="pill">${escapeHtml(pText(p, "badge") || "—")}</div>
          </div>
          <div class="product__subtitle">${escapeHtml(pText(p, "flavor") || "")}</div>
          <div class="product__desc">${escapeHtml(pText(p, "desc") || "")}</div>
          <div class="spec-row" style="margin-top: 12px">${specs}</div>
          <div class="product__buy">
            <div class="product__priceRow">
              <div class="price price--big">
                ${hasSale ? `<div class="price__old">${formatMoney(unitOld)}</div>` : ""}
                <div class="price__now">${formatMoney(unitNow)}</div>
              </div>
              <button id="buyBtn" class="btn" type="button">${escapeHtml(t("buy_btn"))}</button>
            </div>
            <div class="product__fine">${escapeHtml(t("footer_fine"))}</div>
          </div>
        </div>
      </div>
    `;

    const buyBtn = $("#buyBtn", productRoot);
    if (buyBtn) {
      buyBtn.addEventListener("click", () => {
        addToCart(p.id, 1);
        toast(t("toast_added"));
      });
    }
  };

  // --- Cart page ---
  const cartPageItems = $("#cartPageItems");
  const cartPageTotal = $("#cartPageTotal");
  const cartPageQty = $("#cartPageQty");
  const checkoutBtn = $("#checkoutBtn");

  const renderCartPage = () => {
    if (!cartPageItems) return;
    const items = [];
    for (const p of visibleProducts()) {
      const qty = Number(cart[p.id] || 0);
      if (qty > 0) items.push({ p, qty });
    }

    if (cartPageQty) cartPageQty.textContent = String(cartQty());
    if (cartPageTotal) cartPageTotal.textContent = formatMoney(sumUAH());

    if (items.length === 0) {
      cartPageItems.innerHTML =
        `<div class="cart-empty">${escapeHtml(t("toast_cart_empty"))}. ` +
        `<a href="shop.html">${escapeHtml(t("go_to_shop"))}</a>.</div>`;
      return;
    }

    cartPageItems.innerHTML = items
      .map(({ p, qty }) => {
        const unit = Number(p.price_uah) || 0;
        const lineUAH = unit * qty;
        return `
          <div class="cart-item" data-id="${escapeHtml(p.id)}">
            <div class="cart-item__emoji" aria-hidden="true">${escapeHtml(p.emoji || "⚡")}</div>
            <div>
              <div class="cart-item__name">${escapeHtml(pText(p, "name"))}</div>
              <div class="cart-item__meta">${escapeHtml(pText(p, "flavor") || "")} • ${formatMoney(unit)} • ${formatMoney(lineUAH)}</div>
            </div>
            <div class="qty" aria-label="Quantity">
              <button class="qty__btn" type="button" data-action="dec" aria-label="Decrease">−</button>
              <div class="qty__num" aria-label="Current quantity">${qty}</div>
              <button class="qty__btn" type="button" data-action="inc" aria-label="Increase">+</button>
            </div>
          </div>
        `;
      })
      .join("");
  };

  if (cartPageItems && !cartPageItems.dataset.bound) {
    cartPageItems.dataset.bound = "1";
    cartPageItems.addEventListener("click", (e) => {
      const wrap = e.target.closest(".cart-item");
      if (!wrap) return;
      const id = wrap.getAttribute("data-id");
      if (!id) return;
      const action = e.target.getAttribute("data-action");
      if (action === "inc") addToCart(id, 1);
      if (action === "dec") addToCart(id, -1);
      renderCartPage();
    });
  }

  if (checkoutBtn && !checkoutBtn.dataset.bound) {
    checkoutBtn.dataset.bound = "1";
    checkoutBtn.addEventListener("click", () => {
      const qty = cartQty();
      if (qty <= 0) {
        toast(t("toast_cart_empty"));
        return;
      }
      for (const k of Object.keys(cart)) delete cart[k];
      saveCart(cart);
      setCartCount();
      renderCartPage();
      toast(t("toast_checkout"));
    });
  }

  const rerenderAll = () => {
    setCartCount();
    renderFeatured();
    renderShop();
    renderProduct();
    renderCartPage();
  };

  bindEgg21();
  applyControlActiveStates();
  rerenderAll();
});
