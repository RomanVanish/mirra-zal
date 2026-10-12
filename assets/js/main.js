/* Площадка МирРа — небольшой vanilla JS: меню, окно связи, галереи, просмотр фото и видео, появление блоков. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    sheetRoom.textContent = room ? 'Забронировать · ' + room : 'Забронировать дату';
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

  /* ---------- кнопка «Наверх»: появляется после полутора экранов прокрутки ---------- */
  var toTop = $('[data-to-top]');
  if (toTop) {
    var syncTop = function () {
      var on = window.scrollY > window.innerHeight * 1.5;
      if (on === toTop.classList.contains('is-on')) return;
      toTop.classList.toggle('is-on', on);
      toTop.setAttribute('aria-hidden', String(!on));
      toTop.tabIndex = on ? 0 : -1;
    };
    syncTop();
    window.addEventListener('scroll', syncTop, { passive: true });
    toTop.addEventListener('click', function () {
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

  var lbIndex = function () { return Math.round(lbTrack.scrollLeft / lbTrack.clientWidth); };
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
    // пара «мягкий / яркий свет»: фото лежат друг на друге, переключатель плавно меняет их
    $$('.gallery__slide--light', track).forEach(function (fig) {
      var imgs = $$('img', fig);
      if (imgs.length < 2) return;
      var bar = document.createElement('div');
      bar.className = 'light-switch';
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', 'Освещение');
      var pick = function (i) {
        imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
        $$('button', bar).forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
      };
      imgs.forEach(function (im, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = im.dataset.mode || ('Вариант ' + (i + 1));
        b.addEventListener('click', function (e) { e.stopPropagation(); pick(i); });
        bar.appendChild(b);
      });
      fig.appendChild(bar);
      pick(0);
    });

    var slides = $$('.gallery__slide', track);
    var count = $('[data-count]', g);
    var prev = $('[data-prev]', g);
    var next = $('[data-next]', g);
    if (slides.length < 2) g.classList.add('gallery--single');
    var idx = function () { return Math.round(track.scrollLeft / track.clientWidth); };
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
    // для просмотра на весь экран берём видимое сейчас фото (у пары «свет» — выбранный вариант)
    var items = function () {
      return slides.map(function (s) {
        var im = $('img.is-on', s) || $('img', s);
        return { src: fullSrc(im), alt: im.alt };
      });
    };
    slides.forEach(function (s, i) { s.addEventListener('click', function () { lbOpen(items(), i, track); }); });
    update();
  });

  /* ---------- общая галерея ---------- */
  var mosaic = $('[data-mosaic]');
  if (mosaic) {
    var mItems = $$('.mosaic__item', mosaic);
    var mData = mItems.map(function (b) { var im = $('img', b); return { src: fullSrc(im), alt: im.alt }; });
    mItems.forEach(function (b, i) { b.addEventListener('click', function () { lbOpen(mData, i, b); }); });
  }

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

  /* ---------- свет под формат (секция показывается, когда в ней есть пары фото) ---------- */
  var light = $('#light');
  var sets = light ? $$('.light__set', light) : [];
  if (sets.length) {
    light.hidden = false;
    var roomsBar = $('[data-light-rooms]', light);
    var stage = $('[data-light-stage]', light);
    var modesBar = $('[data-light-modes]', light);
    var note = $('[data-light-note]', light);
    var showRoom = function (set) {
      $$('button', roomsBar).forEach(function (b) { b.setAttribute('aria-selected', String(b._set === set)); });
      stage.innerHTML = ''; modesBar.innerHTML = '';
      var figs = $$('figure', set);
      var imgs = figs.map(function (f) { var im = $('img', f).cloneNode(); stage.appendChild(im); return im; });
      var pick = function (i) {
        imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
        $$('button', modesBar).forEach(function (b, k) { b.setAttribute('aria-pressed', String(k === i)); });
        note.textContent = figs[i].dataset.note || '';
      };
      figs.forEach(function (f, i) {
        var b = document.createElement('button');
        b.type = 'button'; b.textContent = f.dataset.mode;
        b.addEventListener('click', function () { pick(i); });
        modesBar.appendChild(b);
      });
      pick(0);
    };
    if (sets.length > 1) {
      sets.forEach(function (set) {
        var b = document.createElement('button');
        b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = set.dataset.room; b._set = set;
        b.addEventListener('click', function () { showRoom(set); });
        roomsBar.appendChild(b);
      });
    } else { roomsBar.hidden = true; }
    showRoom(sets[0]);
  }
})();
