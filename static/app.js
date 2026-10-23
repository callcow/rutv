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
  "Первый канал": "federal", "Россия 1": "federal", "Матч ТВ": "sport",
  "НТВ": "federal", "Пятый канал": "federal", "Россия К": "federal",
  "Россия 24": "news", "Карусель": "kids", "ОТР": "federal",
  "ТВ Центр": "federal", "РЕН ТВ": "federal", "СПАС": "federal",
  "СТС": "entertainment", "Домашний": "entertainment", "ТВ-3": "entertainment",
  "Пятница": "entertainment", "Звезда": "federal", "Мир": "entertainment",
  "ТНТ": "entertainment", "Муз-ТВ": "entertainment", "Суббота": "entertainment",
  "Че": "entertainment", "ЦТВ": "federal", "Известия": "news",
  "Кино ТВ": "movie", "Ю": "entertainment", "Телеканал 78": "federal",
  "КиноСезон": "movie", "Солнце": "entertainment", "СТС Love": "entertainment"
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

let activeIndex = -1;
let currentFilter = 'all';
let player = null;

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
  CHANNELS.forEach((ch, i) => {
    const category = getChannelCategory(ch.title);
    if (currentFilter !== 'all' && category !== currentFilter) return;

    const item = document.createElement('div');
    item.className = 'channel-item' + (i === activeIndex ? ' active' : '');
    item.setAttribute('data-index', i);

    const hdBadge = ch.quality === 'HD' ? '<span class="quality-badge hd">HD</span>' : '';
    const logoFile = getLogoFile(ch.title);
    const logoHtml = logoFile ? `<img src="static/logos/${logoFile}" alt="${ch.title}" loading="lazy">` : initials(ch.title);

    item.innerHTML = `
      <div class="channel-card-inner">
        ${hdBadge}
        <div class="channel-logo">${logoHtml}</div>
      </div>
      <div class="channel-name-wrapper">
        <div class="channel-name" title="${ch.title}">${ch.title}</div>
      </div>
    `;
    item.addEventListener('click', () => selectChannel(parseInt(item.getAttribute('data-index'))));
    channelListEl.appendChild(item);
  });
}

// --- EPG ЛОГИКА ---
function parseEPGDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function takeUpcoming(items, limit) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const now = new Date();
  let anchorIdx = -1;

  for (let i = 0; i < items.length; i++) {
    const s = parseEPGDate(items[i].start_iso);
    const e = parseEPGDate(items[i].stop_iso);
    if (s && e && now >= s && now < e) { anchorIdx = i; break; }
  }

  if (anchorIdx === -1) {
    for (let i = 0; i < items.length; i++) {
      const e = parseEPGDate(items[i].stop_iso);
      if (e && e > now) { anchorIdx = i; break; }
    }
  }
  if (anchorIdx === -1) anchorIdx = items.length - 1;
  return items.slice(anchorIdx, anchorIdx + limit);
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
  let channelEpg = EPG_DATA[title];
  if (!channelEpg) {
    const key = Object.keys(EPG_DATA).find(k => k.toLowerCase() === title.toLowerCase());
    if (key) channelEpg = EPG_DATA[key];
  }
  const visible = takeUpcoming(channelEpg, EPG_ITEMS_LIMIT);

  if (visible.length > 0) {
    epgListEl.innerHTML = visible.map(item => `
      <div class="epg-item" data-start="${item.start_iso}" data-stop="${item.stop_iso}">
        <span class="epg-time">${item.start}</span>
        <span class="epg-name">
          <div class="epg-info-row">
            <span class="epg-title-text">${item.title}</span>
          </div>
        </span>
      </div>
    `).join('');
    updateCurrentEPGHighlight();
  } else {
    epgListEl.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; text-align:center; margin-top:20px;">Нет данных о программе</div>';
  }
}

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
}

// --- ЛОГИКА ПЛЕЕРА ---
function initCustomPlayer() {
  player = videojs('video', {
    controls: false,
    autoplay: true,
    preload: 'auto',
    fill: true,
    html5: { vhs: { overrideNative: true } }
  });

  const el = player.el();

  const customBar = document.createElement('div');
  customBar.className = 'custom-video-bar';
  customBar.innerHTML = `
    <button class="cv-btn cv-play" title="Play/Pause">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </button>
    
    <!-- ГРОМКОСТЬ -->
    <div class="cv-volume-wrapper">
      <button class="cv-btn cv-mute" title="Mute/Unmute">
        <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
      </button>
      <input type="range" class="cv-volume-slider" id="cvVolume" min="0" max="1" step="0.05" value="1">
    </div>
    
    <!-- ПЛАШКА LIVE -->
    <div class="cv-live-badge">
      <span class="cv-live-dot"></span> LIVE
    </div>

    <div class="cv-spacer"></div>
    
    <!-- НАСТРОЙКИ КАЧЕСТВА -->
    <div class="cv-quality-wrapper">
      <div class="cv-quality-btn" id="cvQualityBtn">Авто</div>
      <div class="cv-quality-menu" id="cvQualityMenu"></div>
    </div>

    <button class="cv-btn cv-fs" title="Fullscreen">
      <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
    </button>
  `;

  el.appendChild(customBar);
  el.classList.add('vjs-custom-bar-active');

  // ЦЕНТРАЛЬНАЯ КНОПКА (АНИМАЦИЯ)
  const centerBtn = document.createElement('div');
  centerBtn.className = 'cv-center-btn';
  centerBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  el.appendChild(centerBtn);

  const playSvg = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`;
  const pauseSvg = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
  const volSvg = `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
  const muteSvg = `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;

  const btnPlay = customBar.querySelector('.cv-play');
  const btnMute = customBar.querySelector('.cv-mute');
  const volumeSlider = document.getElementById('cvVolume');
  const btnFs = customBar.querySelector('.cv-fs');
  const qualityBtn = document.getElementById('cvQualityBtn');
  const qualityMenu = document.getElementById('cvQualityMenu');

  let centerTimeout;

  // ФУНКЦИЯ ПОКАЗА ЦЕНТРАЛЬНОЙ КНОПКИ
  const showCenterBtn = (isPause) => {
    centerBtn.innerHTML = isPause ? pauseSvg : playSvg;
    centerBtn.classList.add('show');
    clearTimeout(centerTimeout);
    centerTimeout = setTimeout(() => {
      centerBtn.classList.remove('show');
    }, 800);
  };

  // КЛИК ПО САМОМУ ВИДЕО
  const videoElement = el.querySelector('video');
  if (videoElement) {
    videoElement.addEventListener('click', () => {
      if (player.paused()) {
        player.play();
        showCenterBtn(true); // Показываем паузу (так как видео начало играть)
      } else {
        player.pause();
        showCenterBtn(false); // Показываем плей (так как видео встало на паузу)
      }
    });
  }

  // Обработчики кнопок
  btnPlay.addEventListener('click', () => player.paused() ? player.play() : player.pause());
  btnMute.addEventListener('click', () => player.muted(!player.muted()));
  btnFs.addEventListener('click', () => player.isFullscreen() ? player.exitFullscreen() : player.requestFullscreen());

  // Синхронизация громкости
  volumeSlider.addEventListener('input', (e) => {
    player.volume(parseFloat(e.target.value));
    if (player.volume() > 0 && player.muted()) {
      player.muted(false);
    }
  });

  player.on('volumechange', () => {
    btnMute.innerHTML = player.muted() || player.volume() === 0 ? muteSvg : volSvg;
    const vol = player.muted() ? 0 : player.volume();
    volumeSlider.value = vol;
    volumeSlider.style.setProperty('--vol', `${vol * 100}%`);
  });

  player.on('play', () => { btnPlay.innerHTML = pauseSvg; });
  player.on('pause', () => { btnPlay.innerHTML = playSvg; });

  // Качество
  qualityBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    qualityMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    qualityMenu.classList.remove('show');
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
      item.onclick = () => {
        setLevel(i);
        qualityBtn.textContent = `${level.height}p`;
        updateQualityUI(`${level.height}p`);
        qualityMenu.classList.remove('show');
      };
      qualityMenu.appendChild(item);
    }

    const autoBtn = document.createElement('div');
    autoBtn.className = 'cv-quality-item';
    autoBtn.textContent = 'Авто';
    autoBtn.onclick = () => {
      setLevel(-1);
      qualityBtn.textContent = 'Авто';
      updateQualityUI('Авто');
      qualityMenu.classList.remove('show');
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

  // Автоскрытие кастомного бара
  let hideTimeout;
  const showBar = () => {
    el.classList.add('cv-visible');
    clearTimeout(hideTimeout);
    if (!player.paused()) {
      hideTimeout = setTimeout(() => el.classList.remove('cv-visible'), 3000);
    }
  };
  
  el.addEventListener('mousemove', showBar);
  el.addEventListener('mouseleave', () => { if (!player.paused()) el.classList.remove('cv-visible'); });
  player.on('pause', showBar);
  player.on('play', showBar);
}

function selectChannel(i) {
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

  player.src({ src: ch.stream, type: 'application/x-mpegURL' });
  player.play().catch(() => {});
}

// --- ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ---
scrollLeftBtn.addEventListener('click', () => channelListEl.scrollBy({ left: -300, behavior: 'smooth' }));
scrollRightBtn.addEventListener('click', () => channelListEl.scrollBy({ left: 300, behavior: 'smooth' }));
channelListEl.addEventListener('scroll', () => {
  scrollLeftBtn.style.display = channelListEl.scrollLeft > 0 ? 'flex' : 'none';
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); selectChannel(activeIndex + 1); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); selectChannel(activeIndex - 1); }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && activeIndex >= 0 && CHANNELS[activeIndex]) {
    renderEPG(CHANNELS[activeIndex].title);
    updateNowPlayingBanner(CHANNELS[activeIndex].title);
  }
});

renderChannels();
if (CHANNELS.length > 0) {
  selectChannel(0);
}