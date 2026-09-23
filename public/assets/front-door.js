/* The Digital Front Door Nobody Walks Through
   Opener, three pinned sequences, calculator, sidenotes, trace rail.
   Timing: one orchestrated moment per figure; a beat before the thing
   you are meant to notice; nothing loops. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
  var isWide = function () { return window.matchMedia('(min-width: 1180px)').matches; };

  /* ---------- reading progress (trace rail from site-shell.css) ---------- */
  var root = document.documentElement;
  // CSS scroll-driven animation drives the rail where supported (front-door.css); this is the fallback
  if (!(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
    var traceTick = null;
    var updateTrace = function () {
      traceTick = null;
      var scrollable = root.scrollHeight - window.innerHeight;
      var p = scrollable > 0 ? window.scrollY / scrollable : 0;
      root.style.setProperty('--trace-depth', (Math.max(0, Math.min(1, p)) * 100) + '%');
    };
    var scheduleTrace = function () { if (traceTick === null) traceTick = requestAnimationFrame(updateTrace); };
    window.addEventListener('scroll', scheduleTrace, { passive: true });
    window.addEventListener('resize', scheduleTrace);
    updateTrace();
  }

  /* ---------- helpers ---------- */
  function onEnter(el, cb, threshold) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { cb(); io.disconnect(); } });
    }, { threshold: threshold == null ? 0.35 : threshold });
    io.observe(el);
  }
  function countUp(el, target, ms, delay) {
    if (reduceMotion) { el.textContent = target; return; }
    setTimeout(function () {
      var start = null;
      function step(t) {
        if (start === null) start = t;
        var k = Math.min(1, (t - start) / ms);
        var eased = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(target * eased);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay || 0);
  }
  function h(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------- Opener: 100 units above the headline ---------- */
  var opener = document.querySelector('.article-opener[data-opener="fd-grid"]');
  if (opener) {
    var FINTECH = 44, COMMUNITY = 4;
    var inner = h('div', 'fd-opener-inner');
    var units = h('div', 'fd-opener-units');
    for (var i = 0; i < 100; i++) units.appendChild(h('div', 'fd-cell'));
    var legend = h('div', 'fd-opener-legend',
      '<div class="fd-legend-row"><span class="fd-swatch fd-swatch-fintech"></span><span class="fd-legend-num" data-count="44">0</span><span class="fd-legend-label">of every 100 new checking accounts opened in 2024 went to digital banks and fintechs</span></div>' +
      '<div class="fd-legend-row"><span class="fd-swatch fd-swatch-community"></span><span class="fd-legend-num" data-count="4">0</span><span class="fd-legend-label">went to community banks</span></div>' +
      '<div class="fd-legend-row"><span class="fd-swatch"></span><span class="fd-legend-num">52</span><span class="fd-legend-label">went to everyone else</span></div>');
    var src = h('p', 'fd-opener-source', 'Cornerstone Advisors, <a href="https://www.crnrstone.com/hubfs/Cornerstone-Advisors-2025-Research-Recap_Beyond-the-Paycheck-Motel.pdf" target="_blank" rel="noopener">Beyond the Paycheck Motel</a>, 2025 research recap, Figure 6. New checking accounts across all ages; community banks defined as institutions under $100 billion in assets.');
    inner.appendChild(units); inner.appendChild(legend); inner.appendChild(src);
    opener.appendChild(inner);
    opener.removeAttribute('aria-hidden');
    opener.setAttribute('role', 'img');
    opener.setAttribute('aria-label', 'Of 100 new checking accounts opened in 2024, 44 went to digital banks and fintechs and 4 went to community banks.');

    var cells = units.children;
    var per = reduceMotion ? 0 : 16;           // the brass fill runs left to right in about 0.7s
    var pause = reduceMotion ? 0 : 520;        // then a beat, so the four land on their own
    for (var a = 0; a < FINTECH; a++) {
      (function (a) { setTimeout(function () { cells[a].classList.add('is-fintech'); }, 220 + a * per); })(a);
    }
    for (var b = 0; b < COMMUNITY; b++) {
      (function (b) {
        var t = 220 + FINTECH * per + pause + b * (reduceMotion ? 0 : 140);
        setTimeout(function () {
          var c = cells[FINTECH + b];
          c.classList.add('is-community', 'is-landing');
          setTimeout(function () { c.classList.remove('is-landing'); }, 260);
        }, t);
      })(b);
    }
    countUp(legend.querySelector('[data-count="44"]'), 44, FINTECH * per + 200, 220);
    countUp(legend.querySelector('[data-count="4"]'), 4, 4 * 140 + 200, 220 + FINTECH * per + pause);
  }

  /* ---------- Closing callback: the hundred, small; only the four fill ---------- */
  document.querySelectorAll('[data-fd="grid-empty"]').forEach(function (fig) {
    var cells = fig.querySelector('.fd-grid-cells');
    if (!cells) return;
    for (var i = 0; i < 100; i++) cells.appendChild(h('div', 'fd-cell'));
    onEnter(fig, function () {
      for (var j = 0; j < 4; j++) {
        (function (j) { setTimeout(function () { cells.children[44 + j].classList.add('is-community'); }, 700 + j * 420); })(j);
      }
    }, 0.6);
  });

  /* ---------- Stat callouts: a row of units, the share filled in brass ---------- */
  document.querySelectorAll('[data-fd="stat"]').forEach(function (fig) {
    var units = fig.querySelector('.fd-stat-units');
    if (!units) return;
    var value = parseInt(fig.getAttribute('data-value'), 10) || 0;
    var of = parseInt(fig.getAttribute('data-of'), 10) || 100;
    var cols = of === 100 ? 50 : of;
    units.setAttribute('data-cols', String(cols));
    for (var i = 0; i < of; i++) units.appendChild(h('div', 'fd-cell'));
    onEnter(fig, function () {
      var per = reduceMotion ? 0 : Math.max(8, Math.round(600 / value));
      for (var j = 0; j < value; j++) {
        (function (j) { setTimeout(function () { units.children[j].classList.add('is-fintech'); }, 120 + j * per); })(j);
      }
    }, 0.5);
  });

  /* ---------- The bank in a hoodie: the hood drops on, then the board arrives ---------- */
  document.querySelectorAll('[data-fd="illo"]').forEach(function (fig) {
    onEnter(fig, function () { fig.classList.add('is-in'); }, 0.55);
  });

  /* ---------- Pinned sequences: step observer ---------- */
  var sequences = [];
  document.querySelectorAll('[data-fd="scrolly"]').forEach(function (sec) {
    var steps = Array.prototype.slice.call(sec.querySelectorAll('.fd-step'));
    var graphic = sec.querySelector('.fd-graphic');
    var seq = { el: sec, steps: steps, graphic: graphic, active: 0, onStep: null };
    sequences.push(seq);

    function setActive(n) {
      if (n === seq.active) return;
      seq.active = n;
      steps.forEach(function (s, i) { s.classList.toggle('is-active', i + 1 === n); });
      graphic.setAttribute('data-step', String(n));
      if (seq.onStep) seq.onStep(n);
      sec.querySelectorAll('.fd-sticky-notes .fd-sidenote').forEach(function (a) {
        a.classList.toggle('is-current', a.getAttribute('data-step') === String(n));
      });
    }
    seq.setActive = setActive;

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(parseInt(e.target.getAttribute('data-step'), 10));
        });
      }, { rootMargin: '-42% 0px -42% 0px', threshold: 0 });
      steps.forEach(function (s) { io.observe(s); });
      // when the section first comes into view, rest on step 1
      var top = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting && seq.active === 0) setActive(1); });
      }, { threshold: 0.05 });
      top.observe(sec);
    } else {
      setActive(steps.length);
    }
  });
  function seqByName(name) {
    for (var i = 0; i < sequences.length; i++) if (sequences[i].el.getAttribute('data-scrolly') === name) return sequences[i];
    return null;
  }

  /* ---------- Sequence 1: the math ---------- */
  var mathSeq = seqByName('math');
  if (mathSeq) {
    var BAL = 5400, NIM = 0.0381, TXN = 34.6, IC_EX = 0.51, IC_COV = 0.23, CAC = 350;
    var spread = BAL * NIM, icEx = TXN * 12 * IC_EX, icCov = TXN * 12 * IC_COV;
    var totalEx = spread + icEx, totalCov = spread + icCov;
    var scale = Math.max(totalEx, CAC) * 1.12;
    var pct = function (v) { return (v / scale * 100).toFixed(2) + '%'; };
    var months = Math.ceil(CAC / (totalEx / 12));

    var g = mathSeq.graphic;
    g.innerHTML =
      '<p class="fd-eyebrow fd-g-eyebrow">One primary checking customer, one year</p>' +
      '<div class="fd-g-balance"><span class="num">' + money(BAL) + '</span><span class="sub">median transaction balance, under 35</span></div>' +
      '<div class="fd-g-bar" data-bar="exempt"><div class="fd-g-bar-head"><span class="fd-g-bar-name">A community bank, under $10B</span><span class="fd-g-bar-val" data-val>$0</span></div>' +
        '<div class="fd-g-track"><div class="fd-g-seg spread"><span class="fd-g-seg-label">spread ' + money(spread) + '</span></div><div class="fd-g-seg ic"><span class="fd-g-seg-label">interchange ' + money(icEx) + '</span></div><div class="fd-g-cac"><span>' + money(CAC) + ' to acquire</span></div></div></div>' +
      '<div class="fd-g-bar" data-bar="covered"><div class="fd-g-bar-head"><span class="fd-g-bar-name">The same customer at a bank over $10B</span><span class="fd-g-bar-val" data-val>$0</span></div>' +
        '<div class="fd-g-track"><div class="fd-g-seg spread"><span class="fd-g-seg-label">spread ' + money(spread) + '</span></div><div class="fd-g-seg ic"><span class="fd-g-seg-label">interchange ' + money(icCov) + '</span></div></div></div>' +
      '<div class="fd-g-ledger">' +
        '<div class="fd-g-row" data-row="spread"><span class="fd-g-row-label">Deposit spread<small>' + money(BAL) + ' × 3.81% net interest margin</small></span><span class="fd-g-row-val">' + money(spread) + '</span></div>' +
        '<div class="fd-g-row" data-row="ic"><span class="fd-g-row-label">Interchange, gross<small>34.6 transactions a month × 12 × $0.51</small></span><span class="fd-g-row-val">' + money(icEx) + '</span></div>' +
        '<div class="fd-g-row is-total" data-row="total"><span class="fd-g-row-label">A year of checking, before any loan</span><span class="fd-g-row-val">' + money(totalEx) + '</span></div>' +
      '</div>' +
      '<p class="fd-g-payback">Against a <strong>' + money(CAC) + '</strong> acquisition cost, that pays back in <strong>' + months + ' months</strong>.</p>';

    var barEx = g.querySelector('[data-bar="exempt"]'), barCov = g.querySelector('[data-bar="covered"]');
    var segs = function (bar) { return { s: bar.querySelector('.spread'), i: bar.querySelector('.ic'), v: bar.querySelector('[data-val]') }; };
    var ex = segs(barEx), cov = segs(barCov);
    var cac = g.querySelector('.fd-g-cac');
    var rows = { spread: g.querySelector('[data-row="spread"]'), ic: g.querySelector('[data-row="ic"]'), total: g.querySelector('[data-row="total"]') };
    var payback = g.querySelector('.fd-g-payback');
    ex.i.style.left = pct(spread); cov.i.style.left = pct(spread);
    cac.style.left = pct(CAC);

    function setBar(o, sp, ic, total) {
      o.s.style.width = pct(sp); o.i.style.width = pct(ic);
      o.s.classList.toggle('is-labeled', sp > 0); o.i.classList.toggle('is-labeled', ic > 0);
      o.v.textContent = money(total);
    }
    mathSeq.onStep = function (n) {
      // 1: the balance alone. 2: spread. 3: interchange stacks on. 4: the acquisition line drops in, already beaten. 5: the same customer over $10B.
      barEx.classList.toggle('is-shown', n >= 2);
      setBar(ex, n >= 2 ? spread : 0, n >= 3 ? icEx : 0, n >= 3 ? totalEx : n >= 2 ? spread : 0);
      rows.spread.classList.toggle('is-shown', n >= 2);
      rows.ic.classList.toggle('is-shown', n >= 3);
      rows.total.classList.toggle('is-shown', n >= 3);
      cac.classList.toggle('is-shown', n >= 4);
      payback.classList.toggle('is-shown', n >= 4);
      barCov.classList.toggle('is-shown', n >= 5);
      setBar(cov, n >= 5 ? spread : 0, n >= 5 ? icCov : 0, n >= 5 ? totalCov : 0);
    };
    mathSeq.onStep(mathSeq.active || 0);
  }

  /* ---------- Sequence 2: the fifteen-year wait ---------- */
  var tlSeq = seqByName('timeline');
  if (tlSeq) {
    var g2 = tlSeq.graphic;
    var perYear = parseFloat(g2.getAttribute('data-per-year')) || 400;
    var startAge = parseInt(g2.getAttribute('data-start'), 10) || 25;
    var endAge = parseInt(g2.getAttribute('data-end'), 10) || 40;
    var eventVal = parseFloat(g2.getAttribute('data-event')) || 973;
    var years = endAge - startAge;
    var W = 760, H = 330, padL = 58, padR = 20, padT = 54, padB = 44;
    var innerW = W - padL - padR, innerH = H - padT - padB;
    var maxVal = perYear * years;
    var slots = years + 1, slotW = innerW / slots, barW = slotW * 0.62;
    var y = function (v) { return padT + innerH - (v / maxVal) * innerH; };
    var ns = 'http://www.w3.org/2000/svg';
    function el(name, attrs, text) {
      var e = document.createElementNS(ns, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (text != null) e.textContent = text;
      return e;
    }
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Checking contribution accumulating from age ' + startAge + ' to ' + (endAge - 1) + ', about ' + money(maxVal) + ' in total, beside a ' + money(eventVal) + ' mortgage at ' + endAge + '.' });
    g2.appendChild(h('p', 'fd-eyebrow', 'The fifteen-year wait'));

    [0, 2000, 4000, 6000].forEach(function (v) {
      if (v > maxVal) return;
      svg.appendChild(el('line', { x1: padL, x2: W - padR, y1: y(v), y2: y(v), 'class': 'fd-tl-axis' }));
      svg.appendChild(el('text', { x: padL - 10, y: y(v) + 4, 'text-anchor': 'end', 'class': 'fd-tl-label' }, money(v)));
    });
    for (var i = 0; i < years; i++) {
      var val = perYear * (i + 1);
      var x = padL + i * slotW + (slotW - barW) / 2;
      var bar = el('rect', { x: x, y: y(val), width: barW, height: innerH - (y(val) - padT), 'class': 'fd-tl-bar' });
      bar.style.transitionDelay = (reduceMotion ? 0 : i * 55) + 'ms';   // rises left to right, about 0.8s across
      svg.appendChild(bar);
      var age = startAge + i;
      if ((age - startAge) % 5 === 0) {
        svg.appendChild(el('text', { x: x + barW / 2, y: H - padB + 22, 'text-anchor': 'middle', 'class': 'fd-tl-label' + (age === startAge ? ' is-strong' : '') }, String(age)));
      }
    }
    var xe = padL + years * slotW + (slotW - barW) / 2;
    // the marker at 40 comes first: the wait, before anything has accumulated
    svg.appendChild(el('line', { x1: xe + barW / 2, x2: xe + barW / 2, y1: padT - 6, y2: padT + innerH, 'class': 'fd-tl-marker' }));
    svg.appendChild(el('text', { x: xe + barW / 2, y: padT - 14, 'text-anchor': 'end', 'class': 'fd-tl-marker-label' }, 'median first-time buyer'));
    var ev = el('rect', { x: xe, y: y(eventVal), width: barW, height: innerH - (y(eventVal) - padT), 'class': 'fd-tl-event' });
    ev.style.transitionDelay = (reduceMotion ? 0 : 380) + 'ms';   // a beat after the reader lands on the sentence
    svg.appendChild(ev);
    svg.appendChild(el('text', { x: xe + barW / 2, y: H - padB + 22, 'text-anchor': 'middle', 'class': 'fd-tl-label is-strong' }, String(endAge)));
    svg.appendChild(el('text', { x: padL + (years - 1) * slotW + slotW / 2, y: y(maxVal) - 26, 'text-anchor': 'middle', 'class': 'fd-tl-callout' }, money(maxVal) + ' of checking'));
    svg.appendChild(el('text', { x: padL + (years - 1) * slotW + slotW / 2, y: y(maxVal) - 10, 'text-anchor': 'middle', 'class': 'fd-tl-sub' }, 'gross, at ' + money(perYear) + ' a year'));
    svg.appendChild(el('text', { x: xe + barW / 2, y: y(eventVal) - 26, 'text-anchor': 'middle', 'class': 'fd-tl-callout is-brass' }, money(eventVal)));
    svg.appendChild(el('text', { x: xe + barW / 2, y: y(eventVal) - 10, 'text-anchor': 'middle', 'class': 'fd-tl-sub is-brass' }, 'the mortgage'));
    svg.appendChild(el('line', { x1: padL, x2: W - padR, y1: padT + innerH, y2: padT + innerH, 'class': 'fd-tl-axis', style: 'stroke: var(--secondary)' }));
    g2.appendChild(svg);
  }

  /* ---------- Sequence 3: twelve functions, one bank ---------- */
  var orgSeq = seqByName('org');
  if (orgSeq) {
    var g3 = orgSeq.graphic;
    var boxes = Array.prototype.slice.call(g3.querySelectorAll('.fd-org-box'));
    function aim() {
      // each box heads for the centre; the outer ones leave first, so the chart folds inward
      var r = g3.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var maxD = 0, ds = [];
      boxes.forEach(function (b) {
        var br = b.getBoundingClientRect();
        var bx = br.left + br.width / 2, by = br.top + br.height / 2;
        var dx = cx - bx, dy = cy - by, d = Math.sqrt(dx * dx + dy * dy);
        ds.push(d); if (d > maxD) maxD = d;
        b.style.setProperty('--dx', dx + 'px');
        b.style.setProperty('--dy', dy + 'px');
      });
      boxes.forEach(function (b, i) {
        var delay = reduceMotion ? 0 : Math.round((1 - ds[i] / (maxD || 1)) * 260);
        b.style.setProperty('--d', delay + 'ms');
      });
    }
    aim();
    window.addEventListener('resize', aim);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(aim);
  }

  /* ---------- Calculator ---------- */
  var calc = document.querySelector('[data-fd="calc"]');
  if (calc) {
    var $ = function (id) { return document.getElementById(id); };
    var inBal = $('fd-in-balance'), inNim = $('fd-in-nim'), inTxn = $('fd-in-txn'), inIc = $('fd-in-ic'), inCac = $('fd-in-cac');
    var outSpread = $('fd-out-spread'), outIc = $('fd-out-ic'), outTotal = $('fd-out-total'), outMonths = $('fd-out-months');
    var barSpread = $('fd-bar-spread'), barIc = $('fd-bar-ic'), barCac = $('fd-bar-cac');
    function num(el) { var v = parseFloat(el.value); return isFinite(v) && v >= 0 ? v : 0; }
    function update() {
      var bal = num(inBal), nim = num(inNim) / 100, txn = num(inTxn), ic = num(inIc), cacv = num(inCac);
      var sp = bal * nim, inter = txn * 12 * ic, total = sp + inter;
      var m = total > 0 ? Math.ceil(cacv / (total / 12)) : 0;
      outSpread.textContent = money(sp); outIc.textContent = money(inter); outTotal.textContent = money(total);
      outMonths.textContent = total > 0 ? (m <= 12 ? m + (m === 1 ? ' month' : ' months') : (m / 12).toFixed(1) + ' years') : '—';
      var sc = Math.max(total, cacv) * 1.12 || 1;
      var wS = sp / sc * 100, wI = inter / sc * 100;
      barSpread.style.width = wS + '%'; barIc.style.left = wS + '%'; barIc.style.width = wI + '%'; barCac.style.left = (cacv / sc * 100) + '%';
    }
    [inBal, inNim, inTxn, inIc, inCac].forEach(function (el) { el.addEventListener('input', update); });
    calc.querySelectorAll('.fd-durbin-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        calc.querySelectorAll('.fd-durbin-btn').forEach(function (b) { b.classList.remove('is-on'); });
        btn.classList.add('is-on'); inIc.value = btn.getAttribute('data-ic'); update();
      });
    });
    inIc.addEventListener('input', function () {
      calc.querySelectorAll('.fd-durbin-btn').forEach(function (b) { b.classList.toggle('is-on', parseFloat(b.getAttribute('data-ic')) === parseFloat(inIc.value)); });
    });
    var key = h('div', 'fd-bar-key', '<span class="k-spread">Deposit spread</span><span class="k-ic">Interchange</span>');
    calc.querySelector('.fd-bar').appendChild(key);
    update();
  }

  /* ---------- Lede and colophon ---------- */
  (function () {
    var b = document.querySelector('.article-body');
    if (!b) return;
    var ps = b.children;
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].tagName === 'P' && !ps[i].className) { ps[i].classList.add('fd-lede'); break; }
      if (ps[i].tagName !== 'ASIDE') break;
    }
    b.querySelectorAll('h2').forEach(function (hd) { if (/about the numbers/i.test(hd.textContent)) hd.classList.add('fd-colophon'); });
  })();

  /* ---------- Sidenotes ---------- */
  var body = document.querySelector('.article-body');
  var notesSection = body && body.querySelector('section[data-footnotes]');
  if (body && notesSection) {
    notesSection.querySelectorAll('li').forEach(function (li, i) { li.setAttribute('data-num', String(i + 1)); });
    var refs = Array.prototype.slice.call(body.querySelectorAll('[data-footnote-ref]'));
    var seen = {};
    var marginNotes = [];

    refs.forEach(function (ref) {
      var id = (ref.getAttribute('href') || '').replace(/^#/, '');
      var li = id && document.getElementById(id);
      if (!li) return;
      var num = li.getAttribute('data-num') || ref.textContent.trim();
      var para = ref.closest('p, li, figcaption') || ref.parentNode;
      var step = ref.closest('.fd-step');
      var seq = ref.closest('[data-fd="scrolly"]');

      if (!seen[id]) {
        seen[id] = true;
        var aside = h('aside', 'fd-sidenote', '<span class="fd-sidenote-num">' + num + '</span>' + li.innerHTML);
        aside.setAttribute('data-for', id);
        if (seq && step) {
          // under a pinned graphic there is no room for the whole note: the source and its first sentence, then a link
          var text = li.textContent.replace(/\s*\u21a9\s*$/, '').trim();
          var m = text.match(/^(.{40,260}?[.!?])(\s|$)/);
          var brief = m ? m[1] : text.slice(0, 200);
          var strong = li.querySelector('strong');
          var lead = strong ? '<strong>' + strong.textContent + '</strong> ' : '';
          if (strong) brief = brief.replace(strong.textContent, '').replace(/^\s+/, '');
          var full = li.innerHTML;
          aside.innerHTML = '<span class="fd-sidenote-num">' + num + '</span>' + lead + '<span class="fd-note-brief">' + brief + '</span><span class="fd-note-full">' + full.replace(/^\s*<p>/, '').replace(/<\/p>\s*$/, '') + '</span> <button type="button" class="fd-note-more">Full note</button>';
          aside.querySelector('.fd-note-more').addEventListener('click', function () { aside.classList.add('is-open'); });
          // in a pinned sequence the note lives under the graphic and appears with its step
          aside.setAttribute('data-step', step.getAttribute('data-step'));
          seq.querySelector('.fd-sticky-notes').appendChild(aside);
        } else {
          body.appendChild(aside);
          marginNotes.push({ el: aside, anchor: para });
        }
        var on = function () { aside.classList.add('is-active'); }, off = function () { aside.classList.remove('is-active'); };
        ref.addEventListener('mouseenter', on); ref.addEventListener('mouseleave', off);
        ref.addEventListener('focus', on); ref.addEventListener('blur', off);
        aside.addEventListener('mouseenter', function () { ref.classList.add('is-active'); });
        aside.addEventListener('mouseleave', function () { ref.classList.remove('is-active'); });
      }

      // narrow screens: tap to open the note under the paragraph
      ref.addEventListener('click', function (e) {
        if (isWide()) return;
        e.preventDefault();
        var existing = para.nextElementSibling;
        if (existing && existing.classList.contains('fd-note-inline') && existing.getAttribute('data-for') === id) {
          existing.remove(); ref.classList.remove('is-active'); return;
        }
        var open = body.querySelector('.fd-note-inline'); if (open) open.remove();
        body.querySelectorAll('[data-footnote-ref].is-active').forEach(function (r) { r.classList.remove('is-active'); });
        var note = h('div', 'fd-note-inline', '<span class="fd-sidenote-num">' + num + '</span>' + li.innerHTML);
        note.setAttribute('data-for', id);
        para.insertAdjacentElement('afterend', note);
        ref.classList.add('is-active');
      });
    });

    function layoutSidenotes() {
      if (!isWide()) return;
      var bodyTop = body.getBoundingClientRect().top + window.scrollY;
      var gap = 22, prevBottom = -Infinity;
      marginNotes.sort(function (a, b) { return a.anchor.getBoundingClientRect().top - b.anchor.getBoundingClientRect().top; });
      // the pinned sequences own the rail while they are on screen; nothing else may sit beside them
      var blocks = Array.prototype.slice.call(body.querySelectorAll('[data-fd="scrolly"]')).map(function (el) {
        var r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY - bodyTop, bottom: r.bottom + window.scrollY - bodyTop };
      });
      marginNotes.forEach(function (s) {
        var top = s.anchor.getBoundingClientRect().top + window.scrollY - bodyTop;
        var hh = s.el.offsetHeight;
        if (top < prevBottom + gap) top = prevBottom + gap;
        blocks.forEach(function (bk) {
          if (top < bk.bottom + gap && top + hh > bk.top - gap) {
            var above = bk.top - gap - hh;
            top = (above >= prevBottom + gap) ? above : bk.bottom + gap;
          }
        });
        s.el.style.top = Math.max(0, top) + 'px';
        prevBottom = top + hh;
      });
    }
    var raf;
    function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(layoutSidenotes); }
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    schedule(); setTimeout(schedule, 600);

    // seed the first step's notes in each sequence
    sequences.forEach(function (seq) {
      seq.el.querySelectorAll('.fd-sticky-notes .fd-sidenote[data-step="1"]').forEach(function (a) { a.classList.add('is-current'); });
    });
  }
})();
