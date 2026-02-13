from __future__ import annotations

import logging
import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from telegram import (
    ForceReply,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputMediaAnimation,
    InputMediaVideo,
    Update,
)
from telegram.constants import ChatAction
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "bot_db.sqlite3"


def utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def open_db() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db() -> None:
    with open_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS videos (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              file_id TEXT NOT NULL,
              file_unique_id TEXT NOT NULL UNIQUE,
              media_type TEXT NOT NULL CHECK(media_type IN ('video','animation')),
              caption TEXT NOT NULL DEFAULT '',
              added_at TEXT NOT NULL,
              added_by INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS likes (
              video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL,
              liked_at TEXT NOT NULL,
              PRIMARY KEY (video_id, user_id)
            );

            CREATE TABLE IF NOT EXISTS comments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
              user_id INTEGER NOT NULL,
              text TEXT NOT NULL,
              ts TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS user_state (
              user_id INTEGER PRIMARY KEY,
              idx INTEGER NOT NULL DEFAULT 0,
              pending_comment_video_id INTEGER NULL REFERENCES videos(id) ON DELETE SET NULL
            );
            """
        )


@dataclass(frozen=True)
class Video:
    id: int
    file_id: str
    media_type: str
    caption: str


class Store:
    def add_video(
        self,
        *,
        file_id: str,
        file_unique_id: str,
        media_type: str,
        caption: str,
        added_by: int,
    ) -> bool:
        caption = (caption or "").strip()
        if len(caption) > 280:
            caption = caption[:280]
        try:
            with open_db() as conn:
                conn.execute(
                    """
                    INSERT INTO videos (file_id, file_unique_id, media_type, caption, added_at, added_by)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (file_id, file_unique_id, media_type, caption, utc_iso(), added_by),
                )
            return True
        except sqlite3.IntegrityError:
            return False

    def count_videos(self) -> int:
        with open_db() as conn:
            (n,) = conn.execute("SELECT COUNT(*) FROM videos").fetchone()
            return int(n)

    def get_by_index(self, idx: int) -> Optional[Video]:
        with open_db() as conn:
            row = conn.execute(
                """
                SELECT id, file_id, media_type, caption
                FROM videos
                ORDER BY id ASC
                LIMIT 1 OFFSET ?
                """,
                (idx,),
            ).fetchone()
            if not row:
                return None
            return Video(id=int(row["id"]), file_id=str(row["file_id"]), media_type=str(row["media_type"]), caption=str(row["caption"]))

    def get_user_idx(self, user_id: int) -> int:
        with open_db() as conn:
            row = conn.execute("SELECT idx FROM user_state WHERE user_id = ?", (user_id,)).fetchone()
            if not row:
                conn.execute("INSERT INTO user_state (user_id, idx) VALUES (?, 0)", (user_id,))
                return 0
            return int(row["idx"])

    def set_user_idx(self, user_id: int, idx: int) -> None:
        with open_db() as conn:
            conn.execute(
                """
                INSERT INTO user_state (user_id, idx) VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET idx = excluded.idx
                """,
                (user_id, idx),
            )

    def set_pending_comment(self, user_id: int, video_id: Optional[int]) -> None:
        with open_db() as conn:
            conn.execute(
                """
                INSERT INTO user_state (user_id, pending_comment_video_id) VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET pending_comment_video_id = excluded.pending_comment_video_id
                """,
                (user_id, video_id),
            )

    def get_pending_comment(self, user_id: int) -> Optional[int]:
        with open_db() as conn:
            row = conn.execute("SELECT pending_comment_video_id FROM user_state WHERE user_id = ?", (user_id,)).fetchone()
            if not row:
                return None
            return int(row["pending_comment_video_id"]) if row["pending_comment_video_id"] is not None else None

    def counts(self, video_id: int) -> tuple[int, int]:
        with open_db() as conn:
            (likes,) = conn.execute("SELECT COUNT(*) FROM likes WHERE video_id = ?", (video_id,)).fetchone()
            (comments,) = conn.execute("SELECT COUNT(*) FROM comments WHERE video_id = ?", (video_id,)).fetchone()
            return int(likes), int(comments)

    def like_once(self, *, video_id: int, user_id: int) -> bool:
        try:
            with open_db() as conn:
                conn.execute(
                    "INSERT INTO likes (video_id, user_id, liked_at) VALUES (?, ?, ?)",
                    (video_id, user_id, utc_iso()),
                )
            return True
        except sqlite3.IntegrityError:
            return False

    def add_comment(self, *, video_id: int, user_id: int, text: str) -> None:
        text = (text or "").strip()
        if not text:
            return
        if len(text) > 280:
            text = text[:280]
        with open_db() as conn:
            conn.execute(
                "INSERT INTO comments (video_id, user_id, text, ts) VALUES (?, ?, ?, ?)",
                (video_id, user_id, text, utc_iso()),
            )

    def last_comments(self, *, video_id: int, limit: int = 10) -> list[tuple[int, str, str]]:
        with open_db() as conn:
            rows = conn.execute(
                """
                SELECT user_id, text, ts
                FROM comments
                WHERE video_id = ?
                ORDER BY id DESC
                LIMIT ?
                """,
                (video_id, limit),
            ).fetchall()
            return [(int(r["user_id"]), str(r["text"]), str(r["ts"])) for r in rows]


store = Store()


def build_keyboard(*, video_id: int) -> InlineKeyboardMarkup:
    likes, comments = store.counts(video_id)
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton(f"❤️ {likes}", callback_data=f"like:{video_id}"),
                InlineKeyboardButton(f"💬 {comments}", callback_data=f"comments:{video_id}"),
            ],
            [InlineKeyboardButton("✍️ Коммент", callback_data=f"comment:{video_id}")],
            [
                InlineKeyboardButton("◀️", callback_data="nav:prev"),
                InlineKeyboardButton("🔀", callback_data="nav:rand"),
                InlineKeyboardButton("▶️", callback_data="nav:next"),
            ],
        ]
    )


def render_caption(video: Video) -> str:
    base = video.caption.strip() if video.caption.strip() else "без описания"
    return base


async def send_or_edit_feed(
    *,
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
    message_to_edit=None,
    force_idx: Optional[int] = None,
) -> None:
    user = update.effective_user
    chat = update.effective_chat
    if not user or not chat:
        return

    total = store.count_videos()
    if total == 0:
        await update.effective_message.reply_text(
            "Пока нет видео.\n\nПришли мне видео (или GIF/анимацию) — и я добавлю в ленту.",
        )
        return

    idx = force_idx if force_idx is not None else store.get_user_idx(user.id)
    idx = max(0, min(total - 1, idx))
    store.set_user_idx(user.id, idx)

    video = store.get_by_index(idx)
    if not video:
        store.set_user_idx(user.id, 0)
        video = store.get_by_index(0)
        if not video:
            await update.effective_message.reply_text("Лента сломалась (нет видео). Пришли мне видео.")
            return

    caption = render_caption(video)
    kb = build_keyboard(video_id=video.id)

    await context.bot.send_chat_action(chat_id=chat.id, action=ChatAction.UPLOAD_VIDEO)

    if message_to_edit is not None:
        try:
            if video.media_type == "animation":
                media = InputMediaAnimation(media=video.file_id, caption=caption)
            else:
                media = InputMediaVideo(media=video.file_id, caption=caption)
            await message_to_edit.edit_media(media=media, reply_markup=kb)
            return
        except Exception:
            pass

    if video.media_type == "animation":
        await context.bot.send_animation(chat_id=chat.id, animation=video.file_id, caption=caption, reply_markup=kb)
    else:
        await context.bot.send_video(chat_id=chat.id, video=video.file_id, caption=caption, reply_markup=kb)


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(
        "Это TikTuk Bot — пародия “тиктока” в телеграме.\n\n"
        "Пришли видео, и я добавлю его в общую ленту.\n"
        "Команды: /feed /next /prev /random /help"
    )
    await send_or_edit_feed(update=update, context=context)


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(
        "Команды:\n"
        "/feed — открыть ленту\n"
        "/next — следующее\n"
        "/prev — предыдущее\n"
        "/random — случайное\n\n"
        "Также можно: просто прислать видео/анимацию — это добавит в ленту."
    )


async def cmd_feed(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await send_or_edit_feed(update=update, context=context)


async def cmd_next(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user:
        return
    total = store.count_videos()
    if total == 0:
        await cmd_feed(update, context)
        return
    idx = store.get_user_idx(user.id)
    await send_or_edit_feed(update=update, context=context, force_idx=min(total - 1, idx + 1))


async def cmd_prev(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user:
        return
    idx = store.get_user_idx(user.id)
    await send_or_edit_feed(update=update, context=context, force_idx=max(0, idx - 1))


async def cmd_random(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    import random

    user = update.effective_user
    if not user:
        return
    total = store.count_videos()
    if total == 0:
        await cmd_feed(update, context)
        return
    await send_or_edit_feed(update=update, context=context, force_idx=random.randint(0, total - 1))


async def on_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    q = update.callback_query
    if not q or not q.message:
        return
    user = update.effective_user
    if not user:
        return

    data = q.data or ""
    await q.answer()

    if data.startswith("nav:"):
        direction = data.split(":", 1)[1]
        total = store.count_videos()
        if total == 0:
            await q.message.reply_text("Пока нет видео. Пришли мне видео.")
            return

        idx = store.get_user_idx(user.id)
        if direction == "next":
            idx = min(total - 1, idx + 1)
        elif direction == "prev":
            idx = max(0, idx - 1)
        elif direction == "rand":
            import random

            idx = random.randint(0, total - 1)
        store.set_user_idx(user.id, idx)
        await send_or_edit_feed(update=update, context=context, message_to_edit=q.message, force_idx=idx)
        return

    if data.startswith("like:"):
        try:
            video_id = int(data.split(":", 1)[1])
        except ValueError:
            return
        ok = store.like_once(video_id=video_id, user_id=user.id)
        likes, comments = store.counts(video_id)
        try:
            await q.message.edit_reply_markup(reply_markup=build_keyboard(video_id=video_id))
        except Exception:
            pass
        if ok:
            await q.answer("Лайк засчитан", show_alert=False)
        else:
            await q.answer("Ты уже лайкнул", show_alert=False)
        return

    if data.startswith("comment:"):
        try:
            video_id = int(data.split(":", 1)[1])
        except ValueError:
            return
        store.set_pending_comment(user.id, video_id)
        await q.message.reply_text(
            "Ок! Напиши комментарий следующим сообщением.",
            reply_markup=ForceReply(selective=True),
        )
        return

    if data.startswith("comments:"):
        try:
            video_id = int(data.split(":", 1)[1])
        except ValueError:
            return
        items = store.last_comments(video_id=video_id, limit=10)
        if not items:
            await q.message.reply_text("Комментариев пока нет. Нажми “✍️ Коммент” и будь первым.")
            return
        text = "Последние комментарии:\n\n" + "\n".join([f"- {t} ({ts})" for _, t, ts in items])
        if len(text) > 3500:
            text = text[:3500] + "…"
        await q.message.reply_text(text)
        return


async def on_video(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    msg = update.effective_message
    if not user or not msg:
        return

    media_type = None
    file_id = None
    file_unique_id = None
    caption = msg.caption or ""

    if msg.video:
        media_type = "video"
        file_id = msg.video.file_id
        file_unique_id = msg.video.file_unique_id
    elif msg.animation:
        media_type = "animation"
        file_id = msg.animation.file_id
        file_unique_id = msg.animation.file_unique_id
    else:
        return

    added = store.add_video(
        file_id=file_id,
        file_unique_id=file_unique_id,
        media_type=media_type,
        caption=caption,
        added_by=user.id,
    )

    if added:
        await msg.reply_text("Добавил в ленту. /feed")
    else:
        await msg.reply_text("Такое уже есть в ленте.")


async def on_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    msg = update.effective_message
    if not user or not msg or not msg.text:
        return

    pending = store.get_pending_comment(user.id)
    if not pending:
        return

    text = msg.text.strip()
    store.add_comment(video_id=pending, user_id=user.id, text=text)
    store.set_pending_comment(user.id, None)
    try:
        await msg.reply_text("Комментарий добавлен.")
    except Exception:
        pass


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise SystemExit("Missing TELEGRAM_BOT_TOKEN env var")

    init_db()

    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("feed", cmd_feed))
    app.add_handler(CommandHandler("next", cmd_next))
    app.add_handler(CommandHandler("prev", cmd_prev))
    app.add_handler(CommandHandler("random", cmd_random))

    app.add_handler(CallbackQueryHandler(on_callback))
    app.add_handler(MessageHandler(filters.VIDEO | filters.ANIMATION, on_video))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, on_text))

    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
