/* The Digital Front Door Nobody Walks Through: interactives, sidenotes, trace rail. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmtMoney = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };

  /* ---------- reading progress (trace rail from site-shell.css) ---------- */
  var root = document.documentElement;
  function updateTrace() {
    var scrollable = root.scrollHeight - window.innerHeight;
    var p = scrollable > 0 ? window.scrollY / scrollable : 0;
    root.style.setProperty('--trace-depth', (Math.max(0, Math.min(1, p)) * 100) + '%');
  }
  window.addEventListener('scroll', updateTrace, { passive: true });
  window.addEventListener('resize', updateTrace);
  updateTrace();

  /* ---------- helpers ---------- */
  function onEnter(el, cb, threshold) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { cb(); io.disconnect(); }
      });
    }, { threshold: threshold == null ? 0.35 : threshold });
    io.observe(el);
  }

  function countUp(el, target, ms) {
    if (reduceMotion) { el.textContent = target; return; }
    var start = null;
    function step(t) {
      if (start === null) start = t;
      var k = Math.min(1, (t - start) / ms);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * eased);
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- 1. the 100-square grid ---------- */
  document.querySelectorAll('[data-fd="grid"], [data-fd="grid-empty"]').forEach(function (fig) {
    var cells = fig.querySelector('.fd-grid-cells');
    if (!cells) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 100; i++) {
      var c = document.createElement('div');
      c.className = 'fd-cell';
      frag.appendChild(c);
    }
    cells.appendChild(frag);
    if (fig.getAttribute('data-fd') === 'grid-empty') return;

    var fintech = parseInt(fig.getAttribute('data-fintech'), 10) || 0;
    var community = parseInt(fig.getAttribute('data-community'), 10) || 0;
    var all = cells.children;

    onEnter(fig, function () {
      var delay = reduceMotion ? 0 : 18;
      for (var i = 0; i < fintech; i++) {
        (function (i) { setTimeout(function () { all[i].classList.add('is-fintech'); }, i * delay); })(i);
      }
      for (var j = 0; j < community; j++) {
        (function (j) { setTimeout(function () { all[fintech + j].classList.add('is-community'); }, (fintech + j) * delay + 240); })(j);
      }
      fig.querySelectorAll('[data-count]').forEach(function (el) {
        countUp(el, parseInt(el.getAttribute('data-count'), 10), fintech * delay + 400);
      });
    }, 0.4);
  });

  /* ---------- 2. the live math ---------- */
  var calc = document.querySelector('[data-fd="calc"]');
  if (calc) {
    var $ = function (id) { return document.getElementById(id); };
    var inBal = $('fd-in-balance'), inNim = $('fd-in-nim'), inTxn = $('fd-in-txn'), inIc = $('fd-in-ic'), inCac = $('fd-in-cac');
    var outSpread = $('fd-out-spread'), outIc = $('fd-out-ic'), outTotal = $('fd-out-total'), outMonths = $('fd-out-months');
    var barSpread = $('fd-bar-spread'), barIc = $('fd-bar-ic'), barCac = $('fd-bar-cac');

    function num(el) { var v = parseFloat(el.value); return isFinite(v) && v >= 0 ? v : 0; }

    function update() {
      var bal = num(inBal), nim = num(inNim) / 100, txn = num(inTxn), ic = num(inIc), cac = num(inCac);
      var spread = bal * nim;
      var inter = txn * 12 * ic;
      var total = spread + inter;
      var months = total > 0 ? Math.ceil(cac / (total / 12)) : 0;

      outSpread.textContent = fmtMoney(spread);
      outIc.textContent = fmtMoney(inter);
      outTotal.textContent = fmtMoney(total);
      outMonths.textContent = total > 0 ? (months <= 12 ? String(months) : (months / 12).toFixed(1) + ' years') : '—';

      var scale = Math.max(total, cac) * 1.12 || 1;
      var wS = (spread / scale) * 100, wI = (inter / scale) * 100, xC = (cac / scale) * 100;
      barSpread.style.width = wS + '%';
      barIc.style.left = wS + '%';
      barIc.style.width = wI + '%';
      barCac.style.left = xC + '%';
    }

    [inBal, inNim, inTxn, inIc, inCac].forEach(function (el) { el.addEventListener('input', update); });

    calc.querySelectorAll('.fd-durbin-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        calc.querySelectorAll('.fd-durbin-btn').forEach(function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on');
        inIc.value = btn.getAttribute('data-ic');
        update();
      });
    });
    inIc.addEventListener('input', function () {
      calc.querySelectorAll('.fd-durbin-btn').forEach(function (b) {
        b.classList.toggle('is-on', parseFloat(b.getAttribute('data-ic')) === parseFloat(inIc.value));
      });
    });

    // key for the bar
    var key = document.createElement('div');
    key.className = 'fd-bar-key';
    key.innerHTML = '<span class="k-spread">Deposit spread</span><span class="k-ic">Interchange</span>';
    calc.querySelector('.fd-bar').appendChild(key);

    update();
  }

  /* ---------- 3. the fifteen-year timeline ---------- */
  var tl = document.querySelector('[data-fd="timeline"]');
  if (tl) {
    var perYear = parseFloat(tl.getAttribute('data-per-year')) || 400;
    var startAge = parseInt(tl.getAttribute('data-start'), 10) || 25;
    var endAge = parseInt(tl.getAttribute('data-end'), 10) || 40;
    var eventVal = parseFloat(tl.getAttribute('data-event')) || 973;
    var years = endAge - startAge; // 15 bars, ages 25..39, then the event at 40
    var W = 1000, H = 340, padL = 64, padR = 24, padT = 44, padB = 44;
    var innerW = W - padL - padR, innerH = H - padT - padB;
    var maxVal = perYear * years;
    var slots = years + 1;
    var slotW = innerW / slots;
    var barW = slotW * 0.62;
    var y = function (v) { return padT + innerH - (v / maxVal) * innerH; };

    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Cumulative checking contribution from age ' + startAge + ' to ' + (endAge - 1) + ' rising to ' + fmtMoney(maxVal) + ', beside a ' + fmtMoney(eventVal) + ' mortgage at ' + endAge + '.');

    function el(name, attrs, text) {
      var e = document.createElementNS(ns, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (text != null) e.textContent = text;
      return e;
    }

    // gridlines and y labels
    [0, 2000, 4000, 6000].forEach(function (v) {
      if (v > maxVal) return;
      svg.appendChild(el('line', { x1: padL, x2: W - padR, y1: y(v), y2: y(v), 'class': 'fd-tl-axis' }));
      svg.appendChild(el('text', { x: padL - 10, y: y(v) + 4, 'text-anchor': 'end', 'class': 'fd-tl-label' }, fmtMoney(v)));
    });

    // bars
    for (var i = 0; i < years; i++) {
      var val = perYear * (i + 1);
      var x = padL + i * slotW + (slotW - barW) / 2;
      var bar = el('rect', { x: x, y: y(val), width: barW, height: innerH - (y(val) - padT), 'class': 'fd-tl-bar' });
      bar.style.transitionDelay = (reduceMotion ? 0 : i * 70) + 'ms';
      svg.appendChild(bar);
      var age = startAge + i;
      if (age === startAge || (age - startAge) % 5 === 0) {
        svg.appendChild(el('text', { x: x + barW / 2, y: H - padB + 22, 'text-anchor': 'middle', 'class': 'fd-tl-label' + (age === startAge ? ' is-strong' : '') }, String(age)));
      }
    }

    // the event at endAge
    var xe = padL + years * slotW + (slotW - barW) / 2;
    var ev = el('rect', { x: xe, y: y(eventVal), width: barW, height: innerH - (y(eventVal) - padT), 'class': 'fd-tl-event' });
    ev.style.transitionDelay = (reduceMotion ? 0 : years * 70 + 300) + 'ms';
    svg.appendChild(ev);
    svg.appendChild(el('text', { x: xe + barW / 2, y: H - padB + 22, 'text-anchor': 'middle', 'class': 'fd-tl-label is-strong' }, String(endAge)));

    // callouts
    svg.appendChild(el('text', { x: padL + (years - 1) * slotW + slotW / 2, y: y(maxVal) - 14, 'text-anchor': 'middle', 'class': 'fd-tl-callout' }, fmtMoney(maxVal) + ' of checking'));
    svg.appendChild(el('text', { x: padL + (years - 1) * slotW + slotW / 2, y: y(maxVal) - 0, 'text-anchor': 'middle', 'class': 'fd-tl-sub' }, 'gross, at ' + fmtMoney(perYear) + ' a year'));
    svg.appendChild(el('text', { x: xe + barW / 2, y: y(eventVal) - 14, 'text-anchor': 'middle', 'class': 'fd-tl-callout is-brass' }, fmtMoney(eventVal)));
    svg.appendChild(el('text', { x: xe + barW / 2, y: y(eventVal), 'text-anchor': 'middle', 'class': 'fd-tl-sub' }, 'the mortgage'));
    svg.appendChild(el('text', { x: padL, y: H - padB + 22, 'text-anchor': 'start', 'class': 'fd-tl-sub', dx: -50 }, 'age'));

    // baseline
    svg.appendChild(el('line', { x1: padL, x2: W - padR, y1: padT + innerH, y2: padT + innerH, 'class': 'fd-tl-axis', style: 'stroke: var(--secondary)' }));

    tl.querySelector('.fd-timeline-svg').appendChild(svg);
    onEnter(tl, function () { tl.classList.add('is-in'); }, 0.45);
  }

  /* ---------- 4. bank view / customer view ---------- */
  var tg = document.querySelector('[data-fd="toggle"]');
  if (tg) {
    var stage = tg.querySelector('.fd-toggle-stage');
    var btns = tg.querySelectorAll('.fd-toggle-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('is-on'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('is-on');
        btn.setAttribute('aria-selected', 'true');
        stage.setAttribute('data-view', btn.getAttribute('data-view'));
      });
    });
  }

  /* ---------- sidenotes ---------- */
  var body = document.querySelector('.article-body');
  var notesSection = body && body.querySelector('section[data-footnotes]');
  if (body && notesSection) {
    // number the notes for the ::before counter
    notesSection.querySelectorAll('li').forEach(function (li, i) { li.setAttribute('data-num', String(i + 1)); });

    var refs = Array.prototype.slice.call(body.querySelectorAll('[data-footnote-ref]'));
    var seen = {};
    var sidenotes = [];

    refs.forEach(function (ref) {
      var href = ref.getAttribute('href') || '';
      var id = href.replace(/^#/, '');
      var li = id && document.getElementById(id);
      if (!li) return;
      var num = li.getAttribute('data-num') || ref.textContent.trim();
      var para = ref.closest('p, li, figcaption') || ref.parentNode;

      // desktop sidenote: one per note, anchored to the first reference
      if (!seen[id]) {
        seen[id] = true;
        var aside = document.createElement('aside');
        aside.className = 'fd-sidenote';
        aside.setAttribute('data-for', id);
        aside.innerHTML = '<span class="fd-sidenote-num">' + num + '</span>' + li.innerHTML;
        body.appendChild(aside);
        sidenotes.push({ el: aside, anchor: para, ref: ref });
        ref.addEventListener('mouseenter', function () { aside.classList.add('is-active'); });
        ref.addEventListener('mouseleave', function () { aside.classList.remove('is-active'); });
      }

      // narrow screens: tap to expand the note under the paragraph
      ref.addEventListener('click', function (e) {
        if (window.matchMedia('(min-width: 1180px)').matches) return;
        e.preventDefault();
        var existing = para.nextElementSibling;
        if (existing && existing.classList.contains('fd-note-inline') && existing.getAttribute('data-for') === id) {
          existing.remove();
          ref.classList.remove('is-active');
          return;
        }
        var open = para.parentNode.querySelector('.fd-note-inline');
        if (open) { open.remove(); }
        body.querySelectorAll('[data-footnote-ref].is-active').forEach(function (r) { r.classList.remove('is-active'); });
        var note = document.createElement('div');
        note.className = 'fd-note-inline';
        note.setAttribute('data-for', id);
        note.innerHTML = '<span class="fd-sidenote-num">' + num + '</span>' + li.innerHTML;
        para.insertAdjacentElement('afterend', note);
        ref.classList.add('is-active');
      });
    });

    function layoutSidenotes() {
      if (!window.matchMedia('(min-width: 1180px)').matches) return;
      var bodyTop = body.getBoundingClientRect().top + window.scrollY;
      var gap = 18;
      var prevBottom = -Infinity;
      sidenotes.forEach(function (s) {
        var top = s.anchor.getBoundingClientRect().top + window.scrollY - bodyTop;
        var h = s.el.offsetHeight;
        if (top < prevBottom + gap) top = prevBottom + gap;
        s.el.style.top = Math.max(0, top) + 'px';
        prevBottom = top + h;
      });
    }
    var raf;
    function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(layoutSidenotes); }
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    schedule();
    setTimeout(schedule, 600);
  }
})();
