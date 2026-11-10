/*
 * Интерактив сайта. Заменяет скрипты конструктора Т-Банка:
 *  1. мобильное меню («бургер»);
 *  2. карусель отзывов (стрелки);
 *  3. увеличение картинки по клику.
 * Кнопки «Задать вопрос» — обычные ссылки на Max прямо в HTML, скрипт им не нужен.
 */
(function () {
  'use strict';

  // 0. Ссылки между страницами в HTML «чистые», как на сайте: «/» и «/agile».
  // При просмотре файлов с диска (file://) таких адресов нет — подставляем имена файлов.
  if (location.protocol === 'file:') {
    var localPages = { '/': 'index.html', '/agile': 'agile.html' };
    document.querySelectorAll('a[href]').forEach(function (a) {
      var file = localPages[a.getAttribute('href')];
      if (file) a.setAttribute('href', file);
    });
  }

  // 1. Мобильное меню
  document.querySelectorAll('.s-header-type-1').forEach(function (header) {
    var burger = header.querySelector('.js-burger');
    var menu = header.querySelector('.js-menu');
    if (!burger || !menu) return;

    function setOpen(open) {
      burger.classList.toggle('js-burger_open', open);
      menu.classList.toggle('js-menu_open', open);
      header.classList.toggle('js-active', open);
      document.documentElement.classList.toggle('menu-open', open);
    }

    burger.addEventListener('click', function () {
      setOpen(!menu.classList.contains('js-menu_open'));
    });
    // Клик по пункту меню — закрываем меню и едем к разделу
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960) setOpen(false);
    });
  });

  // 2. Карусель отзывов — бесконечная, по кругу.
  // Копии всех отзывов ставим перед и после оригиналов. Когда лента
  // заезжает на копии, незаметно перескакиваем на те же отзывы-оригиналы.
  document.querySelectorAll('.s-reviews-type-4__slider').forEach(function (slider) {
    var track = slider.querySelector('.js-list-wrapper');
    var list = slider.querySelector('.js-list');
    var prev = slider.querySelector('.js-arrow_previous');
    var next = slider.querySelector('.js-arrow_next');
    if (!track || !list) return;

    var slides = Array.prototype.slice.call(list.children);
    var n = slides.length;
    if (n < 2) return;

    function makeClone(slide) {
      var c = slide.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
      return c;
    }
    slides.forEach(function (s) { list.appendChild(makeClone(s)); });
    for (var i = n - 1; i >= 0; i--) list.insertBefore(makeClone(slides[i]), list.firstChild);
    // Теперь в ленте: [копии] [оригиналы] [копии], оригиналы — позиции n..2n-1

    function slideWidth() {
      return slides[0].getBoundingClientRect().width;
    }
    // Если стоим на копиях — мгновенно переносимся на такие же оригиналы
    function normalize() {
      var w = slideWidth();
      var idx = Math.round(track.scrollLeft / w);
      if (idx < n) idx += n;
      else if (idx >= 2 * n) idx -= n;
      else return;
      track.scrollLeft = idx * w;
    }
    // Куда сейчас едет лента (номер слайда); null — стоит на месте.
    // Нужно, чтобы быстрые клики подряд складывались, а не терялись.
    var target = null;
    function go(dir) {
      var w = slideWidth();
      if (target === null) {
        normalize();
        target = Math.round(track.scrollLeft / w);
      }
      var visible = Math.max(1, Math.round(track.clientWidth / w));
      var nextTarget = target + dir;
      if (nextTarget < 0 || nextTarget > 3 * n - visible) return; // копии кончились — ждём остановки
      target = nextTarget;
      track.scrollTo({ left: target * w, behavior: 'smooth' });
    }

    // Стартуем с первого оригинала
    track.scrollLeft = n * slideWidth();

    var settleTimer;
    track.addEventListener('scroll', function () {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        target = null;
        normalize();
      }, 150);
    }, { passive: true });
    window.addEventListener('resize', function () {
      var w = slideWidth();
      var idx = ((Math.round(track.scrollLeft / w) % n) + n) % n;
      track.scrollLeft = (n + idx) * w;
    });

    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
  });

  // 3. Увеличение картинки по клику
  function openLightbox(src, alt) {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<button type="button" class="lightbox__close" aria-label="Закрыть">×</button>';
    var img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    box.appendChild(img);

    function close() {
      box.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
    }
    box.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);
    box.querySelector('.lightbox__close').focus();
  }

  document.querySelectorAll('[data-zoom-src]').forEach(function (el) {
    el.addEventListener('click', function () {
      var img = el.querySelector('img');
      openLightbox(el.getAttribute('data-zoom-src'), img && img.alt);
    });
  });
})();
