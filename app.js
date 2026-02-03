// Всегда ждём загрузки DOM, чтобы элементы точно существовали
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM готов — запускаем скрипты");

  // --- Мем‑режим (тряска страницы) ---
  let memeTimer = null;
  const triggerMemeMode = (durationMs = 700) => {
    const root = document.documentElement;
    root.classList.add("meme-mode");
    if (memeTimer) window.clearTimeout(memeTimer);
    memeTimer = window.setTimeout(() => root.classList.remove("meme-mode"), durationMs);
  };

  // --- Мышка на кронштейне (следит за курсором) ---
  const mouseRig = document.getElementById("mouseRig");
  if (mouseRig) {
    let lastX = 0;
    let lastY = 0;
    let raf = 0;

    const updateRig = () => {
      raf = 0;
      const rect = mouseRig.getBoundingClientRect();
      const px = rect.left;
      const py = rect.top;
      const dx = lastX - px;
      const dy = lastY - py;
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const len = Math.min(280, Math.max(90, dist));

      mouseRig.style.setProperty("--arm-ang", `${ang}deg`);
      mouseRig.style.setProperty("--arm-len", `${len}px`);
    };

    window.addEventListener("mousemove", (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
      if (!raf) raf = window.requestAnimationFrame(updateRig);
    });
  }

  // --- Пасхалка "ГАНВЕСТ" (по клику "О нас") ---
  const ganvest = document.getElementById("ganvest");
  const ganvestClose = document.getElementById("ganvestClose");
  const ganvestImg = document.getElementById("ganvestImg");
  const ganvestSound = document.getElementById("ganvestSound");
  let ganvestTimer = null;

  const speak = (text) => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ru-RU";
      u.rate = 1;
      u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    } catch {
      // ignore: some browsers block speech
    }
  };

  const hideGanvest = () => {
    if (!ganvest || ganvest.hidden) return;
    if (ganvestTimer) window.clearTimeout(ganvestTimer);
    ganvestTimer = null;
    ganvest.classList.add("ganvest--closing");
    if (ganvestSound) {
      try {
        ganvestSound.pause();
        ganvestSound.currentTime = 0;
      } catch {
        // ignore
      }
    }
    window.setTimeout(() => {
      ganvest.hidden = true;
      ganvest.classList.remove("ganvest--closing");
    }, 230);
  };

  const showGanvest = () => {
    if (!ganvest) return;
    ganvest.hidden = false;
    ganvest.classList.remove("ganvest--closing");

    // Аудио (если есть assets/ganvest.mp3). Фоллбек — синтез речи.
    if (ganvestSound) {
      try {
        ganvestSound.currentTime = 0;
        const p = ganvestSound.play();
        if (p && typeof p.catch === "function") p.catch(() => speak("ПЕПЕ ШНЕЙНЕ"));
      } catch {
        speak("ПЕПЕ ШНЕЙНЕ");
      }
    } else {
      speak("ПЕПЕ ШНЕЙНЕ");
    }

    if (ganvestTimer) window.clearTimeout(ganvestTimer);
    ganvestTimer = window.setTimeout(hideGanvest, 7000);
  };

  if (ganvestClose) ganvestClose.addEventListener("click", hideGanvest);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideGanvest();
  });

  if (ganvestImg) {
    ganvestImg.addEventListener("error", () => {
      if (ganvest) ganvest.classList.add("ganvest--noimg");
    });
  }

  // --- Smooth scroll для кнопки "Начать" ---
  const startBtn = document.getElementById("startBtn");
  const cardsSection = document.getElementById("cards");

  if (startBtn && cardsSection) {
    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      cardsSection.scrollIntoView({ behavior: "smooth" });
      triggerMemeMode(850);
      console.log("Кнопка 'Начать' — скроллим к карточкам");
    });
  } else {
    console.warn("startBtn или cardsSection не найдены в DOM");
  }

  // --- Кнопка "Написать" ---
  const contactBtn = document.getElementById("contactBtn");
  const contactSection = document.getElementById("contact");

  if (contactBtn && contactSection) {
    contactBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Простая демонстрация: плавный скролл и временное модальное сообщение
      contactSection.scrollIntoView({ behavior: "smooth" });

      // Создадим временное уведомление (вместо alert)
      const toast = document.createElement("div");
      toast.textContent = "Форма появится здесь совсем скоро ✉️";
      toast.style.opacity = "1";
      toast.style.transition = "opacity 350ms ease";
      toast.style.position = "fixed";
      toast.style.right = "20px";
      toast.style.bottom = "20px";
      toast.style.padding = "12px 16px";
      toast.style.background = "rgba(0,0,0,0.9)";
      toast.style.color = "white";
      toast.style.borderRadius = "8px";
      toast.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)";
      toast.style.zIndex = 9999;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = "0";
      }, 1800);
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 2200);

      console.log("Кнопка 'Написать' — показал уведомление");
    });
  } else {
    console.warn("contactBtn или contactSection не найдены в DOM");
  }

  // --- Плавный переход по ссылкам меню (если нужно) ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      // если ссылка ведёт к якорю на этой же странице — плавно скроллим
      const targetId = this.getAttribute("href").slice(1);
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth" });
        if (targetId === "cards") {
          // Важно: звук и показ должны быть в рамках клика, иначе браузер может заблокировать autoplay.
          showGanvest();
        }
      }
    });
  });

  console.log("Скрипт и слушатели установлены ✅");
});
