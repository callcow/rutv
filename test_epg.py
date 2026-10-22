import gzip
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta

EPG_URL = "https://iptvx.one/EPG_LITE"
MSK = timezone(timedelta(hours=3))

# НАПИШИТЕ ЗДЕСЬ НАЗВАНИЕ КАНАЛА, КОТОРЫЙ ХОТИТЕ ПРОВЕРИТЬ
TEST_CHANNEL = "Россия 1" 

# Словарь для проверки (из вашего build_epg.py)
CHANNEL_MAPPING = {
    "Первый канал": "1tv",
    "Россия 1": "rossia1",
    "Матч ТВ": "matchtv",
    "НТВ": "ntv",
    "Пятый канал": "5tv",
    "Россия К": "kultura",
    "Россия 24": "russia24",
    "Карусель": "karusel",
    "ОТР": "otr",
    "ТВ Центр": "tvc",
    "РЕН ТВ": "rentv",
    "СПАС": "spas",
    "СТС": "sts",
    "Домашний": "domashniy",
    "ТВ-3": "tv3",
    "Пятница": "friday",
    "Звезда": "zvezda",
    "Мир": "mir",
    "ТНТ": "tnt",
    "Муз-ТВ": "muztv",
    "Суббота": "subbota",
    "Че": "che",
    "Известия": "izvestia",
    "Кино ТВ": "kinotv",
    "КиноСезон": "kinosezon",
    "ЦТВ": "ctv",
    "СТС Love": "stslove",
    "Ю": "u",
    "Солнце": "solnce",
    "Телеканал 78": "78"
}

def download_epg():
    print(f"→ Загрузка EPG...")
    req = urllib.request.Request(EPG_URL, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            if data[:2] == b'\x1f\x8b':
                data = gzip.decompress(data)
            return data
    except Exception as e:
        print(f"✗ Ошибка: {e}")
        return None

def test_channel():
    if TEST_CHANNEL not in CHANNEL_MAPPING:
        print(f"Канал '{TEST_CHANNEL}' не найден в словаре CHANNEL_MAPPING.")
        return

    target_id = CHANNEL_MAPPING[TEST_CHANNEL]
    print(f"Ищем канал: {TEST_CHANNEL} (ID по словарю: {target_id})\n")

    xml_data = download_epg()
    if not xml_data:
        return

    try:
        xml_str = xml_data.decode('utf-8', errors='ignore')
        xml_str = re.sub(r'<!DOCTYPE[^>]+>', '', xml_str)
        root = ET.fromstring(xml_str)
    except Exception as e:
        print(f"✗ Ошибка парсинга XML: {e}")
        return

    now = datetime.now(MSK)
    found_programs = []

    # Ищем ВСЕ программы, которые относятся к этому ID
    for programme in root.findall('programme'):
        channel_id = programme.get('channel')
        
        if channel_id == target_id:
            start_str = programme.get('start', '')
            stop_str = programme.get('stop', '')
            
            try:
                start_dt = datetime.strptime(start_str[:14], "%Y%m%d%H%M%S").replace(tzinfo=MSK)
                stop_dt = datetime.strptime(stop_str[:14], "%Y%m%d%H%M%S").replace(tzinfo=MSK)
            except ValueError:
                continue

            title_elem = programme.find('title')
            prog_title = title_elem.text if title_elem is not None else "Без названия"

            found_programs.append({
                "start": start_dt.strftime("%H:%M"),
                "stop": stop_dt.strftime("%H:%M"),
                "title": prog_title
            })

    # Выводим результат
    if not found_programs:
        print(f"Программы для ID '{target_id}' не найдены.")
        print("Возможно, канал в EPG называется иначе. Попробуйте другие варианты ID.")
    else:
        print(f"Найдено {len(found_programs)} передач для ID '{target_id}':")
        for p in found_programs:
            print(f"[{p['start']} - {p['stop']}] {p['title']}")

if __name__ == "__main__":
    test_channel()