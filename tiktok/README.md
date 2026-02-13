# TikTuk — пародия на TikTok на Python

Это маленькая локальная “тиктоk‑лента” в браузере: один ролик на экран, вертикальный скролл со snap, лайки/комменты (в JSON).

## Запуск

```bash
cd tiktok
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

Открой: `http://127.0.0.1:5050`

## Telegram-бот (лента как “тикток” в телеграме)

Это не “настоящий TikTok” (его нельзя полностью повторить), но бот делает похожую ленту:
одно видео за раз + кнопки **Next/Prev/Like/Comment**. Видео добавляются, когда ты присылаешь их боту.

### Запуск бота

1) Создай бота у @BotFather и получи токен.

2) В терминале:

```bash
cd tiktok
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-bot.txt
export TELEGRAM_BOT_TOKEN="PASTE_YOUR_TOKEN"
python3 bot.py
```

### Как пользоваться

- Напиши `/start` или `/feed` — откроется лента.
- Пришли видео/анимацию — оно добавится в общую ленту.
- Лайки/комменты сохраняются локально в `tiktok/data/bot_db.sqlite3`.

## Как добавить видео

Вариант 1: нажми “Загрузить” вверху.

Вариант 2: просто положи файлы в `tiktok/static/videos/` (поддержка: `.mp4`, `.webm`, `.ogg`).

## Где хранятся лайки и комментарии

`tiktok/data/db.json`
