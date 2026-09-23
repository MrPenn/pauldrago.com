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
    // The markup is rendered at build time (FrontDoorOpener.astro); this only animates it.
    var units = opener.querySelector('.fd-opener-units');
    var legend = opener.querySelector('.fd-opener-legend');
    // The figures ship in the HTML; zero them only when there is an animation to run.
    if (!reduceMotion) legend.querySelectorAll('[data-count]').forEach(function (n) { n.textContent = '0'; });

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
    // The hundred boxes ship in the HTML; only build them if an older page lacks them.
    if (!cells.children.length) for (var i = 0; i < 100; i++) cells.appendChild(h('div', 'fd-cell'));
    // The four ship filled; they only replay if the figure is still below the fold, so the
    // reader never finds it empty.
    if (reduceMotion || fig.getBoundingClientRect().top < window.innerHeight) return;
    for (var k = 0; k < 4; k++) cells.children[44 + k].classList.remove('is-community');
    onEnter(fig, function () {
      for (var j = 0; j < 4; j++) {
        (function (j) { setTimeout(function () { cells.children[44 + j].classList.add('is-community'); }, 400 + j * 300); })(j);
      }
    }, 0.3);
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

    var stacked = window.matchMedia('(max-width: 1179px)');
    if (stacked.matches) {
      // Stacked layout: the graphic is pinned to the top of the screen and the
      // steps scroll up underneath it. The live step is the last one whose top
      // has passed a line a little below the graphic.
      var sticky = sec.querySelector('.fd-sticky');
      var ticking = false;
      function pick() {
        ticking = false;
        var secR = sec.getBoundingClientRect();
        if (secR.bottom < 0 || secR.top > window.innerHeight) return;
        var line = (sticky ? sticky.getBoundingClientRect().bottom : 0) + window.innerHeight * 0.14;
        var n = 1;
        for (var i = 0; i < steps.length; i++) {
          if (steps[i].getBoundingClientRect().top <= line) n = i + 1;
        }
        setActive(n);
      }
      function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      pick();
    } else if ('IntersectionObserver' in window) {
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
    // Totals shown on screen are the sum of the rounded parts, so the ledger always adds up.
    var shownEx = Math.round(spread) + Math.round(icEx);
    var scale = Math.max(totalEx, CAC) * 1.12;
    var pct = function (v) { return (v / scale * 100).toFixed(2) + '%'; };
    var months = Math.ceil(CAC / (totalEx / 12));

    var g = mathSeq.graphic;
    g.innerHTML =
      '<p class="fd-eyebrow fd-g-eyebrow">One primary checking customer, one year</p>' +
      '<div class="fd-g-balance"><span class="num">' + money(BAL) + '</span><span class="sub">median transaction balance, under 35</span></div>' +
      '<div class="fd-g-bar" data-bar="exempt"><div class="fd-g-bar-head"><span class="fd-g-bar-name">A community bank, under $10B</span><span class="fd-g-bar-val" data-val>$0</span></div>' +
        '<div class="fd-g-track"><div class="fd-g-seg spread"><span class="fd-g-seg-label"><span class="fd-g-seg-word">spread </span>' + money(spread) + '</span></div><div class="fd-g-seg ic"><span class="fd-g-seg-label"><span class="fd-g-seg-word">interchange </span>' + money(icEx) + '</span></div><div class="fd-g-cac"><span>' + money(CAC) + ' to acquire</span></div></div></div>' +
      '<div class="fd-g-bar" data-bar="covered"><div class="fd-g-bar-head"><span class="fd-g-bar-name">The same customer at a bank over $10B</span><span class="fd-g-bar-val" data-val>$0</span></div>' +
        '<div class="fd-g-track"><div class="fd-g-seg spread"><span class="fd-g-seg-label"><span class="fd-g-seg-word">spread </span>' + money(spread) + '</span></div><div class="fd-g-seg ic"><span class="fd-g-seg-label"><span class="fd-g-seg-word">interchange </span>' + money(icCov) + '</span></div></div></div>' +
      '<div class="fd-g-ledger">' +
        '<div class="fd-g-row" data-row="spread"><span class="fd-g-row-label">Deposit spread<small>' + money(BAL) + ' × 3.81% net interest margin</small></span><span class="fd-g-row-val">' + money(spread) + '</span></div>' +
        '<div class="fd-g-row" data-row="ic"><span class="fd-g-row-label">Interchange, gross<small>34.6 transactions a month × 12 × $0.51</small></span><span class="fd-g-row-val">' + money(icEx) + '</span></div>' +
        '<div class="fd-g-row is-total" data-row="total"><span class="fd-g-row-label">A year of checking, before any loan</span><span class="fd-g-row-val">' + money(shownEx) + '</span></div>' +
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

    function fit(seg, share) {
      // a label only shows when the segment is wide enough to hold it
      var lab = seg.querySelector('.fd-g-seg-label');
      if (!lab) return;
      var track = seg.parentNode.getBoundingClientRect().width;
      seg.classList.toggle('is-tight', share * track < lab.scrollWidth + 18);
    }
    function setBar(o, sp, ic, total) {
      o.s.style.width = pct(sp); o.i.style.width = pct(ic);
      o.s.classList.toggle('is-labeled', sp > 0); o.i.classList.toggle('is-labeled', ic > 0);
      // The bar's total is the sum of the shown (rounded) parts, so it matches the ledger.
      o.v.textContent = money(Math.round(sp) + Math.round(ic));
      fit(o.s, sp / scale); fit(o.i, ic / scale);
    }
    window.addEventListener('resize', function () { mathSeq.onStep(mathSeq.active || 0); });
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
    var ns = 'http://www.w3.org/2000/svg';
    function el(name, attrs, text) {
      var e = document.createElementNS(ns, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (text != null) e.textContent = text;
      return e;
    }
    g2.appendChild(h('p', 'fd-eyebrow', 'The fifteen-year wait'));
    var maxVal = perYear * years;
    var svg = null;

    // Drawn at the width it is displayed, so one SVG unit is one CSS pixel and the type stays
    // at its real size. The two callouts live in a band above the plot, clear of every bar.
    function drawTimeline() {
      var cs = getComputedStyle(g2);
      var W = Math.max(300, Math.round(g2.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)));
      var H = Math.round(Math.max(300, Math.min(380, W * 0.78)));
      var padL = 54, padR = 8, padT = 78, padB = 52;
      var innerW = W - padL - padR, innerH = H - padT - padB;
      var slots = years + 1, slotW = innerW / slots, barW = Math.max(6, slotW * 0.62);
      var y = function (v) { return padT + innerH - (v / maxVal) * innerH; };
      var next = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'Checking contribution accumulating from age ' + startAge + ' to ' + (endAge - 1) + ', about ' + money(maxVal) + ' in total, beside a ' + money(eventVal) + ' mortgage at ' + endAge + '.' });

      [0, 2000, 4000, 6000].forEach(function (v) {
        if (v > maxVal) return;
        next.appendChild(el('line', { x1: padL, x2: W - padR, y1: y(v), y2: y(v), 'class': 'fd-tl-axis' }));
        next.appendChild(el('text', { x: padL - 8, y: y(v) + 4, 'text-anchor': 'end', 'class': 'fd-tl-label' }, money(v)));
      });
      for (var i = 0; i < years; i++) {
        var val = perYear * (i + 1);
        var x = padL + i * slotW + (slotW - barW) / 2;
        var bar = el('rect', { x: x, y: y(val), width: barW, height: innerH - (y(val) - padT), 'class': 'fd-tl-bar' });
        bar.style.transitionDelay = (reduceMotion ? 0 : i * 55) + 'ms';   // rises left to right, about 0.8s across
        next.appendChild(bar);
        var age = startAge + i;
        if ((age - startAge) % 5 === 0) {
          next.appendChild(el('text', { x: x + barW / 2, y: padT + innerH + 20, 'text-anchor': 'middle', 'class': 'fd-tl-label' + (age === startAge ? ' is-strong' : '') }, String(age)));
        }
      }
      var xe = padL + years * slotW + (slotW - barW) / 2, xm = xe + barW / 2;
      // the marker at 40 comes first: the wait, before anything has accumulated
      next.appendChild(el('line', { x1: xm, x2: xm, y1: 50, y2: padT + innerH, 'class': 'fd-tl-marker' }));
      next.appendChild(el('text', { x: W - padR, y: padT + innerH + 40, 'text-anchor': 'end', 'class': 'fd-tl-marker-label' }, 'Median first-time buyer'));
      var ev = el('rect', { x: xe, y: y(eventVal), width: barW, height: innerH - (y(eventVal) - padT), 'class': 'fd-tl-event' });
      ev.style.transitionDelay = (reduceMotion ? 0 : 380) + 'ms';   // a beat after the reader lands on the sentence
      next.appendChild(ev);
      next.appendChild(el('text', { x: xm, y: padT + innerH + 20, 'text-anchor': 'middle', 'class': 'fd-tl-label is-strong' }, String(endAge)));
      // callout band: checking total top left, the mortgage top right above its marker
      next.appendChild(el('text', { x: padL, y: 22, 'text-anchor': 'start', 'class': 'fd-tl-callout' }, money(maxVal) + ' of checking'));
      next.appendChild(el('text', { x: padL, y: 42, 'text-anchor': 'start', 'class': 'fd-tl-sub' }, 'gross, at ' + money(perYear) + ' a year'));
      next.appendChild(el('text', { x: W - padR, y: 22, 'text-anchor': 'end', 'class': 'fd-tl-callout is-brass' }, money(eventVal)));
      next.appendChild(el('text', { x: W - padR, y: 42, 'text-anchor': 'end', 'class': 'fd-tl-sub is-brass' }, 'the mortgage'));
      next.appendChild(el('line', { x1: padL, x2: W - padR, y1: padT + innerH, y2: padT + innerH, 'class': 'fd-tl-axis', style: 'stroke: var(--secondary)' }));
      if (svg) g2.replaceChild(next, svg); else g2.appendChild(next);
      svg = next;
    }
    drawTimeline();
    var tlWidth = g2.clientWidth, tlTimer;
    window.addEventListener('resize', function () {
      clearTimeout(tlTimer);
      tlTimer = setTimeout(function () { if (g2.clientWidth !== tlWidth) { tlWidth = g2.clientWidth; drawTimeline(); } }, 150);
    });
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
      // The displayed total is the sum of the displayed parts, so the ledger always adds up.
      outSpread.textContent = money(sp); outIc.textContent = money(inter); outTotal.textContent = money(Math.round(sp) + Math.round(inter));
      outMonths.textContent = total > 0 ? (m <= 12 ? m + (m === 1 ? ' month' : ' months') : (m / 12).toFixed(1) + ' years') : '—';
      var sc = Math.max(total, cacv) * 1.12 || 1;
      var wS = sp / sc * 100, wI = inter / sc * 100;
      barSpread.style.width = wS + '%'; barIc.style.left = wS + '%'; barIc.style.width = wI + '%'; barCac.style.left = (cacv / sc * 100) + '%';
    }
    var inputs = [inBal, inNim, inTxn, inIc, inCac];
    var defaults = inputs.map(function (el) { return el.value; });
    var reset = $('fd-calc-reset');
    var hotTimer;
    function afterEdit() {
      update();
      var dirty = inputs.some(function (el, i) { return el.value !== defaults[i]; });
      if (reset) reset.hidden = !dirty;
      [outSpread, outIc, outTotal, outMonths].forEach(function (o) { o.classList.add('is-hot'); });
      clearTimeout(hotTimer);
      hotTimer = setTimeout(function () { [outSpread, outIc, outTotal, outMonths].forEach(function (o) { o.classList.remove('is-hot'); }); }, 700);
    }
    inputs.forEach(function (el) {
      el.addEventListener('input', afterEdit);
      el.addEventListener('focus', function () { el.select(); });
    });
    if (reset) reset.addEventListener('click', function () {
      inputs.forEach(function (el, i) { el.value = defaults[i]; });
      calc.querySelectorAll('.fd-durbin-btn').forEach(function (b) { setPressed(b, b.getAttribute('data-ic') === defaults[3]); });
      afterEdit();
    });
    function setPressed(b, on) { b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    calc.querySelectorAll('.fd-durbin-btn').forEach(function (btn) {
      setPressed(btn, btn.classList.contains('is-on'));
      btn.addEventListener('click', function () {
        calc.querySelectorAll('.fd-durbin-btn').forEach(function (b) { setPressed(b, b === btn); });
        inIc.value = btn.getAttribute('data-ic'); afterEdit();
      });
    });
    inIc.addEventListener('input', function () {
      calc.querySelectorAll('.fd-durbin-btn').forEach(function (b) { setPressed(b, parseFloat(b.getAttribute('data-ic')) === parseFloat(inIc.value)); });
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
          aside.innerHTML = '<span class="fd-sidenote-num">' + num + '</span>' + lead + '<span class="fd-note-brief">' + brief + '</span><span class="fd-note-full">' + full.replace(/^\s*<p>/, '').replace(/<\/p>\s*$/, '') + '</span> <button type="button" class="fd-note-more" aria-expanded="false">Full note</button>';
          var more = aside.querySelector('.fd-note-more');
          more.addEventListener('click', function () {
            var open = aside.classList.toggle('is-open');
            more.setAttribute('aria-expanded', open ? 'true' : 'false');
            more.textContent = open ? 'Shorter note' : 'Full note';
          });
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
