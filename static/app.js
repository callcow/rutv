// Функция для расшифровки Base64
function decodeBase64Json(encodedStr) {
  try {
    const binaryStr = atob(encodedStr);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const jsonString = new TextDecoder().decode(bytes);
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Ошибка расшифровки каналов", e);
    return [];
  }
}

const CHANNELS = typeof ENCODED_CHANNELS !== 'undefined' ? decodeBase64Json(ENCODED_CHANNELS) : [];

const LOGO_FILES = {
  "Первый канал": "1tv.png", "Россия 1": "russia1.png", "Матч ТВ": "matchtv.png",
  "НТВ": "ntv.png", "Пятый канал": "5tv.png", "Россия К": "russiak.png",
  "Россия 24": "russia24.png", "Карусель": "karusel.png", "ОТР": "otr.png",
  "ТВ Центр": "tvc.png", "РЕН ТВ": "rentv.png", "СПАС": "spas.png",
  "СТС": "sts.png", "Домашний": "domashniy.png", "ТВ-3": "tv3.png",
  "Пятница": "friday.png", "Звезда": "zvezda.png", "Мир": "mir.png",
  "ТНТ": "tnt.png", "Муз-ТВ": "muztv.png", "Суббота": "subbota.png",
  "Че": "che.png", "ЦТВ": "ctv.png", "Известия": "iz.png",
  "Кино ТВ": "kinotv.png", "Ю": "u.png", "Телеканал 78": "78.png",
  "КиноСезон": "kinosezon.png", "Солнце": "solnce.png", "СТС Love": "stslove.png"
};

const CHANNEL_CATEGORIES = {
  "Первый канал": "federal", "Россия 1": "federal", "Матч ТВ": "federal",
  "НТВ": "federal", "Пятый канал": "federal", "Россия К": "federal",
  "Россия 24": "federal", "Карусель": "federal", "ОТР": "federal",
  "ТВ Центр": "federal",
  "РЕН ТВ": "federal", "СПАС": "federal", "СТС": "federal",
  "Домашний": "federal", "ТВ-3": "federal", "Пятница": "federal",
  "Звезда": "federal", "Мир": "federal", "ТНТ": "federal",
  "Муз-ТВ": "federal"
};

function getChannelCategory(title) {
  const key = Object.keys(CHANNEL_CATEGORIES).find(k => k.toLowerCase() === title.trim().toLowerCase());
  return key ? CHANNEL_CATEGORIES[key] : "all";
}

function getLogoFile(title) {
  const titleLower = title.trim().toLowerCase();
  const key = Object.keys(LOGO_FILES).find(k => k.toLowerCase() === titleLower);
  return key ? LOGO_FILES[key] : null;
}

// ============================================================
// LOCALSTORAGE: последний канал, избранное, качество
// ============================================================
const LS_LAST_CHANNEL = 'tv_last_channel';
const LS_FAVORITES = 'tv_favorites';
const LS_LAST_VOLUME = 'tv_volume';

function loadLastChannel() {
  const v = parseInt(localStorage.getItem(LS_LAST_CHANNEL), 10);
  return isNaN(v) ? -1 : v;
}
function saveLastChannel(i) {
  try { localStorage.setItem(LS_LAST_CHANNEL, String(i)); } catch(e) {}
}
function loadFavorites() {
  try {
    const raw = localStorage.getItem(LS_FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}
function saveFavorites(arr) {
  try { localStorage.setItem(LS_FAVORITES, JSON.stringify(arr)); } catch(e) {}
}
let favorites = new Set(loadFavorites());

function isFavorite(title) { return favorites.has(title); }
function toggleFavorite(title) {
  if (favorites.has(title)) favorites.delete(title);
  else favorites.add(title);
  saveFavorites([...favorites]);
}

// ============================================================
// DOM
// ============================================================
const channelListEl = document.getElementById('channelList');
const infoTitle = document.getElementById('infoTitle');
const infoLogo = document.getElementById('infoLogo');
const epgListEl = document.getElementById('epgList');
const placeholder = document.getElementById('placeholder');
const videoContainer = document.getElementById('video-container');
const scrollRightBtn = document.getElementById('scrollRightBtn');
const scrollLeftBtn = document.getElementById('scrollLeftBtn');
const nowPlayingBanner = document.getElementById('nowPlayingBanner');
const nowPlayingText = document.getElementById('nowPlayingText');
const epgDateHeader = document.getElementById('epgDateHeader');
const toastContainer = document.getElementById('toastContainer');

const HEART_SVG = `<svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
const HEART_OUTLINE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;

function showToast(message, isFavoriteAdd) {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${isFavoriteAdd ? 'toast-success' : 'toast-remove'}`;
  
  toast.innerHTML = `
    <span class="toast-icon">${isFavoriteAdd ? HEART_SVG : HEART_OUTLINE_SVG}</span>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    toast.addEventListener('animationend', () => {
      toast.remove();
    }, { once: true });
  }, 3000);
}
const RU_MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const RU_DAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

let activeIndex = -1;
let currentFilter = 'all';
let currentSearch = '';
let player = null;
let playerNowEl = null;
let currentProgTitle = '';
let currentEpgDay = 0;

// ============================================================
// EPG: панель вкладок по дням
// ============================================================
document.querySelectorAll('.epg-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.epg-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentEpgDay = parseInt(tab.getAttribute('data-day'), 10) || 0;
    if (activeIndex >= 0 && CHANNELS[activeIndex]) {
      renderEPG(CHANNELS[activeIndex].title);
    }
  });
});

function updateEpgDate() {
  if (!epgDateHeader) return;
  const d = new Date();
  d.setDate(d.getDate() + currentEpgDay);
  const dayName = RU_DAYS[d.getDay()];
  const month = RU_MONTHS[d.getMonth()];
  epgDateHeader.textContent = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${d.getDate()} ${month}`;
}

// ============================================================
// Плеер-оверлей
// ============================================================
function syncPlayerOverlay() {
  if (!playerNowEl) return;
  const textEl = playerNowEl.querySelector('.cv-now-text');
  if (currentProgTitle) {
    textEl.textContent = currentProgTitle;
    playerNowEl.style.display = 'flex';
  } else {
    playerNowEl.style.display = 'none';
  }
}

const EPG_ITEMS_LIMIT = 11;

function initials(name) {
  return name.split(/[\s\-_]+/).map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
}

function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
  });
  renderChannels();
}

function renderChannels() {
  channelListEl.innerHTML = '';
  const q = currentSearch.trim().toLowerCase();

  CHANNELS.forEach((ch, i) => {
    const category = getChannelCategory(ch.title);

    if (currentFilter === 'favorites') {
      if (!isFavorite(ch.title)) return;
    } else if (currentFilter !== 'all' && category !== currentFilter) {
      return;
    }

    if (q && !ch.title.toLowerCase().includes(q)) return;

    const item = document.createElement('div');
    item.className = 'channel-item' + (i === activeIndex ? ' active' : '');
    item.setAttribute('data-index', i);

    const hdBadge = ch.quality === 'HD' ? '<span class="quality-badge hd">HD</span>' : '';
    const logoFile = getLogoFile(ch.title);
    const logoHtml = logoFile ? `<img src="static/logos/${logoFile}" alt="${ch.title}" loading="lazy">` : initials(ch.title);
    const favActive = isFavorite(ch.title);
    const heartClass = favActive ? 'fav-star active' : 'fav-star';

    item.innerHTML = `
      <div class="channel-card-inner">
        ${hdBadge}
        <div class="channel-logo">${logoHtml}</div>
        <button class="${heartClass}" data-fav="${ch.title}" title="В избранное" aria-label="В избранное">
          <svg viewBox="0 0 24 24" class="heart-icon">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
      <div class="channel-name-wrapper">
        <div class="channel-name" title="${ch.title}">${ch.title}</div>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('fav-star')) return;
      selectChannel(parseInt(item.getAttribute('data-index')));
    });

    const star = item.querySelector('.fav-star');
    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(ch.title);
      const added = isFavorite(ch.title);
      showToast(
        added
          ? `«${ch.title}» добавлен в любимые`
          : `«${ch.title}» больше не в любимых`,
        added
      );

      // Анимация "взрыва" сердечка при добавлении
      if (added) {
        star.classList.add('burst');
        // Создаём маленькие частицы
        for (let k = 0; k < 6; k++) {
          const particle = document.createElement('span');
          particle.className = 'heart-particle';
          const angle = (Math.PI * 2 * k) / 6;
          particle.style.setProperty('--tx', `${Math.cos(angle) * 26}px`);
          particle.style.setProperty('--ty', `${Math.sin(angle) * 26}px`);
          particle.style.animationDelay = `${k * 20}ms`;
          star.appendChild(particle);
        }
        setTimeout(() => {
          star.classList.remove('burst');
          star.querySelectorAll('.heart-particle').forEach(p => p.remove());
        }, 700);
      }

      // Обновляем остальные карточки и панель (не перерисовывая текущую до конца анимации)
      const titleToUpdate = ch.title;
      setTimeout(() => {
        renderChannels();
        updateFavToggle();
      }, isFavorite(titleToUpdate) ? 650 : 0);
    });

    channelListEl.appendChild(item);
  });
}

// ============================================================
// Поиск и фильтры
// ============================================================
if (channelSearch) {
  channelSearch.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderChannels();
  });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => setFilter(btn.getAttribute('data-filter')));
});

// ============================================================
// Избранное (кнопка на панели канала)
// ============================================================
function updateFavToggle() {
  if (!favToggle || activeIndex < 0 || !CHANNELS[activeIndex]) return;
  const title = CHANNELS[activeIndex].title;
  favToggle.classList.toggle('active', isFavorite(title));
  // У кнопки в панели текст не нужен — там SVG-сердечко, меняем только класс
}

if (favToggle) {
  favToggle.addEventListener('click', () => {
    if (activeIndex < 0 || !CHANNELS[activeIndex]) return;
    const title = CHANNELS[activeIndex].title;
    toggleFavorite(title);
    const added = isFavorite(title);
    showToast(
      added
        ? `«${title}» добавлен в любимые`
        : `«${title}» больше не в любимых`,
      added
    );

    // Анимация пульса
    favToggle.classList.remove('pulse');
    void favToggle.offsetWidth; // рестарт анимации
    favToggle.classList.add('pulse');
    setTimeout(() => favToggle.classList.remove('pulse'), 600);

    renderChannels();
    updateFavToggle();
  });
}

// ============================================================
// EPG логика
// ============================================================
function parseEPGDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function takeUpcoming(items, limit, dayOffset) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const now = new Date();
  const targetDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 0, 0, 0);
  const targetDayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset + 1, 0, 0, 0);

  // 1. Отбираем только те передачи, которые попадают в нужный день
  let filtered = items.filter(it => {
    const s = parseEPGDate(it.start_iso);
    const e = parseEPGDate(it.stop_iso);
    if (!s || !e) return false;
    return (s < targetDayEnd) && (e > targetDayStart);
  });

  // 2. Если это "Сегодня", отсекаем то, что уже прошло
  if (dayOffset === 0) {
    filtered = filtered.filter(it => {
      const e = parseEPGDate(it.stop_iso);
      return e > now;
    });
  }

  return filtered.slice(0, limit);
}

function updateCurrentEPGHighlight() {
  const items = document.querySelectorAll('.epg-item');
  const now = new Date();
  items.forEach(item => {
    const startStr = item.getAttribute('data-start');
    const stopStr = item.getAttribute('data-stop');
    if (!startStr || !stopStr) return;
    const start = new Date(startStr);
    const stop = new Date(stopStr);

    if (now >= start && now < stop) {
      item.classList.add('now-playing');
      const timeEl = item.querySelector('.epg-time');
      if (timeEl && !timeEl.querySelector('.live-badge')) {
        const badge = document.createElement('span');
        badge.className = 'live-badge';
        badge.textContent = 'В эфире';
        timeEl.appendChild(badge);
      }
      const total = stop - start, passed = now - start;
      let percent = (passed / total) * 100;
      if (percent < 0) percent = 0;
      if (percent > 100) percent = 100;
      item.style.background = `linear-gradient(90deg, rgba(99, 102, 241, 0.35) ${percent}%, rgba(99, 102, 241, 0.05) ${percent}%)`;
    } else {
      item.classList.remove('now-playing');
      const badge = item.querySelector('.live-badge');
      if (badge) badge.remove();
      item.style.background = '';
    }
  });
}
setInterval(updateCurrentEPGHighlight, 60000);

function renderEPG(title) {
  if (!epgListEl) return;
  updateEpgDate();
  let channelEpg = EPG_DATA[title];
  if (!channelEpg) {
    const key = Object.keys(EPG_DATA).find(k => k.toLowerCase() === title.toLowerCase());
    if (key) channelEpg = EPG_DATA[key];
  }
  const visible = takeUpcoming(channelEpg, EPG_ITEMS_LIMIT * 4, currentEpgDay);

  if (visible.length > 0) {
    epgListEl.innerHTML = visible.map((item, idx) => `
      <div class="epg-item" data-start="${item.start_iso}" data-stop="${item.stop_iso}" data-idx="${idx}">
        <span class="epg-time">${item.start}</span>
        <span class="epg-name">
          <div class="epg-info-row">
            <span class="epg-title-text">${item.title}</span>
          </div>
        </span>
      </div>
    `).join('');

    // Клик по передаче — показать описание
    epgListEl.querySelectorAll('.epg-item').forEach(el => {
      el.addEventListener('click', () => showProgramDescription(channelEpg, parseInt(el.getAttribute('data-idx'), 10), visible));
    });

    updateCurrentEPGHighlight();
  } else {
    epgListEl.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; text-align:center; margin-top:20px;">Нет данных о программе</div>';
  }
}

// ============================================================
// Описание передачи
// ============================================================
let descOverlay = null;

function showProgramDescription(fullEpg, idx, visible) {
  const item = visible[idx];
  if (!item) return;

  if (!descOverlay) {
    descOverlay = document.createElement('div');
    descOverlay.className = 'desc-overlay';
    descOverlay.innerHTML = `
      <div class="desc-card">
        <button class="desc-close" title="Закрыть">×</button>
        <div class="desc-time"></div>
        <div class="desc-title"></div>
        <div class="desc-text"></div>
      </div>
    `;
    document.body.appendChild(descOverlay);
    descOverlay.addEventListener('click', (e) => {
      if (e.target === descOverlay || e.target.classList.contains('desc-close')) {
        descOverlay.classList.remove('show');
      }
    });
  }

  descOverlay.querySelector('.desc-time').textContent = `${item.start}–${item.stop || ''}`;
  descOverlay.querySelector('.desc-title').textContent = item.title;
  descOverlay.querySelector('.desc-text').textContent = item.desc || 'Описание отсутствует.';
  descOverlay.classList.add('show');
}

// ============================================================
// "Сейчас идёт"
// ============================================================
function updateNowPlayingBanner(channelTitle) {
  if (!nowPlayingText || !nowPlayingBanner) return;
  let channelEpg = EPG_DATA[channelTitle];
  if (!channelEpg) {
    const key = Object.keys(EPG_DATA).find(k => k.toLowerCase() === channelTitle.toLowerCase());
    if (key) channelEpg = EPG_DATA[key];
  }
  if (!channelEpg || channelEpg.length === 0) {
    nowPlayingText.innerHTML = `<span class="label">Сейчас идёт:</span> Нет данных`;
    nowPlayingBanner.style.display = 'block';
    currentProgTitle = '';
    syncPlayerOverlay();
    return;
  }
  const now = new Date();
  let currentProg = null;
  for (let i = 0; i < channelEpg.length; i++) {
    const item = channelEpg[i];
    const start = parseEPGDate(item.start_iso);
    const stop = parseEPGDate(item.stop_iso);
    if (!start || !stop) continue;
    if (now >= start && now < stop) { currentProg = item; break; }
  }
  if (!currentProg) {
    for (let i = 0; i < channelEpg.length; i++) {
      const start = parseEPGDate(channelEpg[i].start_iso);
      if (start && start > now) { currentProg = channelEpg[i]; break; }
    }
  }
  const progTitle = currentProg ? currentProg.title : 'Программа не найдена';
  nowPlayingText.innerHTML = `<span class="label">Сейчас идёт:</span> ${progTitle}`;
  nowPlayingBanner.style.display = 'block';

  currentProgTitle = currentProg ? currentProg.title : '';
  syncPlayerOverlay();
}

// ============================================================
// Плеер: инициализация + переподключение + PiP + error
// ============================================================
let retryAttempt = 0;
let retryTimer = null;
let offlineOverlay = null;
let lastStreamUrl = '';

function createOfflineOverlay() {
  if (offlineOverlay) return offlineOverlay;
  offlineOverlay = document.createElement('div');
  offlineOverlay.className = 'cv-offline';
  offlineOverlay.innerHTML = `
    <div class="cv-offline-text">Канал недоступен</div>
    <button class="cv-offline-retry">Повторить</button>
  `;
  offlineOverlay.querySelector('.cv-offline-retry').addEventListener('click', () => {
    hideOfflineOverlay();
    retryAttempt = 0;
    if (player && lastStreamUrl) {
      player.src({ src: lastStreamUrl, type: 'application/x-mpegURL' });
      player.play().catch(() => {});
    }
  });
  return offlineOverlay;
}

function showOfflineOverlay() {
  if (!player) return;
  const el = player.el();
  const ov = createOfflineOverlay();
  if (!ov.parentNode) el.appendChild(ov);
  ov.style.display = 'flex';
}
function hideOfflineOverlay() {
  if (offlineOverlay) offlineOverlay.style.display = 'none';
}

function scheduleRetry() {
  if (retryTimer) return;
  retryAttempt++;
  if (retryAttempt > 5) {
    showOfflineOverlay();
    return;
  }
  const delay = Math.min(5000 * retryAttempt, 30000);
  console.log(`Переподключение через ${delay}ms (попытка ${retryAttempt})`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    if (player && lastStreamUrl) {
      try {
        player.src({ src: lastStreamUrl, type: 'application/x-mpegURL' });
        player.play().catch(() => {});
      } catch(e) {}
    }
  }, delay);
}

function initCustomPlayer() {
  player = videojs('video', {
    controls: false,
    autoplay: true,
    preload: 'auto',
    fill: true,
    html5: { vhs: { overrideNative: true } }
  });

  const el = player.el();

  const clickOverlay = document.createElement('div');
  clickOverlay.className = 'cv-click-overlay';
  el.appendChild(clickOverlay);

  const customBar = document.createElement('div');
  customBar.className = 'custom-video-bar';
  customBar.innerHTML = `
    <button class="cv-btn cv-play" title="Play/Pause (Пробел)">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </button>
    
    <div class="cv-volume-wrapper">
      <button class="cv-btn cv-mute" title="Mute/Unmute (M)">
        <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
      </button>
      <input type="range" class="cv-volume-slider" id="cvVolume" min="0" max="1" step="0.05" value="1">
    </div>
    
    <div class="cv-live-badge">
      <span class="cv-live-dot"></span> LIVE
    </div>

    <div class="cv-spacer"></div>
    
    <div class="cv-quality-wrapper">
      <div class="cv-quality-btn" id="cvQualityBtn">Авто</div>
      <div class="cv-quality-menu" id="cvQualityMenu"></div>
    </div>

    <button class="cv-btn cv-pip" title="Картинка в картинке (P)">
      <svg viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>
    </button>

    <button class="cv-btn cv-fs" title="Fullscreen (F)">
      <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
    </button>
  `;

  el.appendChild(customBar);
  el.classList.add('vjs-custom-bar-active');

  const centerBtn = document.createElement('div');
  centerBtn.className = 'cv-center-btn';
  centerBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  el.appendChild(centerBtn);

  playerNowEl = document.createElement('div');
  playerNowEl.className = 'cv-now-playing';
  playerNowEl.innerHTML = `<span class="cv-now-text"></span>`;
  el.appendChild(playerNowEl);
  syncPlayerOverlay();

  const playSvg = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  const pauseSvg = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
  const volSvg = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
  const muteSvg = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

  const btnPlay = customBar.querySelector('.cv-play');
  const btnMute = customBar.querySelector('.cv-mute');
  const volumeSlider = document.getElementById('cvVolume');
  const btnFs = customBar.querySelector('.cv-fs');
  const btnPip = customBar.querySelector('.cv-pip');
  const qualityBtn = document.getElementById('cvQualityBtn');
  const qualityMenu = document.getElementById('cvQualityMenu');

  // Восстанавливаем громкость
  const savedVol = parseFloat(localStorage.getItem(LS_LAST_VOLUME));
  if (!isNaN(savedVol)) {
    player.volume(savedVol);
    volumeSlider.value = savedVol;
    volumeSlider.style.setProperty('--vol', `${savedVol * 100}%`);
  }

  let centerTimeout;
  const showCenterBtn = (isPause) => {
    centerBtn.innerHTML = isPause ? pauseSvg : playSvg;
    centerBtn.classList.add('show');
    clearTimeout(centerTimeout);
    centerTimeout = setTimeout(() => {
      centerBtn.classList.remove('show');
    }, 800);
  };

  let isBarVisible = false;
  let barHideTimeout;

  const showBar = () => {
    isBarVisible = true;
    el.classList.add('cv-visible');
    clearTimeout(barHideTimeout);
    if (!player.paused()) {
      barHideTimeout = setTimeout(() => {
        isBarVisible = false;
        el.classList.remove('cv-visible');
      }, 3000);
    }
  };

  const isBarShown = () =>
    el.classList.contains('cv-visible') || player.paused();

  let barWasVisibleOnDown = false;
  clickOverlay.addEventListener('pointerdown', () => {
    barWasVisibleOnDown = isBarShown();
  });

  // Свайп по плееру — переключение каналов
  let swipeStartX = 0, swipeStartY = 0, swipeStartTime = 0;
  clickOverlay.addEventListener('pointerdown', (e) => {
    swipeStartX = e.clientX;
    swipeStartY = e.clientY;
    swipeStartTime = Date.now();
  });
  clickOverlay.addEventListener('pointerup', (e) => {
    const dx = e.clientX - swipeStartX;
    const dy = e.clientY - swipeStartY;
    const dt = Date.now() - swipeStartTime;
    // Свайп влево/вправо быстрый и горизонтальный
    if (dt < 600 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      e.stopPropagation();
      if (dx < 0) selectChannel(activeIndex + 1);
      else selectChannel(activeIndex - 1);
      // подавляем click после свайпа
      clickOverlay.dataset.suppressClick = '1';
      setTimeout(() => { delete clickOverlay.dataset.suppressClick; }, 50);
    }
  });

  clickOverlay.addEventListener('click', (e) => {
    e.stopPropagation();
    if (clickOverlay.dataset.suppressClick) return;

    if (!barWasVisibleOnDown) {
      showBar();
      return;
    }

    if (player.paused()) {
      player.play();
      showCenterBtn(true);
    } else {
      player.pause();
      showCenterBtn(false);
    }
    showBar();
  });

  btnPlay.addEventListener('click', (e) => {
    e.stopPropagation();
    player.paused() ? player.play() : player.pause();
    showBar();
  });

  btnMute.addEventListener('click', (e) => {
    e.stopPropagation();
    player.muted(!player.muted());
    showBar();
  });

  btnFs.addEventListener('click', (e) => {
    e.stopPropagation();
    player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen();
    showBar();
  });

  btnPip.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      const v = player.tech(true) && player.tech(true).el();
      if (!v) return;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (v.requestPictureInPicture) {
        await v.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('PiP не доступен', err);
    }
    showBar();
  });

  volumeSlider.addEventListener('input', (e) => {
    player.volume(parseFloat(e.target.value));
    if (player.volume() > 0 && player.muted()) player.muted(false);
    showBar();
  });

  player.on('volumechange', () => {
    btnMute.innerHTML = player.muted() || player.volume() === 0 ? muteSvg : volSvg;
    const vol = player.muted() ? 0 : player.volume();
    volumeSlider.value = vol;
    volumeSlider.style.setProperty('--vol', `${vol * 100}%`);
    try { localStorage.setItem(LS_LAST_VOLUME, String(vol)); } catch(e) {}
  });

  player.on('play', () => {
    btnPlay.innerHTML = pauseSvg;
    showBar();
  });

  player.on('pause', () => {
    btnPlay.innerHTML = playSvg;
    showBar();
  });

  qualityBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    qualityMenu.classList.toggle('show');
    showBar();
  });

  document.addEventListener('click', () => {
    qualityMenu.classList.remove('show');
  });

  // --- Переподключение / ошибка ---
  player.on('playing', () => {
    retryAttempt = 0;
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    hideOfflineOverlay();
  });

  player.on('error', () => {
    const err = player.error();
    console.warn('Ошибка плеера', err);
    scheduleRetry();
  });

  player.on('stalled', () => {
    // Иногда не приходит error, но поток "зависает" — тоже подстрахуемся
    // Не делаем retry сразу, только если долго нет playing
  });

  player.on('loadedmetadata', () => {
    const levels = player.qualityLevels();
    qualityMenu.innerHTML = '';
    let hasLevels = false;

    const setLevel = (levelIndex) => {
      for (let j = 0; j < levels.length; j++) {
        if (levelIndex === -1) levels[j].enabled = true;
        else levels[j].enabled = (j === levelIndex);
      }
    };

    for (let i = levels.length - 1; i >= 0; i--) {
      const level = levels[i];
      if (!level.height) continue;
      hasLevels = true;

      const item = document.createElement('div');
      item.className = 'cv-quality-item';
      item.textContent = `${level.height}p`;
      item.onclick = (e) => {
        e.stopPropagation();
        setLevel(i);
        qualityBtn.textContent = `${level.height}p`;
        updateQualityUI(`${level.height}p`);
        qualityMenu.classList.remove('show');
        showBar();
      };
      qualityMenu.appendChild(item);
    }

    const autoBtn = document.createElement('div');
    autoBtn.className = 'cv-quality-item';
    autoBtn.textContent = 'Авто';
    autoBtn.onclick = (e) => {
      e.stopPropagation();
      setLevel(-1);
      qualityBtn.textContent = 'Авто';
      updateQualityUI('Авто');
      qualityMenu.classList.remove('show');
      showBar();
    };
    qualityMenu.appendChild(autoBtn);

    if (hasLevels) {
      updateQualityUI('Авто');
    } else {
      qualityBtn.textContent = 'Авто';
      autoBtn.classList.add('active');
    }

    function updateQualityUI(selectedText) {
      const items = qualityMenu.querySelectorAll('.cv-quality-item');
      items.forEach((item) => {
        item.classList.remove('active');
        if (item.textContent === selectedText) item.classList.add('active');
      });
    }
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') showBar();
  });

  el.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!player.paused()) {
      isBarVisible = false;
      el.classList.remove('cv-visible');
    }
  });
}

function selectChannel(i) {
  if (CHANNELS.length === 0) return;
  // Циклический переход
  if (i < 0) i = CHANNELS.length - 1;
  if (i >= CHANNELS.length) i = 0;
  if (i < 0 || i >= CHANNELS.length) return;

  activeIndex = i;
  const ch = CHANNELS[i];

  infoTitle.textContent = ch.title;

  const logoFile = getLogoFile(ch.title);
  if (logoFile) {
    infoLogo.innerHTML = `<img src="static/logos/${logoFile}" alt="${ch.title}">`;
  } else {
    infoLogo.textContent = initials(ch.title);
  }

  renderEPG(ch.title);
  updateNowPlayingBanner(ch.title);
  updateFavToggle();
  saveLastChannel(i);

  placeholder.style.display = 'none';
  videoContainer.style.display = 'block';

  renderChannels();

  const activeItem = channelListEl.querySelector(`.channel-item[data-index="${i}"]`);
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  if (!player) {
    initCustomPlayer();
  }

  lastStreamUrl = ch.stream;
  retryAttempt = 0;
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  hideOfflineOverlay();

  player.src({ src: ch.stream, type: 'application/x-mpegURL' });
  player.play().catch(() => {});
}

// ============================================================
// Горячие клавиши ПК
// ============================================================
document.addEventListener('keydown', (e) => {
  // Игнорируем ввод в поле поиска
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  if (e.key === 'ArrowRight') { e.preventDefault(); selectChannel(activeIndex + 1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); selectChannel(activeIndex - 1); }
  else if (e.code === 'Space') {
    e.preventDefault();
    if (player) player.paused() ? player.play() : player.pause();
  }
  else if (e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А') {
    e.preventDefault();
    if (player) player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen();
  }
  else if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') {
    e.preventDefault();
    if (player) player.muted(!player.muted());
  }
  else if (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З') {
    e.preventDefault();
    (async () => {
      try {
        if (!player) return;
        const v = player.tech(true) && player.tech(true).el();
        if (!v) return;
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else if (v.requestPictureInPicture) await v.requestPictureInPicture();
      } catch(err) {}
    })();
  }
  else if (/^\d$/.test(e.key)) {
    // 1..9 — прямой переход на канал по номеру
    const num = parseInt(e.key, 10);
    const idx = num === 0 ? 9 : num - 1;
    if (idx < CHANNELS.length) selectChannel(idx);
  }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && activeIndex >= 0 && CHANNELS[activeIndex]) {
    renderEPG(CHANNELS[activeIndex].title);
    updateNowPlayingBanner(CHANNELS[activeIndex].title);
  }
});

setInterval(() => {
  if (activeIndex >= 0 && CHANNELS[activeIndex]) {
    updateNowPlayingBanner(CHANNELS[activeIndex].title);
  }
}, 60000);

// ============================================================
// КНОПКИ ПРОКРУТКИ КАРУСЕЛИ (ПК)
// ============================================================
if (scrollLeftBtn && scrollRightBtn && channelListEl) {
  scrollLeftBtn.addEventListener('click', () => {
    channelListEl.scrollBy({ left: -300, behavior: 'smooth' });
  });

  scrollRightBtn.addEventListener('click', () => {
    channelListEl.scrollBy({ left: 300, behavior: 'smooth' });
  });

  const updateScrollButtons = () => {
    // Левая кнопка — показываем только если есть куда скроллить влево
    if (channelListEl.scrollLeft > 0) {
      scrollLeftBtn.style.display = 'flex';
    } else {
      scrollLeftBtn.style.display = 'none';
    }

    // Правая кнопка — скрываем, если дошли до конца
    const maxScroll = channelListEl.scrollWidth - channelListEl.clientWidth;
    if (channelListEl.scrollLeft >= maxScroll - 5) {
      scrollRightBtn.style.display = 'none';
    } else {
      scrollRightBtn.style.display = 'flex';
    }
  };

  channelListEl.addEventListener('scroll', updateScrollButtons);
  updateScrollButtons();
  window.addEventListener('resize', updateScrollButtons);
}

// ============================================================
// Старт
// ============================================================
renderChannels();
if (CHANNELS.length > 0) {
  const saved = loadLastChannel();
  const startIdx = (saved >= 0 && saved < CHANNELS.length) ? saved : 0;
  // Небольшая задержка, чтобы DOM успел отрисоваться
  setTimeout(() => selectChannel(startIdx), 0);
}