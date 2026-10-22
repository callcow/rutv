// Функция для расшифровки Base64 (работает с кириллицей)
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
const channelCountEl = document.getElementById('channelCount');
const searchInput = document.getElementById('searchInput');
const nowPlayingEl = document.getElementById('nowPlaying');
const placeholder = document.getElementById('placeholder');
const videoContainer = document.getElementById('video-container');

let activeIndex = -1;
let player = null;

function initials(name) {
  return name.split(/[\s\-_]+/).map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
}

function renderChannels(filter = '') {
  channelListEl.innerHTML = '';
  const q = filter.toLowerCase();
  let visibleCount = 0;
  
  CHANNELS.forEach((ch, i) => {
    if (q && !ch.title.toLowerCase().includes(q)) return;
    visibleCount++;
    
    const item = document.createElement('div');
    item.className = 'channel-item' + (i === activeIndex ? ' active' : '');
    // Показываем бейдж только если качество HD
    const qualityBadge = ch.quality === 'HD' ? '<span class="quality-badge hd">HD</span>' : '';

    item.innerHTML = `
      <div class="channel-logo">${initials(ch.title)}</div>
      <div class="channel-info">
        <div class="channel-name" title="${ch.title}">${ch.title}</div>
        <div class="channel-meta">В эфире</div>
      </div>
      ${qualityBadge}
    `;
    item.addEventListener('click', () => selectChannel(i));
    channelListEl.appendChild(item);
  });

  if (visibleCount === 0) {
    channelListEl.innerHTML = '<div style="text-align:center; color:var(--text-muted); margin-top:20px; font-size:14px;">Ничего не найдено</div>';
  }
}

function selectChannel(i) {
  if (i < 0 || i >= CHANNELS.length) return;
  activeIndex = i;
  const ch = CHANNELS[i];
  
  // Обновляем интерфейс
  nowPlayingEl.textContent = ch.title;
  placeholder.style.display = 'none';
  videoContainer.style.display = 'block';
  
  renderChannels(searchInput.value);

  const activeItem = channelListEl.querySelector('.channel-item.active');
  if (activeItem) {
    activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Инициализируем Video.js, если еще не создан
  if (!player) {
    player = videojs('video', {
      controls: true,
      autoplay: true,
      preload: 'auto',
      fluid: false,
      textTrackSettings: false, // Отключаем диалог настроек субтитров
      html5: {
        vhs: {
          overrideNative: true
        }
      }
    });

// Подключаем плагин выбора качества (если поток адаптивный)
    if (player.qualityMenu) {
      player.qualityMenu();
    }
  }

  // Меняем источник видео
  player.src({
    src: ch.stream,
    type: 'application/x-mpegURL'
  });
  
  // Запускаем воспроизведение
  player.play().catch(() => {
    // Браузер может заблокировать автоплей, если видео со звуком
    // Просто игнорируем, пользователь нажмет play
  });
}

// Обработка поиска
searchInput.addEventListener('input', (e) => renderChannels(e.target.value));

// Обработка клавиатуры
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); selectChannel(activeIndex + 1); }
  if (e.key === 'ArrowUp')   { e.preventDefault(); selectChannel(activeIndex - 1); }
});

// Инициализация
channelCountEl.textContent = CHANNELS.length;
renderChannels();
if (CHANNELS.length > 0) {
  selectChannel(0);
}