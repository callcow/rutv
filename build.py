import json
import sys
from pathlib import Path

import requests

CHANNELS_URL = "https://gitverse.ru/api/repos/rutv/rutv/raw/branch/master/channels.json"
OUTPUT_FILE = Path("index.html")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; TV-Builder/1.0)",
    "Accept": "application/json, text/plain, */*",
}

TEMPLATE = """<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ТВ Онлайн</title>
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js"></script>
<style>
  :root {
    --bg: #0a0a0c;
    --bg-elev: #131318;
    --bg-hover: #1a1a22;
    --border: #23232c;
    --text: #e8e8ed;
    --text-dim: #8a8a96;
    --accent: #4f8cff;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    height: 100%; background: var(--bg); color: var(--text);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
  }
  .app { display: grid; grid-template-columns: 1fr 340px; height: 100vh; gap: 1px; background: var(--border); }
  .player-area { display: flex; flex-direction: column; background: var(--bg); min-width: 0; }
  .topbar {
    display: flex; align-items: center; gap: 16px; padding: 16px 24px;
    background: var(--bg-elev); border-bottom: 1px solid var(--border);
  }
  .logo {
    font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
    background: linear-gradient(135deg, #4f8cff, #a855f7);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }
  .now-playing {
    display: flex; align-items: center; gap: 10px; padding: 6px 14px;
    background: var(--bg-hover); border-radius: 100px; font-size: 13px; color: var(--text-dim);
  }
  .now-playing .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; box-shadow: 0 0 8px #22c55e; animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .now-playing .name { color: var(--text); font-weight: 600; }
  .player-wrap { flex: 1; display: flex; align-items: center; justify-content: center; background: #000; position: relative; min-height: 0; overflow: hidden; }
  .player-wrap video { width: 100%; height: 100%; object-fit: contain; background: #000; }
  .player-placeholder {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 20px;
    background: radial-gradient(circle at center, #131318 0%, #0a0a0c 100%); pointer-events: none;
  }
  .player-placeholder svg { width: 80px; height: 80px; color: var(--text-dim); opacity: 0.4; }
  .player-placeholder p { color: var(--text-dim); font-size: 15px; }
  .sidebar { display: flex; flex-direction: column; background: var(--bg-elev); min-height: 0; }
  .sidebar-header { padding: 20px 20px 12px; display: flex; align-items: center; justify-content: space-between; }
  .sidebar-header h2 { font-size: 15px; font-weight: 600; }
  .channel-count { font-size: 12px; color: var(--text-dim); background: var(--bg-hover); padding: 3px 9px; border-radius: 100px; }
  .search-box { margin: 0 20px 14px; position: relative; }
  .search-box input {
    width: 100%; padding: 10px 14px 10px 38px; background: var(--bg-hover);
    border: 1px solid transparent; border-radius: 10px; color: var(--text);
    font-size: 13px; outline: none; transition: border-color 0.2s;
  }
  .search-box input:focus { border-color: var(--accent); }
  .search-box input::placeholder { color: var(--text-dim); }
  .search-box svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-dim); }
  .channel-list { flex: 1; overflow-y: auto; padding: 0 12px 20px; scrollbar-width: thin; }
  .channel-list::-webkit-scrollbar { width: 6px; }
  .channel-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  .channel-item {
    display: flex; align-items: center; gap: 12px; padding: 10px 12px;
    border-radius: 10px; cursor: pointer; transition: background 0.15s; margin-bottom: 2px;
  }
  .channel-item:hover { background: var(--bg-hover); }
  .channel-item.active {
    background: linear-gradient(90deg, rgba(79,140,255,0.15), rgba(79,140,255,0.05));
    box-shadow: inset 2px 0 0 var(--accent);
  }
  .channel-logo {
    width: 40px; height: 40px; border-radius: 8px; background: var(--bg-hover);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; color: var(--text-dim); flex-shrink: 0;
  }
  .channel-item.active .channel-logo { background: rgba(79,140,255,0.2); color: var(--accent); }
  .channel-info { flex: 1; min-width: 0; }
  .channel-name { font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .channel-meta { font-size: 11.5px; color: var(--text-dim); margin-top: 2px; }
  .live-badge { font-size: 10px; font-weight: 700; color: #22c55e; background: rgba(34,197,94,0.12); padding: 2px 6px; border-radius: 4px; letter-spacing: 0.5px; flex-shrink: 0; }
  @media (max-width: 900px) {
    .app { grid-template-columns: 1fr; grid-template-rows: 1fr 45vh; }
    .sidebar { border-top: 1px solid var(--border); }
  }
</style>
</head>
<body>
<div class="app">
  <main class="player-area">
    <div class="topbar">
      <div class="logo">ТВ Онлайн</div>
      <div class="now-playing">
        <span class="dot"></span>
        <span class="name" id="nowPlaying">Выберите канал</span>
      </div>
    </div>
    <div class="player-wrap">
      <div class="player-placeholder" id="placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none"/>
        </svg>
        <p>Выберите канал для просмотра</p>
      </div>
      <video id="video" controls playsinline muted></video>
    </div>
  </main>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>Каналы</h2>
      <span class="channel-count" id="channelCount">0</span>
    </div>
    <div class="search-box">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input type="text" id="searchInput" placeholder="Поиск канала...">
    </div>
    <div class="channel-list" id="channelList"></div>
  </aside>
</div>

<script>
  const CHANNELS = __CHANNELS__;

  const channelListEl = document.getElementById('channelList');
  const channelCountEl = document.getElementById('channelCount');
  const searchInput = document.getElementById('searchInput');
  const nowPlayingEl = document.getElementById('nowPlaying');
  const video = document.getElementById('video');
  const placeholder = document.getElementById('placeholder');

  let activeIndex = -1;
  let hls = null;

  function initials(name) {
    return name.split(/[\\s\\-_]+/).map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
  }

  function renderChannels(filter = '') {
    channelListEl.innerHTML = '';
    const q = filter.toLowerCase();
    CHANNELS.forEach((ch, i) => {
      if (q && !ch.title.toLowerCase().includes(q)) return;
      const item = document.createElement('div');
      item.className = 'channel-item' + (i === activeIndex ? ' active' : '');
      item.innerHTML = `
        <div class="channel-logo">${initials(ch.title)}</div>
        <div class="channel-info">
          <div class="channel-name">${ch.title}</div>
          <div class="channel-meta">LIVE</div>
        </div>
        <span class="live-badge">LIVE</span>
      `;
      item.addEventListener('click', () => selectChannel(i));
      channelListEl.appendChild(item);
    });
  }

  function selectChannel(i) {
    if (i < 0 || i >= CHANNELS.length) return;
    activeIndex = i;
    const ch = CHANNELS[i];
    nowPlayingEl.textContent = ch.title;
    placeholder.style.display = 'none';
    renderChannels(searchInput.value);

    if (hls) { hls.destroy(); hls = null; }
    video.pause();
    video.removeAttribute('src');
    video.load();

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = ch.stream;
      video.play().catch(() => {});
    } else if (window.Hls && Hls.isSupported()) {
      hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(ch.stream);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (e, d) => { if (d.fatal) console.error('HLS error:', d); });
    } else {
      console.error('HLS не поддерживается');
    }
  }

  searchInput.addEventListener('input', (e) => renderChannels(e.target.value));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); selectChannel(activeIndex + 1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); selectChannel(activeIndex - 1); }
  });

  channelCountEl.textContent = CHANNELS.length;
  renderChannels();
  if (CHANNELS.length) selectChannel(0);
</script>
</body>
</html>
"""


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
    payload = json.dumps(channels, ensure_ascii=False, indent=2)
    if "__CHANNELS__" not in TEMPLATE:
        raise ValueError("В шаблоне не найден плейсхолдер __CHANNELS__")
    return TEMPLATE.replace("__CHANNELS__", payload)


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
