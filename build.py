import json
import sys
import base64
from pathlib import Path
import requests

CHANNELS_URL = "https://gitverse.ru/api/repos/rutv/rutv/raw/branch/master/channels.json"
OUTPUT_FILE = Path("index.html")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; TV-Builder/1.0)",
    "Accept": "application/json, text/plain, */*",
}

def fetch_channels() -> list[dict]:
    print(f"→ Загрузка {CHANNELS_URL}")
    r = requests.get(CHANNELS_URL, headers=HEADERS, timeout=60)
    r.raise_for_status()
    data = r.json()

    if not isinstance(data, list):
        raise ValueError(f"Ожидался массив, получено: {type(data).__name__}")

    cleaned = []
    for item in data:
        title = (item.get("title") or "").strip()
        stream = (item.get("stream") or "").strip()
        quality = (item.get("quality") or "").strip()
        if not title or not stream:
            continue
        cleaned.append({"title": title, "stream": stream, "quality": quality})

    if not cleaned:
        raise ValueError("channels.json не содержит валидных каналов")

    return cleaned

def main() -> int:
    try:
        channels = fetch_channels()
        print(f"✓ Получено {len(channels)} каналов")
    except Exception as e:
        print(f"✗ Ошибка загрузки channels.json: {e}", file=sys.stderr)
        return 1

    try:
        html = Path("templates/index.html").read_text(encoding="utf-8")
        
        # 1. Превращаем список каналов в компактную JSON-строку
        channels_json = json.dumps(channels, ensure_ascii=False, separators=(',', ':'))
        
        # 2. Читаем EPG, если файл существует
        epg_json = "{}"
        epg_path = Path("epg_data.json")
        if epg_path.exists():
            print(f"✓ Найден epg_data.json ({epg_path.stat().st_size:,} байт), страница подгружает его отдельно")
        else:
            print("⚠ Файл epg_data.json не найден. Программа передач будет пустой.")
        
        # 3. Шифруем каналы в Base64
        encoded_bytes = base64.b64encode(channels_json.encode('utf-8'))
        encoded_str = encoded_bytes.decode('utf-8')
        
        # 4. Подставляем зашифрованную строку и EPG в шаблон
        html = html.replace("$CHANNELS", f'"{encoded_str}"')
        html = html.replace("$EPG_DATA", epg_json) 

        OUTPUT_FILE.write_text(html, encoding="utf-8")
        print(f"✓ {OUTPUT_FILE} ({len(html):,} байт)")
        return 0

    except Exception as e:
        print(f"✗ Ошибка рендера: {e}", file=sys.stderr)   
        return 1

if __name__ == "__main__":
    sys.exit(main())
