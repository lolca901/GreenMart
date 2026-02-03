document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const PRODUCTS = Array.isArray(window.STORE_PRODUCTS) ? window.STORE_PRODUCTS : [];

  // --- Preferences (lang + currency) ---
  const PREF_LANG = "neonpuff_lang_v1";
  const PREF_CUR = "neonpuff_cur_v1";
  const PREF_THEME = "neonpuff_theme_v1";

  const supportedLangs = new Set(["ru", "uk", "en"]);
  const supportedCurrencies = new Set(["UAH", "USD", "NOK"]);
  const supportedThemes = new Set(["light", "dark"]);

  const prefs = {
    lang: "ru",
    currency: "UAH", // main currency is UAH
    theme: "light",
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
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: prefs.currency,
      maximumFractionDigits: 0,
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

      hero_tag: "Многостраничный демо‑магазин",
      hero_title: "Товары “как в интернет‑магазине”. Дизайн “как в клипе”.",
      hero_desc: "Главная → Каталог → Карточка товара → Корзина. Всё работает на чистом HTML/CSS/JS.",
      hero_open_catalog: "Открыть каталог",
      hero_rules: "Ограничения",
      badge_1: "Пыхни с удовольствием",
      badge_2: "Найди то, что по душе",
      badge_3: "Быстрая доставка и честные вкусы",
      panel_title: "Быстрые категории",
      panel_hint: "Нажми — перейдёшь на страницу каталога.",
      quick_vapes: "Одноразовые",
      quick_vapes_meta: "хиты и новинки",
      quick_acc: "Аксессуары",
      quick_acc_meta: "заряд/чехлы",

      feature_title: "Визуал, который продаёт",
      feature_desc:
        "Карточки с “витринным” видом, быстрые метки, аккуратные спецификации, и корзина, которая не бесит.",

      legal_title: "Важно",
      legal_age_title: "Возраст",
      legal_age_text: "Контент предназначен только для лиц 21+.",
      legal_demo_title: "Демо",
      legal_demo_text: "Это учебный проект: без платежей и без доставки.",
      legal_nic_title: "Никотин",
      legal_nic_text: "Никотин вызывает зависимость.",

      footer_fine: "21+ • Никотин вызывает зависимость.",


      shop_title: "Каталог",
      shop_sub: "Поиск, фильтры, сортировка. Нажми на товар — откроется страница.",
      cat_all: "Все",
      cat_vapes: "Одноразовые",
      cat_accessories: "Аксессуары",
      field_search: "Поиск",
      ph_search: "Например: mint, 6000, кабель",
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
      no_results: "Ничего не найдено. Попробуй другой запрос.",

      spec_puffs: "затяжек",
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

      hero_tag: "Багатосторінковий демо‑магазин",
      hero_title: "Товари “як в інтернет‑магазині”. Дизайн “як у кліпі”.",
      hero_desc: "Головна → Каталог → Сторінка товару → Кошик. Усе працює на чистому HTML/CSS/JS.",
      hero_open_catalog: "Відкрити каталог",
      hero_rules: "Обмеження",
      badge_1: "Пихни із задоволенням",
      badge_2: "Знайди те, що до душі",
      badge_3: "Швидка доставка та чесні смаки",
      panel_title: "Швидкі категорії",
      panel_hint: "Натисни — перейдеш на сторінку каталогу.",
      quick_vapes: "Одноразові",
      quick_vapes_meta: "хіти та новинки",
      quick_acc: "Аксесуари",
      quick_acc_meta: "заряд/чохли",

      feature_title: "Візуал, який продає",
      feature_desc:
        "Вітринні картки, швидкі мітки, акуратні характеристики та кошик без нервів.",

      legal_title: "Важливо",
      legal_age_title: "Вік",
      legal_age_text: "Контент призначений лише для осіб 21+.",
      legal_demo_title: "Демо",
      legal_demo_text: "Це навчальний проєкт: без платежів і без доставки.",
      legal_nic_title: "Нікотин",
      legal_nic_text: "Нікотин викликає залежність.",

      footer_fine: "21+ • Нікотин викликає залежність.",


      shop_title: "Каталог",
      shop_sub: "Пошук, фільтри, сортування. Натисни на товар — відкриється сторінка.",
      cat_all: "Усі",
      cat_vapes: "Одноразові",
      cat_accessories: "Аксесуари",
      field_search: "Пошук",
      ph_search: "Наприклад: mint, 6000, кабель",
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
      no_results: "Нічого не знайдено. Спробуй інший запит.",

      spec_puffs: "затяжок",
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

      hero_tag: "Multi‑page demo store",
      hero_title: "E‑commerce flow. Music‑video energy.",
      hero_desc: "Home → Catalog → Product page → Cart. Built with plain HTML/CSS/JS.",
      hero_open_catalog: "Open catalog",
      hero_rules: "Notes",
      badge_1: "Puff with pleasure",
      badge_2: "Find what fits your vibe",
      badge_3: "Fast delivery, honest flavors",
      panel_title: "Quick categories",
      panel_hint: "Tap to jump to the catalog page.",
      quick_vapes: "Disposables",
      quick_vapes_meta: "hits & new",
      quick_acc: "Accessories",
      quick_acc_meta: "charge/cases",

      feature_title: "Visuals that sell",
      feature_desc:
        "Showcase‑style cards, quick badges, clean specs, and a cart that feels smooth.",

      legal_title: "Important",
      legal_age_title: "Age",
      legal_age_text: "Content is intended for 21+ only.",
      legal_demo_title: "Demo",
      legal_demo_text: "Educational project: no payments and no delivery.",
      legal_nic_title: "Nicotine",
      legal_nic_text: "Nicotine is addictive.",

      footer_fine: "21+ • Nicotine is addictive.",


      shop_title: "Catalog",
      shop_sub: "Search, filters, sorting. Click a product to open its page.",
      cat_all: "All",
      cat_vapes: "Disposables",
      cat_accessories: "Accessories",
      field_search: "Search",
      ph_search: "Try: mint, 6000, cable",
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
      no_results: "No results. Try another query.",

      spec_puffs: "puffs",
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

  // --- Switchers ---
  const langSelect = $("#langSelect");
  const curSelect = $("#curSelect");
  const themeSelect = $("#themeSelect");

  if (langSelect) {
    langSelect.value = prefs.lang;
    langSelect.addEventListener("change", () => {
      const v = langSelect.value;
      if (supportedLangs.has(v)) {
        prefs.lang = v;
        savePrefs();
        applyStaticI18n();
        rerenderAll();
      }
    });
  }

  if (curSelect) {
    curSelect.value = prefs.currency;
    curSelect.addEventListener("change", () => {
      const v = curSelect.value;
      if (supportedCurrencies.has(v)) {
        prefs.currency = v;
        savePrefs();
        rerenderAll();
      }
    });
  }

  const applyTheme = () => {
    document.documentElement.dataset.theme = prefs.theme;
  };

  if (themeSelect) {
    themeSelect.value = prefs.theme;
    themeSelect.addEventListener("change", () => {
      const v = themeSelect.value;
      if (supportedThemes.has(v)) {
        prefs.theme = v;
        savePrefs();
        applyTheme();
      }
    });
  }

  applyTheme();
  applyStaticI18n();

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
    for (const p of PRODUCTS) {
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
            <div class="price__now">${formatMoney(unitNow)}</div>
            ${hasSale ? `<div class="price__old">${formatMoney(unitOld)}</div>` : ""}
          </div>
          <div class="card-actions">
            <a class="small-btn" href="product.html?id=${encodeURIComponent(p.id)}">${escapeHtml(t("details_btn"))}</a>
            <button class="small-btn" type="button" data-action="add">${escapeHtml(t("buy_btn"))}</button>
          </div>
        </div>
      </article>
    `;
  };

  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

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

  // --- Home featured grid ---
  const featuredGrid = $("#featuredGrid");
  const renderFeatured = () => {
    if (!featuredGrid) return;
    const featured = PRODUCTS.filter((p) => p.category === "vapes").slice(0, 3);
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
    let list = PRODUCTS.slice();

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
    const p = findProduct(id);

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
                <div class="price__now">${formatMoney(unitNow)}</div>
                ${hasSale ? `<div class="price__old">${formatMoney(unitOld)}</div>` : ""}
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
    for (const p of PRODUCTS) {
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

  rerenderAll();
});
