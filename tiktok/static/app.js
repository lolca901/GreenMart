const feedEl = document.getElementById("feed");
const emptyEl = document.getElementById("empty");
const toastEl = document.getElementById("toast");

const commentsDialog = document.getElementById("commentsDialog");
const commentsList = document.getElementById("commentsList");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");

const uploadInput = document.getElementById("uploadInput");

let feedItems = [];
let activeVideoId = null;

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => toastEl.classList.remove("show"), 1600);
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const c of children) el.append(c);
  return el;
}

function renderItem(item) {
  const video = h("video", {
    class: "video",
    src: item.url,
    playsinline: "",
    muted: "",
    loop: "",
    preload: "metadata",
  });

  const likeBtn = h("button", { class: "btn", title: "Лайк", type: "button" }, ["❤"]);
  const likeCount = h("div", { class: "count" }, [String(item.likes || 0)]);

  const commentBtn = h("button", { class: "btn", title: "Комментарии", type: "button" }, ["💬"]);
  const commentCount = h("div", { class: "count" }, [String(item.commentsCount || 0)]);

  likeBtn.addEventListener("click", async () => {
    try {
      const r = await api(`/api/videos/${encodeURIComponent(item.id)}/like`, { method: "POST", body: "{}" });
      likeCount.textContent = String(r.likes);
    } catch (e) {
      toast(`Не лайкается: ${e.message}`);
    }
  });

  commentBtn.addEventListener("click", () => openComments(item.id));

  const meta = h("div", { class: "meta" }, [
    h("div", { class: "meta__left" }, [
      h("div", { class: "author" }, [item.author]),
      h("div", { class: "caption" }, [item.caption]),
    ]),
    h("div", { class: "actions" }, [likeBtn, likeCount, commentBtn, commentCount]),
  ]);

  const root = h("section", { class: "item", "data-id": item.id }, [
    video,
    h("div", { class: "gradient" }),
    meta,
  ]);

  root._video = video;
  root._commentCountEl = commentCount;
  return root;
}

function setupAutoPlay() {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const section = e.target;
        const video = section._video;
        if (!video) continue;
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          activeVideoId = section.dataset.id;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    },
    { threshold: [0.25, 0.6, 0.9] }
  );

  for (const section of feedEl.querySelectorAll(".item")) {
    io.observe(section);
  }
}

function snapBy(delta) {
  const sections = Array.from(feedEl.querySelectorAll(".item"));
  if (!sections.length) return;

  const top = feedEl.scrollTop;
  const hgt = sections[0].getBoundingClientRect().height;
  const idx = Math.round(top / hgt);
  const next = Math.max(0, Math.min(sections.length - 1, idx + delta));
  feedEl.scrollTo({ top: next * hgt, behavior: "smooth" });
}

window.addEventListener("keydown", (e) => {
  if (commentsDialog.open) return;
  if (e.key === "ArrowDown") snapBy(1);
  if (e.key === "ArrowUp") snapBy(-1);
});

async function loadFeed() {
  const data = await api("/api/feed");
  feedItems = data.items || [];

  feedEl.replaceChildren();
  if (!feedItems.length) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  for (const item of feedItems) feedEl.append(renderItem(item));
  setupAutoPlay();
}

async function openComments(videoId) {
  activeVideoId = videoId;
  commentsList.replaceChildren();
  commentInput.value = "";
  try {
    const data = await api(`/api/videos/${encodeURIComponent(videoId)}/comments`);
    const comments = data.comments || [];
    if (!comments.length) {
      commentsList.append(h("div", { class: "comment" }, ["Первый! (или нет)"]));
    } else {
      for (const c of comments) {
        commentsList.append(
          h("div", { class: "comment" }, [
            h("div", {}, [c.text]),
            h("div", { class: "comment__ts" }, [c.ts || ""]),
          ])
        );
      }
    }
    commentsDialog.showModal();
    commentInput.focus();
  } catch (e) {
    toast(`Не открывается: ${e.message}`);
  }
}

commentForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = commentInput.value.trim();
  if (!text) return;

  try {
    await api(`/api/videos/${encodeURIComponent(activeVideoId)}/comment`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    toast("Улетело в интернет (локальный)");
    commentsDialog.close();
    await loadFeed();
  } catch (e2) {
    toast(`Не комментится: ${e2.message}`);
  }
});

uploadInput.addEventListener("change", async () => {
  const f = uploadInput.files?.[0];
  if (!f) return;
  const fd = new FormData();
  fd.append("file", f);

  try {
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    toast("Загружено");
    uploadInput.value = "";
    await loadFeed();
  } catch (e) {
    toast(`Не загрузилось: ${e.message}`);
  }
});

loadFeed().catch((e) => toast(`Не стартануло: ${e.message}`));

