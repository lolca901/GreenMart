/* TikTok parody client (no external assets). */

const $ = (sel, root = document) => root.querySelector(sel);

const toastEl = $("#toast");
let toastTimer = null;
const toast = (text) => {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.add("is-on");
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("is-on"), 1200);
};

const feedEl = $("#feed");
const tpl = $("#clipTpl");

const applyPalette = (bgEl, palette) => {
  const [c1, c2, c3] = Array.isArray(palette) ? palette : [];
  if (!bgEl) return;
  bgEl.style.background =
    `radial-gradient(900px 540px at 18% 12%, ${c1}2e, transparent 58%),` +
    `radial-gradient(900px 540px at 86% 16%, ${c2}28, transparent 60%),` +
    `radial-gradient(760px 520px at 60% 92%, ${c3}22, transparent 60%),` +
    `linear-gradient(180deg, rgba(0,0,0,0.54), rgba(0,0,0,0.76))`;
};

const render = (items) => {
  if (!feedEl || !tpl) return;
  feedEl.innerHTML = "";
  for (const it of items) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const bg = node.querySelector(".clip__bg");
    applyPalette(bg, it.palette);

    node.querySelector(".user__name").textContent = it?.user?.name || "user";
    node.querySelector(".user__tag").textContent = it?.user?.tag || "@user";
    node.querySelector(".caption").textContent = it?.caption || "";
    node.querySelector(".music").textContent = `♪ ${it?.music || "demo"}`;

    const likeBtn = node.querySelector(".act--like");
    const likeNum = likeBtn.querySelector(".act__num");
    const comBtn = node.querySelector('[data-demo="comment"]');
    const shareBtn = node.querySelector('[data-demo="share"]');

    let likes = Number(it?.stats?.likes || 0);
    let comments = Number(it?.stats?.comments || 0);
    let shares = Number(it?.stats?.shares || 0);

    likeNum.textContent = String(likes);
    comBtn.querySelector(".act__num").textContent = String(comments);
    shareBtn.querySelector(".act__num").textContent = String(shares);

    likeBtn.addEventListener("click", async () => {
      const isOn = likeBtn.classList.toggle("is-on");
      const delta = isOn ? 1 : -1;
      likeNum.textContent = String(Math.max(0, Number(likeNum.textContent || 0) + delta));
      try {
        const res = await fetch("/api/like", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: it.id, delta }),
        });
        const data = await res.json();
        if (typeof data?.likes === "number") likeNum.textContent = String(data.likes);
      } catch {
        // offline / no server: keep optimistic UI
      }
    });

    comBtn.addEventListener("click", () => toast("Комментарии — демо"));
    shareBtn.addEventListener("click", async () => {
      toast("Ссылка скопирована (демо)");
      try {
        await navigator.clipboard.writeText(location.href);
      } catch {
        // ignore
      }
    });

    feedEl.appendChild(node);
  }
};

const init = async () => {
  try {
    const res = await fetch("/api/feed", { cache: "no-store" });
    const data = await res.json();
    render(Array.isArray(data?.items) ? data.items : []);
  } catch {
    toast("Сервер не отвечает. Запусти python3 server.py");
  }
};

init();

