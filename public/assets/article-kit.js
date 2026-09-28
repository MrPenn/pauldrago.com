/* Article kit: the motion and interaction behind the kit's figures, ported from the front door
   article so a new article needs no script of its own.
   - Unit stats fill one unit at a time when they come into view.
   - Built figures (data-pd="build") reveal their parts in order of data-at when they arrive.
   - Pinned sequences (data-pd="scrolly") show each part as the reader reaches its step.
   - Calculators (data-pd="calc") recompute from formulas written in the markup.
   - Unit grids fill their accent squares in order, then the other squares land after a beat.
   - Org folds send every box to the centre and bring in the one thing the customer sees.
   - Illustrations rise into place.
   Everything ships visible in the HTML; this only takes it away to bring it back, and only for
   figures below the fold. One easing, a beat before the thing to notice, nothing loops. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.matchMedia('(width >= 1180px)');
  var body = document.querySelector('.article__body') || document.body;
  // data-pd-arm on the root makes every figure wait for the reader, wherever it sits; the
  // styleguide's frames use it, since each frame starts with its figure at the top.
  var armAll = document.documentElement.hasAttribute('data-pd-arm');
  var below = function (el) { return armAll || el.getBoundingClientRect().top > window.innerHeight * 0.9; };

  function onEnter(el, cb, threshold) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); cb(); } });
    }, { threshold: threshold == null ? 0.35 : threshold });
    io.observe(el);
  }
  function parts(root) { return Array.prototype.slice.call(root.querySelectorAll('[data-at]')); }
  function lastStep(root) { return parts(root).reduce(function (m, p) { return Math.max(m, +p.getAttribute('data-at') || 0); }, 0); }
  // Shows every part whose step has been reached (and, with data-until, not yet passed).
  function show(root, n) {
    root.setAttribute('data-step', String(n));
    parts(root).forEach(function (p) {
      var until = p.getAttribute('data-until');
      p.classList.toggle('is-shown', (+p.getAttribute('data-at') || 0) <= n && (until === null || n <= +until));
    });
    root.querySelectorAll('.pd-fold').forEach(aim);
  }

  /* ---------- Org fold: each box heads for the centre, the outer ones first ---------- */
  function aim(fold) {
    var boxes = fold.querySelectorAll('.pd-org__box');
    var r = fold.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2, max = 0, ds = [];
    boxes.forEach(function (b) {
      if (b.style.getPropertyValue('--dx') && fold.classList.contains('is-shown')) { ds.push(+b.getAttribute('data-d') || 0); return; }
      var br = b.getBoundingClientRect();
      var dx = cx - (br.left + br.width / 2), dy = cy - (br.top + br.height / 2), d = Math.sqrt(dx * dx + dy * dy);
      b.style.setProperty('--dx', dx + 'px');
      b.style.setProperty('--dy', dy + 'px');
      b.setAttribute('data-d', String(d));
      ds.push(d);
      if (d > max) max = d;
    });
    if (!max) return;
    boxes.forEach(function (b, i) { b.style.setProperty('--d', (reduce ? 0 : Math.round((1 - ds[i] / max) * 260)) + 'ms'); });
  }

  /* ---------- Stacked bars: a segment too narrow for its label shows none ---------- */
  function fit(root) {
    root.querySelectorAll('.pd-seg').forEach(function (seg) {
      var label = seg.querySelector('.pd-seg__label');
      var track = seg.parentNode;
      if (!label || !track) return;
      var share = parseFloat(seg.style.width) / 100 || 0;
      // A range's label may run on over its hatching.
      var next = seg.nextElementSibling;
      if (next && next.classList.contains('pd-range')) share += parseFloat(next.style.width) / 100 || 0;
      seg.classList.toggle('is-tight', share * track.getBoundingClientRect().width < label.scrollWidth + 18);
    });
  }

  /* ---------- Built figures: each part in turn, a beat apart ---------- */
  var builds = [];
  function play(fig) {
    var n = lastStep(fig);
    show(fig, 0);
    for (var s = 1; s <= n; s++) {
      (function (s) { setTimeout(function () { show(fig, s); }, reduce ? 0 : 150 + (s - 1) * 700); })(s);
    }
  }
  document.querySelectorAll('[data-pd="build"]').forEach(function (fig) {
    builds.push(fig);
    fit(fig);
    if (reduce || !below(fig)) { show(fig, lastStep(fig)); return; }
    fig.classList.add('is-armed');
    show(fig, 0);
    onEnter(fig, function () { play(fig); }, 0.4);
  });

  /* ---------- Unit stats: the share fills one unit at a time ---------- */
  var units = [];
  function fill(fig) {
    var cells = fig.querySelectorAll('.pd-cell');
    var value = parseInt(fig.getAttribute('data-value'), 10) || 0;
    var per = reduce ? 0 : Math.max(8, Math.round(600 / Math.max(1, value)));
    cells.forEach(function (c) { c.classList.remove('is-on'); });
    for (var j = 0; j < value && j < cells.length; j++) {
      (function (j) { setTimeout(function () { cells[j].classList.add('is-on'); }, 120 + j * per); })(j);
    }
  }
  document.querySelectorAll('[data-pd="units"]').forEach(function (fig) {
    units.push(fig);
    if (reduce || !below(fig)) return;
    fig.querySelectorAll('.pd-cell.is-on').forEach(function (c) { c.classList.remove('is-on'); });
    onEnter(fig, function () { fill(fig); }, 0.5);
  });

  /* ---------- Unit grids: the accent squares fill in order, a beat, then the others land ---------- */
  // Squares marked is-on fill first (data-pace ms apart, 16 by default), then after a 520ms beat
  // the squares marked is-alt land one at a time (data-alt-pace, 140 by default), and the legend
  // numbers count up alongside. The finished grid ships in the HTML.
  var grids = [];
  function countUp(el, target, ms, delay) {
    if (reduce) { el.textContent = target.toLocaleString('en-US'); return; }
    setTimeout(function () {
      var start = null;
      function step(t) {
        if (start === null) start = t;
        var k = Math.min(1, (t - start) / ms);
        el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US');
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay || 0);
  }
  function grid(fig) {
    var cells = Array.prototype.slice.call(fig.querySelectorAll('.pd-cell'));
    var sets = cellsOf(fig), on = sets.on, alt = sets.alt;
    if (!reduce) fig.querySelectorAll('[data-count]').forEach(function (n) { n.textContent = '0'; });
    var pace = reduce ? 0 : +(fig.getAttribute('data-pace') || 16);
    var altPace = reduce ? 0 : +(fig.getAttribute('data-alt-pace') || 140);
    var start = reduce ? 0 : +(fig.getAttribute('data-delay') || 220);
    var beat = reduce || !on.length ? 0 : 520;
    cells.forEach(function (c) { c.classList.remove('is-on', 'is-alt'); });
    on.forEach(function (c, i) { setTimeout(function () { c.classList.add('is-on'); }, start + i * pace); });
    var altStart = start + on.length * pace + beat;
    alt.forEach(function (c, i) {
      setTimeout(function () {
        c.classList.add('is-alt', 'is-landing');
        setTimeout(function () { c.classList.remove('is-landing'); }, 260);
      }, altStart + i * altPace);
    });
    fig.querySelectorAll('[data-count]').forEach(function (n) {
      var target = +n.getAttribute('data-count');
      var isAlt = n.closest('.pd-legend') && n.closest('.pd-legend').querySelector('.pd-swatch--ink');
      countUp(n, target, isAlt ? alt.length * altPace + 200 : on.length * pace + 200, isAlt ? altStart : start);
    });
  }
  function cellsOf(fig) {
    if (!fig.pdCells) {
      var c = Array.prototype.slice.call(fig.querySelectorAll('.pd-cell'));
      fig.pdCells = { on: c.filter(function (x) { return x.classList.contains('is-on'); }), alt: c.filter(function (x) { return x.classList.contains('is-alt'); }) };
    }
    return fig.pdCells;
  }
  document.querySelectorAll('[data-pd="grid"]').forEach(function (fig) {
    grids.push(fig);
    if (reduce) return;
    cellsOf(fig);
    // On screen at load (an opener): it replays at once. Below the fold: it waits for the reader.
    if (!below(fig)) { grid(fig); return; }
    fig.querySelectorAll('.pd-cell').forEach(function (c) { c.classList.remove('is-on', 'is-alt'); });
    fig.querySelectorAll('[data-count]').forEach(function (n) { n.textContent = '0'; });
    onEnter(fig, function () { grid(fig); }, 0.3);
  });

  /* ---------- Illustrations rise into place ---------- */
  var imgs = [];
  document.querySelectorAll('.pd-img').forEach(function (fig) {
    imgs.push(fig);
    if (reduce || !below(fig)) return;
    fig.classList.add('is-armed');
    onEnter(fig, function () { fig.classList.remove('is-armed'); }, 0.3);
  });

  /* ---------- Pinned sequences ---------- */
  // Under a pinned graphic there is no room for a whole source: the publisher and the first
  // sentence show, and "Full note" opens the rest.
  function brief(note, li) {
    if (!li || note.querySelector('[data-note-more]')) return;
    var num = note.querySelector('.sidenote__num');
    var strong = li.querySelector('strong');
    var text = li.textContent.replace(/\s*\u21a9\s*$/, '').trim();
    if (strong) text = text.replace(strong.textContent, '').trim();
    var m = text.match(/^(.{40,260}?[.!?])(\s|$)/);
    var full = li.innerHTML.replace(/<a[^>]*data-footnote-backref[^>]*>[\s\S]*?<\/a>/g, '').replace(/^\s*<p>/, '').replace(/<\/p>\s*$/, '');
    note.innerHTML = (num ? num.outerHTML : '') + (strong ? '<strong>' + strong.textContent + '</strong> ' : '') +
      '<span class="pd-scrolly__note-brief"></span><span class="pd-scrolly__note-full">' + full + '</span> <button type="button" class="pd-text-btn" data-note-more aria-expanded="false">Full note</button>';
    note.querySelector('.pd-scrolly__note-brief').textContent = m ? m[1] : text.slice(0, 200);
    var more = note.querySelector('[data-note-more]');
    more.addEventListener('click', function () {
      var open = note.classList.toggle('is-open');
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
      more.textContent = open ? 'Shorter note' : 'Full note';
    });
  }
  var sequences = [];
  document.querySelectorAll('[data-pd="scrolly"]').forEach(function (sec) {
    var steps = Array.prototype.slice.call(sec.querySelectorAll('.pd-scrolly__step'));
    var graphic = sec.querySelector('.pd-scrolly__graphic');
    if (!graphic || !steps.length) return;
    var seq = { el: sec, graphic: graphic, active: -1, manual: false };
    sequences.push(seq);
    sec.setAttribute('data-rail', 'block');
    graphic.classList.add('is-armed');
    fit(graphic);

    // Sources cited in a step move under the graphic and appear with their step.
    var notes = sec.querySelector('.pd-scrolly__notes');
    steps.forEach(function (step) {
      step.querySelectorAll('[data-footnote-ref]').forEach(function (ref) {
        var id = (ref.getAttribute('href') || '').replace(/^#/, '');
        var note = id && body.querySelector('.sidenote[data-for="' + id + '"]');
        if (note && notes) {
          note.setAttribute('data-step', step.getAttribute('data-step'));
          brief(note, document.getElementById(id));
          notes.appendChild(note);
        }
      });
    });

    seq.set = function (n) {
      if (n === seq.active) return;
      seq.active = n;
      steps.forEach(function (s) { s.classList.toggle('is-active', +s.getAttribute('data-step') === n); });
      show(graphic, n);
      if (notes) notes.querySelectorAll('.sidenote').forEach(function (a) { a.classList.toggle('is-current', a.getAttribute('data-step') === String(n)); });
    };
    if (reduce) { seq.set(lastStep(graphic)); }

    // Wide: the step crossing the middle of the screen is live. Stacked: the last step whose top
    // has passed a line a little below the pinned graphic.
    var ticking = false;
    function pick() {
      ticking = false;
      if (seq.manual) return;
      var r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var line = wide.matches ? window.innerHeight * 0.5 : (sec.querySelector('.pd-scrolly__sticky').getBoundingClientRect().bottom + window.innerHeight * 0.14);
      var n = 0;
      steps.forEach(function (s) { if (s.getBoundingClientRect().top <= line) n = +s.getAttribute('data-step'); });
      seq.set(Math.max(1, n));
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }
    if (!reduce) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      show(graphic, 0);
      pick();
    }
  });

  /* ---------- Calculators ---------- */
  // Formulas are plain arithmetic: numbers, names, + - * / and parentheses, and round, ceil,
  // floor, min, max and abs. They are read here, never run as code.
  function tokens(src) {
    var out = [], re = /\s*(\d*\.?\d+|[A-Za-z_]\w*|[-+*\/(),])/y, m;
    re.lastIndex = 0;
    while (re.lastIndex < src.length && (m = re.exec(src))) out.push(m[1]);
    if (re.lastIndex < src.trim().length) throw new Error('cannot read "' + src + '"');
    return out;
  }
  var FN = { round: Math.round, ceil: Math.ceil, floor: Math.floor, min: Math.min, max: Math.max, abs: Math.abs };
  function evaluate(src, vars) {
    var t = tokens(src), i = 0;
    function peek() { return t[i]; }
    function next() { return t[i++]; }
    function expr() { var v = term(); while (peek() === '+' || peek() === '-') { v = next() === '+' ? v + term() : v - term(); } return v; }
    function term() { var v = factor(); while (peek() === '*' || peek() === '/') { v = next() === '*' ? v * factor() : v / factor(); } return v; }
    function factor() {
      var tok = next();
      if (tok === '-') return -factor();
      if (tok === '(') { var v = expr(); next(); return v; }
      if (/^\d|^\./.test(tok)) return parseFloat(tok);
      if (FN[tok] && peek() === '(') {
        next();
        var args = [expr()];
        while (peek() === ',') { next(); args.push(expr()); }
        next();
        return FN[tok].apply(null, args);
      }
      return Object.prototype.hasOwnProperty.call(vars, tok) ? vars[tok] : NaN;
    }
    return expr();
  }
  function format(n, how) {
    if (!isFinite(n)) return how === 'months' ? 'not reached' : '$0';
    if (how === 'money') return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');
    if (how === 'millions') return (n < 0 ? '-$' : '$') + (Math.round(Math.abs(n) / 1e5) / 10).toLocaleString('en-US') + ' million';
    if (how === 'months') { var m = Math.ceil(n); return m <= 12 ? m + (m === 1 ? ' month' : ' months') : (m / 12).toFixed(1) + ' years'; }
    if (how === 'percent') return (Math.round(n * 10) / 10) + '%';
    if (how === 'int') return Math.round(n).toLocaleString('en-US');
    return (Math.round(n * 100) / 100).toLocaleString('en-US');
  }
  document.querySelectorAll('[data-pd="calc"]').forEach(function (calc) {
    var inputs = Array.prototype.slice.call(calc.querySelectorAll('[data-var]'));
    var defaults = inputs.map(function (el) { return el.value; });
    var defs = (calc.getAttribute('data-define') || '').split(';').map(function (d) { return d.split('='); }).filter(function (d) { return d.length === 2; });
    var reset = calc.querySelector('[data-reset]');
    var outs = Array.prototype.slice.call(calc.querySelectorAll('[data-out]'));
    var toggles = Array.prototype.slice.call(calc.querySelectorAll('[data-set]'));
    var hot;
    function update() {
      var v = {};
      inputs.forEach(function (el) { var x = parseFloat(el.value); v[el.getAttribute('data-var')] = isFinite(x) && x >= 0 ? x : 0; });
      defs.forEach(function (d) { v[d[0].trim()] = evaluate(d[1], v); });
      outs.forEach(function (o) { o.textContent = format(v[o.getAttribute('data-out')], o.getAttribute('data-format') || 'number'); });
      calc.querySelectorAll('.pd-bar--live').forEach(function (bar) {
        var scale = evaluate(bar.getAttribute('data-scale') || 'scale', v) || 1;
        var left = 0;
        bar.querySelectorAll('.pd-seg[data-w]').forEach(function (seg) {
          var w = Math.max(0, evaluate(seg.getAttribute('data-w'), v)) / scale * 100;
          seg.style.left = left + '%';
          seg.style.width = w + '%';
          left += w;
        });
        bar.querySelectorAll('.pd-mark[data-x]').forEach(function (mk) { mk.style.left = Math.min(100, evaluate(mk.getAttribute('data-x'), v) / scale * 100) + '%'; });
        // A part's label shows only while its segment is wide enough to hold it.
        fit(bar);
      });
      toggles.forEach(function (b) {
        var kv = b.getAttribute('data-set').split('=');
        var on = v[kv[0].trim()] === parseFloat(kv[1]);
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    function edited() {
      update();
      if (reset) reset.hidden = inputs.every(function (el, i) { return el.value === defaults[i]; });
      outs.forEach(function (o) { o.classList.add('is-hot'); });
      clearTimeout(hot);
      hot = setTimeout(function () { outs.forEach(function (o) { o.classList.remove('is-hot'); }); }, 700);
    }
    inputs.forEach(function (el) {
      el.addEventListener('input', edited);
      el.addEventListener('focus', function () { el.select(); });
    });
    toggles.forEach(function (b) {
      b.addEventListener('click', function () {
        var kv = b.getAttribute('data-set').split('=');
        var target = calc.querySelector('[data-var="' + kv[0].trim() + '"]');
        if (target) { target.value = kv[1].trim(); edited(); }
      });
    });
    if (reset) reset.addEventListener('click', function () { inputs.forEach(function (el, i) { el.value = defaults[i]; }); edited(); });
    update();
  });

  /* ---------- As-of sliders: pick a day, see the version that was live ---------- */
  // Every version ships in the HTML as a list; the script reads it, shows the slider, and keeps the
  // answers and the date at the size of their largest state, so nothing moves while the slider does.
  function day(s) { var p = String(s).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function dayName(t) { return new Date(t).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }); }
  var asofs = [];
  document.querySelectorAll('[data-pd="asof"]').forEach(function (fig) {
    var range = fig.querySelector('.pd-slider');
    var out = fig.querySelector('.pd-asof__day');
    if (!range || !out) return;
    var t0 = day(fig.getAttribute('data-start'));
    var t1 = day(fig.getAttribute('data-end'));
    var versions = Array.prototype.slice.call(fig.querySelectorAll('.pd-asof__versions li')).map(function (li, i) {
      return { n: i + 1, f: day(li.getAttribute('data-from')), t: li.getAttribute('data-to') ? day(li.getAttribute('data-to')) : t1, copy: li.querySelector('.pd-asof__copy').innerHTML, meta: li.querySelector('.pd-asof__meta').innerHTML };
    });
    if (!versions.length) return;
    var bands = fig.querySelectorAll('.pd-asof__band');
    var live = fig.querySelector('[data-show="live"]');
    var latest = fig.querySelector('[data-show="latest"]');
    var last = versions[versions.length - 1];
    function at(t) { for (var i = 0; i < versions.length; i++) if (t >= versions[i].f && t <= versions[i].t) return versions[i]; return last; }
    function draw() {
      var t = t0 + (+range.value) * 864e5;
      var v = at(t);
      out.textContent = dayName(t);
      range.setAttribute('aria-valuetext', dayName(t));
      bands.forEach(function (b, i) { b.classList.toggle('is-live', i === v.n - 1); });
      if (live) {
        live.querySelector('.pd-asof__copy').innerHTML = v.copy;
        live.querySelector('.pd-asof__meta').innerHTML = v.meta;
      }
      if (latest) {
        var wrong = v !== last;
        latest.classList.toggle('is-wrong', wrong);
        var verdict = latest.querySelector('.pd-asof__verdict');
        if (verdict) verdict.textContent = latest.getAttribute(wrong ? 'data-wrong' : 'data-right') || '';
      }
    }
    function settle() {
      var saved = range.value;
      var answers = [live, latest].filter(Boolean);
      answers.forEach(function (a) { a.style.minHeight = ''; });
      out.style.minWidth = '';
      var tallest = answers.map(function () { return 0; });
      var widest = 0;
      versions.forEach(function (v) {
        range.value = String(Math.round((v.f - t0) / 864e5));
        draw();
        answers.forEach(function (a, i) { tallest[i] = Math.max(tallest[i], a.getBoundingClientRect().height); });
      });
      // The widest date the slider can show sets the date's width.
      for (var i = 0; i <= +range.max; i += 1) { out.textContent = dayName(t0 + i * 864e5); widest = Math.max(widest, out.getBoundingClientRect().width); }
      range.value = saved;
      draw();
      // Both answers take the taller of the two, so the pair stays level.
      var h = Math.max.apply(null, tallest);
      answers.forEach(function (a) { a.style.minHeight = Math.ceil(h) + 'px'; });
      out.style.minWidth = Math.ceil(widest) + 'px';
    }
    range.hidden = false;
    fig.classList.add('is-armed');
    range.addEventListener('input', draw);
    draw();
    settle();
    fig.pdSettle = settle;
    fig.pdWidth = fig.offsetWidth;
    asofs.push(fig);
    // The page can still change width after this first measure (a scrollbar arriving, the rail
    // taking its column), so the figure re-measures whenever its own width changes.
    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { if (fig.offsetWidth !== fig.pdWidth) { fig.pdWidth = fig.offsetWidth; settle(); } }).observe(fig);
    }
  });

  /* ---------- Resize ---------- */
  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      builds.concat(sequences.map(function (s) { return s.graphic; })).forEach(fit);
      document.querySelectorAll('.pd-calc .pd-bar--live').forEach(fit);
      document.querySelectorAll('.pd-fold').forEach(function (f) { f.querySelectorAll('.pd-org__box').forEach(function (b) { b.style.removeProperty('--dx'); }); aim(f); });
      asofs.forEach(function (f) { if (f.offsetWidth !== f.pdWidth) { f.pdWidth = f.offsetWidth; f.pdSettle(); } });
    }, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { builds.forEach(fit); document.querySelectorAll('.pd-calc .pd-bar--live').forEach(fit); sequences.forEach(function (s) { fit(s.graphic); }); asofs.forEach(function (f) { f.pdSettle(); }); });
  // A face that arrives after the first measure (an italic, a late weight) changes line lengths, so
  // the slider's held sizes and the segment labels are measured again whenever one finishes loading.
  window.addEventListener('load', function () { asofs.forEach(function (f) { f.pdSettle(); }); });
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', function () { builds.forEach(fit); document.querySelectorAll('.pd-calc .pd-bar--live').forEach(fit); asofs.forEach(function (f) { f.pdSettle(); }); });
  }

  /* ---------- For the styleguide: replay a figure, or hold a sequence on one step ---------- */
  // Both look the page up again, so a figure the styleguide has just rebuilt is included.
  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  window.pdKit = {
    replay: function () {
      all('[data-pd="build"]').forEach(function (f) { fit(f); f.classList.add('is-armed'); play(f); });
      all('[data-pd="units"]').forEach(fill);
      all('[data-pd="grid"]').forEach(grid);
      all('.pd-img').forEach(function (f) { f.classList.add('is-armed'); setTimeout(function () { f.classList.remove('is-armed'); }, 60); });
      sequences.forEach(function (s) { s.manual = true; s.active = -1; s.set(0); setTimeout(function () { s.set(1); }, 60); });
    },
    step: function (n) { sequences.forEach(function (s) { s.manual = true; s.set(n); }); },
    fit: function () { all('[data-pd="build"], .pd-scrolly__graphic').forEach(fit); },
  };
})();
