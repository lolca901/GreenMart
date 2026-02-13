#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from __future__ import annotations

import json
import os
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parent
WEB = ROOT / "web"
DATA = ROOT / "data"
STATE_PATH = DATA / "state.json"


def _now_ms() -> int:
  return int(time.time() * 1000)


def _read_json(path: Path, default: Any) -> Any:
  try:
    return json.loads(path.read_text(encoding="utf-8"))
  except Exception:
    return default


def _atomic_write_text(path: Path, text: str) -> None:
  tmp = path.with_suffix(path.suffix + ".tmp")
  tmp.write_text(text, encoding="utf-8")
  os.replace(tmp, path)


def _seed_feed() -> list[dict[str, Any]]:
  # No external videos (offline) — we render "fake clips" with neon backgrounds on the client.
  return [
    {
      "id": "np-clip-001",
      "user": {"name": "neonpuff", "tag": "@neonpuff"},
      "caption": "NeonPuff. Вкусы, которые цепляют. #neon #puff #vibe",
      "music": "NEONPUFF — Demo Beat",
      "palette": ["#3cf3b0", "#55d7ff", "#d86cff"],
      "stats": {"likes": 1240, "comments": 78, "shares": 54},
    },
    {
      "id": "np-clip-002",
      "user": {"name": "mint", "tag": "@ice.mint"},
      "caption": "Ice‑настроение. Чисто, холодно, ровно. #ice #mint",
      "music": "ICE LOOP — 120bpm",
      "palette": ["#55d7ff", "#3cf3b0", "#bba6ff"],
      "stats": {"likes": 980, "comments": 41, "shares": 19},
    },
    {
      "id": "np-clip-003",
      "user": {"name": "berries", "tag": "@berry.rush"},
      "caption": "Синий вайб на ночь. #berries #blue",
      "music": "BERRY WAVE — slowed",
      "palette": ["#4f8cff", "#7c3aed", "#55d7ff"],
      "stats": {"likes": 1455, "comments": 120, "shares": 88},
    },
    {
      "id": "np-clip-004",
      "user": {"name": "tropical", "tag": "@trop.mix"},
      "caption": "Тропики без приторности. #tropical #mango",
      "music": "MANGO SNAP — remix",
      "palette": ["#fb7185", "#f97316", "#facc15"],
      "stats": {"likes": 1112, "comments": 67, "shares": 42},
    },
    {
      "id": "np-clip-005",
      "user": {"name": "cola", "tag": "@cola.ice"},
      "caption": "Классика, которая не стареет. #cola #ice",
      "music": "COLA CLICK — demo",
      "palette": ["#f59e0b", "#ef4444", "#a16207"],
      "stats": {"likes": 802, "comments": 33, "shares": 17},
    },
  ]


def _load_state() -> dict[str, Any]:
  DATA.mkdir(parents=True, exist_ok=True)
  state = _read_json(STATE_PATH, {})
  if not isinstance(state, dict):
    state = {}
  state.setdefault("likes", {})  # id -> likes (int)
  state.setdefault("updated_ms", _now_ms())
  return state


def _save_state(state: dict[str, Any]) -> None:
  state["updated_ms"] = _now_ms()
  _atomic_write_text(STATE_PATH, json.dumps(state, ensure_ascii=False, indent=2))


FEED = _seed_feed()
STATE = _load_state()


def _content_type(path: str) -> str:
  p = path.lower()
  if p.endswith(".html"):
    return "text/html; charset=utf-8"
  if p.endswith(".css"):
    return "text/css; charset=utf-8"
  if p.endswith(".js"):
    return "application/javascript; charset=utf-8"
  if p.endswith(".svg"):
    return "image/svg+xml"
  if p.endswith(".png"):
    return "image/png"
  if p.endswith(".jpg") or p.endswith(".jpeg"):
    return "image/jpeg"
  if p.endswith(".mp3"):
    return "audio/mpeg"
  return "application/octet-stream"


class Handler(BaseHTTPRequestHandler):
  server_version = "TikTokParodyPy/1.0"

  def log_message(self, fmt: str, *args: Any) -> None:
    # Keep logs readable.
    super().log_message("%s - %s" % (self.address_string(), fmt), *args)

  def _send_json(self, data: Any, status: int = 200) -> None:
    raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
    self.send_response(status)
    self.send_header("Content-Type", "application/json; charset=utf-8")
    self.send_header("Content-Length", str(len(raw)))
    self.send_header("Cache-Control", "no-store")
    self.end_headers()
    self.wfile.write(raw)

  def _send_bytes(self, b: bytes, ctype: str, status: int = 200, cache: str = "no-store") -> None:
    self.send_response(status)
    self.send_header("Content-Type", ctype)
    self.send_header("Content-Length", str(len(b)))
    self.send_header("Cache-Control", cache)
    self.end_headers()
    self.wfile.write(b)

  def _serve_file(self, path: Path) -> None:
    if not path.exists() or not path.is_file():
      self.send_error(HTTPStatus.NOT_FOUND, "Not found")
      return
    data = path.read_bytes()
    # Static assets can be cached a bit, but we keep it small to reduce surprises while editing.
    cache = "public, max-age=60"
    self._send_bytes(data, _content_type(path.name), 200, cache=cache)

  def do_GET(self) -> None:
    parsed = urlparse(self.path)
    path = parsed.path

    if path == "/" or path == "/index.html":
      self._serve_file(WEB / "index.html")
      return

    if path.startswith("/api/"):
      if path == "/api/feed":
        # Merge persistent likes into the feed.
        likes_overrides = STATE.get("likes", {})
        out = []
        for item in FEED:
          it = dict(item)
          st = dict(it.get("stats", {}))
          lid = it.get("id", "")
          if isinstance(likes_overrides, dict) and lid in likes_overrides:
            try:
              st["likes"] = int(likes_overrides[lid])
            except Exception:
              pass
          it["stats"] = st
          out.append(it)
        self._send_json({"items": out, "server_time_ms": _now_ms()})
        return

      if path == "/api/state":
        self._send_json({"updated_ms": STATE.get("updated_ms", _now_ms())})
        return

      self._send_json({"error": "Unknown endpoint"}, status=404)
      return

    # Static files from WEB directory
    rel = path.lstrip("/")
    # Disallow escaping the directory
    file_path = (WEB / rel).resolve()
    if not str(file_path).startswith(str(WEB.resolve())):
      self.send_error(HTTPStatus.FORBIDDEN, "Forbidden")
      return
    if file_path.is_dir():
      file_path = file_path / "index.html"
    self._serve_file(file_path)

  def do_POST(self) -> None:
    parsed = urlparse(self.path)
    path = parsed.path

    if path == "/api/like":
      try:
        length = int(self.headers.get("Content-Length") or "0")
      except Exception:
        length = 0
      body = self.rfile.read(length) if length > 0 else b"{}"
      try:
        payload = json.loads(body.decode("utf-8"))
      except Exception:
        payload = {}

      clip_id = str(payload.get("id") or "")
      delta = payload.get("delta", 1)
      try:
        delta_i = int(delta)
      except Exception:
        delta_i = 1

      ids = {x.get("id") for x in FEED}
      if clip_id not in ids:
        self._send_json({"error": "Unknown id"}, status=404)
        return

      likes = STATE.setdefault("likes", {})
      try:
        cur = int(likes.get(clip_id, 0))
      except Exception:
        cur = 0
      nxt = max(0, cur + delta_i)
      likes[clip_id] = nxt
      _save_state(STATE)
      self._send_json({"id": clip_id, "likes": nxt})
      return

    self._send_json({"error": "Unknown endpoint"}, status=404)


def main() -> None:
  host = "127.0.0.1"
  port = 8008
  httpd = ThreadingHTTPServer((host, port), Handler)
  print(f"TikTok parody running: http://{host}:{port}")
  print(f"Serving web from: {WEB}")
  httpd.serve_forever()


if __name__ == "__main__":
  main()

