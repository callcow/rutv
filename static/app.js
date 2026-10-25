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
    "КиноСезон": "kinosezon.png", "Солнце": "solnce.png", "СТС Love": "stslove.png",
    "РБК": "rbc.png","viju TV1000": "viju_tv1000.png","viju TV1000 Action": "viju_action.png",
    "viju TV1000 Novella": "viju_novella.png","viju TV1000 Romantica": "viju_romantica.png",
    "viju History": "viju_history.png","viju Explore": "viju_explore.png",
    "viju Nature": "viju_nature.png","Da Vinci": "davinci.png"
  };

  const CHANNEL_CATEGORIES = {
    // Федеральные
    "Первый канал": "federal", "Россия 1": "federal", "Матч ТВ": "federal",
    "НТВ": "federal", "Пятый канал": "federal", "Россия К": "federal",
    "Россия 24": "federal", "Карусель": "federal", "ОТР": "federal",
    "ТВ Центр": "federal", "РЕН ТВ": "federal", "СПАС": "federal", "СТС": "federal",
    "Домашний": "federal", "ТВ-3": "federal", "Пятница": "federal",
    "Звезда": "federal", "Мир": "federal", "ТНТ": "federal", "Муз-ТВ": "federal",
    
    // Спортивные
    "Матч ТВ": "sport",
    
    // Кино и сериалы
    "Кино ТВ": "cinema", "КиноСезон": "cinema",
    "viju TV1000": "cinema",
    "viju TV1000 Action": "cinema",
    "viju TV1000 Novella": "cinema",
    "viju TV1000 Romantica": "cinema",
    
    // Познавательные
    "Россия К": "edu",
    "viju History": "edu",
    "viju Explore": "edu",
    "viju Nature": "edu",
    "Da Vinci": "edu",
    
    // Детские
    "Карусель": "kids", "Солнце": "kids",
    
    // Развлекательные
    "Пятница": "entertainment", "Суббота": "entertainment", "Че": "entertainment", "СТС Love": "entertainment", "Ю": "entertainment",
    
    // Новостные
    "Россия 24": "news", "Известия": "news", "РБК": "news",
    
    // Музыкальные
    "Муз-ТВ": "music",
  };

    // Каналы, которые должны быть ещё и в других категориях
  // (в объекте выше повторяющийся ключ перезаписывается, поэтому вторая категория здесь)
  const EXTRA_CATEGORIES = {
    "Матч ТВ": ["federal"], "Россия К": ["federal"], "Карусель": ["federal"],
    "Пятница": ["federal"], "Россия 24": ["federal"], "Муз-ТВ": ["federal"],
  };

  function channelInCategory(title, category) {
    const t = title.trim().toLowerCase();
    const find = (map) => {
      const k = Object.keys(map).find(x => x.toLowerCase() === t);
      return k ? map[k] : null;
    };
    if (find(CHANNEL_CATEGORIES) === category) return true;
    const extra = find(EXTRA_CATEGORIES);
    return !!(extra && extra.includes(category));
  }

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
  const LS_QUALITY = 'tv_quality'; // 'auto' или число (высота в пикселях)

  function loadQualityPref() {
    try {
      const raw = localStorage.getItem(LS_QUALITY);
      if (!raw || raw === 'auto') return 'auto';
      const h = parseInt(raw, 10);
      return isNaN(h) ? 'auto' : h;
    } catch(e) { return 'auto'; }
  }
  function saveQualityPref(v) {
    try { localStorage.setItem(LS_QUALITY, String(v)); } catch(e) {}
  }

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

  function updateFavCount() {
    const el = document.getElementById('favCountLabel');
    if (el) el.textContent = favorites.size ? `Любимые (${favorites.size})` : 'Любимые';
  }
  updateFavCount();
  function toggleFavorite(title) {
    if (favorites.has(title)) favorites.delete(title);
    else favorites.add(title);
    saveFavorites([...favorites]);
    updateFavCount();
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
      <span>${esc(message)}</span>
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
  let currentProgStop = null;   // когда заканчивается текущая передача (Date)
  let currentProgStopText = ''; // то же в виде «22:10»

    function updatePlayerRemaining() {
    const el = document.getElementById('cvRemaining');
    if (!el) return;
    if (!currentProgStop) { el.textContent = ''; return; }

    const mins = Math.max(0, Math.ceil((currentProgStop - new Date()) / 60000));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const left = h ? `${h} ч ${m} мин` : `${m} мин`;
    el.textContent = `до конца передачи ${left}`;
  }
  let epgExpanded = false;
  let lastTapTime = 0;
  let lastTapIndex = -1;

  let landscapeLocked = false;

  function lockLandscape() {
    if (!screen.orientation || !screen.orientation.lock) return;
    if (landscapeLocked) return; // уже заблокировано — повторный вызов вызывает мигание в Firefox
    landscapeLocked = true;
    screen.orientation.lock('landscape').catch(() => { landscapeLocked = false; });
  }

  function unlockLandscape() {
    landscapeLocked = false;
    if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
  }

  // ============================================================
  // EPG: панель вкладок по дням
  // ============================================================
  document.querySelectorAll('.epg-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.epg-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const day = parseInt(tab.getAttribute('data-day'), 10) || 0;
      currentEpgDay = Math.min(day, 1); // Только 0 (сегодня) или 1 (завтра)
      epgExpanded = false; // Сбрасываем кнопку "Показать ещё"
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

    // Если включённый канал есть на этой вкладке — показываем его в карусели
    const activeCard = channelListEl.querySelector('.channel-item.active');
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function renderChannels() {
    channelListEl.innerHTML = '';
    const q = currentSearch.trim().toLowerCase();

    CHANNELS.forEach((ch, i) => {
      const category = getChannelCategory(ch.title);

      if (currentFilter === 'favorites') {
        if (!isFavorite(ch.title)) return;
      } else if (currentFilter !== 'all' && !channelInCategory(ch.title, currentFilter)) {
        return;
      }

      if (q && !ch.title.toLowerCase().includes(q)) return;

      const item = document.createElement('div');
      item.className = 'channel-item' + (i === activeIndex ? ' active' : '');
      item.setAttribute('data-index', i);

      const hdBadge = ch.quality === 'HD' ? '<span class="quality-badge hd">HD</span>' : '';
      const logoFile = getLogoFile(ch.title);
      const logoHtml = logoFile ? `<img src="static/logos/${logoFile}" alt="${esc(ch.title)}" loading="lazy">` : esc(initials(ch.title));
      const favActive = isFavorite(ch.title);
      const heartClass = favActive ? 'fav-star active' : 'fav-star';

          // Ищем текущую передачу для этого канала
      let currentProgTime = '';
      let currentProgTitle = '';
      let channelEpg = EPG_DATA[ch.title];
      if (!channelEpg) {
        const key = Object.keys(EPG_DATA).find(k => k.toLowerCase() === ch.title.toLowerCase());
        if (key) channelEpg = EPG_DATA[key];
      }
      if (channelEpg && channelEpg.length > 0) {
        const now = new Date();
        let currentProg = null;
        for (let j = 0; j < channelEpg.length; j++) {
          const itemProg = channelEpg[j];
          const start = parseEPGDate(itemProg.start_iso);
          const stop = parseEPGDate(itemProg.stop_iso);
          if (!start || !stop) continue;
          if (now >= start && now < stop) { currentProg = itemProg; break; }
        }
        if (currentProg) {
          currentProgTime = fmtLocalTime(currentProg.start_iso, currentProg.start);
          currentProgTitle = currentProg.title;
        }
      }

      // Объединяем для атрибута title (чтобы при наведении показывалось полностью)
      const currentProgText = currentProgTime ? `${currentProgTime} ${currentProgTitle}` : '';

      item.innerHTML = `
        <div class="channel-card-inner">
          ${hdBadge}
          <div class="channel-logo">${logoHtml}</div>
          <button class="${heartClass}" data-fav="${esc(ch.title)}" title="В избранное" aria-label="В избранное">
            <svg viewBox="0 0 24 24" class="heart-icon">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
        <div class="channel-name-wrapper">
          <div class="channel-name" title="${esc(ch.title)}">${esc(ch.title)}</div>
        </div>
        <div class="channel-epg-now" title="${esc(currentProgText)}">
          ${currentProgTime ? `<span class="epg-card-time">${esc(currentProgTime)}</span> <span class="epg-card-title">${esc(currentProgTitle)}</span>` : ''}
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('fav-star')) return;

        // Двойной тап по карточке (телефон) — добавить/убрать из любимых
        const tapIndex = parseInt(item.getAttribute('data-index'), 10);
        const tapNow = Date.now();
        const isMobileView = window.matchMedia('(max-width: 900px)').matches;
        if (isMobileView && tapIndex === lastTapIndex && tapNow - lastTapTime < 350) {
          lastTapTime = 0;
          lastTapIndex = -1;
          const favBtn = item.querySelector('.fav-star');
          if (favBtn) favBtn.click();
          return;
        }
        lastTapTime = tapNow;
        lastTapIndex = tapIndex;

        // Если открыт поиск — закрываем его и сбрасываем запрос
        const wrapperEl = document.querySelector('.filters-wrapper');
        const searchWasActive = currentSearch.trim() !== '' ||
          (wrapperEl && wrapperEl.classList.contains('search-open'));
        if (searchWasActive) {
          currentSearch = '';
          const searchInput = document.getElementById('channelSearch');
          if (searchInput) searchInput.value = '';
          if (wrapperEl) wrapperEl.classList.remove('search-open');
        }

          if (tapIndex === activeIndex) {
          // Канал уже включён — поток не перезапускаем
          if (searchWasActive) {
            // поиск закрыт, список нужно перерисовать полным
            renderChannels();
            const activeCard = channelListEl.querySelector(`.channel-item[data-index="${tapIndex}"]`);
            if (activeCard) activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        } else {
          selectChannel(tapIndex);
        }

        // После поиска возвращаем страницу к плееру
          window.scrollTo({ top: 0, behavior: 'smooth' });
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
          // Если мы во вкладке "Любимые" и после удаления там не осталось каналов — переключаем на "Все"
          if (currentFilter === 'favorites' && favorites.size === 0) {
            setFilter('all');
          } else {
            renderChannels();
          }
          updateFavToggle();
        }, isFavorite(titleToUpdate) ? 650 : 0);
      });

      channelListEl.appendChild(item);
    });

    // Обновляем видимость кнопок прокрутки после перерисовки
    if (typeof updateScrollButtons === 'function') {
      setTimeout(updateScrollButtons, 10); // Небольшая задержка для пересчета размеров
    }
  }

  // ============================================================
  // Поиск и фильтры
  // ============================================================
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  const searchCloseBtn = document.getElementById('searchCloseBtn');
  const searchWrapper = document.querySelector('.filters-wrapper');

  if (searchToggleBtn && channelSearch) {
      const closeSearch = () => {
      searchWrapper.classList.remove('search-open');
      channelSearch.value = '';
      currentSearch = '';
      renderChannels();
    };

    // Клик по лупе — открываем/закрываем поиск
    searchToggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = searchWrapper.classList.toggle('search-open');
      
        if (isOpen) {
        searchWrapper.scrollTo({ left: 0, behavior: 'smooth' });
        const isMobileSearch = window.matchMedia('(max-width: 900px)').matches;
        setTimeout(() => channelSearch.focus({ preventScroll: true }), 50);

        if (isMobileSearch) {
          // Поднимаем строку поиска к верху экрана, чтобы клавиатура не закрывала каналы
          const scrollSearchToTop = () =>
            searchWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(scrollSearchToTop, 60);
          setTimeout(scrollSearchToTop, 400); // повтор, когда клавиатура уже выехала
        }
      } else {
        closeSearch();
      }
    });

    // Клик по крестику — закрываем
    if (searchCloseBtn) {
      searchCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeSearch();
      });
    }

    // Ввод текста
    channelSearch.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      renderChannels();
    });

    // Закрываем поиск при клике вне поля (если поле пустое)
    document.addEventListener('click', (e) => {
      if (!searchWrapper.contains(e.target) && !channelSearch.value) {
        searchWrapper.classList.remove('search-open');
      }
    });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Закрываем поиск и сбрасываем запрос
      if (searchWrapper) searchWrapper.classList.remove('search-open');
      currentSearch = '';
      if (channelSearch) channelSearch.value = '';

      setFilter(btn.getAttribute('data-filter'));
    });
  });

  // ============================================================
  // Стрелки прокрутки категорий (ПК)
  // ============================================================
  const filtersArrowLeft = document.getElementById('filtersArrowLeft');
  const filtersArrowRight = document.getElementById('filtersArrowRight');

  function updateFiltersArrows() {
    if (!searchWrapper || !filtersArrowLeft || !filtersArrowRight) return;
    const maxScroll = searchWrapper.scrollWidth - searchWrapper.clientWidth;
    filtersArrowLeft.classList.toggle('visible', searchWrapper.scrollLeft > 5);
    filtersArrowRight.classList.toggle('visible', maxScroll > 5 && searchWrapper.scrollLeft < maxScroll - 5);
  }

  if (searchWrapper && filtersArrowLeft && filtersArrowRight) {
    filtersArrowLeft.addEventListener('click', (e) => {
      e.stopPropagation();
      searchWrapper.scrollBy({ left: -250, behavior: 'smooth' });
    });
    filtersArrowRight.addEventListener('click', (e) => {
      e.stopPropagation();
      searchWrapper.scrollBy({ left: 250, behavior: 'smooth' });
    });

    searchWrapper.addEventListener('scroll', updateFiltersArrows);
    // меняется ширина контента (открытие/закрытие поиска)
    searchWrapper.addEventListener('transitionend', updateFiltersArrows);
    window.addEventListener('resize', updateFiltersArrows);
    window.addEventListener('load', updateFiltersArrows);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateFiltersArrows);
    updateFiltersArrows();
  }

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

      // Если мы во вкладке "Любимые" и после удаления там не осталось каналов — переключаем на "Все"
      if (currentFilter === 'favorites' && favorites.size === 0) {
        setFilter('all');
      } else {
        renderChannels();
      }
      updateFavToggle();
    });
  }

  // ============================================================
  // EPG логика
  // ============================================================
    // Время передачи в часовом поясе зрителя (из ISO-даты); fallback — исходная строка «ЧЧ:ММ» (МСК)
  function fmtLocalTime(iso, fallback) {
    const d = parseEPGDate(iso);
    if (!d) return fallback || '';
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  }

  // Экранирование текста перед вставкой в HTML
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

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

    // 2. Если это "Сегодня", оставляем 4 последние прошедшие передачи, текущую и все следующие
    if (dayOffset === 0) {
      const firstCurrent = filtered.findIndex(it => parseEPGDate(it.stop_iso) > now);
      if (firstCurrent === -1) {
        filtered = filtered.slice(-4);
      } else {
        filtered = filtered.slice(Math.max(0, firstCurrent - 4));
      }
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
        item.classList.remove('epg-past');
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
        item.classList.toggle('epg-past', now >= stop);
        const badge = item.querySelector('.live-badge');
        if (badge) badge.remove();
        item.style.background = '';
      }
    });
  }
  setInterval(updateCurrentEPGHighlight, 60000);

  const epgShowMoreBtn = document.getElementById('epgShowMoreBtn');

  if (epgShowMoreBtn) {
    epgShowMoreBtn.addEventListener('click', () => {
      epgExpanded = !epgExpanded; // Переключаем состояние (открыто/закрыто)
      if (activeIndex >= 0 && CHANNELS[activeIndex]) {
        renderEPG(CHANNELS[activeIndex].title);
      }
    });
  }

    // Прокручиваем панель программы так, чтобы текущая передача была по центру
  // (к концу дня она сама опускается ниже: дальше низа списка прокрутить нельзя)
  function scrollEpgToCurrent() {
        if (!epgListEl) return;

    // Список прокручивается сам только в ПК-раскладке; в других случаях страницу не трогаем
    const scrollable = getComputedStyle(epgListEl).overflowY !== 'visible' &&
                       epgListEl.scrollHeight > epgListEl.clientHeight + 1;
    if (!scrollable) return;

    requestAnimationFrame(() => {
      const current = epgListEl.querySelector('.epg-item.now-playing');
      if (!current) { epgListEl.scrollTop = 0; return; }

      const lr = epgListEl.getBoundingClientRect();
      const ir = current.getBoundingClientRect();
      const target = epgListEl.scrollTop + (ir.top - lr.top)
                     - (epgListEl.clientHeight / 2) + (ir.height / 2);
      epgListEl.scrollTop = Math.max(0, target);
    });
  }

  function renderEPG(title) {
    if (!epgListEl) return;
    updateEpgDate();
    
    let channelEpg = EPG_DATA[title];
    if (!channelEpg) {
      const key = Object.keys(EPG_DATA).find(k => k.toLowerCase() === title.toLowerCase());
      if (key) channelEpg = EPG_DATA[key];
    }
    
    // Забираем все доступные передачи на этот день (лимит 40, чтобы точно хватило)
    const allVisible = takeUpcoming(channelEpg, 100, currentEpgDay);

    if (allVisible.length > 0) {
      // На мобильных (<= 900px) показываем 5, на ПК — 11
      const isMobile = window.innerWidth <= 900;
      const initialLimit = isMobile ? 5 : 11;
      
      const nowTs = new Date();
      const pastCount = currentEpgDay === 0
        ? allVisible.filter(it => parseEPGDate(it.stop_iso) <= nowTs).length
        : 0;
      const collapsed = allVisible.slice(pastCount, pastCount + 5);

      let visible = allVisible;
      if (isMobile && !epgExpanded) {
        visible = collapsed.length ? collapsed : allVisible.slice(-5);
      }

      epgListEl.innerHTML = visible.map((item) => {
        // Находим реальный индекс этой передачи в полном массиве (для клика)
        const realIdx = allVisible.indexOf(item);
        return `
        <div class="epg-item" data-start="${item.start_iso}" data-stop="${item.stop_iso}" data-idx="${realIdx}">
          <span class="epg-time">${fmtLocalTime(item.start_iso, item.start)}</span>
          <span class="epg-name">
            <div class="epg-info-row">
              <span class="epg-title-text">${esc(item.title)}</span>
            </div>
          </span>
        </div>
      `}).join('');

      // Клик по передаче — показать описание
      epgListEl.querySelectorAll('.epg-item').forEach(el => {
        el.addEventListener('click', () => showProgramDescription(channelEpg, parseInt(el.getAttribute('data-idx'), 10), allVisible));
      });

      updateCurrentEPGHighlight();
      scrollEpgToCurrent();

      // Показываем/скрываем кнопку "Показать ещё / Скрыть"
      if (epgShowMoreBtn) {
        if (isMobile && allVisible.length > collapsed.length) {
          epgShowMoreBtn.style.display = 'block';
          epgShowMoreBtn.textContent = epgExpanded ? 'Скрыть' : 'Показать ещё';
        } else {
          epgShowMoreBtn.style.display = 'none';
        }
      }
    } else {
      epgListEl.innerHTML = '<div style="color: var(--text-muted); font-size: 14px; text-align:center; margin-top:20px;">Нет данных о программе</div>';
      if (epgShowMoreBtn) epgShowMoreBtn.style.display = 'none';
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

    descOverlay.querySelector('.desc-time').textContent =
      `${fmtLocalTime(item.start_iso, item.start)}–${fmtLocalTime(item.stop_iso, item.stop)}`;
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
      currentProgStop = null;
      updatePlayerRemaining();
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
    nowPlayingText.innerHTML = `<span class="label">Сейчас идёт:</span> ${esc(progTitle)}`;
    nowPlayingBanner.style.display = 'block';

    currentProgTitle = currentProg ? currentProg.title : '';
    syncPlayerOverlay();

    // Конец передачи берём только если она идёт прямо сейчас
    currentProgStop = null;
    currentProgStopText = '';
    if (currentProg) {
      const s = parseEPGDate(currentProg.start_iso);
      const e = parseEPGDate(currentProg.stop_iso);
      if (s && e && now >= s && now < e) {
        currentProgStop = e;
        currentProgStopText = fmtLocalTime(currentProg.stop_iso, currentProg.stop);
      }
    }
    updatePlayerRemaining();
  }

  // ============================================================
  // Плеер: инициализация + переподключение + PiP + error
  // ============================================================
  let retryAttempt = 0;
  let retryTimer = null;
  let offlineOverlay = null;
  let lastStreamUrl = '';

  // hls.js, если браузер его поддерживает (на iPhone Safari остаётся встроенный HLS)
  let hls = null;
  let onHlsManifest = null;
  let prebufferCleanup = null; // сброс ожидания буфера при смене канала
  let streamLoadedAt = 0;      // когда последний раз загружали поток

  const PREBUFFER_SECONDS = 8;     // сколько секунд видео накопить перед стартом
  const PREBUFFER_MAX_WAIT = 12000; // но ждать не дольше 12 секунд (мс)
  const USE_HLSJS = typeof Hls !== 'undefined' && Hls.isSupported();

  function loadStream(url) {
    if (!player) return;
    player.el().classList.add('cv-loading'); // индикатор до старта воспроизведения

    if (!USE_HLSJS) {
      player.src({ src: url, type: 'application/x-mpegURL' });
      player.play().catch(() => {});
      return;
    }

    if (hls) { hls.destroy(); hls = null; }

    if (prebufferCleanup) { prebufferCleanup(); prebufferCleanup = null; }
    streamLoadedAt = Date.now();

    const video = player.tech(true).el();
    video.autoplay = false; // стартуем сами, когда накопится буфер
    hls = new Hls({
      lowLatencyMode: false,
      liveSyncDurationCount: 3,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      backBufferLength: 30,
      manifestLoadingMaxRetry: 4,
      levelLoadingMaxRetry: 4,
      fragLoadingMaxRetry: 6
    });

    const h = hls;
      h.on(Hls.Events.MANIFEST_PARSED, () => {
      if (onHlsManifest) onHlsManifest(h);

      // Ждём, пока накопится запас видео, и только потом запускаем
      let started = false;
      let checkTimer = null;
      let maxTimer = null;

      const cleanup = () => {
        clearInterval(checkTimer);
        clearTimeout(maxTimer);
      };
      const startPlayback = () => {
        if (started) return;
        started = true;
        cleanup();
        player.play().catch(() => player.el().classList.remove('cv-loading'));
      };
      const bufferedAhead = () => {
        const b = video.buffered;
        if (!b.length) return 0;
        return b.end(b.length - 1) - video.currentTime;
      };

      checkTimer = setInterval(() => {
        if (bufferedAhead() >= PREBUFFER_SECONDS) startPlayback();
      }, 300);
      maxTimer = setTimeout(startPlayback, PREBUFFER_MAX_WAIT);

      prebufferCleanup = cleanup;
    });
    h.on(Hls.Events.ERROR, (evt, data) => {
      if (!data.fatal) return;
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        h.recoverMediaError();
      } else {
        scheduleRetry();
      }
    });

    h.loadSource(url);
    h.attachMedia(video);
  }
  


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
        loadStream(lastStreamUrl);
      }
    });
    return offlineOverlay;
  }

  function showOfflineOverlay() {
    if (!player) return;
    const el = player.el();
    const ov = createOfflineOverlay();
    if (!ov.parentNode) el.appendChild(ov);
    el.classList.remove('cv-loading');
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
          loadStream(lastStreamUrl);
        } catch(e) {}
      }
    }, delay);
  }

  function initCustomPlayer() {
    player = videojs('video', {
      controls: false,
      autoplay: false,
      preload: 'auto',
      fill: true,
      html5: { vhs: { overrideNative: true } }
    });

    const el = player.el();

    // Убираем родные контролы браузера (Firefox рисует свой значок «плей»)
    const nativeVideo = player.tech(true) && player.tech(true).el();
    if (nativeVideo) {
      nativeVideo.controls = false;
      nativeVideo.removeAttribute('controls');
      nativeVideo.autoplay = false;
      nativeVideo.removeAttribute('autoplay');
    }

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
      <div class="cv-remaining" id="cvRemaining"></div>

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

    // Индикатор загрузки: виден, пока канал не начал воспроизводиться или буферизуется
    const spinner = document.createElement('div');
    spinner.className = 'cv-spinner';
    el.appendChild(spinner);
    player.on('waiting', () => el.classList.add('cv-loading'));
    player.on('playing', () => el.classList.remove('cv-loading'));

    playerNowEl = document.createElement('div');
    playerNowEl.className = 'cv-now-playing';
    playerNowEl.innerHTML = `<span class="cv-now-text"></span>`;
    el.appendChild(playerNowEl);
    syncPlayerOverlay();
    updatePlayerRemaining();

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

    const hideBar = () => {
      isBarVisible = false;
      clearTimeout(barHideTimeout);
      el.classList.remove('cv-visible');
    };

    const isBarShown = () =>
      el.classList.contains('cv-visible') || player.paused();

    let barWasVisibleOnDown = false;
    let lastPointerType = 'mouse';
    clickOverlay.addEventListener('pointerdown', (e) => {
      barWasVisibleOnDown = isBarShown();
      lastPointerType = e.pointerType;
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

            // Мышь (ПК): клик в любое место — пауза/плей, как раньше
      if (lastPointerType === 'mouse') {
        player.paused() ? player.play() : player.pause();
        showBar();
        return;
      }

      // Касание: пауза только по центру, где кнопка
      const r = clickOverlay.getBoundingClientRect();
      const dist = Math.hypot(
        e.clientX - (r.left + r.width / 2),
        e.clientY - (r.top + r.height / 2)
      );
      const zone = Math.max(centerBtn.offsetWidth, 56) * 0.75;

      if (dist <= zone) {
        player.paused() ? player.play() : player.pause();
        showBar();
      } else if (!player.paused()) {
        // клик в пустое место — прячем панель и кнопку
        hideBar();
      }
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
      centerBtn.innerHTML = pauseSvg;
      showBar();
    });

    player.on('pause', () => {
      btnPlay.innerHTML = playSvg;
      centerBtn.innerHTML = playSvg;
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

    // Панель скрылась — закрываем и меню качества, чтобы оно не вернулось вместе с ней
    new MutationObserver(() => {
      if (!isBarShown()) qualityMenu.classList.remove('show');
    }).observe(el, { attributes: true, attributeFilter: ['class'] });

      // После паузы возвращаемся в прямой эфир, а не продолжаем с места паузы
    let pausedAt = 0;
    player.on('pause', () => { pausedAt = Date.now(); });
    player.on('play', () => {
      // пауза была до загрузки текущего потока (смена канала) — не трогаем
      if (!pausedAt || pausedAt < streamLoadedAt) { pausedAt = 0; return; }
      const pausedFor = Date.now() - pausedAt;
      pausedAt = 0;
      if (pausedFor < 1500) return; // короткую паузу не трогаем
      if (hls && hls.liveSyncPosition > 0) {
        player.tech(true).el().currentTime = hls.liveSyncPosition;
      }
    });

    // --- Переподключение / ошибка ---// --- Переподключение / ошибка ---
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

  // Полный экран на телефоне/планшете — сразу горизонтальный режим
    player.on('fullscreenchange', () => {
      if (!screen.orientation) return;
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      if (player.isFullscreen() && isTouch) {
        lockLandscape();
      } else {
        // небольшая задержка: при смене канала событие может ненадолго «мигнуть»
        setTimeout(() => {
        if (!player.isFullscreen()) unlockLandscape();
        }, 400);
      }
    });

        // Меню качества, когда играет hls.js
    onHlsManifest = (h) => {
      qualityMenu.innerHTML = '';
      const items = [];
      (h.levels || []).forEach((lv, idx) => {
        if (lv.height) items.push({ idx, height: lv.height });
      });
      items.sort((a, b) => b.height - a.height);

      const updateUI = (text) => {
        qualityMenu.querySelectorAll('.cv-quality-item').forEach(it => {
          it.classList.toggle('active', it.textContent === text);
        });
      };
      const choose = (idx, label, saveValue) => {
        h.currentLevel = idx; // -1 = авто
        qualityBtn.textContent = label;
        updateUI(label);
        if (saveValue !== undefined) saveQualityPref(saveValue);
      };

      items.forEach(({ idx, height }) => {
        const item = document.createElement('div');
        item.className = 'cv-quality-item';
        item.textContent = `${height}p`;
        item.onclick = (e) => {
          e.stopPropagation();
          choose(idx, `${height}p`, height);
          qualityMenu.classList.remove('show');
          showBar();
        };
        qualityMenu.appendChild(item);
      });

      const autoItem = document.createElement('div');
      autoItem.className = 'cv-quality-item';
      autoItem.textContent = 'Авто';
      autoItem.onclick = (e) => {
        e.stopPropagation();
        choose(-1, 'Авто', 'auto');
        qualityMenu.classList.remove('show');
        showBar();
      };
      qualityMenu.appendChild(autoItem);

      // Применяем сохранённое качество (или ближайшее)
      const pref = loadQualityPref();
      if (pref === 'auto' || items.length === 0) {
        choose(-1, 'Авто');
      } else {
        let best = items[0];
        items.forEach(it => {
          if (Math.abs(it.height - pref) < Math.abs(best.height - pref)) best = it;
        });
        choose(best.idx, `${best.height}p`);
      }
    };

    player.on('loadedmetadata', () => {
      if (USE_HLSJS) return; // меню строит hls.js
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
          saveQualityPref(level.height);
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
        saveQualityPref('auto');
        qualityBtn.textContent = 'Авто';
        updateQualityUI('Авто');
        qualityMenu.classList.remove('show');
        showBar();
      };
      qualityMenu.appendChild(autoBtn);

            if (hasLevels) {
        const pref = loadQualityPref();
        if (pref === 'auto') {
          setLevel(-1);
          qualityBtn.textContent = 'Авто';
          updateQualityUI('Авто');
        } else {
          // ищем уровень с ближайшей высотой (при равенстве берём более высокий)
          let bestIdx = -1;
          let bestDiff = Infinity;
          for (let i = levels.length - 1; i >= 0; i--) {
            if (!levels[i].height) continue;
            const diff = Math.abs(levels[i].height - pref);
            if (diff < bestDiff) {
              bestDiff = diff;
              bestIdx = i;
            }
          }
          if (bestIdx >= 0) {
            setLevel(bestIdx);
            const label = `${levels[bestIdx].height}p`;
            qualityBtn.textContent = label;
            updateQualityUI(label);
          } else {
            setLevel(-1);
            qualityBtn.textContent = 'Авто';
            updateQualityUI('Авто');
          }
        }
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

   // При переходе на другой канал сворачиваем программу и возвращаем вкладку «Сегодня»
    if (activeIndex !== i) {
      epgExpanded = false;
      currentEpgDay = 0;
      document.querySelectorAll('.epg-tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-day') === '0');
      });
    }

    const hadActiveChannel = activeIndex >= 0;
    activeIndex = i;
    const ch = CHANNELS[i];

    // Канал не входит в открытую вкладку (например, переключили стрелками) — переходим на «Все»
    if (hadActiveChannel && currentFilter !== 'all') {
      const inCurrentFilter = currentFilter === 'favorites'
        ? isFavorite(ch.title)
        : channelInCategory(ch.title, currentFilter);
      if (!inCurrentFilter) setFilter('all');
    }

    infoTitle.textContent = ch.title;

    const logoFile = getLogoFile(ch.title);
    if (logoFile) {
      infoLogo.innerHTML = `<img src="static/logos/${logoFile}" alt="${esc(ch.title)}">`;
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

        renderChannels();

    const activeItem = channelListEl.querySelector(`.channel-item[data-index="${i}"]`);
    if (activeItem) {
      // Вычисляем позицию для прокрутки только внутри карусели, не трогая страницу
      const scrollLeft = activeItem.offsetLeft - (channelListEl.clientWidth / 2) + (activeItem.offsetWidth / 2);
      channelListEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
    if (!player) {
      initCustomPlayer();
    }

    lastStreamUrl = ch.stream;
    retryAttempt = 0;
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    hideOfflineOverlay();

    loadStream(ch.stream);

    // Если плеер в полном экране на телефоне — удерживаем горизонтальный режим
    if (player.isFullscreen() && window.matchMedia('(pointer: coarse)').matches) {
      lockLandscape(); // ничего не делает, если уже заблокировано
    }
  }

  // ============================================================
  // Горячие клавиши ПК
  // ============================================================
  document.addEventListener('keydown', (e) => {
    // Игнорируем ввод в поле поиска
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

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

    // ============================================================
  // Скрываем передачу, которая не влезает целиком внизу панели
  // ============================================================
  const infoPanelEl = document.querySelector('.info-panel');
  let clipRaf = 0;

  function updateEpgClipping() {
    if (!infoPanelEl || !epgListEl) return;
    const items = epgListEl.querySelectorAll('.epg-item');
    const overflowing = epgListEl.scrollHeight > epgListEl.clientHeight + 1;
    const panelRect = epgListEl.getBoundingClientRect();
    const visibleBottom = panelRect.top + epgListEl.clientTop + epgListEl.clientHeight;

    items.forEach(item => {
      if (!overflowing) {
        item.classList.remove('epg-clipped');
        return;
      }
      const r = item.getBoundingClientRect();
      // Передача частично видна внизу — скрываем, пока не влезет целиком
      item.classList.toggle('epg-clipped', r.bottom > visibleBottom + 1 && r.top < visibleBottom);
    });
  }

  function scheduleEpgClipping() {
    cancelAnimationFrame(clipRaf);
    clipRaf = requestAnimationFrame(updateEpgClipping);
  }

  if (infoPanelEl && epgListEl) {
    epgListEl.addEventListener('scroll', scheduleEpgClipping, { passive: true });
    window.addEventListener('resize', scheduleEpgClipping);
    new MutationObserver(scheduleEpgClipping).observe(epgListEl, { childList: true });
    if (window.ResizeObserver) new ResizeObserver(scheduleEpgClipping).observe(infoPanelEl);
    scheduleEpgClipping();
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && activeIndex >= 0 && CHANNELS[activeIndex]) {
      renderEPG(CHANNELS[activeIndex].title);
      updateNowPlayingBanner(CHANNELS[activeIndex].title);
    }
  });

// Обновляем баннер и EPG раз в минуту
  setInterval(() => {
    if (activeIndex >= 0 && CHANNELS[activeIndex]) {
      updateNowPlayingBanner(CHANNELS[activeIndex].title);
    }
  }, 60000);

  // Обновляем счётчик "осталось" каждую секунду
  setInterval(() => {
    if (currentProgStop) {
      updatePlayerRemaining();
    }
  }, 1000);

  // ============================================================
  // КНОПКИ ПРОКРУТКИ КАРУСЕЛИ (ПК)
  // ============================================================
  // Функция обновления кнопок прокрутки (сделана глобальной)
  function updateScrollButtons() {
    if (!scrollLeftBtn || !scrollRightBtn || !channelListEl) return;

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
  }

    // Шаг прокрутки: показываем следующий «экран», последний видимый канал становится первым
  function getCarouselStep() {
    const item = channelListEl.querySelector('.channel-item');
    if (!item) return channelListEl.clientWidth * 0.8;
    const gap = parseFloat(getComputedStyle(channelListEl).columnGap) || 0;
    const itemW = item.offsetWidth + gap;
    const visibleCount = Math.floor(channelListEl.clientWidth / itemW);
    return Math.max(1, visibleCount - 1) * itemW;
  }

  if (scrollLeftBtn && scrollRightBtn && channelListEl) {
    scrollLeftBtn.addEventListener('click', () => {
      channelListEl.scrollBy({ left: -getCarouselStep(), behavior: 'smooth' });
    });

    scrollRightBtn.addEventListener('click', () => {
      channelListEl.scrollBy({ left: getCarouselStep(), behavior: 'smooth' });
    });

    channelListEl.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
  }

      // ============================================================
  // Старт
  // ============================================================
  
  // Логика показа подсказки про двойной тап (только 1 раз и только на телефоне)
  const LS_TIP_SHOWN = 'tv_tip_doubletap_shown';
  
    function showMobileTipIfNeeded() {
    // Проверяем, мобильное ли устройство
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (!isMobile) return;

    // Проверяем, показывали ли уже
    try {
      if (localStorage.getItem(LS_TIP_SHOWN)) return;
    } catch(e) {}

    const tipEl = document.getElementById('mobileTip');
    if (!tipEl) return;

    // Показываем через 3 секунды после загрузки, чтобы интерфейс успел отрисоваться
    setTimeout(() => {
      tipEl.classList.add('show');
      
      // Автоматически скрываем через 10 секунд
      const autoHide = setTimeout(hideTip, 10000);

      function hideTip() {
        // Плавно скрываем (добавляем класс анимации исчезновения)
        tipEl.classList.add('toast-hide');
        try { localStorage.setItem(LS_TIP_SHOWN, '1'); } catch(e) {}
        clearTimeout(autoHide);

        // Ждем окончания анимации и убираем класс show
        setTimeout(() => {
          tipEl.classList.remove('show', 'toast-hide');
        }, 300);
      }
    }, 2000); // 3 секунды задержки
  }

  // Вызываем показ подсказки
  showMobileTipIfNeeded();

  renderChannels();
  if (CHANNELS.length > 0) {
    const saved = loadLastChannel();
    const startIdx = (saved >= 0 && saved < CHANNELS.length) ? saved : 0;
    // Небольшая задержка, чтобы DOM успел отрисоваться
    setTimeout(() => selectChannel(startIdx), 0);
  }