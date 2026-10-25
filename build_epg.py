import gzip
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
from pathlib import Path

EPG_URL = "https://www.teleguide.info/download/new3/xmltv.xml.gz"
OUTPUT_FILE = Path("epg_data.json")
DEBUG_CHANNELS_FILE = Path("epg_channels.txt")

MSK = timezone(timedelta(hours=3))

# ============================================================
# КАРТА КАНАЛОВ: "Название в channels.json" -> "id из XMLTV"
# Заполни сам, посмотрев вывод epg_channels.txt после первого запуска.
# ============================================================
CHANNEL_MAPPING = {
    "Первый канал":  "1",
    "Россия 1":      "2",
    "Матч ТВ":       "2060",
    "НТВ":           "4",
    "Пятый канал":   "255",
    "Россия К":      "5",
    "Россия 24":     "676",
    "Карусель":      "300007",
    "ОТР":           "1000",
    "ТВ Центр":      "3",
    "РЕН ТВ":        "103",
    "СПАС":          "222",
    "СТС":           "104",
    "Домашний":      "102",
    "ТВ-3":          "105",
    "Пятница":       "1671",
    "Звезда":        "330",
    "Мир":           "100010",
    "ТНТ":           "101",
    "Муз-ТВ":        "1900",
    "Суббота":       "2338",
    "Че":            "2068",
    "ЦТВ":           "2161",
    "Известия":      "2290",
    "Кино ТВ":       "1653",
    "Ю":             "108",
    "Телеканал 78":  "269",
    "КиноСезон":     "3118",
    "Солнце":        "3239",
    "СТС Love":      "1800",
    "РБК":                 "326",    
    "viju TV1000":         "288",    
    "viju TV1000 Action":  "300047",    
    "viju TV1000 Novella": "",    
    "viju TV1000 Romantica":"",   
    "viju History":        "325",    
    "viju Explore":        "324",    
    "viju Nature":         "1009",    
    "Da Vinci":            "955",    
    
}


def download_epg():
    """Скачивает и распаковывает EPG (gzip)."""
    print(f"→ Загрузка EPG: {EPG_URL}")
    req = urllib.request.Request(EPG_URL, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            data = response.read()
            if data[:2] == b'\x1f\x8b':
                data = gzip.decompress(data)
            print(f"✓ Получено {len(data):,} байт (распаковано)")
            return data
    except Exception as e:
        print(f"✗ Ошибка скачивания EPG: {e}", file=sys.stderr)
        return None


def dump_channels(xml_data):
    """Пишет список всех каналов из XMLTV в файл для ручного маппинга."""
    try:
        root = ET.fromstring(xml_data)
    except ET.ParseError as e:
        print(f"✗ Не удалось распарсить XML для дампа каналов: {e}")
        return

    lines = []
    for ch in root.findall('channel'):
        ch_id = ch.get('id', '?')
        name_el = ch.find('display-name')
        name = name_el.text.strip() if name_el is not None and name_el.text else ''
        lines.append(f'{ch_id}\t{name}')

    DEBUG_CHANNELS_FILE.write_text("\n".join(lines), encoding="utf-8")
    print(f"✓ Список каналов сохранён в {DEBUG_CHANNELS_FILE} ({len(lines)} шт.)")


def clean_title(raw: str) -> str:
    """Убирает возрастные рейтинги, лишние скобки, пробелы."""
    if not raw:
        return "Без названия"
    t = raw.strip()
    t = re.sub(r'\(\s*\d{1,2}\s*\+\s*\)', '', t)   # (12+), (6+), (16+), (18+)
    t = re.sub(r'^[>⋮\s]+', '', t)                 # служебные префиксы
    t = re.sub(r'\s+', ' ', t).strip()
    return t or "Без названия"


def parse_epg(xml_data):
    """Парсит XMLTV и возвращает {название_канала: [передачи]}."""
    if not xml_data:
        return {}

    try:
        root = ET.fromstring(xml_data)
    except ET.ParseError as e:
        print(f"✗ Ошибка парсинга XML: {e}", file=sys.stderr)
        return {}

    id_to_title = {
    epg_id: title
    for title, epg_id in CHANNEL_MAPPING.items()
    if epg_id  # отбрасываем пустые
}

    now = datetime.now(MSK)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    # от начала сегодняшних суток: сегодня + ещё 3 дня (с запасом на случай, если сборка задержится)
    horizon = today_start + timedelta(days=4)

    temp = {}

    for prog in root.findall('programme'):
        ch_id = prog.get('channel')
        our_title = id_to_title.get(ch_id)
        if not our_title:
            continue

        start_raw = prog.get('start', '')
        stop_raw = prog.get('stop', '')
        if len(start_raw) < 14 or len(stop_raw) < 14:
            continue

        try:
            start_dt = datetime.strptime(start_raw[:14], "%Y%m%d%H%M%S").replace(tzinfo=MSK)
            stop_dt = datetime.strptime(stop_raw[:14], "%Y%m%d%H%M%S").replace(tzinfo=MSK)
        except ValueError:
            continue

        if stop_dt < today_start or start_dt > horizon:
            continue

        title_el = prog.find('title')
        raw_title = title_el.text if title_el is not None else ''
        prog_title = clean_title(raw_title)

        desc_el = prog.find('desc')
        prog_desc = (desc_el.text or '').strip() if desc_el is not None else ''
        # Ограничим длину на всякий случай
        if prog_desc:
            prog_desc = re.sub(r'\s+', ' ', prog_desc)[:800]

        key = (our_title, start_dt)
        if key not in temp:
            temp[key] = {
                "start": start_dt,
                "stop": stop_dt,
                "title": prog_title,
                "desc": prog_desc,
            }

    schedule = {}
    for (channel, start_dt), info in temp.items():
        schedule.setdefault(channel, []).append({
            "start": info["start"].strftime("%H:%M"),
            "stop": info["stop"].strftime("%H:%M"),
            "title": info["title"],
            "desc": info.get("desc", ""),
            "start_iso": info["start"].isoformat(),
            "stop_iso": info["stop"].isoformat(),
        })

    for title in schedule:
        schedule[title].sort(key=lambda x: x["start_iso"])

    return schedule


def main():
    print("Начинаем сбор EPG...")
    xml_data = download_epg()
    if not xml_data:
        print("Не удалось скачать EPG. Пропускаем.")
        return

    dump_channels(xml_data)

    if not CHANNEL_MAPPING:
        print("⚠ CHANNEL_MAPPING пуст. Смотри epg_channels.txt и заполни карту.")
        OUTPUT_FILE.write_text("{}", encoding="utf-8")
        return

    schedule = parse_epg(xml_data)

    if not schedule:
        print("⚠ Не найдено совпадений по каналам. Проверь CHANNEL_MAPPING.")
        OUTPUT_FILE.write_text("{}", encoding="utf-8")
        return

    OUTPUT_FILE.write_text(
        json.dumps(schedule, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    total = sum(len(v) for v in schedule.values())
    print(f"✓ Сохранено {total} передач для {len(schedule)} каналов в {OUTPUT_FILE}")


if __name__ == "__main__":
    main()