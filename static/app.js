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
  "Первый канал": "1tv.png",
  "Россия 1": "russia1.png",
  "Матч ТВ": "matchtv.png",
  "НТВ": "ntv.png",
  "Пятый канал": "5tv.png",
  "Россия К": "russiak.png",
  "Россия 24": "russia24.png",
  "Карусель": "karusel.png",
  "ОТР": "otr.png",
  "ТВ Центр": "tvc.png",
  "РЕН ТВ": "rentv.png",
  "СПАС": "spas.png",
  "СТС": "sts.png",
  "Домашний": "domashniy.png",
  "ТВ-3": "tv3.png",
  "Пятница": "friday.png",
  "Звезда": "zvezda.png",
  "Мир": "mir.png",
  "ТНТ": "tnt.png",
  "Муз-ТВ": "muztv.png",
  "Суббота": "subbota.png",
  "Че": "che.png",
  "ЦТВ": "ctv.png",
  "Известия": "iz.png",
  "Кино ТВ": "kinotv.png",
  "Ю": "u.png",
  "Телеканал 78": "78.png",
  "КиноСезон": "kinosezon.png",
  "Солнце": "solnce.png",
  "СТС Love": "stslove.png"
};

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

// Элементы плашки "Сейчас идёт"
const nowPlayingBanner = document.getElementById('nowPlayingBanner');
const nowPlayingText = document.getElementById('nowPlayingText');

let activeIndex = -1;
let player = null;

// Сколько передач показывать в списке (включая текущую)
const EPG_ITEMS_LIMIT = 11;

function initials(name) {
  return name.split(/[\s\-_]+/).map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
}

function renderChannels() {
  channelListEl.innerHTML = '';

  CHANNELS.forEach((ch, i) => {
    const item = document.createElement('div');
    item.className = 'channel-item' + (i === activeIndex ? ' active' : '');

    const hdBadge = ch.quality === 'HD' ? '<span class="quality-badge hd">HD</span>' : '';

    const logoFile = getLogoFile(ch.title);
    const logoHtml = logoFile
      ? `<img src="static/logos/${logoFile}" alt="${ch.title}" loading="lazy">`
      : initials(ch.title);

    item.innerHTML = `
      <div class="channel-card-inner">
        <div class="channel-logo">${logoHtml}</div>
      </div>
      <div class="channel-name-wrapper">
        <div class="channel-name" title="${ch.title}">${ch.title}</div>
        ${hdBadge}
      </div>
    `;

    item.addEventListener('click', () => selectChannel(i));
    channelListEl.appendChild(item);
  });
}

function parseEPGDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

// Берёт до `limit` передач, начиная с текущей.
function takeUpcoming(items, limit) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const now = new Date();

  let anchorIdx = -1;
  for (let i = 0; i < items.length; i++) {
    const s = parseEPGDate(items[i].start_iso);
    const e = parseEPGDate(items[i].stop_iso);
    if (s && e && now >= s && now < e) {
      anchorIdx = i;
      break;
    }
  }

  if (anchorIdx === -1) {
    for (let i = 0; i < items.length; i++) {
      const e = parseEPGDate(items[i].stop_iso);
      if (e && e > now) { anchorIdx = i; break; }
    }
  }

  if (anchorIdx === -1) {
    anchorIdx = items.length - 1;
  }

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

    const titleRow = item.querySelector('.epg-info-row');
    const progressBar = item.querySelector('.progress-bar');
    const progressContainer = item.querySelector('.progress-container');
    
    if (now >= start && now < stop) {
      item.classList.add('now-playing');
      
      if (titleRow && !titleRow.querySelector('.live-badge')) {
        const badge = document.createElement('span');
        badge.className = 'live-badge';
        badge.textContent = 'В эфире';
        titleRow.appendChild(badge);
      }

      if (progressBar && progressContainer) {
        progressContainer.style.display = 'block'; 
        
        const total = stop - start;
        const passed = now - start;
        let percent = (passed / total) * 100;
        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;
        
        progressBar.style.width = `${percent}%`;
      }
    } else {
      item.classList.remove('now-playing');
      
      if (titleRow) {
        const badge = titleRow.querySelector('.live-badge');
        if (badge) badge.remove();
      }

      if (progressContainer) {
        progressContainer.style.display = 'none';
      }
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
          <div class="progress-container">
            <div class="progress-bar"></div>
          </div>
        </span>
      </div>
    `).join('');

    updateCurrentEPGHighlight();
  } else {
    epgListEl.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; text-align:center; margin-top:20px;">Нет данных о программе</div>';
  }
}

// Обновление плашки "Сейчас идёт" (ОБЪЕДИНЕНО В ОДИН ТЕГ)
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

    if (now >= start && now < stop) {
      currentProg = item;
      break;
    }
  }

  // Если текущей нет, берем первую, которая начнется
  if (!currentProg) {
    for (let i = 0; i < channelEpg.length; i++) {
       const start = parseEPGDate(channelEpg[i].start_iso);
       if (start && start > now) {
           currentProg = channelEpg[i];
           break;
       }
    }
  }

  // Вставляем всё в один HTML-элемент
  const progTitle = currentProg ? currentProg.title : 'Программа не найдена';
  nowPlayingText.innerHTML = `<span class="label">Сейчас идёт:</span> ${progTitle}`;

  nowPlayingBanner.style.display = 'block';
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

  const activeItem = channelListEl.children[i];
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  if (!player) {
    player = videojs('video', {
      controls: true,
      autoplay: true,
      preload: 'auto',
      fluid: false,
      textTrackSettings: false,
      html5: { vhs: { overrideNative: true } }
    });

    if (player.qualityMenu) {
      player.qualityMenu();
    }
  }

  player.src({ src: ch.stream, type: 'application/x-mpegURL' });
  player.play().catch(() => {});
}

scrollLeftBtn.addEventListener('click', () => {
  channelListEl.scrollBy({ left: -300, behavior: 'smooth' });
});

scrollRightBtn.addEventListener('click', () => {
  channelListEl.scrollBy({ left: 300, behavior: 'smooth' });
});

channelListEl.addEventListener('scroll', () => {
  if (channelListEl.scrollLeft > 0) {
    scrollLeftBtn.style.display = 'flex';
  } else {
    scrollLeftBtn.style.display = 'none';
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); selectChannel(activeIndex + 1); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); selectChannel(activeIndex - 1); }
});

// Обновление при возврате на вкладку
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