document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const PRODUCTS = Array.isArray(window.STORE_PRODUCTS) ? window.STORE_PRODUCTS : [];

  const formatRUB = (value) => `${Math.round(value).toLocaleString("ru-RU")} ₽`;

  const toast = (text) => {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("toast--in"));
    window.setTimeout(() => el.classList.remove("toast--in"), 2600);
    window.setTimeout(() => el.remove(), 3100);
  };

  // --- Age gate (21+) ---
  const ageGate = $("#ageGate");
  const ageYes = $("#ageYes");
  const ageNo = $("#ageNo");

  const AGE_KEY = "neonpuff_age_ok_v1";
  const isAgeOk = () => {
    try {
      return localStorage.getItem(AGE_KEY) === "1";
    } catch {
      return false;
    }
  };

  const setAgeOk = () => {
    try {
      localStorage.setItem(AGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  const showAgeGate = () => {
    if (!ageGate) return;
    ageGate.hidden = false;
    const firstBtn = ageYes || ageNo;
    if (firstBtn) firstBtn.focus();
    document.body.style.overflow = "hidden";
  };

  const hideAgeGate = () => {
    if (!ageGate) return;
    ageGate.hidden = true;
    document.body.style.overflow = "";
  };

  if (ageGate) {
    if (!isAgeOk()) showAgeGate();
    if (ageYes) {
      ageYes.addEventListener("click", () => {
        setAgeOk();
        hideAgeGate();
        toast("Добро пожаловать. 21+ подтверждено.");
      });
    }
    if (ageNo) {
      ageNo.addEventListener("click", () => {
        // We don't redirect anywhere; we simply block access.
        toast("Доступ запрещён.");
        ageGate.innerHTML =
          '<div class="age-gate__card" role="dialog" aria-modal="true" aria-label="Доступ запрещён">' +
          '<div class="age-gate__kicker">21+</div>' +
          '<div class="age-gate__title">Доступ запрещён</div>' +
          '<div class="age-gate__text">Этот контент предназначен только для лиц 21+. Закрой страницу.</div>' +
          "</div>";
      });
    }
  }

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

  const cartQty = () =>
    Object.values(cart).reduce((sum, n) => sum + (Number(n) || 0), 0);

  const cartSum = () => {
    let sum = 0;
    for (const p of PRODUCTS) {
      const qty = Number(cart[p.id] || 0);
      if (qty > 0) sum += qty * p.price;
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

  // --- Helpers for rendering ---
  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

  const specPills = (p) => {
    const parts = [];
    if (p.puffs) parts.push(`≈${p.puffs} puff`);
    if (p.nicotine) parts.push(p.nicotine);
    if (p.flavor) parts.push(p.flavor);
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

    return `
      <article class="product-card" data-id="${escapeHtml(p.id)}">
        <a class="product-media" href="product.html?id=${encodeURIComponent(p.id)}" data-accent="${escapeHtml(p.accent || "mono")}">
          <div class="product-emoji" aria-hidden="true">${escapeHtml(p.emoji || "⚡")}</div>
        </a>
        <div class="product-top">
          <div class="product-name">${escapeHtml(p.name)}</div>
          <div class="pill">${escapeHtml(p.badge || "Товар")}</div>
        </div>
        <div class="product-desc">${escapeHtml(p.desc || "")}</div>
        ${specHtml}
        <div class="product-bottom">
          <div class="price">${formatRUB(p.price)}</div>
          <div class="card-actions">
            <a class="small-btn" href="product.html?id=${encodeURIComponent(p.id)}">Подробнее</a>
            <button class="small-btn" type="button" data-action="add">В корзину</button>
          </div>
        </div>
      </article>
    `;
  };

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- Home featured grid ---
  const featuredGrid = $("#featuredGrid");
  if (featuredGrid) {
    const featured = PRODUCTS.filter((p) => p.category === "vapes").slice(0, 3);
    featuredGrid.innerHTML = featured.map(productCardHTML).join("");
    featuredGrid.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="add"]');
      if (!btn) return;
      const card = e.target.closest(".product-card");
      const id = card?.getAttribute("data-id");
      if (!id) return;
      addToCart(id, 1);
      toast("Добавлено в корзину");
    });
  }

  // --- Shop page (catalog) ---
  const productsGrid = $("#productsGrid");
  const searchInput = $("#searchInput");
  const sortSelect = $("#sortSelect");
  const chipButtons = $$(".chip-btn");

  const shopState = {
    search: "",
    sort: "popular",
    category: "all",
  };

  const getVisibleProducts = () => {
    const q = shopState.search.trim().toLowerCase();
    let list = PRODUCTS.slice();

    if (shopState.category !== "all") {
      list = list.filter((p) => p.category === shopState.category);
    }

    if (q) {
      list = list.filter((p) => {
        const hay = `${p.name} ${p.desc} ${p.flavor || ""} ${p.badge || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (shopState.sort === "price_asc") list.sort((a, b) => a.price - b.price);
    if (shopState.sort === "price_desc") list.sort((a, b) => b.price - a.price);

    return list;
  };

  const renderProducts = () => {
    if (!productsGrid) return;
    const list = getVisibleProducts();
    if (list.length === 0) {
      productsGrid.innerHTML =
        '<div class="cart-empty">Ничего не найдено. Попробуй другой запрос.</div>';
      return;
    }
    productsGrid.innerHTML = list.map(productCardHTML).join("");
  };

  const setCategory = (cat) => {
    shopState.category = cat;
    chipButtons.forEach((b) =>
      b.classList.toggle("chip-btn--active", (b.getAttribute("data-cat") || "all") === cat),
    );
    renderProducts();
  };

  if (productsGrid) {
    // hash shortcuts (e.g. shop.html#vapes)
    const hash = (location.hash || "").replace("#", "");
    if (hash === "vapes" || hash === "accessories") {
      setCategory(hash);
    } else {
      renderProducts();
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        shopState.search = searchInput.value;
        renderProducts();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        shopState.sort = sortSelect.value;
        renderProducts();
      });
    }

    chipButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.getAttribute("data-cat") || "all";
        setCategory(cat);
      });
    });

    productsGrid.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="add"]');
      if (!btn) return;
      const card = e.target.closest(".product-card");
      const id = card?.getAttribute("data-id");
      if (!id) return;
      addToCart(id, 1);
      toast("Добавлено в корзину");
    });
  }

  // --- Product page ---
  const productRoot = $("#productRoot");
  if (productRoot) {
    const params = new URLSearchParams(location.search);
    const id = params.get("id") || "";
    const p = findProduct(id);

    if (!p) {
      productRoot.innerHTML =
        '<div class="cart-empty">Товар не найден. Вернись в <a href="shop.html">каталог</a>.</div>';
    } else {
      const specs = specPills(p)
        .map((s) => `<div class="spec">${escapeHtml(s)}</div>`)
        .join("");

      productRoot.innerHTML = `
        <div class="product__grid">
          <div class="product__media" data-accent="${escapeHtml(p.accent || "mono")}">
            <div class="product-emoji" aria-hidden="true">${escapeHtml(p.emoji || "⚡")}</div>
          </div>
          <div>
            <div class="product-top">
              <div class="product__title">${escapeHtml(p.name)}</div>
              <div class="pill">${escapeHtml(p.badge || "Товар")}</div>
            </div>
            <div class="product__subtitle">${escapeHtml(p.flavor || "Аксессуар")}</div>
            <div class="product__desc">${escapeHtml(p.desc || "")}</div>
            <div class="spec-row" style="margin-top: 12px">${specs}</div>
            <div class="product__buy">
              <div class="product__priceRow">
                <div class="price" style="font-size: 1.4rem">${formatRUB(p.price)}</div>
                <button id="buyBtn" class="btn" type="button">В корзину</button>
              </div>
              <div class="product__fine">
                21+ • Никотин вызывает зависимость. Демо‑проект: без платежей.
              </div>
            </div>
          </div>
        </div>
      `;

      const buyBtn = $("#buyBtn", productRoot);
      if (buyBtn) {
        buyBtn.addEventListener("click", () => {
          addToCart(p.id, 1);
          toast("Добавлено в корзину");
        });
      }
    }
  }

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
    if (cartPageTotal) cartPageTotal.textContent = formatRUB(cartSum());

    if (items.length === 0) {
      cartPageItems.innerHTML =
        '<div class="cart-empty">Корзина пустая. Открой <a href="shop.html">каталог</a> и добавь товар.</div>';
      return;
    }

    cartPageItems.innerHTML = items
      .map(({ p, qty }) => {
        const line = p.price * qty;
        return `
          <div class="cart-item" data-id="${escapeHtml(p.id)}">
            <div class="cart-item__emoji" aria-hidden="true">${escapeHtml(p.emoji || "⚡")}</div>
            <div>
              <div class="cart-item__name">${escapeHtml(p.name)}</div>
              <div class="cart-item__meta">${escapeHtml(p.flavor || "")} • ${formatRUB(p.price)} • ${formatRUB(line)}</div>
            </div>
            <div class="qty" aria-label="Количество">
              <button class="qty__btn" type="button" data-action="dec" aria-label="Уменьшить">−</button>
              <div class="qty__num" aria-label="Текущее количество">${qty}</div>
              <button class="qty__btn" type="button" data-action="inc" aria-label="Увеличить">+</button>
            </div>
          </div>
        `;
      })
      .join("");
  };

  if (cartPageItems) {
    renderCartPage();

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

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const qty = cartQty();
      if (qty <= 0) {
        toast("Корзина пустая");
        return;
      }
      for (const k of Object.keys(cart)) delete cart[k];
      saveCart(cart);
      setCartCount();
      renderCartPage();
      toast("Оформлено! (демо)");
    });
  }
});
