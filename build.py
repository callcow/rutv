import json
import sys
from pathlib import Path

import requests

CHANNELS_URL = "https://gitverse.ru/api/repos/rutv/rutv/raw/branch/master/channels.json"
TEMPLATE_FILE = Path("template.html")
OUTPUT_FILE = Path("index.html")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; TV-Builder/1.0)",
    "Accept": "application/json, text/plain, */*",
}


def fetch_channels() -> list[dict]:
    print(f"→ Загрузка {CHANNELS_URL}")
    r = requests.get(CHANNELS_URL, headers=HEADERS, timeout=30)
    r.raise_for_status()
    data = r.json()

    if not isinstance(data, list):
        raise ValueError(f"Ожидался массив, получено: {type(data).__name__}")

    cleaned = []
    for item in data:
        title = (item.get("title") or "").strip()
        stream = (item.get("stream") or "").strip()
        if not title or not stream:
            continue
        cleaned.append({"title": title, "stream": stream})

    if not cleaned:
        raise ValueError("channels.json не содержит валидных каналов")

    return cleaned


def render_html(channels: list[dict]) -> str:
    template = TEMPLATE_FILE.read_text(encoding="utf-8")
    payload = json.dumps(channels, ensure_ascii=False, indent=2)
    if "__CHANNELS__" not in template:
        raise ValueError("В template.html не найден плейсхолдер __CHANNELS__")
    return template.replace("__CHANNELS__", payload)


def main() -> int:
    try:
        channels = fetch_channels()
    except Exception as e:
        print(f"✗ Ошибка загрузки channels.json: {e}", file=sys.stderr)
        return 1

    print(f"✓ Получено {len(channels)} каналов")

    try:
        html = render_html(channels)
    except Exception as e:
        print(f"✗ Ошибка рендера: {e}", file=sys.stderr)
        return 1

    OUTPUT_FILE.write_text(html, encoding="utf-8")
    print(f"✓ {OUTPUT_FILE} ({len(html):,} байт)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
