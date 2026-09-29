/* Shared article template behaviour: sources in the right rail, the lede, the colophon.
   Runs on articles whose body is marked data-notes="rail"; an article with its own
   sidenote system (data-notes="custom") keeps it. */
(function () {
  const body = document.querySelector<HTMLElement>('.article__body[data-notes="rail"]');
  if (!body) return;

  function h(tag: string, cls: string, html: string) { const el = document.createElement(tag); el.className = cls; el.innerHTML = html; return el; }
  const wide = window.matchMedia('(width >= 1180px)');

  /* The first plain paragraph opens the piece; "About the numbers" closes it without a number. */
  for (let i = 0; i < body.children.length; i++) {
    const c = body.children[i];
    if (c.tagName === 'P' && !c.className) { c.classList.add('article__lede'); break; }
    if (c.tagName === 'H3' || c.tagName === 'SECTION') break;
  }
  body.querySelectorAll('h2').forEach(function (hd) {
    if (/about the numbers/i.test(hd.textContent ?? '')) hd.classList.add('article__colophon');
  });

  /* Sidenotes */
  const list = body.querySelector('section[data-footnotes]');
  if (!list) return;
  list.querySelectorAll('li').forEach(function (li, n) { li.setAttribute('data-num', String(n + 1)); });
  const notes: { el: HTMLElement; anchor: Element }[] = [];
  const made: Record<string, HTMLElement> = {};

  body.querySelectorAll('[data-footnote-ref]').forEach(function (ref) {
    const id = (ref.getAttribute('href') || '').replace(/^#/, '');
    const li = id && document.getElementById(id);
    if (!li) return;
    const num = li.getAttribute('data-num');
    const anchor = ref.closest('p, li, td, figcaption') || ref.parentElement!;
    // On narrow screens the number opens the source in place; say so to assistive technology.
    if (!wide.matches) ref.setAttribute('aria-expanded', 'false');

    if (!made[id]) {
      const note = made[id] = h('aside', 'sidenote', '<span class="sidenote__num">' + num + '</span>' + li.innerHTML);
      note.setAttribute('data-for', id);
      body.appendChild(note);
      notes.push({ el: note, anchor: anchor });
      const on = function () { note.classList.add('is-active'); };
      const off = function () { note.classList.remove('is-active'); };
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
      const next = anchor.nextElementSibling;
      if (next && next.classList.contains('note-inline') && next.getAttribute('data-for') === id) {
        next.remove(); ref.classList.remove('is-active'); ref.setAttribute('aria-expanded', 'false'); return;
      }
      const open = body.querySelector('.note-inline'); if (open) open.remove();
      body.querySelectorAll('[data-footnote-ref].is-active').forEach(function (r) { r.classList.remove('is-active'); r.setAttribute('aria-expanded', 'false'); });
      const inline = h('div', 'note-inline', '<span class="sidenote__num">' + num + '</span>' + li.innerHTML);
      inline.setAttribute('data-for', id);
      anchor.insertAdjacentElement('afterend', inline);
      ref.classList.add('is-active');
      ref.setAttribute('aria-expanded', 'true');
    });
  });

  // Notes sit level with the paragraph that cites them and push down rather than overlap.
  // Figures marked data-rail="block" that reach into the rail own it beside them.
  const layout = function () {
    if (!wide.matches) return;
    const top0 = body.getBoundingClientRect().top + window.scrollY;
    const gap = 22;
    let prev = -Infinity;
    const edge = body.getBoundingClientRect().right;
    const blocks = Array.from(body.querySelectorAll('[data-rail="block"]')).filter(function (el) {
      return el.getBoundingClientRect().right > edge + 1;
    }).map(function (el) {
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY - top0, bottom: r.bottom + window.scrollY - top0 };
    });
    notes.forEach(function (n) {
      let top = n.anchor.getBoundingClientRect().top + window.scrollY - top0;
      const ht = n.el.offsetHeight;
      if (top < prev + gap) top = prev + gap;
      blocks.forEach(function (b) {
        if (top < b.bottom + gap && top + ht > b.top - gap) top = b.bottom + gap;
      });
      n.el.style.top = Math.max(0, top) + 'px';
      prev = top + ht;
    });
  };
  let raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(layout); }
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(body);
  wide.addEventListener('change', schedule);
  schedule();
})();
