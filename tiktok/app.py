from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, render_template, request
from werkzeug.utils import secure_filename


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "db.json"
VIDEOS_DIR = ROOT / "static" / "videos"

ALLOWED_VIDEO_EXTS = {".mp4", ".webm", ".ogg"}


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def _load_db() -> dict[str, Any]:
    if not DB_PATH.exists():
        return {"likes": {}, "comments": {}}
    try:
        data = json.loads(DB_PATH.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            return {"likes": {}, "comments": {}}
        data.setdefault("likes", {})
        data.setdefault("comments", {})
        return data
    except Exception:
        return {"likes": {}, "comments": {}}


@dataclass(frozen=True)
class VideoItem:
    video_id: str
    filename: str

    @property
    def url(self) -> str:
        return f"/static/videos/{self.filename}"

    @property
    def caption(self) -> str:
        stem = Path(self.filename).stem.replace("_", " ").strip()
        return stem or "без_названия.mp4"

    @property
    def author(self) -> str:
        base = Path(self.filename).stem
        normalized = "".join(ch for ch in base.lower() if ch.isalnum() or ch in {"_", "-"})
        return "@" + (normalized[:18] or "tiktuk_py")


def _scan_videos() -> list[VideoItem]:
    VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
    files = []
    for p in sorted(VIDEOS_DIR.iterdir(), key=lambda x: x.name.lower()):
        if p.is_file() and p.suffix.lower() in ALLOWED_VIDEO_EXTS:
            files.append(VideoItem(video_id=p.name, filename=p.name))
    return files


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 250 * 1024 * 1024  # 250MB

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/api/feed")
    def feed():
        db = _load_db()
        items = []
        for v in _scan_videos():
            likes = int(db.get("likes", {}).get(v.video_id, 0) or 0)
            comments = db.get("comments", {}).get(v.video_id, []) or []
            items.append(
                {
                    "id": v.video_id,
                    "url": v.url,
                    "caption": v.caption,
                    "author": v.author,
                    "likes": likes,
                    "commentsCount": len(comments),
                }
            )
        return jsonify({"items": items})

    @app.post("/api/videos/<video_id>/like")
    def like(video_id: str):
        db = _load_db()
        db.setdefault("likes", {})
        db["likes"][video_id] = int(db["likes"].get(video_id, 0) or 0) + 1
        _atomic_write_json(DB_PATH, db)
        return jsonify({"id": video_id, "likes": db["likes"][video_id]})

    @app.get("/api/videos/<video_id>/comments")
    def get_comments(video_id: str):
        db = _load_db()
        comments = db.get("comments", {}).get(video_id, []) or []
        return jsonify({"id": video_id, "comments": comments})

    @app.post("/api/videos/<video_id>/comment")
    def add_comment(video_id: str):
        body = request.get_json(silent=True) or {}
        text = (body.get("text") or "").strip()
        if not text:
            return jsonify({"error": "Комментарий пустой"}), 400

        db = _load_db()
        db.setdefault("comments", {})
        db["comments"].setdefault(video_id, [])
        db["comments"][video_id].append({"text": text[:280], "ts": _utc_iso()})
        _atomic_write_json(DB_PATH, db)
        return jsonify({"ok": True})

    @app.post("/api/upload")
    def upload():
        f = request.files.get("file")
        if not f or not f.filename:
            return jsonify({"error": "Файл не выбран"}), 400

        filename = secure_filename(f.filename)
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_VIDEO_EXTS:
            return jsonify({"error": f"Разрешены только: {', '.join(sorted(ALLOWED_VIDEO_EXTS))}"}), 400

        VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
        target = VIDEOS_DIR / filename
        if target.exists():
            target = VIDEOS_DIR / f"{Path(filename).stem}-{int(datetime.now().timestamp())}{ext}"
        f.save(target)
        return jsonify({"ok": True, "filename": target.name})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5050, debug=True)

