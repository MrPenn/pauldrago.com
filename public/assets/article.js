/* Shared article template behaviour: sources in the right rail, the lede, the colophon.
   Runs on articles whose body is marked data-notes="rail"; an article with its own
   sidenote system (data-notes="custom") keeps it. */
(function () {
  var body = document.querySelector('.article__body[data-notes="rail"]');
  if (!body) return;

  function h(tag, cls, html) { var el = document.createElement(tag); el.className = cls; el.innerHTML = html; return el; }
  var wide = window.matchMedia('(width >= 1180px)');

  /* The first plain paragraph opens the piece; "About the numbers" closes it without a number. */
  for (var i = 0; i < body.children.length; i++) {
    var c = body.children[i];
    if (c.tagName === 'P' && !c.className) { c.classList.add('article__lede'); break; }
    if (c.tagName === 'H3' || c.tagName === 'SECTION') break;
  }
  body.querySelectorAll('h2').forEach(function (hd) {
    if (/about the numbers/i.test(hd.textContent)) hd.classList.add('article__colophon');
  });

  /* Sidenotes */
  var list = body.querySelector('section[data-footnotes]');
  if (!list) return;
  list.querySelectorAll('li').forEach(function (li, n) { li.setAttribute('data-num', String(n + 1)); });
  var notes = [];
  var made = {};

  body.querySelectorAll('[data-footnote-ref]').forEach(function (ref) {
    var id = (ref.getAttribute('href') || '').replace(/^#/, '');
    var li = id && document.getElementById(id);
    if (!li) return;
    var num = li.getAttribute('data-num');
    var anchor = ref.closest('p, li, td, figcaption') || ref.parentNode;
    // On narrow screens the number opens the source in place; say so to assistive technology.
    if (!wide.matches) ref.setAttribute('aria-expanded', 'false');

    if (!made[id]) {
      var note = made[id] = h('aside', 'sidenote', '<span class="sidenote__num">' + num + '</span>' + li.innerHTML);
      note.setAttribute('data-for', id);
      body.appendChild(note);
      notes.push({ el: note, anchor: anchor });
      var on = function () { note.classList.add('is-active'); };
      var off = function () { note.classList.remove('is-active'); };
      ref.addEventListener('mouseenter', on); ref.addEventListener('mouseleave', off);
      ref.addEventListener('focus', on); ref.addEventListener('blur', off);
      note.addEventListener('mouseenter', function () { ref.classList.add('is-active'); });
      note.addEventListener('mouseleave', function () { ref.classList.remove('is-active'); });
    }

    // Wide screens: the number takes focus to its note in the rail. Narrow screens: it opens the
    // source under its paragraph.
    ref.addEventListener('click', function (e) {
      e.preventDefault();
      if (wide.matches) {
        made[id].setAttribute('tabindex', '-1');
        made[id].focus();
        return;
      }
      var next = anchor.nextElementSibling;
      if (next && next.classList.contains('note-inline') && next.getAttribute('data-for') === id) {
        next.remove(); ref.classList.remove('is-active'); ref.setAttribute('aria-expanded', 'false'); return;
      }
      var open = body.querySelector('.note-inline'); if (open) open.remove();
      body.querySelectorAll('[data-footnote-ref].is-active').forEach(function (r) { r.classList.remove('is-active'); r.setAttribute('aria-expanded', 'false'); });
      var inline = h('div', 'note-inline', '<span class="sidenote__num">' + num + '</span>' + li.innerHTML);
      inline.setAttribute('data-for', id);
      anchor.insertAdjacentElement('afterend', inline);
      ref.classList.add('is-active');
      ref.setAttribute('aria-expanded', 'true');
    });
  });

  // Notes sit level with the paragraph that cites them and push down rather than overlap.
  // Figures marked data-rail="block" that reach into the rail own it beside them.
  function layout() {
    if (!wide.matches) return;
    var top0 = body.getBoundingClientRect().top + window.scrollY;
    var gap = 22, prev = -Infinity;
    var edge = body.getBoundingClientRect().right;
    var blocks = Array.prototype.filter.call(body.querySelectorAll('[data-rail="block"]'), function (el) {
      return el.getBoundingClientRect().right > edge + 1;
    }).map(function (el) {
      var r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY - top0, bottom: r.bottom + window.scrollY - top0 };
    });
    notes.forEach(function (n) {
      var top = n.anchor.getBoundingClientRect().top + window.scrollY - top0;
      var ht = n.el.offsetHeight;
      if (top < prev + gap) top = prev + gap;
      blocks.forEach(function (b) {
        if (top < b.bottom + gap && top + ht > b.top - gap) top = b.bottom + gap;
      });
      n.el.style.top = Math.max(0, top) + 'px';
      prev = top + ht;
    });
  }
  var raf;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); }
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(body);
  wide.addEventListener ? wide.addEventListener('change', schedule) : wide.addListener(schedule);
  schedule();
})();
