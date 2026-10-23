/* Площадка МирРа — небольшой vanilla JS: меню, окно связи, галереи, просмотр фото и видео, появление блоков. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // иконки света для телефона: яркий — солнце, средний — лампочка, мягкий — торшер
  var ICON = {
    'Яркий': '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
    'Средний': '<path d="M9.2 17.5h5.6M10 20.5h4"/><path d="M12 3a6 6 0 0 0-3.4 10.9c.6.4.9 1 .9 1.7v.4h5v-.4c0-.7.3-1.3.9-1.7A6 6 0 0 0 12 3Z"/>',
    'Мягкий': '<path d="M8 3h8l2.3 6.5H5.7Z"/><path d="M12 9.5v11M8.5 20.5h7"/>'
  };

  /* ---------- заглушки видео: видны, только если у body есть класс show-placeholders ---------- */
  var showPh = document.body.classList.contains('show-placeholders');
  var placeholder = function (el, posterFrom) {
    if (!showPh) return;
    el.hidden = false;
    el.classList.add('is-placeholder');
    el.setAttribute('aria-disabled', 'true');
    var poster = posterFrom && (posterFrom.currentSrc || posterFrom.src);
    var target = el.querySelector('.video-thumb__img') || el;
    if (poster) target.style.backgroundImage = 'url("' + poster + '")';
    var small = el.querySelector('small');
    if (small) small.innerHTML = 'Видео <span class="soon-badge">скоро</span>';
  };

  /* ---------- шапка: линия при прокрутке ---------- */
  var header = $('[data-header]');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- мобильное меню ---------- */
  var burger = $('[data-burger]');
  var menu = $('[data-menu]');
  menu.hidden = false;
  menu.setAttribute('aria-hidden', 'true');
  var setMenu = function (open) {
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.setAttribute('aria-hidden', String(!open));
    if (open) { var first = $('a', menu); if (first) first.focus({ preventScroll: true }); }
  };
  burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  $$('.menu__nav a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });

  /* ---------- окно «Как связаться» ---------- */
  var sheet = $('[data-sheet]');
  var sheetRoom = $('[data-sheet-room]');
  var sheetReturn = null;
  var openSheet = function (room, from) {
    sheetReturn = from || null;
    var title = from && from.getAttribute('data-sheet-title');
    sheetRoom.textContent = title || (room ? 'Забронировать · ' + room : 'Забронировать дату');
    sheet.showModal();
    $('.sheet__panel', sheet).focus({ preventScroll: true });
    document.body.classList.add('sheet-open');
    window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { sheet.classList.add('is-open'); }); });
  };
  var closeSheet = function () {
    if (!sheet.open) return;
    sheet.classList.remove('is-open');
    window.setTimeout(function () { sheet.close(); }, reduce ? 0 : 420);
  };
  sheet.addEventListener('close', function () {
    sheet.classList.remove('is-open');
    document.body.classList.remove('sheet-open');
    if (sheetReturn) sheetReturn.focus({ preventScroll: true });
  });
  sheet.addEventListener('cancel', function (e) { e.preventDefault(); closeSheet(); });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
  $('[data-sheet-close]').addEventListener('click', closeSheet);
  $$('[data-contact]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      if (menu.classList.contains('is-open')) setMenu(false);
      openSheet(el.getAttribute('data-room'), el);
    });
  });

  /* ---------- появление блоков при прокрутке (один раз) ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- плавающая кнопка: после первого экрана, кроме контактов ---------- */
  var floatBtn = $('[data-float]');
  if (floatBtn && 'IntersectionObserver' in window) {
    var pastHero = false, atContacts = false;
    var sync = function () {
      var show = pastHero && !atContacts;
      floatBtn.classList.toggle('is-on', show);
      floatBtn.setAttribute('aria-hidden', String(!show));
      floatBtn.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (entries) {
      var en = entries[0];
      pastHero = !en.isIntersecting && en.boundingClientRect.top < 0;
      sync();
    }, { threshold: 0 }).observe($('.hero__actions'));
    new IntersectionObserver(function (entries) {
      atContacts = entries[0].isIntersecting;
      sync();
    }, { threshold: 0, rootMargin: '0px 0px -30% 0px' }).observe($('#contacts'));
  }

  /* ---------- текущий раздел: название под логотипом + активный пункт меню ---------- */
  var subEl = $('[data-current-section]');
  var sections = $$('section[data-section-name]');
  var navLinks = $$('.nav a');
  if (subEl && sections.length) {
    var glider = $('.nav__glider');
    var moveGlider = function () {
      if (!glider) return;
      var act = $('.nav a.is-active');
      if (!act) { glider.classList.remove('is-on'); return; }
      glider.style.width = act.offsetWidth + 'px';
      glider.style.transform = 'translateX(' + act.offsetLeft + 'px)';
      glider.classList.add('is-on');
    };
    window.addEventListener('resize', moveGlider);
    var defaultSub = subEl.textContent;
    var current = null, swapTimer = null;
    var setSection = function (sec) {
      if (sec === current) return;
      current = sec;
      var text = sec ? sec.getAttribute('data-section-name') : defaultSub;
      navLinks.forEach(function (a) { a.classList.toggle('is-active', !!sec && a.getAttribute('href') === '#' + sec.id); });
      moveGlider();
      window.clearTimeout(swapTimer);
      subEl.classList.add('is-out');
      swapTimer = window.setTimeout(function () {
        subEl.textContent = text;
        subEl.classList.toggle('is-section', !!sec);
        subEl.classList.remove('is-out');
      }, reduce ? 0 : 220);
    };
    var findSection = function () {
      var line = header.offsetHeight + 24, found = null;
      sections.forEach(function (sec) { if (!sec.hidden && sec.getBoundingClientRect().top <= line) found = sec; });
      if (found && found.getBoundingClientRect().bottom <= line) found = null;
      setSection(found);
    };
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      window.requestAnimationFrame(function () { ticking = false; findSection(); });
    }, { passive: true });
    findSection();
  }

  /* ---------- пока страницу листают — класс is-scrolling (дверь в «Условиях» прикрывается) ---------- */
  var scrollIdle = 0;
  window.addEventListener('scroll', function () {
    document.documentElement.classList.add('is-scrolling');
    clearTimeout(scrollIdle);
    scrollIdle = setTimeout(function () { document.documentElement.classList.remove('is-scrolling'); }, 220);
  }, { passive: true });

  /* ---------- кнопка «Наверх»: появляется после полутора экранов прокрутки.
     После перехода по ссылке из текста (не из меню) временно становится «Вернуться» — стрелка влево,
     ведёт на место, откуда ушли. Сама возвращается к «Наверх», если человек ушёл далеко или вернулся сам. ---------- */
  var toTop = $('[data-to-top]');
  if (toTop) {
    var tip = $('[data-to-top-tip]', toTop);
    var back = null;       // { y, target, at }
    var tipTimer = 0;
    var syncTop = function () {
      var on = !!back || window.scrollY > window.innerHeight * 1.5;
      if (on === toTop.classList.contains('is-on')) return;
      toTop.classList.toggle('is-on', on);
      toTop.setAttribute('aria-hidden', String(!on));
      toTop.tabIndex = on ? 0 : -1;
    };
    var setBack = function (state) {
      back = state;
      toTop.classList.toggle('is-back', !!back);
      clearTimeout(tipTimer);
      toTop.classList.remove('show-tip');
      if (back) {
        toTop.setAttribute('aria-label', back.label);
        tip.textContent = back.label;
        toTop.classList.add('show-tip');
        tipTimer = setTimeout(function () { toTop.classList.remove('show-tip'); }, 3500);
      } else {
        toTop.setAttribute('aria-label', 'Наверх');
      }
      syncTop();
    };
    var checkBack = function () {
      if (!back || Date.now() - back.at < 1500) return;   // пока идёт плавная прокрутка к цели — не трогаем
      var h = window.innerHeight;
      var farFromTarget = Math.abs(back.target.getBoundingClientRect().top) > h * 2.5;
      var nearOrigin = Math.abs(window.scrollY - back.y) < h * 0.3;
      if (farFromTarget || nearOrigin) setBack(null);
    };
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.hasAttribute('data-contact') || a.closest('.nav, .menu, .header, .footer, .skip')) return;
      var target = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (!target) return;
      var from = a.closest('[data-section-name]');
      var name = from && from.getAttribute('data-section-name');
      setBack({ y: window.scrollY, target: target, at: Date.now(), label: name ? 'Назад к разделу «' + name + '»' : 'Вернуться назад' });
    });
    syncTop();
    window.addEventListener('scroll', function () { syncTop(); checkBack(); }, { passive: true });
    toTop.addEventListener('click', function () {
      if (back) {
        var y = back.y;
        setBack(null);
        window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        return;
      }
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var brand = $('.brand'); if (brand) brand.focus({ preventScroll: true });
    });
  }

  /* ---------- просмотр фото и видео на весь экран ---------- */
  var lb = $('[data-lb]');
  var lbTrack = $('[data-lb-track]');
  var lbCount = $('[data-lb-count]');
  var lbItems = [];
  var lbReturn = null;

  var lbIndex = function () { var w = lbTrack.clientWidth; return w ? Math.round(lbTrack.scrollLeft / w) : 0; };
  var lbUpdate = function () {
    lbCount.textContent = (lbIndex() + 1) + ' / ' + lbItems.length;
    var cur = lbTrack.children[lbIndex()];
    $$('video', lbTrack).forEach(function (v) { if (!cur || !cur.contains(v)) v.pause(); });
  };
  var lbGo = function (i, smooth) {
    i = Math.max(0, Math.min(lbItems.length - 1, i));
    lbTrack.scrollTo({ left: i * lbTrack.clientWidth, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  };
  var lbOpen = function (items, start, from) {
    lbItems = items;
    lbReturn = from || null;
    lbTrack.innerHTML = '';
    items.forEach(function (it) {
      var slide = document.createElement('div');
      slide.className = 'lb__slide';
      if (it.video) {
        var v = document.createElement('video');
        v.src = it.video; v.controls = true; v.playsInline = true; v.preload = 'metadata';
        if (it.poster) v.poster = it.poster;
        v.setAttribute('aria-label', it.alt || 'Видео');
        slide.appendChild(v);
      } else {
        var img = document.createElement('img');
        img.src = it.src; img.alt = it.alt; img.decoding = 'async';
        slide.appendChild(img);
      }
      lbTrack.appendChild(slide);
    });
    $$('.lb__nav', lb).forEach(function (b) { b.hidden = items.length < 2; });
    lbCount.hidden = items.length < 2;
    lb.showModal();
    document.body.classList.add('lb-open');
    lbGo(start, false);
    lbUpdate();
    var startVideo = items[start] && items[start].video && $('video', lbTrack.children[start]);
    if (startVideo) { var p = startVideo.play(); if (p && p.catch) p.catch(function () {}); }
  };
  lb.addEventListener('close', function () {
    $$('video', lbTrack).forEach(function (v) { v.pause(); });
    lbTrack.innerHTML = '';
    document.body.classList.remove('lb-open');
    if (lbReturn) lbReturn.focus({ preventScroll: true });
  });
  $('[data-lb-close]').addEventListener('click', function () { lb.close(); });
  $('[data-lb-prev]').addEventListener('click', function () { lbGo(lbIndex() - 1, true); });
  $('[data-lb-next]').addEventListener('click', function () { lbGo(lbIndex() + 1, true); });
  lbTrack.addEventListener('scroll', function () { window.requestAnimationFrame(lbUpdate); }, { passive: true });
  lb.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'VIDEO') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); lbGo(lbIndex() + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); lbGo(lbIndex() - 1, true); }
  });
  lbTrack.addEventListener('click', function (e) { if (e.target.classList.contains('lb__slide')) lb.close(); });

  var fullSrc = function (img) {
    if (img.dataset.full) return img.dataset.full;
    var set = img.getAttribute('srcset');
    if (set) { var parts = set.split(',').map(function (s) { return s.trim().split(' ')[0]; }); return parts[parts.length - 1]; }
    return img.currentSrc || img.src;
  };

  /* ---------- галереи в карточках помещений ---------- */
  $$('[data-gallery]').forEach(function (g) {
    var track = $('.gallery__track', g);
    // пара/тройка «свет»: фото лежат друг на друге, переключатель плавно меняет их.
    // Свет сам чередуется каждые 6 с (только внутри этого слайда, другие ракурсы не листаются);
    // если свет выбрали вручную — пауза 20 с. Работает, пока галерея на экране.
    $$('.gallery__slide--light', track).forEach(function (fig) {
      var imgs = $$('img', fig);
      if (imgs.length < 2) return;
      var bar = document.createElement('div');
      bar.className = 'light-switch';
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', 'Освещение');
      var cur = 0, timer = 0, onScreen = false;
      var start = +fig.dataset.lightStart || 6000;   // первая смена; у соседних кабинетов — со сдвигом
      var pick = function (i) {
        cur = i;
        imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
        $$('button', bar).forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
      };
      var cycle = function (delay) {
        clearTimeout(timer);
        if (reduce || !onScreen || document.hidden) return;
        timer = setTimeout(function () { pick((cur + 1) % imgs.length); cycle(6000); }, delay);
      };
      imgs.forEach(function (im, i) {
        var b = document.createElement('button');
        var mode = im.dataset.mode || ('Вариант ' + (i + 1));
        b.type = 'button'; b.setAttribute('aria-label', mode + ' свет');
        b.innerHTML = (ICON[mode] ? '<svg class="light__ic" viewBox="0 0 24 24" aria-hidden="true">' + ICON[mode] + '</svg>' : '') + '<span class="light__txt">' + mode + '</span>';
        b.addEventListener('click', function (e) { e.stopPropagation(); pick(i); cycle(20000); });
        bar.appendChild(b);
      });
      fig.appendChild(bar);
      pick(0);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; cycle(start); }, { threshold: 0.5 }).observe(fig);
      } else { onScreen = true; cycle(start); }
      document.addEventListener('visibilitychange', function () { cycle(start); });
    });

    var slides = $$('.gallery__slide', track);
    var count = $('[data-count]', g);
    var prev = $('[data-prev]', g);
    var next = $('[data-next]', g);
    if (slides.length < 2) g.classList.add('gallery--single');
    var idx = function () { var w = track.clientWidth; return w ? Math.round(track.scrollLeft / w) : 0; };
    var update = function () {
      var i = idx();
      count.textContent = (i + 1) + ' / ' + slides.length;
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
    };
    var go = function (i) { track.scrollTo({ left: i * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); };
    prev.addEventListener('click', function () { go(idx() - 1); });
    next.addEventListener('click', function () { go(idx() + 1); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx() - 1); }
    });
    // на весь экран — все фото помещения, у слайда «свет» — каждый вариант света отдельным кадром;
    // открывается на том варианте, который сейчас виден
    var items = [], first = [];
    slides.forEach(function (s) {
      first.push(items.length);
      $$('img', s).forEach(function (im) { items.push({ src: fullSrc(im), alt: im.alt }); });
    });
    slides.forEach(function (s, i) {
      s.addEventListener('click', function () {
        var on = $$('img', s).indexOf($('img.is-on', s));
        lbOpen(items, first[i] + Math.max(on, 0), track);
      });
    });
    update();
  });

  /* ---------- общая галерея ---------- */
  var mosaic = $('[data-mosaic]');
  if (mosaic) {
    var mItems = $$('.mosaic__item', mosaic);
    var mData = mItems.map(function (b) { var im = $('img', b); return { src: fullSrc(im), alt: im.alt }; });
    mItems.forEach(function (b, i) { b.addEventListener('click', function () { lbOpen(mData, i, b); }); });
  }

  /* ---------- ленты фото (удобства): по нажатию — на весь экран с листанием ---------- */
  $$('[data-photos]').forEach(function (box) {
    var items = $$('[data-photo]', box);
    var data = items.map(function (b) { var im = $('img', b); return { src: fullSrc(im), alt: im.alt }; });
    items.forEach(function (b, i) { b.addEventListener('click', function () { lbOpen(data, i, b); }); });
  });

  /* ---------- фото входа ---------- */
  var ent = $('[data-entrance]');
  if (ent) {
    var eItems = $$('.entrance__photo', ent);
    var eData = eItems.map(function (b) { var im = $('img', b); return { src: im.src, alt: im.alt }; });
    eItems.forEach(function (b, i) { b.addEventListener('click', function () { lbOpen(eData, i, b); }); });
  }

  /* ---------- видео-карточки: появляются, только когда указан файл в data-video ---------- */
  $$('.video-card[data-video]').forEach(function (card) {
    var src = card.getAttribute('data-video');
    if (!src) {
      var sect = card.closest('section');
      placeholder(card, sect && $('img', sect));
      if (showPh && card.dataset.videoId) $$('[data-video-open="' + card.dataset.videoId + '"]').forEach(function (b) { b.hidden = false; b.classList.add('is-placeholder'); });
      return;
    }
    if (card.dataset.poster) card.style.backgroundImage = 'url("' + card.dataset.poster + '")';
    card.hidden = false;
    var open = function (from) { lbOpen([{ video: src, poster: card.dataset.poster, alt: card.dataset.title }], 0, from); };
    card.addEventListener('click', function () { open(card); });
    if (card.dataset.videoId) {
      $$('[data-video-open="' + card.dataset.videoId + '"]').forEach(function (btn) {
        btn.hidden = false;
        btn.addEventListener('click', function () { open(btn); });
      });
    }
  });

  /* ---------- видео-плашки под фото помещений ---------- */
  var fmt = function (sec) { sec = Math.round(sec); return Math.floor(sec / 60) + ':' + ('0' + sec % 60).slice(-2); };
  $$('.video-thumb[data-video]').forEach(function (btn) {
    var src = btn.getAttribute('data-video');
    if (!src) { var room = btn.closest('.room'); placeholder(btn, room && $('.gallery__slide img', room)); return; }
    var img = $('.video-thumb__img', btn);
    if (btn.dataset.poster) img.style.backgroundImage = 'url("' + btn.dataset.poster + '")';
    var out = $('[data-duration-out]', btn);
    if (btn.dataset.duration) {
      out.textContent = 'Видео · ' + btn.dataset.duration;
    } else {
      // длительность берём из самого файла (качаются только служебные данные, не всё видео)
      var probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.addEventListener('loadedmetadata', function () { if (isFinite(probe.duration)) out.textContent = 'Видео · ' + fmt(probe.duration); });
      probe.src = src;
    }
    btn.hidden = false;
    btn.addEventListener('click', function () { lbOpen([{ video: src, poster: btn.dataset.poster, alt: btn.dataset.title }], 0, btn); });
  });

  /* ---------- свет под формат: каждые 4 с — следующий свет, после последнего — следующее помещение (по кругу).
     Кнопки помещений и света — поверх фото. Если свет выбрали вручную, автосмена продолжится через 20 с. ---------- */
  var light = $('#light');
  var sets = light ? $$('.light__set', light) : [];
  if (sets.length) {
    light.hidden = false;
    var roomsBar = $('[data-light-rooms]', light);
    var pics = $('[data-light-pics]', light);
    var stage = $('[data-light-stage]', light);
    var modesBar = $('[data-light-modes]', light);
    var note = $('[data-light-note]', light);
    var STEP = 4000, RESUME = 20000;
    var cur = { imgs: [], figs: [], i: -1 }, timer = 0, visible = false, underT = 0;
    // смена света: новое фото проявляется поверх, предыдущее остаётся под ним непрозрачным,
    // пока переход не закончится, — сквозь кадр ничего не просвечивает
    var pick = function (i) {
      var prev = cur.imgs[cur.i], next = cur.imgs[i];
      cur.i = i;
      cur.imgs.forEach(function (im) { if (im !== prev && im !== next) im.classList.remove('is-on', 'is-under'); });
      if (prev && prev !== next && prev.classList.contains('is-on')) {
        prev.classList.remove('is-on'); prev.classList.add('is-under');
        clearTimeout(underT);
        underT = setTimeout(function () { prev.classList.remove('is-under'); }, 1500);
      }
      next.classList.remove('is-under'); next.classList.add('is-on');
      $$('button', modesBar).forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
      note.innerHTML = '';
      var rn = document.createElement('span'); rn.className = 'light__note-room';
      rn.textContent = cur.set.dataset.room.replace(/[«»]/g, '') + ' · ';
      note.appendChild(rn);
      note.appendChild(document.createTextNode(cur.figs[i].dataset.note || ''));
    };
    var schedule = function (delay) {
      clearTimeout(timer);
      if (reduce || !visible || document.hidden) return;
      timer = setTimeout(function () {
        // после последнего света — следующее помещение, по кругу
        if (cur.i < cur.imgs.length - 1) { pick(cur.i + 1); schedule(STEP); }
        else { showRoom(sets[(sets.indexOf(cur.set) + 1) % sets.length]); }
      }, delay);
    };
    var showRoom = function (set) {
      $$('button', roomsBar).forEach(function (b) { b.setAttribute('aria-selected', String(b._set === set)); });
      // плавная смена помещения: старые фото остаются, пока новое не загрузится и не проявится поверх
      // под новым помещением остаётся только кадр, который был виден; остальные убираем сразу
      var shown = $('img.is-on', pics) || $('img.is-old', pics);
      $$('img', pics).forEach(function (im) { if (im !== shown) im.remove(); });
      var old = shown ? [shown] : [];
      if (shown) { shown.classList.remove('is-on', 'is-under'); shown.classList.add('is-old'); }
      clearTimeout(underT);
      modesBar.innerHTML = '';
      cur.set = set; cur.i = -1;
      cur.figs = $$('figure', set);
      cur.imgs = cur.figs.map(function (f) { var im = $('img', f).cloneNode(); im.removeAttribute('loading'); im.classList.remove('is-on'); pics.appendChild(im); return im; });
      cur.figs.forEach(function (f, i) {
        var b = document.createElement('button');
        var mode = f.dataset.mode;
        b.type = 'button'; b.setAttribute('aria-label', mode + ' свет'); b.title = mode + ' свет';
        b.innerHTML = (ICON[mode] ? '<svg class="light__ic" viewBox="0 0 24 24" aria-hidden="true">' + ICON[mode] + '</svg>' : '') + '<span class="light__txt">' + mode + '</span>';
        b.addEventListener('click', function () { pick(i); schedule(RESUME); });
        modesBar.appendChild(b);
      });
      var first = cur.imgs[0];
      var reveal = function () {
        requestAnimationFrame(function () {
          pick(0);
          setTimeout(function () { old.forEach(function (im) { im.remove(); }); }, 1500);
        });
      };
      if (!old.length || reduce) { old.forEach(function (im) { im.remove(); }); pick(0); }
      else if (first.decode) { first.decode().then(reveal, reveal); }
      else { reveal(); }
      schedule(STEP);
    };
    if (sets.length > 1) {
      sets.forEach(function (set, n) {
        var b = document.createElement('button');
        var name = set.dataset.room.replace(/[«»]/g, '');
        b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', name); b._set = set;
        b.innerHTML = '<span class="light__num">' + (n + 1) + '</span><span class="light__txt">' + name + '</span>';
        b.addEventListener('click', function () { showRoom(set); });
        roomsBar.appendChild(b);
      });
    } else { roomsBar.hidden = true; }
    // автосмена идёт, только пока блок на экране и вкладка открыта
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; schedule(STEP); }, { threshold: 0.35 }).observe(stage);
    } else { visible = true; }
    document.addEventListener('visibilitychange', function () { schedule(STEP); });
    showRoom(sets[0]);
  }
})();
