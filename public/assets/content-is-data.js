/* Your Content Has No Parent: the interactive figures.
   Each figure is a <figure data-cd="..."> in the article with a readable fallback inside; the
   script replaces the fallback when the figure comes near the screen. The graph reads
   /assets/lineage.json, which the build writes from the finished page. */
(function () {
  var body = document.querySelector('.article-body');
  if (!body) return;

  function h(tag, attrs, html) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') el.className = attrs[k]; else el.setAttribute(k, attrs[k]);
    });
    if (html != null) el.innerHTML = html;
    return el;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n) {
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(n >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + ' million';
    return '$' + Math.round(n).toLocaleString('en-US');
  }


  var lineage = null;
  function getLineage() {
    if (!lineage) lineage = fetch('/assets/lineage.json').then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
    return lineage;
  }
  var PAGE = location.pathname.replace(/\.html$/, '').replace(/\/$/, '');

  /* ---------------------------------------------------------------- What rendered on a given day */
  function asof(fig) {
    var V = [
      { v: 1, from: '2026-01-05', to: '2026-02-26', copy: 'Earn 4.10% APY. $500 minimum to open. Rate may change after the account is opened.' },
      { v: 2, from: '2026-02-27', to: '2026-04-02', copy: 'Earn 4.25% APY. $500 minimum to open. Rate may change after the account is opened.' },
      { v: 3, from: '2026-04-03', to: '2026-05-20', copy: 'Earn 4.00% APY through June 30. $500 minimum to open. Rate may change after the account is opened.' },
      { v: 4, from: '2026-05-21', to: null, copy: 'Earn 3.85% APY. $1,000 minimum to open. Rate may change after the account is opened.' },
    ];
    function d(s) { var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
    var start = d('2026-01-05'), end = d('2026-06-30');
    var days = Math.round((end - start) / 864e5);
    function fmt(dt) { return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }); }
    function live(dt) {
      for (var i = 0; i < V.length; i++) {
        var f = d(V[i].from), t = V[i].to ? d(V[i].to) : end;
        if (dt >= f && dt <= t) return V[i];
      }
      return V[V.length - 1];
    }
    var stage = fig.querySelector('.cd-widget-stage');
    stage.innerHTML = '';
    var initial = Math.round((d('2026-03-14') - start) / 864e5);
    var head = h('div', { class: 'cd-asof-date' }, '<span>The customer saw the rate disclosure on</span>');
    var out = h('output', { for: 'cd-asof-day', 'aria-live': 'polite' });
    head.appendChild(out);
    var range = h('input', { type: 'range', id: 'cd-asof-day', min: '0', max: String(days), step: '1', value: String(initial), 'aria-label': 'Day the customer saw the disclosure' });
    var bands = h('div', { class: 'cd-asof-bands', 'aria-hidden': 'true' });
    V.forEach(function (x) {
      var f = d(x.from), t = x.to ? d(x.to) : end;
      bands.appendChild(h('span', { 'data-v': x.v, style: 'flex:' + ((t - f) / 864e5 + 1) }));
    });
    // Month labels sit where each month begins on the slider's own scale.
    var months = h('div', { class: 'cd-asof-months', 'aria-hidden': 'true' }, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(function (m, i) {
      var at = Math.max(0, (Date.UTC(2026, i, 1) - start) / 864e5 / days * 100);
      return '<span style="left:' + at.toFixed(1) + '%">' + m + '</span>';
    }).join(''));
    var answers = h('div', { class: 'cd-asof-answers' });
    var kept = h('div', { class: 'cd-answer' });
    var current = h('div', { class: 'cd-answer' });
    answers.appendChild(kept); answers.appendChild(current);
    function draw() {
      var dt = new Date(start.getTime() + (+range.value) * 864e5);
      out.textContent = fmt(dt);
      range.setAttribute('aria-valuetext', fmt(dt));
      var v = live(dt), now = V[V.length - 1];
      bands.querySelectorAll('span').forEach(function (b) { b.classList.toggle('is-live', +b.getAttribute('data-v') === v.v); });
      kept.innerHTML = '<h3>A system that keeps every version</h3><p class="copy">' + esc(v.copy) + '</p><p class="meta">Version ' + v.v + ', live ' + fmt(d(v.from)) + (v.to ? ' to ' + fmt(d(v.to)) : ' to today') + '. Approved by deposit compliance.</p><span class="verdict">This is what the customer saw.</span>';
      var wrong = v.v !== now.v;
      current.className = 'cd-answer' + (wrong ? ' is-wrong' : '');
      current.innerHTML = '<h3>A system that keeps only the current version</h3><p class="copy">' + esc(now.copy) + '</p><p class="meta">Version ' + now.v + ', the one published today.</p><span class="verdict">' + (wrong ? 'Not what the customer saw.' : 'Correct, because the version you picked is still live.') + '</span>';
    }
    // Nothing moves while the slider does: each box, and the date, is held at the size of its
    // largest state at the current width, measured again when the width changes.
    function settle() {
      var saved = range.value, keptMax = 0, currentMax = 0, dateMax = 0;
      kept.style.minHeight = current.style.minHeight = out.style.minWidth = '';
      // The boxes change only with the version, so one state per version covers them.
      V.forEach(function (x) {
        range.value = String(Math.round((d(x.from) - start) / 864e5));
        draw();
        keptMax = Math.max(keptMax, kept.getBoundingClientRect().height);
        currentMax = Math.max(currentMax, current.getBoundingClientRect().height);
      });
      range.value = saved;
      draw();
      // Every date the slider can show, laid out once in a hidden row and measured together.
      var seen = {}, labels = [];
      for (var i = 0; i <= days; i++) { var s = fmt(new Date(start.getTime() + i * 864e5)); if (!seen[s]) { seen[s] = 1; labels.push('<output>' + s + '</output>'); } }
      var probe = h('div', { class: 'cd-asof-date cd-probe', 'aria-hidden': 'true' }, labels.join(''));
      stage.appendChild(probe);
      probe.querySelectorAll('output').forEach(function (o) { dateMax = Math.max(dateMax, o.getBoundingClientRect().width); });
      stage.removeChild(probe);
      kept.style.minHeight = Math.ceil(keptMax) + 'px';
      current.style.minHeight = Math.ceil(currentMax) + 'px';
      out.style.minWidth = Math.ceil(dateMax) + 'px';
    }
    range.addEventListener('input', draw);
    stage.appendChild(head); stage.appendChild(range); stage.appendChild(bands); stage.appendChild(months); stage.appendChild(answers);
    stage.appendChild(h('p', { class: 'cd-note' }, 'An example disclosure for an example year. The rates, dates and versions are invented; the question is the one the rules ask.'));
    draw();
    settle();
    var lastWidth = stage.offsetWidth, timer = null;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { if (stage.offsetWidth !== lastWidth) { lastWidth = stage.offsetWidth; settle(); } }, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
  }

  /* ---------------------------------------------------------------- What a new piece, a variant and a reuse cost */
  function calc(fig) {
    // Defaults reproduce the article's worked example exactly: a new piece at $1,800, and $5.4 million outside the system.
    var F = {
      assets: { label: 'How many assets do you ship a year?', v: 5000, note: 'Example. Adobe found 70 percent of organizations produce 1,000 or more a year.' },
      lineage: { label: 'What percent of assets have a parent on file?', v: 40, max: 100, note: 'Example. A parent is what it was built from. A new asset counts if marked new.' },
      rate: { label: 'What does an hour of staff time cost?', v: 75, note: 'Example. Pay, benefits and overhead, or your agency\'s hourly rate.' },
      create: { label: 'How many hours to make a new piece?', v: 8, note: 'Example. From the brief to a draft ready for review.' },
      createVar: { label: 'How many hours to make a variant?', v: 1.5, note: 'Example. An approved asset with a new image and one line changed.' },
      reviewers: { label: 'How many people review each asset?', v: 8, note: 'Example. Typeface found 92 percent of marketing leaders need ten or more.' },
      minutes: { label: 'How many minutes per reviewer, per round?', v: 23, note: 'Filestage measured an average of 23 minutes per review on its platform.' },
      rounds: { label: 'How many review rounds does a new piece take?', v: 4, note: 'Filestage measured an average of 4 versions before approval.' },
      roundsVar: { label: 'How many review rounds does a variant take?', v: 1.3, note: 'Veeva measured 1.3 rounds in pharma, where parts are approved once, in advance.' },
      diff: { label: 'What percent of a variant is new?', v: 25, max: 100, note: 'Example. Reviewers read only this part. The rest is already approved and translated.' },
      words: { label: 'How many words are in a typical asset?', v: 400, note: 'Example. Count all the copy that gets translated.' },
      langs: { label: 'How many languages do you translate into?', v: 3, note: 'Example. For a US bank, often Spanish, sometimes more.' },
      wphNew: { label: 'How many words an hour, translating new copy?', v: 1100, note: 'Parra Escart\u00edn and Arcedillo measured about 1,100 in a study of ten translators.' },
      wphMem: { label: 'How many words an hour, if translated before?', v: 2460, note: 'Parra Escart\u00edn and Arcedillo measured about 2,460 with a past translation offered.' },
      tRate: { label: 'What does an hour of translation cost?', v: 50, note: 'Example. A vendor\'s hourly rate, or your own translators\' full cost.' },
      rework: { label: 'How many hours of rework on a new piece?', v: 3, note: 'Example. Time spent making the changes reviewers ask for.' },
      reworkVar: { label: 'How many hours of rework on a variant?', v: 0.5, note: 'Example. Changes reviewers ask for on a variant.' },
      triage: { label: 'How many minutes to find an existing asset?', v: 20, note: 'Example. The person at intake finds it and sends it instead of making a new one.' },
    };
    var inputs = {};
    function show(n) { return n >= 1000 && n % 1 === 0 ? n.toLocaleString('en-US') : String(n); }
    function field(key) {
      var f = F[key];
      var id = 'cd-calc-' + key;
      var wrap = h('label', { class: 'cd-field', for: id }, '<span>' + esc(f.label) + '</span>');
      var inp = h('input', { id: id, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: show(f.v) });
      inp.addEventListener('input', draw);
      inp.addEventListener('blur', function () { var x = num(inp); inp.value = show(x); });
      inputs[key] = inp;
      wrap.appendChild(inp);
      wrap.appendChild(h('small', null, esc(f.note)));
      return wrap;
    }
    function num(inp) { var x = parseFloat(String(inp.value).replace(/[,$%\s]/g, '')); return isFinite(x) && x >= 0 ? x : 0; }
    function val(k) { var x = num(inputs[k]); return F[k].max != null ? Math.min(F[k].max, x) : x; }

    var stage = fig.querySelector('.cd-widget-stage');
    stage.innerHTML = '';
    var head = h('div', { class: 'cd-calc-head', 'aria-live': 'polite' });
    var mix = h('div', { class: 'cd-calc-mix' });
    ['assets', 'lineage'].forEach(function (k) { mix.appendChild(field(k)); });
    var lanes = h('div', { class: 'cd-lanes' });
    var key = h('div', { class: 'cd-lane-key', 'aria-hidden': 'true' }, '<span><i class="k-create"></i>Creation</span><span><i class="k-review"></i>Review</span><span><i class="k-trans"></i>Translation</span><span><i class="k-rework"></i>Rework</span>');
    var parts = h('details', { class: 'cd-parts' }, '<summary>Change the numbers behind each price</summary>');
    var grid = h('div', { class: 'cd-parts-grid' });
    // Grouped under the same colours as the price bars, so each number sits with the cost it drives.
    [
      ['k-create', 'Creation', ['rate', 'create', 'createVar']],
      ['k-review', 'Review', ['reviewers', 'minutes', 'rounds', 'roundsVar', 'diff']],
      ['k-trans', 'Translation', ['words', 'langs', 'tRate', 'wphNew', 'wphMem']],
      ['k-rework', 'Rework', ['rework', 'reworkVar']],
      ['k-reuse', 'Reuse', ['triage']],
    ].forEach(function (g) {
      grid.appendChild(h('p', { class: 'cd-parts-group' }, '<i class="' + g[0] + '"></i>' + g[1]));
      g[2].forEach(function (k) { grid.appendChild(field(k)); });
    });
    parts.appendChild(grid);
    stage.appendChild(head); stage.appendChild(mix); stage.appendChild(lanes); stage.appendChild(key); stage.appendChild(parts);
    stage.appendChild(h('p', { class: 'cd-note' }, 'Numbers marked Example are stand-ins set to match the $5.4 million example above. Replace them with your own. The rest were measured by the source named in the note.'));

    function prices() {
      var rate = val('rate'), tRate = val('tRate'), words = val('words'), langs = val('langs');
      var reviewH = function (rounds, share) { return rounds * val('reviewers') * val('minutes') * share / 60; };
      var fresh = val('wphNew') || 1, mem = val('wphMem') || 1, share = Math.min(1, val('diff') / 100);
      var n = { create: val('create') * rate, review: reviewH(val('rounds'), 1) * rate, trans: langs * (words / fresh) * tRate, rework: val('rework') * rate };
      var v = { create: val('createVar') * rate, review: reviewH(val('roundsVar'), share) * rate, trans: langs * (words * share / fresh + words * (1 - share) / mem) * tRate, rework: val('reworkVar') * rate };
      var r = { create: 0, review: val('triage') / 60 * rate, trans: 0, rework: 0 };
      function sum(o) { return o.create + o.review + o.trans + o.rework; }
      return { n: n, v: v, r: r, N: sum(n), V: sum(v), R: sum(r) };
    }
    function lane(title, total, parts, maxTotal, days) {
      var bar = ['create', 'review', 'trans', 'rework'].map(function (k) {
        return '<span class="k-' + k + '" style="width:' + (maxTotal > 0 ? parts[k] / maxTotal * 100 : 0) + '%"></span>';
      }).join('');
      return '<div class="cd-lane"><h3>' + title + '</h3><p class="price">' + money(total) + '</p><p class="days">' + days + '</p><div class="cd-lane-bar">' + bar + '</div></div>';
    }
    function draw() {
      var p = prices();
      var dark = val('assets') * (1 - val('lineage') / 100) * p.N;
      head.innerHTML = '<p class="cd-calc-big">' + money(dark) + '</p><p class="cd-calc-say">a year spent on assets with no parent on file, each at the price of a new piece.</p>';
      lanes.innerHTML = lane('New piece', p.N, p.n, p.N, 'The whole chain: one to two months') +
        lane('Variant', p.V, p.v, p.N, 'The variant lane: a day or two') +
        lane('Reuse', p.R, p.r, p.N, 'Linked at intake: the same day');
    }
    draw();
  }

  /* ---------------------------------------------------------------- Find your weakest link */
  // A guided interview: two questions about the institution, then one about each of the twelve links,
  // one at a time. The report reads back where every link stands, the next five things to work on
  // (weakest first, foundations before stages on a tie, then chain order), and the rules that apply.
  // Answers live in memory only; a reload starts over.
  function focus(fig) {
    var LINKS = [
      { id: 'intake', group: 'stage', name: 'Intake', q: 'How does work get into the queue?',
        opts: ['Anyone asks anyone, and it all gets made', 'A request form, and everything is accepted', 'A form, and the library is checked first', 'A plan with capacity; triage can say no'],
        now: ['Work arrives from anywhere, and every request gets made.', 'Requests come through a form, and all of them are accepted.', 'Someone checks the library first, but the plan and the capacity are not connected.', 'Work comes from a plan with capacity behind it, and triage can close a request.'],
        moves: [
          ['Put every request through one form with a requester, a date, and the audience it is for.', 'Keep the list of requests where the people who approve work can see it.'],
          ['Before anything is made, have someone search the library and link what already exists to the request.', 'Count how many requests last quarter asked for something that already existed.'],
          ['Give one person the authority to close a request as fulfilled when a usable asset exists.', 'Cap work in progress at what the slowest stage can take, and plan against that number.'],
        ] },
      { id: 'create', group: 'stage', name: 'Creation', q: 'How are new assets made?',
        opts: ['From a blank page', 'By copying an old file', 'From templates, regulated parts typed in', 'Assembled from approved parts'],
        now: ['Every asset starts from a blank page.', 'New assets start as copies of old files, and the link to the original is lost.', 'Templates exist, but the regulated parts are typed in each time.', 'Assets are assembled from approved parts, and only the connective copy is new.'],
        moves: [
          ['Build a template for the asset you make most often, with the brand and layout locked.', 'Keep finished files where the next person can find them.'],
          ['Replace copying an old file with a template that pulls from the library, so the original stays linked.', 'Write down what a variant is: an image swap, a call to action, a market line.'],
          ['Lock the regulated slots in each template and point them at approved components.', 'Move whichever you make most, the sell sheet or the sales deck, into a locked template.'],
        ] },
      { id: 'approve', group: 'stage', name: 'Approval', q: 'What does legal approve?',
        opts: ['Every piece and every variation, in full', 'Every piece, checked against approved claims', 'Approved parts once, then every new piece', 'Parts and templates once, then only changes'],
        now: ['Legal reads every piece and every variation in full.', 'Legal reads every piece in full, checking it against a list of approved claims.', 'Legal approves parts once, and still reads every new piece in full.', 'Legal approves parts and templates once, and reads only what changed after that.'],
        moves: [
          ['List the claims, disclosures and rates legal approves most often, and keep each with its approver and date.', 'Send a variation to legal as the lines that changed, next to the approved piece it came from.'],
          ['Have legal approve each of the 20 most-used components once, so it is approved in every asset that uses it.', 'Keep every approved component with its approver, its date and its expiry.'],
          ['Pre-approve the templates and allowed combinations with legal, so review reads only what changed.', 'Agree with legal, in writing, which changes count as a variant.'],
        ] },
      { id: 'review', group: 'stage', name: 'Review', q: 'How many review rounds does a typical asset take?',
        opts: ['Six or more', 'Four or five', 'Two or three', 'About one'],
        now: ['A typical asset goes through six or more review rounds.', 'A typical asset takes four or five rounds, around the marketing benchmark (Filestage: 4).', 'A typical asset takes two or three rounds.', 'A typical asset takes about one round, close to pharma\u2019s 1.3.'],
        moves: [
          ['Put a deadline on every review and publish who is holding what.', 'Collect feedback in one round per reviewer group instead of passing the piece from one to the next.'],
          ['Time-stamp every handoff to see how long work waits in front of each reviewer.', 'Send comments back as one list per round, with conflicts settled before they go.'],
          ['Count rounds per asset every month, and name the reviewer group that adds the most.', 'Send variants through the variant lane, where review reads only what changed.'],
        ] },
      { id: 'local', group: 'stage', name: 'Localization', q: 'How does a market get its version?',
        opts: ['The market rebuilds it', 'Translated, then rewritten outside the system', 'Translation memory, market reviews', 'Attached to components; markets own the law'],
        now: ['Each market rebuilds the asset on its own.', 'Assets are translated word for word, and the market\u2019s rewrite never comes back into the system.', 'Translation memory is used, and the market reviews the result.', 'Translation is attached to components, and markets own the records that differ by law.'],
        moves: [
          ['Send markets the approved source with its translation, instead of letting them start over.', 'Record which markets have a version of each asset.'],
          ['Get each market\u2019s final version back into the system as its own record.', 'For every regulated component, ask whether a market differs by language, by voice, or by law.'],
          ['Make the components that differ by law separate records, owned by that market\u2019s legal team.', 'Connect translation to the components, so a translated component stays translated.'],
        ] },
      { id: 'store', group: 'stage', name: 'Storage', q: 'Does each asset in your library record where it came from?',
        opts: ['There is no one library', 'There is a library, but nothing records it', 'Every upload has to name its parent', 'Parents are recorded automatically'],
        now: ['Assets live in drives and inboxes, and finding one means asking someone.', 'There is a library, but fields are optional and nothing records where an asset came from.', 'Uploads carry required fields, and every asset declares a parent.', 'Assets record their parts automatically, and search works by component, rights and expiry.'],
        moves: [
          ['Pick one library and move the finished assets into it.', 'Pull an export and count the assets that shipped last year.'],
          ['Make a parent field required at upload: every asset declares its parent, or declares that it is new.', 'Make the governance fields required from controlled lists, starting from FINRA 2210\u2019s: approver, dates of use, the source of every figure.'],
          ['Build templates that reference components instead of copies, so the parent is recorded without anyone typing it.', 'Block publishing any regulated asset that has no parent.'],
        ] },
      { id: 'deliver', group: 'stage', name: 'Delivery', q: 'How do assets reach the channels?',
        opts: ['Downloaded and uploaded again', 'Some channels pull from the library', 'Most channels pull by reference', 'Expire once, it stops everywhere'],
        now: ['Every channel gets its own downloaded copy.', 'Some channels pull from the library; the rest get copies.', 'Most channels pull approved assets by reference.', 'Channels pull by reference, and an expired asset stops rendering everywhere at once.'],
        moves: [
          ['List every place an asset goes live, and who uploads it there.', 'Give every shipped asset an ID that follows it into each channel.'],
          ['Connect the web and email to the library so they pull the approved version instead of a copy.', 'Send agencies and partners links to the approved version instead of files.'],
          ['Serve assets through an approved-only delivery link, so expiring one pulls it everywhere.', 'Find the channels that still hold copies and move them to references, one at a time.'],
        ] },
      { id: 'measure', group: 'stage', name: 'Measurement', q: 'How do you know how much of what you make gets used?',
        opts: ['We don\u2019t', 'We guess', 'We measured it once', 'We report it every month'],
        now: ['Nobody knows how much of what gets made is used.', 'There is a guess at how much gets used.', 'Use was measured once.', 'Use is reported every month.'],
        moves: [
          ['Count the assets made last year and the ones anyone used. A rough ratio is enough to start.', 'Tag every shipped asset with an ID your analytics can read.'],
          ['Compute a first dark content number: assets with no parent, times cost per asset.', 'Have finance build a fully loaded cost per asset. No public benchmark exists.'],
          ['Report the dark content number and the reopen reasons every month to whoever funds the function.', 'Put reuse rate next to component performance, to see whether reused parts do as well as new ones.'],
        ] },
      { id: 'owner', group: 'base', name: 'Ownership', q: 'Who owns the chain from end to end?',
        opts: ['Nobody; each team owns its stage', 'A coordinator, without authority', 'One owner, other stages out of reach', 'One owner who can change any stage'],
        now: ['Each team owns its own stage, and nobody owns the whole chain.', 'Someone tracks the chain but cannot change how any stage works.', 'One person owns the chain, but other teams\u2019 stages are out of reach.', 'One person owns the chain and can change any stage, with an executive behind them.'],
        moves: [
          ['Map the chain by interviewing the people who do the work, with a timestamp at every handoff.', 'Name the stage with the longest queue in front of it.'],
          ['Ask an executive to make one person accountable for the chain, from request to use.', 'Publish the map with the waiting times on it.'],
          ['Get the executive to say, in front of the regions, that reuse is the default.', 'Each quarter, name the slowest stage again and choose the next fix against it.'],
        ] },
      { id: 'records', group: 'base', name: 'Records and rights', q: 'If a regulator asked what a customer saw on a past date, how long would it take to show them?',
        opts: ['We could not show them', 'Weeks', 'Days', 'Minutes'],
        now: ['You could not show what a customer saw on a past date.', 'You could, after weeks of digging.', 'You could in days.', 'You could in minutes.'],
        moves: [
          ['Keep every version that went live, with the dates it was live, not only the current one.', 'For email, keep what each recipient received, not only the template. H2C was fined for keeping one copy.'],
          ['Record first and last use dates on every regulated asset, the dates FINRA 2210 asks broker-dealers to keep.', 'Put expiry dates and rights on every regulated component, with an owner who gets the notice.'],
          ['Log which component versions went into each page or email when it was published.', 'Turn on native expiry so expired assets unpublish, and scope the rest with compliance.'],
        ] },
      { id: 'systems', group: 'base', name: 'Systems', q: 'How does work move between your tools?',
        opts: ['By email and shared drives', 'Between separate tools, by hand', 'The workflow tool writes to the library', 'Every handoff is time-stamped'],
        now: ['Work moves by email and shared drives.', 'The tools are separate, and people move work between them by hand.', 'The workflow tool writes to the library.', 'Every handoff between tools is time-stamped automatically.'],
        moves: [
          ['Put requests and approvals in one workflow tool, even a simple one.', 'List the tools work passes through, and who moves it between them.'],
          ['Connect intake to the library so request fields become the asset\u2019s metadata.', 'Have the workflow tool record who approved what, and when.'],
          ['Time-stamp every handoff automatically, so waiting becomes a measurement.', 'Report the waiting time in front of each stage every month.'],
        ] },
      { id: 'ai', group: 'base', name: 'Generative AI', q: 'Where does generative AI make content today?',
        opts: ['Wherever people like', 'One-off pieces', 'Drafts inside templates', 'Variants from approved parts only'],
        now: ['AI is used however people like.', 'AI makes one-off pieces, and each one goes through full review.', 'AI drafts inside templates.', 'AI assembles variants only from approved parts.'],
        moves: [
          ['Write down where AI may and may not be used, starting with regulated copy.', 'Keep AI away from any field that decides approval, jurisdiction or rights.'],
          ['Move AI from one-off pieces into templates with the brand and layout locked.', 'Count the AI pieces that went through full review last quarter.'],
          ['Point generation at the approved components, so it assembles from approved parts.', 'Send AI variants down the variant lane, where review reads only what changed.'],
        ] },
    ];
    var PROFILE = [
      { id: 'inst', name: 'Institution', q: 'Are you a bank or a credit union, and do you have a broker-dealer or investment adviser arm?',
        opts: ['Bank, no broker-dealer or adviser arm', 'Bank with a broker-dealer or adviser arm', 'Credit union, no broker-dealer or adviser arm', 'Credit union with a broker-dealer or adviser arm'] },
      { id: 'reach', name: 'Markets', q: 'Where does your marketing run, and in which languages?',
        opts: ['The US, in English only', 'The US, in English and Spanish', 'The US, in several languages', 'More than one country'] },
    ];
    var STEPS = PROFILE.concat(LINKS);
    var byId = {};
    STEPS.forEach(function (S) { byId[S.id] = S; });
    var stages = LINKS.filter(function (L) { return L.group === 'stage'; });
    var base = LINKS.filter(function (L) { return L.group === 'base'; });
    var INTRO = 'Two questions about your institution, then one about each link in your content chain. Pick an answer and the next question appears. At the end you get a report with where each link stands, what to work on next, and the rules that apply to you.';
    var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var ans = {}, cur = 0, mode = 'q', changeId = null, changeFrom = null, prevReach = null;
    var viaPointer = false, wasChecked = false, pending = null, started = false, reported = false;
    var leadMin = 0, cardMin = 0, rowMin = {}, reserve = 0, tallest = 0;

    function hgt(el) { return el.getBoundingClientRect().height; }
    function track(name, props) { try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, props || {}); } catch (e) { /* analytics is optional */ } }
    function isNum(v) { return typeof v === 'number'; }
    function asked(id) { return id !== 'local' || ans.reach !== 0; }
    function nextStep(i) { for (var j = i + 1; j < STEPS.length; j++) if (asked(STEPS[j].id)) return j; return -1; }
    function prevStep(i) { for (var j = i - 1; j >= 0; j--) if (asked(STEPS[j].id)) return j; return -1; }
    function eyebrow(S) {
      var i = PROFILE.indexOf(S);
      if (i >= 0) return 'About you, ' + (i + 1) + ' of 2';
      i = stages.indexOf(S);
      if (i >= 0) return 'How work moves, ' + (i + 1) + ' of ' + stages.length;
      return 'What holds it up, ' + (base.indexOf(S) + 1) + ' of ' + base.length;
    }
    function list(names, bold, tag) {
      var n = names.map(function (x) { return bold ? '<' + (tag || 'b') + '>' + esc(x) + '</' + (tag || 'b') + '>' : x; });
      if (n.length < 2) return n.join('');
      // A name with its own 'and' (Records and rights) takes a comma, so two names never read as three.
      if (n.length === 2) return n[0] + (/ and /.test(names[0] + names[1]) ? ', and ' : ' and ') + n[1];
      return n.slice(0, -1).join(', ') + ', and ' + n[n.length - 1];
    }
    function nameOf(L) { return L.name; }
    function cells(n, dir) {
      var c = [0, 1, 2, 3].map(function (i) { return '<i class="' + (n != null && i <= n ? 'on' : '') + '"></i>'; });
      return dir === 'up' ? c.reverse().join('') : c.join('');
    }

    /* ---- The chain and the question card */
    function linkCls(L, currentId, weakMin) {
      var v = ans[L.id], c = '';
      if (!asked(L.id) || v === 'skip') c += ' is-skipped';
      else if (!isNum(v)) c += ' is-blank';
      if (L.id === currentId) c += ' is-current';
      if (weakMin != null && weakMin < 3 && v === weakMin) c += ' is-weak';
      return c;
    }
    function chainHtml(currentId, weakMin) {
      return '<div class="cd-chain-stages">' + stages.map(function (L) {
        return '<div class="cd-link' + linkCls(L, currentId, weakMin) + '"><div class="cd-link-cells">' + cells(isNum(ans[L.id]) ? ans[L.id] : null, 'up') + '</div><span>' + L.name + '</span></div>';
      }).join('') + '</div><div class="cd-chain-base">' + base.map(function (L) {
        return '<div class="cd-base' + linkCls(L, currentId, weakMin) + '"><span>' + L.name + '</span><div class="cd-base-cells">' + cells(isNum(ans[L.id]) ? ans[L.id] : null) + '</div></div>';
      }).join('') + '</div>';
    }
    function answerText(S) {
      var v = ans[S.id];
      if (!asked(S.id)) return 'Not asked';
      if (v === 'skip') return 'Skipped';
      return isNum(v) ? esc(S.opts[v]) : '';
    }
    function answersHtml(currentId) {
      return '<div class="cd-focus-answers"><h3>Your answers</h3><ol>' + STEPS.map(function (S) {
        var filled = isNum(ans[S.id]) || ans[S.id] === 'skip' || !asked(S.id);
        return '<li data-row="' + S.id + '"' + (S.id === currentId ? ' class="is-current" aria-current="step"' : '') + (filled ? '' : ' data-empty') +
          '><b>' + S.name + '</b> <span>' + answerText(S) + '</span></li>';
      }).join('') + '</ol></div>';
    }
    function cardHtml(S, isChange) {
      var i = STEPS.indexOf(S), v = ans[S.id];
      var opts = S.opts.map(function (o, k) {
        var id = 'cd-focus-' + S.id + '-' + k;
        return '<label class="cd-opt" for="' + id + '"><input type="radio" id="' + id + '" name="cd-focus-' + S.id + '" value="' + k + '"' + (v === k ? ' checked' : '') + '><span>' + esc(o) + '</span></label>';
      }).join('');
      var controls = isChange
        ? '<span class="cd-focus-spacer"></span><button type="button" class="cd-btn is-primary" data-act="done">Back to report</button>'
        : '<button type="button" class="cd-btn" data-act="back"' + (prevStep(i) < 0 ? ' hidden' : '') + '>Back</button><span class="cd-focus-spacer"></span>' +
          '<button type="button" class="cd-link-btn" data-act="skip">Skip</button>' +
          '<button type="button" class="cd-btn is-primary" data-act="next"' + (isNum(v) ? '' : ' aria-disabled="true"') + '>' + (nextStep(i) < 0 ? 'See your report' : 'Next') + '</button>';
      return '<div class="cd-focus-card"><fieldset class="cd-focus-q"><legend><span class="cd-focus-eyebrow">' + eyebrow(S) + '</span><b>' + S.name + '.</b> ' + esc(S.q) + '</legend>' +
        '<div class="cd-focus-opts">' + opts + '</div></fieldset><div class="cd-focus-controls">' + controls + '</div><p class="cd-focus-msg" role="status"></p></div>';
    }
    function applyMins() {
      lead.style.minHeight = leadMin ? Math.ceil(leadMin) + 'px' : '';
      var card = main.querySelector('.cd-focus-card');
      if (card && cardMin) card.style.minHeight = Math.ceil(cardMin) + 'px';
      main.querySelectorAll('[data-row]').forEach(function (li) { var m = rowMin[li.getAttribute('data-row')]; if (m) li.style.minHeight = Math.ceil(m) + 'px'; });
    }
    function renderQ(S, isChange) {
      lead.innerHTML = '<p class="cd-focus-intro">' + INTRO + '</p>';
      chain.innerHTML = chainHtml(S.id, null);
      main.innerHTML = cardHtml(S, isChange) + answersHtml(S.id);
      applyMins();
    }

    /* ---- The report */
    function compute() {
      var ask = LINKS.filter(function (L) { return asked(L.id); });
      var answered = ask.filter(function (L) { return isNum(ans[L.id]); });
      var order = answered.filter(function (L) { return ans[L.id] < 3; }).sort(function (a, b) {
        return ans[a.id] - ans[b.id] || (a.group === b.group ? 0 : a.group === 'base' ? -1 : 1) || LINKS.indexOf(a) - LINKS.indexOf(b);
      });
      var picks = [];
      [0, 1].forEach(function (k) {
        order.forEach(function (L) { if (picks.length < 5) picks.push({ name: L.name, text: L.moves[ans[L.id]][k] }); });
      });
      var min = answered.length ? Math.min.apply(null, answered.map(function (L) { return ans[L.id]; })) : null;
      var notAns = [];
      PROFILE.forEach(function (S) { if (ans[S.id] === 'skip') notAns.push({ S: S, text: 'Skipped.', change: S.id }); });
      ask.forEach(function (L) { if (!isNum(ans[L.id])) notAns.push({ S: L, text: ans[L.id] === 'skip' ? 'Skipped.' : 'Not answered.', change: L.id }); });
      if (!asked('local')) notAns.push({ S: byId.local, text: 'Not asked, because your marketing runs in the US in English only.', change: 'reach' });
      return {
        ask: ask, answered: answered, picks: picks, min: min, notAns: notAns,
        startHere: order.slice(0, 5), afterThat: order.slice(5),
        holding: answered.filter(function (L) { return ans[L.id] === 3; }),
        weakest: order.filter(function (L) { return ans[L.id] === min; }),
      };
    }
    function headline(r, bold) {
      var n = r.answered.length;
      if (!n) return 'You skipped every question about your chain, so there is nothing to read back yet.';
      if (n === 1 && r.min < 3) return list([r.answered[0].name], bold) + ' is the only link you answered.';
      if (r.min === 3) return 'Every link you answered holds.';
      if (n >= 2 && r.weakest.length === n) return (n === 2 ? 'Both' : 'All ' + WORDS[n]) + ' links you answered tie for weakest.';
      var s = list(r.weakest.map(nameOf), bold) + (r.weakest.length > 1 ? ' are your weakest links.' : ' is your weakest link.');
      if (r.holding.length) s += ' ' + list(r.holding.map(nameOf), bold, 'strong') + (r.holding.length > 1 ? ' hold.' : ' holds.');
      return s;
    }
    function nextHeading(r) {
      if (!r.picks.length) return 'What to keep doing';
      return 'The next ' + (r.picks.length === 1 ? 'thing' : WORDS[r.picks.length] + ' things') + ' to work on';
    }
    // What the rules ask, restated from "The regulator's question" and notes 15 to 18. If the article's
    // rules text or the FDIC date changes, change these sentences in the same pass.
    function rules() {
      var inst = ans.inst, bank = inst === 0 || inst === 1, cu = inst === 2 || inst === 3, arm = inst === 1 || inst === 3;
      var head = ['What the rules ask of a bank', 'What the rules ask of a bank with a broker-dealer or adviser arm', 'What the rules ask of a credit union', 'What the rules ask of a credit union with a broker-dealer or adviser arm'][inst] || 'What the rules ask';
      var t = ['A regulator can pick a past date and ask what a customer saw on it.'];
      if (bank) t.push('Regulation DD asks you to keep copies of your advertisements for two years and to be able to reconstruct the required disclosures.');
      if (bank && new Date() < new Date(2027, 3, 1)) t.push('Insured banks have until April 1, 2027 to put the FDIC\u2019s digital sign on their websites and apps. A sign that repeats across a site and an app is a component: approved once, placed everywhere, with the date it took effect.');
      if (cu) t.push('Credit unions sit outside Regulation DD and follow the NCUA\u2019s version, Part 707.');
      if (!bank && !cu) t.push('Banks work under Regulation DD, which asks for copies of advertisements for two years and the ability to reconstruct the required disclosures. Credit unions follow the NCUA\u2019s version, Part 707.');
      if (arm) t.push('If your arm is a broker-dealer, it answers to FINRA Rule 2210: every retail communication kept for three years, with a copy, the dates of first and last use, the approving principal\u2019s name and the date they approved it, and the source of any statistic. If it is an investment adviser, it keeps a copy of each advertisement for five years from its last use.');
      t.push('Regulation Z exempts advertising from its retention rule, so proving what an ad said rests on your own records.');
      t.push('In 2024 FINRA fined H2C Securities $250,000 for failing to preserve 1.25 million communications, mostly mass marketing emails. The firm kept one copy of many of them and did not keep the message each customer received.');
      return { head: head, items: t };
    }
    // slop-ok: x-not-y-contrast (Paul chose this line, 2026-09-24)
    var LEGAL = 'This is a summary of the rules the article cites, not legal advice.';
    // Languages, restated from "Jurisdiction, language, and voice" and note 38.
    function languages() {
      var CFPB = 'The CFPB\u2019s 2021 statement on customers with limited English suggests a notice, ';
      var ASK = 'For each component, ask whether a version differs because of language, because of voice, or because of law.';
      if (ans.reach === 1) return { head: 'Marketing in English and Spanish', text: 'US compliance owns the disclosures in English and in Spanish. Voice belongs to the branches that know the customers. ' + CFPB + 'in Spanish, of the extent and limits of any language services you offer. ' + ASK };
      if (ans.reach === 2) return { head: 'Marketing in several languages', text: 'US compliance owns the disclosures in every language you market in. Voice belongs to the branches that know the customers. ' + CFPB + 'in each of those languages, of the extent and limits of any language services you offer. ' + ASK };
      if (ans.reach === 3) return { head: 'Marketing in more than one country', text: 'A market whose law differs gets its own record, owned by that market\u2019s legal team, with its own version history. Group legal reads it for brand and enterprise risk. ' + ASK + ' If you also market in Spanish or other languages in the US, ' + 'the' + CFPB.slice(3) + 'in those languages, of the extent and limits of any language services you offer.' };
      return null;
    }
    function changeBtn(id, print) {
      return print ? '' : '<button type="button" class="cd-link-btn" data-change="' + id + '" aria-label="Change your ' + byId[id].name + ' answer">Change</button>';
    }
    function rowHtml(S, text, cls, change, print) {
      return '<li' + (cls ? ' class="' + cls + '"' : '') + '><span class="cd-mini" aria-hidden="true">' + (S.moves && isNum(ans[S.id]) ? cells(ans[S.id]) : '') + '</span>' +
        '<span class="cd-row-text"><b>' + S.name + '</b> ' + text + '</span>' + changeBtn(change, print) + '</li>';
    }
    function group(label, cls, rows) {
      return rows.length ? '<h4' + (cls ? ' class="' + cls + '"' : '') + '>' + label + '</h4><ul>' + rows.join('') + '</ul>' : '';
    }
    function reportHtml(r, print) {
      var now = function (cls) { return function (L) { return rowHtml(L, esc(L.now[ans[L.id]]), cls, L.id, print); }; };
      var stand = '<section class="cd-rep-stand"><h3>Where you stand</h3>' +
        group('Start here', 'is-start', r.startHere.map(now('is-weak'))) +
        group('After that', '', r.afterThat.map(now(''))) +
        group('Holding', '', r.holding.map(now(''))) +
        group('Not answered', '', r.notAns.map(function (x) { return rowHtml(x.S, x.text, '', x.change, print); })) + '</section>';
      var next = !r.answered.length ? '' : '<section class="cd-rep-next"><h3>' + nextHeading(r) + '</h3>' + (r.picks.length
        ? '<ol>' + r.picks.map(function (p) { return '<li><b>' + p.name + '</b> ' + esc(p.text) + '</li>'; }).join('') + '</ol>'
        : '<p>Read the numbers every month, and name the slowest stage again each quarter.</p>') + '</section>';
      var ru = rules(), la = languages();
      var law = '<section class="cd-rep-rules"><div class="cd-rep-head"><h3>' + ru.head + '</h3>' + changeBtn('inst', print) + '</div><ul>' + ru.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="cd-rep-legal">' + LEGAL + '</p></section>';
      var lang = la ? '<section class="cd-rep-lang"><div class="cd-rep-head"><h3>' + la.head + '</h3>' + changeBtn('reach', print) + '</div><p>' + esc(la.text) + '</p></section>' : '';
      return '<div class="cd-focus-report"><div class="cd-rep-col">' + stand + '</div><div class="cd-rep-col">' + next + law + lang + '</div></div>';
    }
    var ACTIONS = '<div class="cd-rep-actions"><button type="button" class="cd-btn" data-act="print">Print or save as PDF</button>' +
      '<button type="button" class="cd-btn" data-act="copy">Copy as text</button><button type="button" class="cd-link-btn" data-act="restart">Start over</button>' +
      '<span class="cd-focus-msg" role="status"></span></div>';
    function leadReport(r) {
      return '<h3 class="cd-rep-headline" tabindex="-1">' + headline(r, true) + '</h3><p class="cd-focus-count">' + r.answered.length + ' of ' + r.ask.length + ' answered.</p>';
    }
    function renderReport() {
      var r = compute();
      lead.innerHTML = leadReport(r) + ACTIONS;
      chain.innerHTML = chainHtml(null, r.min);
      main.innerHTML = reportHtml(r, false);
      applyMins();
      return r;
    }
    function sourceLine() {
      var d = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return 'From Your Content Has No Parent, by Paul Drago, ' + location.host + location.pathname + '. Answered ' + d + '.';
    }

    /* ---- Moving between steps */
    function hold() {
      tallest = Math.max(tallest, hgt(stage));
      stage.style.minHeight = Math.ceil(Math.max(reserve, tallest)) + 'px';
    }
    function swap(fn) {
      if (reduce) { fn(); return; }
      main.classList.add('is-out');
      setTimeout(function () { fn(); main.classList.remove('is-out'); }, 100);
    }
    function onScreen(el) { var b = el.getBoundingClientRect(); return b.top >= 0 && b.top < window.innerHeight; }
    function bring(el, block) { if (!onScreen(el)) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: block || 'start' }); }
    function focusRadio() {
      var inp = main.querySelector('.cd-focus-opts input:checked') || main.querySelector('.cd-focus-opts input');
      if (inp) inp.focus({ preventScroll: true });
    }
    function show(i) {
      cur = i; mode = 'q';
      swap(function () { renderQ(STEPS[i], false); hold(); focusRadio(); });
      track('content_chain_step_viewed', { step: STEPS[i].id, position: i + 1 });
    }
    function openReport() {
      mode = 'report';
      swap(function () {
        var r = renderReport(); hold();
        if (stage.getBoundingClientRect().top < 0) bring(stage, 'start');
        var h3 = lead.querySelector('.cd-rep-headline'); if (h3) h3.focus({ preventScroll: true });
        if (!reported) {
          reported = true;
          track('content_chain_report_viewed', { answered: r.answered.length, asked: r.ask.length, skipped: STEPS.filter(function (S) { return ans[S.id] === 'skip'; }).length });
        }
      });
    }
    function advance() {
      clearTimeout(pending); pending = null;
      if (mode === 'change') { finishChange(); return; }
      var j = nextStep(cur);
      if (j < 0) openReport(); else show(j);
    }
    function schedule() {
      viaPointer = false;
      if (!pending) pending = setTimeout(advance, 250);
    }
    function openChange(id) {
      mode = 'change'; changeId = id; changeFrom = ans[id]; prevReach = ans.reach;
      swap(function () { renderQ(byId[id], true); hold(); bring(main.querySelector('.cd-focus-card'), 'start'); focusRadio(); });
    }
    function finishChange() {
      var id = changeId;
      // Moving off English only makes Localization askable; ask it before going back.
      if (id === 'reach' && prevReach === 0 && asked('local') && ans.local === undefined) {
        changeId = 'local'; changeFrom = undefined; prevReach = null;
        swap(function () { renderQ(byId.local, true); hold(); focusRadio(); });
        return;
      }
      if (ans[id] !== changeFrom) track('content_chain_answer_changed');
      mode = 'report'; changeId = null;
      swap(function () {
        renderReport(); hold();
        var b = main.querySelector('[data-change="' + id + '"]') || main.querySelector('[data-change]');
        if (b) { b.focus({ preventScroll: true }); bring(b, 'center'); }
      });
    }
    function restart() {
      if (!window.confirm('Clear all your answers and start over?')) return;
      ans = {}; cur = 0; mode = 'q'; changeId = null;
      track('content_chain_restarted');
      swap(function () { renderQ(STEPS[0], false); hold(); bring(stage, 'start'); focusRadio(); });
    }

    /* ---- Print, save and copy */
    function printReport() {
      track('content_chain_report_printed');
      var r = compute(), old = document.getElementById('cd-print');
      if (old) old.parentNode.removeChild(old);
      var p = h('div', { id: 'cd-print' }, '<p class="cd-widget-title">Your content chain</p>' + leadReport(r) +
        '<div class="cd-chainviz">' + chainHtml(null, r.min) + '</div>' + reportHtml(r, true) + '<p class="cd-rep-source">' + esc(sourceLine()) + '</p>');
      document.body.appendChild(p);
      document.documentElement.classList.add('cd-printing');
      function done() {
        document.documentElement.classList.remove('cd-printing');
        if (p.parentNode) p.parentNode.removeChild(p);
        window.removeEventListener('afterprint', done);
      }
      window.addEventListener('afterprint', done);
      window.print();
    }
    function reportText() {
      var r = compute(), out = ['Your content chain', headline(r, false), r.answered.length + ' of ' + r.ask.length + ' answered.', '', 'Where you stand'];
      [['Start here', r.startHere], ['After that', r.afterThat], ['Holding', r.holding]].forEach(function (g) {
        if (!g[1].length) return;
        out.push(g[0]);
        g[1].forEach(function (L) { out.push('- ' + L.name + ': ' + L.now[ans[L.id]]); });
      });
      if (r.notAns.length) {
        out.push('Not answered');
        r.notAns.forEach(function (x) { out.push('- ' + x.S.name + ': ' + x.text); });
      }
      if (r.answered.length) {
        out.push('', nextHeading(r));
        if (r.picks.length) r.picks.forEach(function (p, i) { out.push((i + 1) + '. ' + p.name + ': ' + p.text); });
        else out.push('Read the numbers every month, and name the slowest stage again each quarter.');
      }
      var ru = rules(), la = languages();
      out.push('', ru.head);
      ru.items.forEach(function (x) { out.push('- ' + x); });
      out.push(LEGAL);
      if (la) out.push('', la.head, la.text);
      out.push('', sourceLine());
      return out.join('\n').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');
    }
    function copyReport() {
      var text = reportText(), msg = stage.querySelector('.cd-rep-actions .cd-focus-msg');
      function say(t, fade) {
        if (!msg) return;
        msg.textContent = t;
        if (fade) setTimeout(function () { if (msg.textContent === t) msg.textContent = ''; }, 3000);
      }
      function ok() { track('content_chain_report_copied'); say('Copied.', true); }
      function fail() { say('Copy did not work in this browser. Select the report and copy it by hand.'); }
      function legacy() {
        try {
          var t = document.createElement('textarea');
          t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.left = '-9999px';
          document.body.appendChild(t); t.select();
          var done = document.execCommand('copy');
          document.body.removeChild(t);
          return done;
        } catch (e) { return false; }
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(ok, function () { if (legacy()) ok(); else fail(); });
          return;
        }
      } catch (e) { /* fall through to the legacy path */ }
      if (legacy()) ok(); else fail();
    }

    /* ---- Space: nothing below the tool moves while the reader answers */
    function settle() {
      var saved = { ans: ans, mode: mode, focusId: document.activeElement && fig.contains(document.activeElement) ? document.activeElement.id : null };
      stage.style.minHeight = ''; lead.style.minHeight = '';
      leadMin = 0; cardMin = 0; rowMin = {};
      // Reports with the longest rules and languages text, and headlines with the most names.
      var fills = [
        function () { return 0; }, function () { return 1; }, function () { return 2; },
        function (i) { return i % 2 ? 3 : 0; }, function (i) { return i ? 'skip' : 0; },
      ];
      function synth(fill) { ans = { inst: 1, reach: 3 }; LINKS.forEach(function (L, i) { ans[L.id] = fill(i); }); }
      // Every state is laid out once in a hidden copy and measured together, so measuring never
      // holds up the page. Copies carry no ids or radio names, so they touch nothing real.
      function inert(s) { return s.replace(/ (id|for|name)="/g, ' data-p$1="'); }
      var probe = h('div', { class: 'cd-probe', 'aria-hidden': 'true' });
      stage.appendChild(probe);
      // Pass 1: each question card (plain and in change mode), the answer rows at each option's
      // length, and every lead.
      var leads = '<div class="cd-focus-lead"><p class="cd-focus-intro">' + INTRO + '</p></div>';
      fills.forEach(function (f) { synth(f); leads += '<div class="cd-focus-lead">' + leadReport(compute()) + ACTIONS + '</div>'; });
      ans = {};
      var cards = '';
      STEPS.forEach(function (S) { cards += cardHtml(S, false) + cardHtml(S, true); });
      var rows = '';
      [0, 1, 2, 3].forEach(function (k) {
        ans = {};
        STEPS.forEach(function (S) { ans[S.id] = k; });
        ans.reach = k || 1;
        rows += answersHtml(null);
      });
      probe.innerHTML = inert(leads + '<div class="cd-focus-main">' + cards + rows + '</div>');
      probe.querySelectorAll('.cd-focus-lead').forEach(function (el) { leadMin = Math.max(leadMin, hgt(el)); });
      probe.querySelectorAll('.cd-focus-card').forEach(function (el) { cardMin = Math.max(cardMin, hgt(el)); });
      probe.querySelectorAll('[data-row]').forEach(function (li) { var id = li.getAttribute('data-row'); rowMin[id] = Math.max(rowMin[id] || 0, hgt(li)); });
      // Pass 2: the questions and each report, with every slot held at its size.
      function held(html) {
        return html.replace('<div class="cd-focus-card">', '<div class="cd-focus-card" style="min-height:' + Math.ceil(cardMin) + 'px">')
          .replace(/<li data-row="([^"]+)"/g, function (m, id) { return m + ' style="min-height:' + Math.ceil(rowMin[id] || 0) + 'px"'; });
      }
      function copy(leadHtml, chainHtmlStr, mainHtml) {
        return '<div class="cd-probe-copy"><div class="cd-focus-lead" style="min-height:' + Math.ceil(leadMin) + 'px">' + leadHtml + '</div>' +
          '<div class="cd-chainviz">' + chainHtmlStr + '</div><div class="cd-focus-main">' + mainHtml + '</div></div>';
      }
      ans = {};
      var copies = copy('<p class="cd-focus-intro">' + INTRO + '</p>', chainHtml(STEPS[0].id, null), held(cardHtml(STEPS[0], false) + answersHtml(STEPS[0].id)));
      fills.forEach(function (f) { synth(f); var r = compute(); copies += copy(leadReport(r) + ACTIONS, chainHtml(null, r.min), reportHtml(r, false)); });
      probe.innerHTML = inert(copies);
      var hs = Array.prototype.map.call(probe.querySelectorAll('.cd-probe-copy'), hgt);
      stage.removeChild(probe);
      var qa = hs[0], rep = Math.max.apply(null, hs.slice(1));
      // When the report is much taller than the questions, the tool grows once, when the reader opens
      // the report, instead of leaving that much blank space under the questions for everyone else.
      reserve = rep - qa <= 120 ? Math.max(qa, rep) : qa;
      tallest = 0;
      ans = saved.ans; mode = saved.mode;
      if (mode === 'report') renderReport(); else renderQ(mode === 'change' ? byId[changeId] : STEPS[cur], mode === 'change');
      hold();
      if (saved.focusId) { var el = document.getElementById(saved.focusId); if (el) el.focus({ preventScroll: true }); }
    }

    /* ---- Build */
    var stage = fig.querySelector('.cd-widget-stage');
    stage.innerHTML = '';
    // Answers describe the reader's own operation: keep them out of autocapture and session recordings.
    stage.classList.add('ph-no-capture');
    var lead = h('div', { class: 'cd-focus-lead' });
    var chain = h('div', { class: 'cd-chainviz', 'aria-hidden': 'true' });
    var main = h('div', { class: 'cd-focus-main' });
    stage.appendChild(lead); stage.appendChild(chain); stage.appendChild(main);

    main.addEventListener('pointerdown', function (e) {
      var lab = e.target.closest && e.target.closest('.cd-opt');
      if (!lab) return;
      var inp = lab.querySelector('input');
      viaPointer = true; wasChecked = !!(inp && inp.checked);
    });
    main.addEventListener('keydown', function (e) {
      viaPointer = false;
      if (e.key !== 'Enter' || !e.target.matches || !e.target.matches('.cd-opt input')) return;
      if (isNum(ans[e.target.name.replace('cd-focus-', '')])) { e.preventDefault(); advance(); }
    });
    main.addEventListener('change', function (e) {
      var t = e.target;
      if (!t.matches || !t.matches('.cd-opt input')) return;
      var id = t.name.replace('cd-focus-', '');
      ans[id] = +t.value;
      if (!started) { started = true; track('content_chain_started'); }
      chain.innerHTML = chainHtml(id, null);
      var rows = main.querySelector('.cd-focus-answers');
      if (rows) { rows.outerHTML = answersHtml(id); applyMins(); }
      var next = main.querySelector('[data-act="next"]');
      if (next) { next.removeAttribute('aria-disabled'); next.textContent = nextStep(STEPS.indexOf(byId[id])) < 0 ? 'See your report' : 'Next'; }
      var msg = main.querySelector('.cd-focus-card .cd-focus-msg');
      if (msg) msg.textContent = '';
      if (viaPointer) schedule();
    });
    stage.addEventListener('click', function (e) {
      var t = e.target;
      if (t.matches && t.matches('.cd-opt input')) { if (viaPointer && wasChecked) schedule(); return; }
      var b = t.closest && t.closest('button');
      if (!b) return;
      var act = b.getAttribute('data-act'), change = b.getAttribute('data-change');
      if (change) { openChange(change); return; }
      if (act === 'back') { var j = prevStep(cur); if (j >= 0) show(j); }
      else if (act === 'skip') {
        ans[STEPS[cur].id] = 'skip';
        if (!started) { started = true; track('content_chain_started'); }
        advance();
      }
      else if (act === 'next') {
        if (b.getAttribute('aria-disabled') === 'true') {
          var msg = main.querySelector('.cd-focus-card .cd-focus-msg');
          if (msg) msg.textContent = 'Pick an answer, or press Skip.';
        } else advance();
      }
      else if (act === 'done') finishChange();
      else if (act === 'print') printReport();
      else if (act === 'copy') copyReport();
      else if (act === 'restart') restart();
    });

    renderQ(STEPS[0], false);
    settle();
    var lastWidth = stage.offsetWidth, timer = null;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { if (stage.offsetWidth !== lastWidth) { lastWidth = stage.offsetWidth; settle(); } }, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
  }

  /* ---------------------------------------------------------------- Every figure in this article, and where it came from */
  // A map from source to item to section, read from the finished page: the registry comes from
  // /assets/lineage.json, and the sentences come from the marks in the article itself. Pick an item
  // and the map lights its path and quotes every sentence that carries it.
  function graph(fig, data) {
    var stage = fig.querySelector('.cd-widget-stage');
    if (!data) return;
    function curly(s) {
      return String(s).replace(/(^|[\s(\[{-])"/g, '$1\u201c').replace(/"/g, '\u201d').replace(/(^|[\s(\[{-])'/g, '$1\u2018').replace(/'/g, '\u2019');
    }
    function list(a) {
      if (a.length < 2) return a.join('');
      if (a.length === 2) return a[0] + (/ and /.test(a[0] + a[1]) ? ', and ' : ' and ') + a[1];
      return a.slice(0, -1).join(', ') + ', and ' + a[a.length - 1];
    }
    var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var comps = {};
    data.components.forEach(function (c) {
      c.label = curly(c.label);
      if (c.note) c.note = curly(c.note);
      comps[c.id] = c;
    });

    // Footnotes: the registry lists footnote labels; the page renumbers notes in reading order.
    var notes = {};
    body.querySelectorAll('section[data-footnotes] li[id^="user-content-fn-"]').forEach(function (li, i) {
      var s = li.querySelector('strong');
      notes[li.id.replace('user-content-fn-', '')] = { num: +(li.getAttribute('data-num') || i + 1), who: s ? s.textContent.replace(/\.\s*$/, '') : '' };
    });

    // Every mark in the article, once. Notes are copied into the margin; count the original only.
    var heads = Array.prototype.slice.call(body.querySelectorAll('h2[id], h3[id]')).filter(function (x) { return !x.closest('section[data-footnotes]') && !fig.contains(x); });
    var marks = Array.prototype.slice.call(body.querySelectorAll('data[value^="c:"]')).filter(function (m) {
      return !fig.contains(m) && !m.closest('.sidenote, .note-inline');
    });
    function sectionOf(m) {
      if (m.closest('.article-brief')) return { id: 'short-version', title: 'The short version' };
      var fn = m.closest('li[id^="user-content-fn-"]');
      if (fn) return { id: 'sources', title: 'Sources', note: notes[fn.id.replace('user-content-fn-', '')] };
      var at = null;
      heads.forEach(function (x) { if (x.compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING) at = x; });
      return at ? { id: at.id, title: at.textContent.trim() } : { id: 'top', title: 'Opening' };
    }
    var uses = {}, first = {};
    marks.forEach(function (m, i) {
      var id = m.getAttribute('value').slice(2);
      if (!comps[id] || comps[id].status === 'shell') return;
      (uses[id] = uses[id] || []).push({ el: m, sec: sectionOf(m) });
      if (first[id] == null) first[id] = i;
    });

    // The sentence a mark sits in, with the mark itself picked out.
    function flat(block, target) {
      var out = '', at = -1, len = 0;
      (function walk(n) {
        if (n === target) at = out.length;
        if (n.nodeType === 3) { out += n.nodeValue; return; }
        if (n.nodeType !== 1 || /^(SCRIPT|STYLE|SUP|BUTTON)$/.test(n.tagName)) return;
        var blk = n !== block && /^(P|LI|TD|TH|DIV|FIGCAPTION|H3|H4)$/.test(n.tagName);
        if (blk && out && !/\s$/.test(out)) out += ' ';
        var start = out.length;
        for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
        if (n === target) len = out.length - start;
        if (blk && n.tagName === 'TD' && n.nextElementSibling) out += ';';
      })(block);
      return { text: out, at: at, len: len };
    }
    function quote(m) {
      var block = m.closest('tr') || m.closest('.cd-record') || m.closest('p, li, blockquote, figcaption') || m.parentNode;
      var f = flat(block, m);
      var before = f.text.slice(0, f.at).replace(/\s+/g, ' ').replace(/^\s+/, '');
      var mark = f.text.slice(f.at, f.at + f.len).replace(/\s+/g, ' ');
      var after = f.text.slice(f.at + f.len).replace(/\s+/g, ' ').replace(/\s+$/, '');
      // Trim to the sentence around the mark.
      var lead = before.match(/^[\s\S]*[.!?]["\u201d\u2019)]*\s+/);
      if (lead) before = before.slice(lead[0].length);
      var tail = after.match(/^[\s\S]*?[.!?]["\u201d\u2019)]*(?=\s|$)/);
      if (tail) after = tail[0];
      if (before.length > 140) before = '...' + before.slice(before.length - 130).replace(/^\S*\s/, ' ');
      if (after.length > 170) after = after.slice(0, 160).replace(/\s\S*$/, '') + '...';
      return esc(before) + '<b>' + esc(mark) + '</b>' + esc(after);
    }

    // Where each item came from, in words. The map shows a short name; the panel gives the full attribution.
    function brief(who) {
      return who.replace(/ with the American Marketing Association$/, '').replace(/^.*\((.+)\)$/, '$1')
        .replace(/^Carla Parra Escart.*$/, 'Translation studies').replace(/ and MarketingProfs$/, '');
    }
    function groupOf(c) {
      if (c.status === 'sourced' && c.sources && c.sources.length) {
        var who = [], nums = [];
        c.sources.forEach(function (n) {
          var x = notes[n];
          if (x && who.indexOf(x.who) < 0) who.push(x.who);
          if (x) nums.push(x.num);
        });
        return { key: 's:' + who.join('|'), label: list(who), short: list(who.map(brief)), order: Math.min.apply(null, nums.length ? nums : [999]) };
      }
      return {
        firsthand: { key: 'author', label: 'The author\u2019s own work', order: 1001 },
        derived: { key: 'derived', label: 'Worked out from other figures', order: 1002 },
        placeholder: { key: 'yours', label: 'Stand-ins for your own number', order: 1003 },
        hypothetical: { key: 'invented', label: 'An invented example', order: 1004 },
        orphan: { key: 'orphan', label: 'No parent', order: 1005 },
      }[c.status] || { key: 'other', label: 'Other', order: 1006 };
    }
    function parentLine(c) {
      if (c.status === 'sourced') {
        var who = [], nums = [];
        (c.sources || []).forEach(function (n) { var x = notes[n]; if (x) { if (who.indexOf(x.who) < 0) who.push(x.who); nums.push(x.num); } });
        return 'From ' + esc(list(who)) + ', ' + (nums.length > 1 ? 'notes ' + list(nums.map(String)) : 'note ' + nums[0]) + '.';
      }
      if (c.status === 'firsthand') return 'From the author\u2019s own work. There is no outside source to check.' + (c.note ? ' ' + esc(c.note) : '');
      if (c.status === 'derived') return 'Worked out from ' + esc(list((c.derivedFrom || []).map(function (d) { return comps[d] ? comps[d].label.toLowerCase() : d; }))) + '.';
      if (c.status === 'placeholder') return 'A stand-in for your own number. ' + esc(c.note || '');
      if (c.status === 'orphan') return esc(c.note || '') + ' The article names it and does not use it as evidence.';
      return esc(c.note || '');
    }
    function day(s) {
      var p = s.split('-');
      return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    }
    function title(c) { return (c.value ? '<span class="v">' + esc(c.value) + '</span> ' : '') + esc(c.label); }

    // Short names for the section tags on the map; the panel uses the full headings.
    var SHORT = {
      'short-version': 'The short version', 'two-to-three-months-then-two-weeks': 'Two to three months',
      'most-stages-are-never-measured': 'Most stages are never measured', 'content-is-data': 'Content is data',
      'pharma-already-runs-it-this-way': 'Pharma runs it this way', 'content-with-no-parent-costs-money-and-invites-fines': 'No parent costs money',
      'dark-content': 'Dark content', 'the-regulators-question': 'The regulator\u2019s question', 'reuse-is-the-default': 'Reuse is the default',
      'jurisdiction-language-and-voice': 'Jurisdiction and language', 'review-reads-the-diff': 'Review reads the diff',
      'buy-generation-last': 'Buy generation last', 'about-the-numbers': 'About the numbers', sources: 'Sources',
    };
    var TABS = [
      { key: 'figure', name: 'Numbers', head: 'The number', kinds: ['figure'] },
      { key: 'rule', name: 'Rules', head: 'The rule', kinds: ['rule'] },
      { key: 'word', name: 'Stories and terms', head: 'The story or term', kinds: ['story', 'term'] },
    ];
    function itemsFor(tab) {
      return Object.keys(uses).map(function (id) { return comps[id]; }).filter(function (c) { return tab.kinds.indexOf(c.kind) >= 0; });
    }
    function sectionsOf(id) {
      var seen = {}, out = [];
      (uses[id] || []).forEach(function (u) { if (!seen[u.sec.id]) { seen[u.sec.id] = 1; out.push(u.sec); } });
      return out;
    }
    function mapHtml(tab) {
      var groups = {}, order = [];
      itemsFor(tab).forEach(function (c) {
        var g = groupOf(c);
        if (!groups[g.key]) { groups[g.key] = { g: g, items: [] }; order.push(g.key); }
        groups[g.key].items.push(c);
      });
      order.sort(function (a, b) { return groups[a].g.order - groups[b].g.order || first[groups[a].items[0].id] - first[groups[b].items[0].id]; });
      return '<div class="cd-map-head" aria-hidden="true"><span>Where it came from</span><span>' + tab.head + '</span><span>Where it\u2019s used</span></div>' +
        order.map(function (k) {
          var G = groups[k];
          G.items.sort(function (a, b) { return first[a.id] - first[b.id]; });
          return '<div class="cd-map-group' + (k === 'orphan' ? ' is-orphan' : '') + '" data-group="' + esc(k) + '">' +
            '<div class="cd-map-src"><button type="button" data-src="' + esc(k) + '">' + esc(G.g.short || G.g.label) + '</button></div><div class="cd-map-rows">' +
            G.items.map(function (c) {
              return '<div class="cd-map-row" data-id="' + c.id + '"><button type="button" class="cd-map-item" data-pick="' + c.id + '">' + title(c) + '</button>' +
                '<div class="cd-map-used">' + sectionsOf(c.id).map(function (s) {
                  return '<button type="button" class="cd-map-sec" data-sec="' + esc(s.id) + '">' + esc(SHORT[s.id] || s.title) + '</button>';
                }).join('') + '</div></div>';
            }).join('') + '</div></div>';
        }).join('');
    }

    // The panel: what the reader picked, where it came from, and the sentences that carry it.
    function usedHtml(id) {
      var u = uses[id] || [];
      return '<h4>Used in ' + (u.length === 1 ? 'one place' : (WORDS[u.length] || u.length) + ' places') + '</h4><ol class="cd-map-quotes">' + u.map(function (x, i) {
        var where = x.sec.note ? 'Sources, note ' + x.sec.note.num : x.sec.title;
        return '<li><span class="cd-map-where">' + esc(where) + '</span><q>' + quote(x.el) + '</q>' +
          '<button type="button" class="cd-link-btn" data-go="' + id + ':' + i + '">Go to it</button></li>';
      }).join('') + '</ol>';
    }
    function itemPanel(c) {
      var g = groupOf(c);
      var v = (c.versions || []).map(function (x) {
        return '<li><b>' + esc(x.value) + '</b>, ' + day(x.from) + (x.to ? ' to ' + day(x.to) : ' to now') + '. ' + esc(curly(x.note)) + '</li>';
      }).join('');
      return '<p class="cd-map-kicker">' + esc(g.label) + '</p><h3 tabindex="-1">' + title(c) + '</h3><p class="cd-map-parent">' + parentLine(c) + '</p>' +
        (v ? '<h4>How it has changed</h4><ul class="cd-map-versions">' + v + '</ul>' : '') + usedHtml(c.id);
    }
    function listPanel(kicker, head, ids, sub) {
      return '<p class="cd-map-kicker">' + esc(kicker) + '</p><h3 tabindex="-1">' + esc(head) + '</h3><p class="cd-map-parent">' + sub + '</p><ul class="cd-map-picks">' +
        ids.map(function (id) { return '<li><button type="button" class="cd-map-item" data-pick="' + id + '">' + title(comps[id]) + '</button></li>'; }).join('') + '</ul>';
    }

    /* ---- Build */
    var tabIx = 0, sel = null;
    stage.innerHTML = '';
    var orphans = Object.keys(uses).filter(function (id) { return comps[id].status === 'orphan'; }).length;
    var parented = Object.keys(uses).length - orphans;
    stage.appendChild(h('p', { class: 'cd-map-sum' }, 'Each of the ' + parented + ' figures, rules, stories and terms below has a recorded parent. The ' + WORDS[orphans] + ' under No parent are named in the article and not used as evidence.'));
    var tabs = h('div', { class: 'cd-seg cd-map-tabs', role: 'group', 'aria-label': 'Show' }, TABS.map(function (t, i) {
      return '<button type="button" data-tab="' + i + '" aria-pressed="' + (i === 0) + '">' + t.name + ' <span>' + itemsFor(t).length + '</span></button>';
    }).join(''));
    var wrap = h('div', { class: 'cd-map-wrap' });
    var map = h('div', { class: 'cd-map' });
    var panel = h('div', { class: 'cd-map-panel', 'aria-live': 'polite' });
    var close = '<button type="button" class="cd-map-close cd-link-btn" data-close="1">Close</button>';
    wrap.appendChild(map); wrap.appendChild(panel);
    stage.appendChild(tabs); stage.appendChild(wrap);
    function sheet() { return getComputedStyle(panel).position === 'fixed'; }
    var HINT = '<p class="cd-map-hint">Pick any item to see where it came from and every sentence in this article that uses it.</p>';

    function paint() {
      map.querySelectorAll('.is-on, .is-sel').forEach(function (el) { el.classList.remove('is-on', 'is-sel'); });
      map.classList.toggle('has-sel', !!sel);
      if (!sel) return;
      if (sel.type === 'item') {
        var row = map.querySelector('[data-id="' + sel.id + '"]');
        if (!row) return;
        row.classList.add('is-sel');
        row.querySelectorAll('.cd-map-sec').forEach(function (b) { b.classList.add('is-on'); });
        row.closest('.cd-map-group').querySelector('[data-src]').classList.add('is-on');
      } else if (sel.type === 'src') {
        var g = map.querySelector('[data-group="' + sel.id + '"]');
        if (!g) return;
        g.querySelector('[data-src]').classList.add('is-sel');
        g.querySelectorAll('.cd-map-row').forEach(function (r) { r.classList.add('is-on'); });
      } else {
        map.querySelectorAll('.cd-map-sec[data-sec="' + sel.id + '"]').forEach(function (b) {
          b.classList.add('is-sel');
          b.closest('.cd-map-row').classList.add('is-on');
        });
      }
    }
    function show(next, fromEl) {
      sel = next;
      var html;
      if (!sel) html = HINT;
      else if (sel.type === 'item') html = itemPanel(comps[sel.id]);
      else if (sel.type === 'src') {
        var ids = Object.keys(uses).filter(function (id) { return groupOf(comps[id]).key === sel.id; }).sort(function (a, b) { return first[a] - first[b]; });
        var lab = groupOf(comps[ids[0]]).label;
        html = listPanel('Where it came from', lab, ids, (ids.length === 1 ? 'One item' : WORDS[ids.length] ? WORDS[ids.length].charAt(0).toUpperCase() + WORDS[ids.length].slice(1) + ' items' : ids.length + ' items') + ' in this article come' + (ids.length === 1 ? 's' : '') + ' from here.');
      } else {
        var ids2 = Object.keys(uses).filter(function (id) { return sectionsOf(id).some(function (s) { return s.id === sel.id; }); }).sort(function (a, b) { return first[a] - first[b]; });
        var s = sectionsOf(ids2[0]).filter(function (x) { return x.id === sel.id; })[0];
        var goto = document.getElementById(sel.id);
        html = listPanel('Where it\u2019s used', s.title, ids2, 'This section carries ' + (ids2.length === 1 ? 'one item' : (WORDS[ids2.length] || ids2.length) + ' items') + ' from the map.') +
          (goto ? '<button type="button" class="cd-link-btn" data-goto="' + esc(sel.id) + '">Go to the section</button>' : '');
      }
      panel.innerHTML = (sel ? close : '') + html;
      paint();
      if (sel && sheet()) {
        panel.classList.add('is-open');
        opener = fromEl || null;
        var h3 = panel.querySelector('h3'); if (h3) h3.focus({ preventScroll: true });
      }
    }
    var opener = null;
    function hideSheet() {
      panel.classList.remove('is-open');
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    }
    function setTab(i) {
      tabIx = i;
      tabs.querySelectorAll('[data-tab]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-tab') === i)); });
      map.innerHTML = mapHtml(TABS[i]);
      if (sel && sel.type === 'item' && TABS[i].kinds.indexOf(comps[sel.id].kind) < 0) sel = null;
      if (!sel && !sheet()) {
        var firstId = map.querySelector('[data-pick]');
        show(firstId ? { type: 'item', id: firstId.getAttribute('data-pick') } : null);
      } else show(sel);
    }

    // Space: the map is held at the height of its longest tab, so switching tabs moves nothing below.
    function settle() {
      map.style.minHeight = '';
      var probe = h('div', { class: 'cd-probe', 'aria-hidden': 'true' }, TABS.map(function (t) { return '<div class="cd-probe-copy">' + mapHtml(t) + '</div>'; }).join(''));
      probe.style.width = map.getBoundingClientRect().width + 'px';
      wrap.appendChild(probe);
      var tallest = Math.max.apply(null, Array.prototype.map.call(probe.querySelectorAll('.cd-probe-copy'), function (el) { return el.getBoundingClientRect().height; }));
      wrap.removeChild(probe);
      map.style.minHeight = Math.ceil(tallest) + 'px';
    }

    // Going to a sentence, and back to the map.
    var back = document.getElementById('cd-map-back') || document.body.appendChild(h('button', { type: 'button', id: 'cd-map-back', class: 'cd-btn is-primary', hidden: '' }, 'Back to the map'));
    var backTo = null;
    back.onclick = function () {
      back.hidden = true;
      var t = backTo && document.contains(backTo) ? backTo : map;
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      if (t.focus) t.focus({ preventScroll: true });
    };
    function visibleCopy(m, u) {
      if (!u.sec.note) return m;
      // A note lives in the margin (wide screens) or opens inline; go to whichever copy shows.
      var num = String(u.sec.note.num), hit = null;
      body.querySelectorAll('.sidenote, .note-inline').forEach(function (n) {
        var s = n.querySelector('.sidenote-num');
        if (!hit && s && s.textContent === num && n.getClientRects().length) hit = n;
      });
      return hit || m;
    }
    function go(id, i) {
      var u = uses[id][i], target = visibleCopy(u.el, u);
      if (sheet()) panel.classList.remove('is-open');
      backTo = map.querySelector('[data-pick="' + id + '"]');
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      target.classList.remove('cd-map-flash'); void target.offsetWidth; target.classList.add('cd-map-flash');
      back.hidden = false;
    }
    if ('IntersectionObserver' in window) {
      // Hide the button once the map is back in the middle of the screen.
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) back.hidden = true; }); }, { rootMargin: '-40% 0px -40% 0px' }).observe(fig);
    }

    stage.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-tab')) setTab(+b.getAttribute('data-tab'));
      else if (b.hasAttribute('data-pick')) show({ type: 'item', id: b.getAttribute('data-pick') }, b);
      else if (b.hasAttribute('data-src')) show({ type: 'src', id: b.getAttribute('data-src') }, b);
      else if (b.hasAttribute('data-sec')) show({ type: 'sec', id: b.getAttribute('data-sec') }, b);
      else if (b.hasAttribute('data-close')) hideSheet();
      else if (b.hasAttribute('data-go')) { var p = b.getAttribute('data-go').split(':'); go(p[0], +p[1]); }
      else if (b.hasAttribute('data-goto')) {
        var t = document.getElementById(b.getAttribute('data-goto'));
        if (t) { if (sheet()) panel.classList.remove('is-open'); backTo = map; t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); back.hidden = false; }
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('is-open')) hideSheet(); });

    setTab(0);
    // Start on a figure with a history, so the first thing the reader sees shows what the map does.
    if (!sheet() && uses['creativex-unactivated']) show({ type: 'item', id: 'creativex-unactivated' });
    settle();
    var lastWidth = stage.offsetWidth, timer = null;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { if (stage.offsetWidth !== lastWidth) { lastWidth = stage.offsetWidth; settle(); if (!sheet()) panel.classList.remove('is-open'); } }, 150);
    });
  }

  /* ---------------------------------------------------------------- Boot */
  var MAKERS = { asof: asof, calc: calc, focus: focus };
  var figs = Array.prototype.slice.call(body.querySelectorAll('[data-cd]'));
  function build(fig) {
    if (fig.getAttribute('data-built')) return;
    fig.setAttribute('data-built', '1');
    var kind = fig.getAttribute('data-cd');
    // A figure built above the reader's place grows from its fallback. Browsers with scroll
    // anchoring keep the reader's place on their own; the rest are moved by the difference.
    var anchors = window.CSS && CSS.supports && CSS.supports('overflow-anchor', 'auto');
    function keep(make) {
      var above = !anchors && fig.getBoundingClientRect().bottom < 0, h0 = fig.offsetHeight;
      make();
      if (above) window.scrollBy(0, fig.offsetHeight - h0);
    }
    if (kind === 'graph') getLineage().then(function (d) { keep(function () { graph(fig, d); }); });
    else if (MAKERS[kind]) keep(function () { MAKERS[kind](fig); });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); build(e.target); } });
    }, { rootMargin: '600px 0px' });
    figs.forEach(function (f) { io.observe(f); });
  } else {
    figs.forEach(build);
  }
  // Anything the reader has not scrolled to yet is built once the page is quiet, so it is ready at rest.
  // One figure per idle moment, so no single task holds up the page.
  window.addEventListener('load', function () {
    var queue = figs.slice();
    var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); };
    function next() {
      var f = queue.shift();
      if (!f) return;
      build(f);
      idle(next, { timeout: 3000 });
    }
    setTimeout(function () { idle(next, { timeout: 3000 }); }, 2500);
  });
})();
