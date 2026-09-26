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
          [{ do: 'Put every request through one form that records who is asking, the date it is needed, and the audience it is for.', get: 'Every open request sits in one list with a due date, and you can decide what gets made first.' }, { do: 'Have whoever takes requests count them every month, including the ones never made, and share the count with the people who approve work.', get: 'You can set the monthly count against the team\u2019s hours and see whether requests run past what the team can make.' }],
          [{ do: 'Before anything is made, have someone search the library for each request and link anything that already exists to it.', get: 'Some requests close the same day on an existing asset, at $25 of triage time in the calculator\u2019s example.' }, { do: 'Pull last quarter\u2019s requests and count how many asked for something the library already had.', get: 'You know how much of last quarter was rebuilt work, a number to show requesters when triage sends them to the library.' }],
          [{ do: 'Give one named person at intake the authority to close a request as fulfilled when a usable asset exists, and log the reason each time.', get: 'Duplicate requests end at intake, and the reason log shows which regions keep pushing for new work.' }, { do: 'Cap work in progress at what the slowest stage can take, and plan each quarter against that number.', get: 'Work stops piling up in front of the slowest stage, and a request in the plan gets a date the team can keep.' }],
        ] },
      { id: 'create', group: 'stage', name: 'Creation', q: 'How are new assets made?',
        opts: ['From a blank page', 'By copying an old file', 'From templates, regulated parts typed in', 'Assembled from approved parts'],
        now: ['Every asset starts from a blank page.', 'New assets start as copies of old files, and the link to the original is lost.', 'Templates exist, but the regulated parts are typed in each time.', 'Assets are assembled from approved parts, and only the connective copy is new.'],
        moves: [
          [{ do: 'Build a template for the asset you make most often, with the brand and layout locked, and start every new one there.', get: 'The next piece of that kind starts with the layout finished, and design hours go into the copy and the image.' }, { do: 'Time the next five new pieces from brief to first draft, and write down the hours each one took.', get: 'You have your own hours for a new piece, the number that replaces the calculator\u2019s example of 8 hours.' }],
          [{ do: 'Replace copying old files with a template that pulls from the library, so every new asset keeps a link to its original.', get: 'Designers start from the current approved version each time, and nobody copies last year\u2019s file with last year\u2019s rate.' }, { do: 'Write down in one paragraph what counts as a variant: an image swap, a call to action, a market line, nothing that touches an approved claim.', get: 'Small changes go down the variant lane, priced in the calculator\u2019s example at $257 against $1,800 for a new piece.' }],
          [{ do: 'Lock the regulated slots in each template, the rate, the disclosure and the claim, and point them at approved components in the library.', get: 'Nobody retypes a rate or a disclosure, and a change to the approved component reaches every template that points at it.' }, { do: 'Count each month how many new pieces were built in a locked template and how many started somewhere else.', get: 'You see how much work still skips the templates, and which team or asset type to move next.' }],
        ] },
      { id: 'approve', group: 'stage', name: 'Approval', q: 'What does legal approve?',
        opts: ['Every piece and every variation, in full', 'Every piece, checked against approved claims', 'Approved parts once, then every new piece', 'Parts and templates once, then only changes'],
        now: ['Legal reads every piece and every variation in full.', 'Legal reads every piece in full, checking it against a list of approved claims.', 'Legal approves parts once, and still reads every new piece in full.', 'Legal approves parts and templates once, and reads only what changed after that.'],
        moves: [
          [{ do: 'Have legal list the claims, disclosures and rates it approves most often, each with the approver\u2019s name and the approval date.', get: 'Writers start from wording legal has already cleared, and legal checks new copy against its own list.' }, { do: 'Send each variation to legal as a marked copy of the approved piece it came from, with only the changed lines highlighted.', get: 'Legal clears a variation by reading a handful of changed lines, and the approved piece stays on file as its parent.' }],
          [{ do: 'Have legal approve each of the 20 most-used components once, so the approval carries into every asset that uses it.', get: 'Those 20 components drop out of every legal read, and review time goes to the new copy around them.' }, { do: 'Ask legal to log its review hours per piece for one month, split between rereading approved language and reading new copy.', get: 'You can show legal how much of its week goes to language it already approved, and pick the next components from that.' }],
          [{ do: 'Have legal pre-approve each template and the combinations of components it allows, so a piece built inside it gets a read of what changed.', get: 'A piece built in a template gets one read of its new copy, the setup behind pharma\u2019s 1.3 review cycles per asset (Veeva).' }, { do: 'Write the rule for novel combinations with legal: triage flags anything off the approved list, and every assembled piece carries its builder\u2019s name.', get: 'Legal\u2019s first objection to reading only the changes has an answer, and a misleading combination traces back to one person.' }],
        ] },
      { id: 'review', group: 'stage', name: 'Review', q: 'How many review rounds does a typical asset take?',
        opts: ['Six or more', 'Four or five', 'Two or three', 'About one'],
        now: ['A typical asset goes through six or more review rounds.', 'A typical asset takes four or five rounds, around the marketing benchmark (Filestage: 4).', 'A typical asset takes two or three rounds.', 'A typical asset takes about one round, close to pharma\u2019s 1.3.'],
        moves: [
          [{ do: 'Put a deadline on every review round, and publish a list each week of who is holding which piece.', get: 'The weekly list shows who has each piece and how late it is.' }, { do: 'Send each piece to everyone in a reviewer group at once, with one due date for all of their comments.', get: 'A round takes as long as the slowest reader in the group, and the writer revises once per group.' }],
          [{ do: 'Have whoever routes reviews record the date each reviewer gets a piece and the date it comes back.', get: 'You can name the reviewer who holds pieces longest, with the dates to back it up.' }, { do: 'Send comments back to the writer as one list per round, with conflicts between reviewers settled before it goes.', get: 'The writer makes one set of changes per round, and fewer rounds go to reviewers undoing each other\u2019s edits.' }],
          [{ do: 'Count review rounds per asset every month, and name the reviewer group that adds the most.', get: 'You see each month whether rounds are falling, and which reviewer group to work with next.' }, { do: 'Name one person on each piece who decides when review is done, so a late comment waits for the next version.', get: 'Pieces stop going around again for every late comment, and each one ships when its named person says it is done.' }],
        ] },
      { id: 'local', group: 'stage', name: 'Translation', q: 'How does a Spanish or other-language version get made?', na: 'We only market in English',
        opts: ['Each branch or team translates on its own', 'Sent out for translation, then edited outside the system', 'Translation memory, and a native speaker reviews it', 'Translations attached to approved components'],
        now: ['Each branch or team gets its own translation, and none of them come back into the library.', 'Assets go out for translation, and the edits made afterward never come back into the system.', 'Translation memory is used, and a native speaker reviews the result.', 'Translations are attached to approved components and reused wherever the component runs.'],
        moves: [
          [{ do: 'Send every translation request through one queue, with the approved English asset attached.', get: 'Each language starts from approved copy, and you can see which assets already have a Spanish version before paying for another.' }, { do: 'Keep a list of which products you market in which language, and who made each version.', get: 'You can show which products you market in Spanish and which only in English, the gap CFPB examiners flagged as a fair lending risk in card marketing.' }],
          [{ do: 'Get each final translation back into the library as its own record, linked to the English asset it came from.', get: 'The next translation reuses the wording that ran, about 2,460 words an hour against 1,100 from scratch in a 2015 study of ten translators.' }, { do: 'Add a notice, in each language you market in, of which services you offer in that language.', get: 'Customers know what help they can get in their language, which the CFPB\u2019s 2021 statement says may lower compliance risk.' }],
          [{ do: 'Link every translated disclosure to its English original in the library.', get: 'When a customer asks for the English version, which Regulation DD and the NCUA rule require you to have, anyone can find it in a minute.' }, { do: 'Attach translations to the components in the library, so a translated claim or disclosure stays translated everywhere it is reused.', get: 'A translated disclosure is reviewed once, and every asset that reuses it carries the approved wording with no new read.' }],
        ] },
      { id: 'store', group: 'stage', name: 'Storage', q: 'Does each asset in your library record where it came from?',
        opts: ['There is no one library', 'There is a library, but nothing records it', 'Every upload has to name its parent', 'Parents are recorded automatically'],
        now: ['Assets live in drives and inboxes, and finding one means asking someone.', 'There is a library, but fields are optional and nothing records where an asset came from.', 'Uploads carry required fields, and every asset declares a parent.', 'Assets record their parts automatically, and search works by component, rights and expiry.'],
        moves: [
          [{ do: 'Pick one system as the library and have marketing ops move finished assets into it, starting with the products you market most.', get: 'Finding an asset stops depending on who you ask, and anyone can search one place before requesting something new.' }, { do: 'Pull an export from every drive and system that holds assets, and count the ones that shipped last year.', get: 'You learn how many assets shipped last year and how many places they sit in, which sizes the move into one library.' }],
          [{ do: 'Make a parent field required at upload: every asset names the asset it came from, or is marked as new.', get: 'Your real share of assets with a parent on file replaces the calculator\u2019s example of 40 percent.' }, { do: 'Make the governance fields required from controlled lists, starting with FINRA 2210\u2019s: approver, dates of use, and the source of every figure.', get: 'When a statistic\u2019s source is updated, you can pull every asset that cites it and fix them in one pass.' }],
          [{ do: 'Build templates that link to library components, so the parent is recorded when an asset is assembled and nobody types it in.', get: 'You can list every asset carrying a claim or rate, which 81 percent of life sciences companies Veeva surveyed in 2016 could not.' }, { do: 'Block publishing on any regulated asset that has no parent on record.', get: 'Every regulated piece that reaches a channel has a parent, and dark content in regulated work drops to zero.' }],
        ] },
      { id: 'deliver', group: 'stage', name: 'Delivery', q: 'How do assets reach the channels?',
        opts: ['Downloaded and uploaded again', 'Some channels pull from the library', 'Most channels pull by reference', 'Expire once, it stops everywhere'],
        now: ['Every channel gets its own downloaded copy.', 'Some channels pull from the library; the rest get copies.', 'Most channels pull approved assets by reference.', 'Channels pull by reference, and an expired asset stops rendering everywhere at once.'],
        moves: [
          [{ do: 'List every place an asset goes live, including the website, email, branches, social and agencies, and who uploads it to each.', get: 'When something has to come down fast, you know every place it lives and who can pull it.' }, { do: 'Give every shipped asset an ID, and put it in the file name and metadata that travel into each channel.', get: 'You can match any copy found in a channel to its approved version and tell whether it is out of date.' }],
          [{ do: 'Connect the website and email platform to the library, so pages and emails pull the current approved version straight from it.', get: 'One update in the library reaches every connected page and email, including the FDIC digital sign insured banks need online by April 1, 2027.' }, { do: 'Send agencies and partners a link to the approved version in the library on every job, and stop sending files.', get: 'Agencies always work from the current approved version, and a withdrawn asset leaves their hands the day you withdraw it.' }],
          [{ do: 'Serve assets through an approved-only delivery link, so expiring an asset in the library pulls it from every channel at once.', get: 'An expired rate or offer comes down everywhere the same day, with no cleanup channel by channel.' }, { do: 'Find the channels that still hold downloaded copies, and connect them to the library one at a time, busiest channel first.', get: 'You can report each month how many channels still run copies, and the list shrinks until expiry reaches everywhere.' }],
        ] },
      { id: 'measure', group: 'stage', name: 'Measurement', q: 'How do you know how much of what you make gets used?',
        opts: ['We don\u2019t', 'We guess', 'We measured it once', 'We report it every month'],
        now: ['Nobody knows how much of what gets made is used.', 'There is a guess at how much gets used.', 'Use was measured once.', 'Use is reported every month.'],
        moves: [
          [{ do: 'Pick twenty assets from last year, check whether each one ran in any channel, and write down the share that did.', get: 'You learn roughly how much of last year\u2019s work never ran, a share CreativeX put at 52 percent of core assets at large brands.' }, { do: 'Have the web and email teams report views and clicks by asset each month, using the asset\u2019s ID in the tracking tag.', get: 'You can say which assets people looked at, and stop remaking the ones that never drew a click.' }],
          [{ do: 'Work out a first dark content number: assets with no parent on file, times a cost per asset.', get: 'Leadership sees the spend outside the system in dollars, the same math behind the article\u2019s $5.4 million example.' }, { do: 'Have finance build a fully loaded cost per asset: agency fees, internal hours, translation, review time and rework, divided by what shipped.', get: 'Your cost and reuse figures run on a number finance built and will stand behind in a budget meeting.' }],
          [{ do: 'Report the dark content number and the reopen reasons every month to whoever funds the content function.', get: 'Whoever funds the work sees each month whether spend outside the system is falling, and why regions reopen requests.' }, { do: 'Put reuse rate next to component performance each month, to see whether reused parts do as well as new ones.', get: 'You can answer a region\u2019s claim that new work performs better with your own numbers.' }],
        ] },
      { id: 'owner', group: 'base', name: 'Ownership', q: 'Who owns the chain from end to end?',
        opts: ['Nobody; each team owns its stage', 'A coordinator, without authority', 'One owner, other stages out of reach', 'One owner who can change any stage'],
        now: ['Each team owns its own stage, and nobody owns the whole chain.', 'Someone tracks the chain but cannot change how any stage works.', 'One person owns the chain, but other teams\u2019 stages are out of reach.', 'One person owns the chain and can change any stage, with an executive behind them.'],
        moves: [
          [{ do: 'Map the chain by interviewing the people who do the work, and write down how long work waits at each handoff.', get: 'You have one picture of how work moves today, drawn from the people doing it, with the handoffs where it stalls.' }, { do: 'From the map, name the stage with the longest queue of work in front of it.', get: 'You know which stage to fix first, and you have the wait in days to make the case.' }],
          [{ do: 'Ask an executive to name, in writing, one person accountable for the chain from request to use.', get: 'When a piece stalls anywhere, one person answers for it, from the request that sat to the review that ran late.' }, { do: 'Publish the map with the waiting times on it, and send it to every team in the chain.', get: 'Each team sees where its work waits on someone else, and arguments about who is slow start from one set of numbers.' }],
          [{ do: 'Get the executive to say at the next regional meeting that reuse is the default, and that triage speaks for them.', get: 'When a region escalates over triage, the executive has already given the answer in public.' }, { do: 'Each quarter, have the owner name the slowest stage again and agree the next fix with that stage\u2019s head.', get: 'Each quarter\u2019s fix lands where work now waits longest, with the head of that stage already signed on.' }],
        ] },
      { id: 'records', group: 'base', name: 'Records and rights', q: 'If a regulator asked what a customer saw on a past date, how long would it take to show them?',
        opts: ['We could not show them', 'Weeks', 'Days', 'Minutes'],
        now: ['You could not show what a customer saw on a past date.', 'You could, after weeks of digging.', 'You could in days.', 'You could in minutes.'],
        moves: [
          [{ do: 'Have marketing ops keep every version that went live with the dates it was live, starting with rate and disclosure pages.', get: 'You can show what ran on any past date, with the ad copies Regulation DD asks a bank to keep for two years.' }, { do: 'For email, keep the version each recipient received, starting with your highest-volume campaign.', get: 'You keep the copy each recipient got, the record H2C Securities lacked when FINRA fined it $250,000 in 2024.' }],
          [{ do: 'Add first-use and last-use dates to every regulated asset in the library, the dates FINRA 2210 asks broker-dealers to keep.', get: 'When a regulator asks when a piece ran, the answer is a lookup, and the weeks of digging stop.' }, { do: 'Put an expiry date and a rights owner on every regulated component, and have the library notify that owner before it lapses.', get: 'A named owner hears before a rate, offer or image license lapses, with time to renew it or pull it.' }],
          [{ do: 'Have the publishing system log which component versions went into each page or email at the moment it goes live.', get: 'You can rebuild any past page or email from its log in minutes, down to the version of each disclosure.' }, { do: 'Turn on the library\u2019s built-in expiry, and agree with compliance who pulls the assets it cannot reach, like print and branch displays.', get: 'Print and branch displays, which the library cannot expire, each have a named person and a pull date on record.' }],
        ] },
      { id: 'systems', group: 'base', name: 'Systems', q: 'How does work move between your tools?',
        opts: ['By email and shared drives', 'Between separate tools, by hand', 'The workflow tool writes to the library', 'Every handoff is time-stamped'],
        now: ['Work moves by email and shared drives.', 'The tools are separate, and people move work between them by hand.', 'The workflow tool writes to the library.', 'Every handoff between tools is time-stamped automatically.'],
        moves: [
          [{ do: 'Put requests and approvals in one workflow tool, even a simple one, and stop taking requests by email.', get: 'Anyone can see where a request sits without asking, and every request has a status.' }, { do: 'List every tool work passes through from request to publish, and who moves it from one to the next.', get: 'You can see each place a person carries work between tools by hand, the handoffs to connect first.' }],
          [{ do: 'Connect the intake form to the library, so the fields a requester fills in become the new asset\u2019s metadata.', get: 'New assets arrive already tagged with product, audience and requester, and search works on them from day one.' }, { do: 'Have the workflow tool record who approved each piece and when, on the piece\u2019s own record.', get: 'Who approved any piece, and on what date, sits on its record, and nobody searches old email to prove it.' }],
          [{ do: 'Have the tools time-stamp every handoff automatically, so the wait in front of each stage becomes a measurement.', get: 'The system tracks every wait between stages, which the postcard executive could only do by sitting in every meeting.' }, { do: 'Once the tools show where every piece is, retire the status spreadsheet and the weekly status meeting.', get: 'The hours spent reporting status go back to the work, and the status everyone sees is current.' }],
        ] },
      { id: 'ai', group: 'base', name: 'Generative AI', q: 'Where does generative AI make content today?',
        opts: ['Wherever people like', 'One-off pieces', 'Drafts inside templates', 'Variants from approved parts only'],
        now: ['AI is used however people like.', 'AI makes one-off pieces, and each one goes through full review.', 'AI drafts inside templates.', 'AI assembles variants only from approved parts.'],
        moves: [
          [{ do: 'Write a one-page rule with legal on where AI may and may not be used, starting with rates, disclosures and other regulated copy.', get: 'Staff know which uses of AI are allowed, and legal knows where generated copy could show up in regulated work.' }, { do: 'Keep AI out of any field that decides approval or rights, such as the approver, the market or the expiry date.', get: 'A named person makes every approval, market and rights call, and the record shows who.' }],
          [{ do: 'Move AI from one-off pieces into templates with the brand and layout locked, so generation fills slots in an approved design.', get: 'AI output arrives in the approved layout, so reviewers check the words and skip the brand check.' }, { do: 'Count the AI-made pieces that went through full review last quarter, and the reviewer hours they took.', get: 'You can put a review-hours cost on one-off AI work, the sign-off struggle 88 percent of marketing leaders reported to Typeface in 2026.' }],
          [{ do: 'Point generation at the approved components in the library, so AI assembles from approved parts and writes only the sentences that join them.', get: 'AI can work on regulated products, because every claim and disclosure in its draft was approved before it ran.' }, { do: 'Record each AI variant in the library with its parent asset and the components it used.', get: 'Each AI variant expires with its parent, so it comes down the day the offer it was built on ends.' }],
        ] },
    ];
    var PROFILE = [];
    var STEPS = PROFILE.concat(LINKS);
    var byId = {};
    STEPS.forEach(function (S) { byId[S.id] = S; });
    var stages = LINKS.filter(function (L) { return L.group === 'stage'; });
    var base = LINKS.filter(function (L) { return L.group === 'base'; });
    var INTRO = 'One question about each of the twelve links in your content chain. Pick an answer and the next question appears. At the end you get the next things to work on, what each one gets you, and where each link stands.';
    var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var ans = {}, cur = 0, mode = 'q', changeId = null, changeFrom = null;
    var viaPointer = false, wasChecked = false, pending = null, started = false, reported = false;
    var leadMin = 0, cardMin = 0, rowMin = {}, reserve = 0, tallest = 0;

    function hgt(el) { return el.getBoundingClientRect().height; }
    function track(name, props) { try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, props || {}); } catch (e) { /* analytics is optional */ } }
    function isNum(v) { return typeof v === 'number'; }
    function answered(v) { return isNum(v) || v === 'na'; }
    function nextStep(i) { return i + 1 < STEPS.length ? i + 1 : -1; }
    function prevStep(i) { return i - 1; }
    function eyebrow(S) {
      var i = stages.indexOf(S);
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
      if (v === 'skip' || v === 'na') c += ' is-skipped';
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
      if (v === 'na') return esc(S.na);
      if (v === 'skip') return 'Skipped';
      return isNum(v) ? esc(S.opts[v]) : '';
    }
    function answersHtml(currentId) {
      return '<div class="cd-focus-answers"><h3>Your answers</h3><ol>' + STEPS.map(function (S) {
        var filled = answered(ans[S.id]) || ans[S.id] === 'skip';
        return '<li data-row="' + S.id + '"' + (S.id === currentId ? ' class="is-current" aria-current="step"' : '') + (filled ? '' : ' data-empty') +
          '><b>' + S.name + '</b> <span>' + answerText(S) + '</span></li>';
      }).join('') + '</ol></div>';
    }
    function cardHtml(S, isChange) {
      var i = STEPS.indexOf(S), v = ans[S.id];
      var opts = S.opts.map(function (o, k) {
        var id = 'cd-focus-' + S.id + '-' + k;
        return '<label class="cd-opt" for="' + id + '"><input type="radio" id="' + id + '" name="cd-focus-' + S.id + '" value="' + k + '"' + (v === k ? ' checked' : '') + '><span>' + esc(o) + '</span></label>';
      }).join('') + (S.na ? '<label class="cd-opt is-na" for="cd-focus-' + S.id + '-na"><input type="radio" id="cd-focus-' + S.id + '-na" name="cd-focus-' + S.id + '" value="na"' + (v === 'na' ? ' checked' : '') + '><span>' + esc(S.na) + '</span></label>' : '');
      var controls = isChange
        ? '<span class="cd-focus-spacer"></span><button type="button" class="cd-btn is-primary" data-act="done">Back to report</button>'
        : '<button type="button" class="cd-btn" data-act="back"' + (prevStep(i) < 0 ? ' hidden' : '') + '>Back</button><span class="cd-focus-spacer"></span>' +
          '<button type="button" class="cd-link-btn" data-act="skip">Skip</button>' +
          '<button type="button" class="cd-btn is-primary" data-act="next"' + (answered(v) ? '' : ' aria-disabled="true"') + '>' + (nextStep(i) < 0 ? 'See your report' : 'Next') + '</button>';
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
      var ask = LINKS.filter(function (L) { return ans[L.id] !== 'na'; });
      var answered = ask.filter(function (L) { return isNum(ans[L.id]); });
      var order = answered.filter(function (L) { return ans[L.id] < 3; }).sort(function (a, b) {
        return ans[a.id] - ans[b.id] || (a.group === b.group ? 0 : a.group === 'base' ? -1 : 1) || LINKS.indexOf(a) - LINKS.indexOf(b);
      });
      var picks = [];
      [0, 1].forEach(function (k) {
        order.forEach(function (L) {
          var m = L.moves[ans[L.id]][k];
          if (typeof m === 'string') m = { do: m, get: '' };
          if (picks.length < 5) picks.push({ name: L.name, do: m.do, get: m.get });
        });
      });
      var min = answered.length ? Math.min.apply(null, answered.map(function (L) { return ans[L.id]; })) : null;
      var notAns = [];
      ask.forEach(function (L) { if (!isNum(ans[L.id])) notAns.push({ S: L, text: ans[L.id] === 'skip' ? 'Skipped.' : 'Not answered.', change: L.id }); });
      if (ans.local === 'na') notAns.push({ S: byId.local, text: 'Not needed: you only market in English.', change: 'local' });
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
      var next = !r.answered.length ? '' : '<section class="cd-rep-next"><h3>' + nextHeading(r) + '</h3>' + (r.picks.length
        ? '<ol>' + r.picks.map(function (p) {
          return '<li><p class="cd-rep-link">' + p.name + '</p><p class="cd-rep-do">' + esc(p.do) + '</p>' +
            (p.get ? '<p class="cd-rep-get"><b>What you get</b> ' + esc(p.get) + '</p>' : '') + '</li>';
        }).join('') + '</ol>'
        : '<p class="cd-rep-keep">Read the numbers every month, and name the slowest stage again each quarter.</p>') + '</section>';
      var stand = '<details class="cd-rep-stand"' + (print || !r.answered.length ? ' open' : '') + '><summary>Where each link stands</summary>' +
        group('Start here', 'is-start', r.startHere.map(now('is-weak'))) +
        group('After that', '', r.afterThat.map(now(''))) +
        group('Holding', '', r.holding.map(now(''))) +
        group('Not answered', '', r.notAns.map(function (x) { return rowHtml(x.S, x.text, '', x.change, print); })) + '</details>';
      return '<div class="cd-focus-report">' + next + stand + '</div>';
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
      mode = 'change'; changeId = id; changeFrom = ans[id];
      swap(function () { renderQ(byId[id], true); hold(); bring(main.querySelector('.cd-focus-card'), 'start'); focusRadio(); });
    }
    function finishChange() {
      var id = changeId;
      if (ans[id] !== changeFrom) track('content_chain_answer_changed');
      mode = 'report'; changeId = null;
      swap(function () {
        renderReport(); hold();
        var d = main.querySelector('details.cd-rep-stand'); if (d) d.open = true;
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
      var r = compute(), out = ['Your content chain', headline(r, false), r.answered.length + ' of ' + r.ask.length + ' answered.'];
      if (r.answered.length) {
        out.push('', nextHeading(r));
        if (r.picks.length) r.picks.forEach(function (p, i) { out.push((i + 1) + '. ' + p.name + ': ' + p.do); if (p.get) out.push('   What you get: ' + p.get); });
        else out.push('Read the numbers every month, and name the slowest stage again each quarter.');
      }
      out.push('', 'Where each link stands');
      [['Start here', r.startHere], ['After that', r.afterThat], ['Holding', r.holding]].forEach(function (g) {
        if (!g[1].length) return;
        out.push(g[0]);
        g[1].forEach(function (L) { out.push('- ' + L.name + ': ' + L.now[ans[L.id]]); });
      });
      if (r.notAns.length) {
        out.push('Not answered');
        r.notAns.forEach(function (x) { out.push('- ' + x.S.name + ': ' + x.text); });
      }
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
      function synth(fill) { ans = {}; LINKS.forEach(function (L, i) { ans[L.id] = fill(i); }); }
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
      if (answered(ans[e.target.name.replace('cd-focus-', '')])) { e.preventDefault(); advance(); }
    });
    main.addEventListener('change', function (e) {
      var t = e.target;
      if (!t.matches || !t.matches('.cd-opt input')) return;
      var id = t.name.replace('cd-focus-', '');
      ans[id] = t.value === 'na' ? 'na' : +t.value;
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
      'language-and-voice': 'Language and voice', 'review-reads-the-diff': 'Review reads the diff',
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
