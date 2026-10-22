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

const channelListEl = document.getElementById('channelList');
const nowPlayingEl = document.getElementById('nowPlaying');
const infoTitle = document.getElementById('infoTitle');
const infoLogo = document.getElementById('infoLogo');
const placeholder = document.getElementById('placeholder');
const videoContainer = document.getElementById('video-container');
const scrollRightBtn = document.getElementById('scrollRightBtn');

let activeIndex = -1;
let player = null;

// Генерируем красивое короткое имя для логотипа
function getLogoText(name) {
    const cleanName = name.replace(/[^\w\sа-яА-Я]/gi, '');
    if (cleanName.includes('Первый')) return '1';
    if (cleanName.includes('Россия 1')) return 'Р1';
    if (cleanName.includes('Россия 24')) return '24';
    if (cleanName.includes('Матч')) return 'М';
    if (cleanName.includes('НТВ')) return 'НТВ';
    if (cleanName.includes('Пятый')) return '5';
    return cleanName.substring(0, 2).toUpperCase(); // Первые 2 буквы
}

function renderChannels() {
  channelListEl.innerHTML = '';
  
  CHANNELS.forEach((ch, i) => {
    const item = document.createElement('div');
    item.className = 'channel-item' + (i === activeIndex ? ' active' : '');
    
    const qualityBadge = ch.quality === 'HD' ? '<span class="quality-badge">HD</span>' : '';
    const logoText = getLogoText(ch.title);

    item.innerHTML = `
      ${qualityBadge}
      <div class="channel-logo">${logoText}</div>
    `;
    item.addEventListener('click', () => selectChannel(i));
    channelListEl.appendChild(item);
  });
}

function selectChannel(i) {
  if (i < 0 || i >= CHANNELS.length) return;
  activeIndex = i;
  const ch = CHANNELS[i];
  
  // Обновляем правую панель
  infoTitle.textContent = ch.title;
  infoLogo.textContent = getLogoText(ch.title);
  nowPlayingEl.textContent = ch.title;
  
  // Прячем заглушку, показываем плеер
  placeholder.style.display = 'none';
  videoContainer.style.display = 'block';
  
  renderChannels();

  const activeItem = channelListEl.children[i];
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // Инициализируем Video.js
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

  // Запускаем поток
  player.src({ src: ch.stream, type: 'application/x-mpegURL' });
  player.play().catch(() => {});
}

const scrollLeftBtn = document.getElementById('scrollLeftBtn');

// Логика прокрутки
if (scrollLeftBtn) {
  scrollLeftBtn.addEventListener('click', () => {
    channelListEl.scrollBy({ left: -400, behavior: 'smooth' });
  });
}

if (scrollRightBtn) {
  scrollRightBtn.addEventListener('click', () => {
    channelListEl.scrollBy({ left: 400, behavior: 'smooth' });
  });
}

// Показываем/скрываем левую кнопку в зависимости от прокрутки
channelListEl.addEventListener('scroll', () => {
  if (scrollLeftBtn) {
    if (channelListEl.scrollLeft > 0) {
      scrollLeftBtn.style.display = 'flex'; // Показываем
    } else {
      scrollLeftBtn.style.display = 'none'; // Скрываем
    }
  }
});

// Клавиатура
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); selectChannel(activeIndex + 1); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); selectChannel(activeIndex - 1); }
});

// Инициализация
renderChannels();
if (CHANNELS.length > 0) {
  selectChannel(0);
}