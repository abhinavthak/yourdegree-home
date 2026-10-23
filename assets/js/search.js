/* YourDegree hero search: Airbnb-style segmented search over the online-programme catalogue */
(function () {
  var form = document.getElementById('ydSearch');
  if (!form) return;

  var DEG = {
    mba: ['MBA', 'Master of Business Administration', 'pg'], ma: ['MA', 'Master of Arts', 'pg'],
    mca: ['MCA', 'Master of Computer Applications', 'pg'], mcom: ['M.Com', 'Master of Commerce', 'pg'], msc: ['M.Sc', 'Master of Science', 'pg'],
    mlis: ['MLIS', 'Master of Library and Information Science', 'pg'], msw: ['MSW', 'Master of Social Work', 'pg'],
    pgdca: ['PGDCA', 'Post Graduate Diploma in Computer Applications', 'pg'],
    bba: ['BBA', 'Bachelor of Business Administration', 'ug'], ba: ['BA', 'Bachelor of Arts', 'ug'],
    bca: ['BCA', 'Bachelor of Computer Applications', 'ug'], bcom: ['B.Com', 'Bachelor of Commerce', 'ug'], bsc: ['B.Sc', 'Bachelor of Science', 'ug']
  };
  var BUDGETS = [
    { id: 'any', label: 'Any budget', min: 0, max: Infinity },
    { id: 'u1', label: 'Under ₹1 lakh', min: 0, max: 100000 },
    { id: '1-2', label: '₹1 – 2 lakh', min: 100000, max: 200000 },
    { id: '2-3', label: '₹2 – 3 lakh', min: 200000, max: 300000 },
    { id: '3p', label: 'Above ₹3 lakh', min: 300000, max: Infinity }
  ];
  var SITE = 'https://www.yourdegree.com/';
  var ICON = { mba: 'cacace75bc', bba: 'cacace75bc', mca: '451892a184', bca: '451892a184', pgdca: '451892a184',
    mcom: 'ed69ff81f5', bcom: 'ed69ff81f5', msc: 'ed69ff81f5', bsc: 'ed69ff81f5', ma: '73a8703195', ba: '73a8703195', msw: '73a8703195', mlis: '73a8703195' };
  var LOGO = { 'D.Y. Patil University': '708eddc90e', 'Chandigarh University': '502341bb01', 'Kurukshetra University': '0d254a487f', 'O.P. Jindal Global University': 'f62dd3ebc9' };
  var img = function (k) { return '<img src="assets/img/' + k + '.webp" alt="" width="40" height="40">'; };

  var data = null, loading = null, links = {}, uniu = {}, ulogo = {};
  var state = { degree: null, uni: null, spec: null, budget: 'any' };
  var active = null, from = null, shown = 12, sort = 'fee';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var panel = $('#spanel'), qDeg = $('#qDeg'), qUni = $('#qUni'), qSpec = $('#qSpec'), fBudget = $('#sresBudget');
  var msOpen = $('#msOpen'), msLabel = $('#msLabel');
  var res = $('#sres'), mq = window.matchMedia('(max-width:759px)');

  function load() {
    if (data) return Promise.resolve(data);
    if (!loading) loading = fetch('assets/data/programs.json?v=def7569f').then(function (r) { return r.json(); }).then(function (j) {
      links = j.links || {}; uniu = j.uniu || {}; ulogo = j.logos || {};
      data = j.p.map(function (r) {
        return { d: r[0], u: j.unis[r[1]], s: r[2], f: r[3], n: r[4], y: r[5], url: SITE + r[6] };
      }).filter(function (p) { return DEG[p.d]; });
      return data;
    });
    return loading;
  }
  var lakh = function (n) { return '₹' + n.toLocaleString('en-IN'); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = function (s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
  function budgetOf(id) { for (var i = 0; i < BUDGETS.length; i++) if (BUDGETS[i].id === id) return BUDGETS[i]; return BUDGETS[0]; }
  function match(p, o) {
    o = o || state;
    if (o.degree && p.d !== o.degree) return false;
    if (o.uni && p.u !== o.uni) return false;
    if (o.spec && p.s !== o.spec) return false;
    var b = budgetOf(o.budget);
    if (b.id !== 'any' && (p.f == null || p.f < b.min || p.f >= b.max)) return false;
    return true;
  }
  function count(o) { return data.filter(function (p) { return match(p, o); }).length; }

  /* ---------- segments ---------- */
  var glide = form.querySelector('.sglide'), ORDER = ['degree', 'uni', 'spec'];
  function moveGlide(seg, prev) {
    if (!glide || !seg) return;
    var el = form.querySelector('.seg[data-seg="' + seg + '"]');
    glide.classList.toggle('jump', !prev);
    glide.style.width = el.offsetWidth + 'px'; glide.style.transform = 'translateX(' + el.offsetLeft + 'px)';
    if (!prev) { void glide.offsetWidth; glide.classList.remove('jump'); }
  }
  /* desktop: end the panel a comfortable gap above the bottom of the screen (and the help strip) */
  function fitPanel() {
    if (panel.hidden || mq.matches) { panel.style.maxHeight = ''; return; }
    var st = document.querySelector('.strip'), below = st && st.classList.contains('on') ? st.offsetHeight : 0;
    var room = window.innerHeight - (form.getBoundingClientRect().bottom + 14) - below - 32;
    panel.style.maxHeight = Math.max(260, Math.min(560, room)) + 'px';
  }
  window.addEventListener('resize', fitPanel);
  window.addEventListener('scroll', function () { if (!panel.hidden) fitPanel(); }, { passive: true });
  function setActive(seg) {
    var prev = active;
    if (seg && prev && seg !== prev) panel.style.setProperty('--dx', (ORDER.indexOf(seg) > ORDER.indexOf(prev) ? 16 : -16) + 'px');
    moveGlide(seg, prev);
    active = seg;
    form.classList.toggle('on', !!seg);
    form.querySelectorAll('.seg').forEach(function (s) { s.classList.toggle('act', s.dataset.seg === seg); });
    [qDeg, qUni, qSpec].forEach(function (i) { i.setAttribute('aria-expanded', String(i.closest('.seg').dataset.seg === seg)); });
    if (!seg) { panel.classList.remove('sw'); delete panel.dataset.seg; panel.hidden = true; if (!form.classList.contains('full')) document.body.classList.remove('slock'); syncFields(); return; }
    load().then(function () { render(); panel.hidden = false; fitPanel(); if (mq.matches) document.body.classList.add('slock'); });
  }
  function syncFields() {
    if (active !== 'degree') qDeg.value = state.degree ? DEG[state.degree][0] : '';
    if (active !== 'uni') qUni.value = state.uni || '';
    if (active !== 'spec') qSpec.value = state.spec || '';
    fBudget.value = state.budget;
    form.querySelectorAll('.segclr').forEach(function (c) { c.hidden = !state[c.dataset.clear]; });
    var sum = [state.degree && 'Online ' + DEG[state.degree][0], state.uni, state.spec].filter(Boolean).join(' · ');
    msLabel.textContent = sum || 'Search degrees';
  }
  function next(after) {
    active = null; syncFields();
    if (after === 'degree') { setActive('uni'); qUni.focus(); }
    else if (after === 'uni') { setActive('spec'); qSpec.focus(); }
    else { setActive(null); form.querySelector('.sbtn').focus({ preventScroll: form.classList.contains('full') }); }
  }

  /* ---------- panels ---------- */
  function sheetHead(title) {
    return '<div class="sp-head"><b>' + title + '</b><button type="button" class="sp-x" data-close aria-label="Close">' +
      '<svg class="ico"><use href="#i-close"/></svg></button></div>';
  }
  function render() {
    var swapped = panel.dataset.seg && panel.dataset.seg !== active && !panel.hidden;
    panel.dataset.seg = active;
    if (active === 'degree') renderDegree();
    else if (active === 'uni') renderUni();
    else renderSpec();
    if (swapped) { panel.classList.remove('sw'); void panel.offsetWidth; panel.classList.add('sw'); }
  }
  function renderDegree() {
    var q = norm(qDeg.value), html = sheetHead('Choose a degree');
    if (!q || (state.degree && qDeg.value === DEG[state.degree][0])) {
      ['pg', 'ug'].forEach(function (lvl) {
        html += '<p class="sp-k">' + (lvl === 'pg' ? 'Postgraduate' : 'Undergraduate') + '</p><div class="sp-tiles">';
        Object.keys(DEG).forEach(function (k) {
          if (DEG[k][2] !== lvl) return;
          var n = count({ degree: k, uni: state.uni, spec: null, budget: 'any' });
          if (!n) return;
          html += '<button type="button" class="sp-tile' + (state.degree === k ? ' sel' : '') + '" data-deg="' + k + '" title="' + n + ' programmes">' + img(ICON[k]) +
            '<span>' + DEG[k][1] + ' (' + DEG[k][0] + ')</span></button>';
        });
        html += '</div>';
      });
    } else {
      var degs = Object.keys(DEG).filter(function (k) { return norm(DEG[k][0] + ' ' + DEG[k][1] + ' ' + k).indexOf(q) > -1; });
      var specs = {}, words = q.split(' ');
      data.forEach(function (p) {
        var hay = norm(DEG[p.d][0] + ' ' + p.s + ' ' + p.d);
        if (words.every(function (w) { return hay.indexOf(w) > -1; })) { var key = p.d + '|' + p.s; specs[key] = (specs[key] || 0) + 1; }
      });
      var list = Object.keys(specs).sort(function (a, b) { return specs[b] - specs[a]; }).slice(0, 7);
      html += '<ul class="sp-list" role="listbox">';
      degs.forEach(function (k) {
        html += '<li><button type="button" role="option" data-deg="' + k + '"><span class="sp-ic"><svg class="ico"><use href="#i-cap"/></svg></span><span><b>' +
          DEG[k][0] + '</b><small>' + DEG[k][1] + ' · all specialisations</small></span></button></li>';
      });
      list.forEach(function (key) {
        var d = key.split('|')[0], s = key.split('|')[1];
        html += '<li><button type="button" role="option" data-deg="' + d + '" data-spec="' + esc(s) + '"><span class="sp-ic"><svg class="ico"><use href="#i-search"/></svg></span><span><b>' +
          DEG[d][0] + ' · ' + esc(s) + '</b><small>' + specs[key] + ' programme' + (specs[key] > 1 ? 's' : '') + '</small></span></button></li>';
      });
      if (!degs.length && !list.length) html += '<li class="sp-none">No degrees match “' + esc(qDeg.value) + '”. Try MBA, BCA or B.Com.</li>';
      html += '</ul>';
    }
    panel.innerHTML = html;
  }
  function renderSpec() {
    var q = norm(qSpec.value === state.spec ? '' : qSpec.value), counts = {};
    data.forEach(function (p) { if ((!state.degree || p.d === state.degree) && (!state.uni || p.u === state.uni)) counts[p.s] = (counts[p.s] || 0) + 1; });
    var names = Object.keys(counts).filter(function (s) { return !q || q.split(' ').every(function (w) { return norm(s).indexOf(w) > -1; }); })
      .sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    var total = count({ degree: state.degree, uni: state.uni, spec: null, budget: 'any' });
    var html = sheetHead('Choose a specialisation') + '<div class="sp-pills sp-any"><button type="button" role="option" class="sp-pill sp-big' + (!state.spec ? ' sel' : '') + '" data-spec="">' +
      '<svg class="ico sp-award" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 19 6v5.5c0 4-3 7.2-7 8.5-4-1.3-7-4.5-7-8.5V6z"/><path d="m8.8 11.3 2.2 2.2 4.2-4.3"/><path d="m8 18.5-1.5 3.5 3-1 1.5 1.8M16 18.5l1.5 3.5-3-1-1.5 1.8"/></svg>' +
      '<span><b>Select Any Specialisation</b><small>' + total + ' Programme' + (total === 1 ? '' : 's') + '</small></span></button></div>';
    html += '<div class="sp-pills sp-cards" role="listbox">';
    names.forEach(function (sp) {
      html += '<button type="button" role="option" class="sp-card' + (state.spec === sp ? ' sel' : '') + '" data-spec="' + esc(sp) + '" title="' + esc(sp) + '">' +
        '<b>' + esc(sp) + '</b><small>' + counts[sp] + ' Programme' + (counts[sp] === 1 ? '' : 's') + '</small></button>';
    });
    html += '</div>';
    if (!names.length) html += '<p class="sp-none">No specialisations match “' + esc(qSpec.value) + '”.</p>';
    panel.innerHTML = html;
  }
  function uniBadge(u) {
    return '<span class="sp-logo">' + (ulogo[u] ? '<img src="assets/img/ulogo/' + ulogo[u] + '.webp" alt="" width="28" height="28" loading="lazy">'
      : '<b>' + esc(initials(u)) + '</b>') + '</span>';
  }
  function renderUni() {
    var q = norm(qUni.value === state.uni ? '' : qUni.value), unis = {};
    data.forEach(function (p) { if (!state.degree || p.d === state.degree) unis[p.u] = (unis[p.u] || 0) + 1; });
    var names = Object.keys(unis).filter(function (u) { return !q || q.split(' ').every(function (w) { return norm(u).indexOf(w) > -1; }); })
      .sort(function (a, b) { return a.replace(/^(the|university of)\s+/i, '').localeCompare(b.replace(/^(the|university of)\s+/i, '')); });
    var html = sheetHead('Choose a university') + '<div class="sp-pills sp-any">' +
      '<button type="button" role="option" class="sp-pill sp-big' + (!state.uni ? ' sel' : '') + '" data-uni="">' +
      '<svg class="ico sp-award" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V10h14v11M9 21v-4h6v4M8 13h1M11.5 13h1M15 13h1M12 10V4m0 0h4l-1 1.5 1 1.5h-4"/></svg>' +
      '<span><b>Select Any University</b><small>' + names.length + ' Universit' + (names.length === 1 ? 'y' : 'ies') + '</small></span></button></div>';
    var letter = null;
    names.forEach(function (u) {
      var L = u.replace(/^(the|university of)\s+/i, '').charAt(0).toUpperCase();
      if (L !== letter) { if (letter) html += '</div>'; letter = L; html += '<p class="sp-k sp-az">' + L + '</p><div class="sp-pills" role="listbox">'; }
      html += '<button type="button" role="option" class="sp-pill' + (state.uni === u ? ' sel' : '') + '" data-uni="' + esc(u) + '" title="' +
        esc(u) + ' · ' + unis[u] + ' programme' + (unis[u] > 1 ? 's' : '') + '">' + uniBadge(u) + '<span>' + esc(u) + '</span></button>';
    });
    if (letter) html += '</div>';
    if (!names.length) html += '<p class="sp-none">No universities match “' + esc(qUni.value) + '”' + (state.degree ? ' for ' + DEG[state.degree][0] : '') + '.</p>';
    panel.innerHTML = html;
  }

  panel.addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
  panel.addEventListener('click', function (e) {
    var btn = e.target.closest('button'); if (!btn) return;
    if (btn.hasAttribute('data-close')) { setActive(null); return; }
    if (btn.dataset.deg !== undefined) {
      var changed = state.degree !== btn.dataset.deg;
      state.degree = btn.dataset.deg;
      if (btn.dataset.spec !== undefined) { state.spec = btn.dataset.spec; next('spec'); return; }
      if (changed) { state.spec = null; if (state.uni && !count({ degree: state.degree, uni: state.uni, spec: null, budget: 'any' })) state.uni = null; }
      qDeg.blur(); next('degree'); return;
    }
    if (btn.dataset.uni !== undefined) {
      state.uni = btn.dataset.uni || null;
      if (state.spec && !count({ degree: state.degree, uni: state.uni, spec: state.spec, budget: 'any' })) state.spec = null;
      qUni.blur(); next('uni'); return;
    }
    if (btn.dataset.spec !== undefined) { state.spec = btn.dataset.spec || null; qSpec.blur(); next('spec'); }
  });

  [qDeg, qUni, qSpec].forEach(function (inp) {
    var seg = inp.closest('.seg').dataset.seg;
    inp.addEventListener('focus', function () { if (active !== seg) { from = inp; setActive(seg); } inp.select(); });
    inp.addEventListener('input', function () { if (data) render(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !data) { e.preventDefault(); load().then(function () { render(); inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); }); return; }
      var opts = [].slice.call(panel.querySelectorAll('[data-deg],[data-uni],[data-spec]'));
      if (e.key === 'ArrowDown' && opts.length) { e.preventDefault(); opts[0].focus(); }
      if (e.key === 'Enter') { e.preventDefault(); if (opts.length && inp.value.trim()) opts[0].click(); else next(seg); }
    });
  });
  form.querySelectorAll('.seg').forEach(function (s) {
    s.addEventListener('mousedown', function (e) {
      if (e.target.closest('.segclr')) return;
      var i = s.querySelector('input'); if (i && e.target !== i) { e.preventDefault(); i.focus(); }
    });
  });
  form.querySelectorAll('.segclr').forEach(function (c) {
    c.addEventListener('click', function (e) {
      e.stopPropagation();
      var k = c.dataset.clear;
      state[k] = null;
      if (k === 'degree') state.spec = null;
      syncFields(); if (active && data) render();
    });
  });
  panel.addEventListener('keydown', function (e) {
    var opts = [].slice.call(panel.querySelectorAll('button:not([data-close]):not([disabled])')), i = opts.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && i > -1) { e.preventDefault(); (opts[i + 1] || opts[i]).focus(); }
    if (e.key === 'ArrowUp' && i > -1) { e.preventDefault(); if (i === 0 && from) from.focus(); else opts[i - 1].focus(); }
  });
  document.addEventListener('mousedown', function (e) { if (active && !form.contains(e.target)) setActive(null); });
  /* phones: the pill opens the search full screen */
  function full(on) {
    form.classList.toggle('full', on); document.body.classList.toggle('slock', on);
    msOpen.setAttribute('aria-expanded', String(on));
    if (on) { load(); qDeg.focus(); } else { setActive(null); msOpen.focus({ preventScroll: true }); }
  }
  msOpen.addEventListener('click', function () { full(true); });
  $('#msClose').addEventListener('click', function () { full(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !active && form.classList.contains('full')) full(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && active) { var a = active; setActive(null); ({ degree: qDeg, uni: qUni, spec: qSpec })[a].focus(); } });

  /* ---------- results ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var tyDeg = norm(qDeg.value);
    if (!state.degree && tyDeg) Object.keys(DEG).forEach(function (k) { if (norm(DEG[k][0]) === tyDeg || k === tyDeg) state.degree = k; });
    setActive(null); qDeg.blur(); qUni.blur(); qSpec.blur();
    if (form.classList.contains('full')) { form.classList.remove('full'); document.body.classList.remove('slock'); msOpen.setAttribute('aria-expanded', 'false'); }
    if (!state.degree && !state.uni && !state.spec) { setActive('degree'); qDeg.focus(); return; }
    var tab = window.open('', '_blank');
    load().then(function () { var url = pageFor(); if (tab) tab.location.href = url; else location.href = url; });
  });
  /* the most specific yourdegree.com page for the current selection */
  function pageFor() {
    var d = state.degree, u = state.uni, sp = state.spec, deg = d ? 'online-' + d + '/' : '';
    if (d && u && sp) { var hit = data.filter(function (p) { return p.d === d && p.u === u && p.s === sp; })[0]; if (hit) return hit.url; }
    if (d && u && links[d + '|u|' + u]) return SITE + links[d + '|u|' + u];
    if (d && sp && links[d + '|s|' + sp]) return SITE + links[d + '|s|' + sp];
    if (d && u) { var one = data.filter(function (p) { return p.d === d && p.u === u; }); if (one.length === 1) return one[0].url; }
    if (d) return SITE + deg;
    if (u && sp) { var m = data.filter(function (p) { return p.u === u && p.s === sp; }); if (m.length === 1) return m[0].url; }
    if (u && uniu[u]) return SITE + uniu[u];
    if (sp) { var by = {}; data.forEach(function (p) { if (p.s === sp) by[p.d] = (by[p.d] || 0) + 1; });
      var best = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; })[0];
      if (best) return SITE + (links[best + '|s|' + sp] || 'online-' + best + '/'); }
    return SITE;
  }
  function initials(u) { return u.replace(/\(.*?\)/g, '').split(/\s+/).filter(function (w) { return /^[A-Z]/.test(w) && !/^(Of|And|The)$/.test(w); }).slice(0, 2).map(function (w) { return w[0]; }).join(''); }
  var NAAC_RANK = { 'A++': 6, 'A+': 5, 'A': 4, 'B++': 3, 'B+': 2, 'B': 1 };
  function showResults(scroll) {
    var list = data.filter(function (p) { return match(p); });
    list.sort(function (a, b) {
      if (sort === 'naac') return (NAAC_RANK[b.n] || 0) - (NAAC_RANK[a.n] || 0) || (a.f || 9e9) - (b.f || 9e9);
      if (sort === 'fee-desc') return (b.f || 0) - (a.f || 0);
      return (a.f || 9e9) - (b.f || 9e9);
    });
    var bits = [state.degree ? 'Online ' + DEG[state.degree][0] : 'Online degrees'];
    if (state.uni) bits.push(state.uni);
    if (state.spec) bits.push(state.spec);
    if (state.budget !== 'any') bits.push(budgetOf(state.budget).label);
    $('#sresTitle').textContent = list.length + ' programme' + (list.length === 1 ? '' : 's');
    $('#sresSub').textContent = bits.join(' · ');
    var g = $('#sresGrid'), html = '';
    list.slice(0, shown).forEach(function (p) {
      html += '<a class="rcard" href="' + p.url + '" target="_blank" rel="noopener">' +
        '<div class="rtop"><span class="rlogo" aria-hidden="true">' + esc(initials(p.u)) + '</span>' + (p.n ? '<span class="rnaac">NAAC ' + p.n + '</span>' : '') + '</div>' +
        '<span class="rdeg">Online ' + DEG[p.d][0] + '</span><h3>' + esc(p.s) + '</h3><p class="runi">' + esc(p.u) + '</p>' +
        '<p class="rmeta">' + (p.y ? esc(p.y) + ' · ' : '') + 'Online</p>' +
        '<div class="rfoot"><span class="rfee">' + (p.f ? lakh(p.f) + ' <small>total fee</small>' : '<small>Fee on request</small>') + '</span>' +
        '<span class="rgo">View <svg class="ico"><use href="#i-arrow"/></svg></span></div></a>';
    });
    g.innerHTML = html;
    $('#sresMore').hidden = list.length <= shown;
    $('#sresEmpty').hidden = list.length > 0;
    g.hidden = !list.length;
    $('#sresSort').closest('label').hidden = !list.length;
    res.hidden = false;
    if (scroll) res.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  $('#sresMore').addEventListener('click', function () { shown += 12; showResults(false); });
  $('#sresSort').addEventListener('change', function (e) { sort = e.target.value; shown = 12; showResults(false); });
  fBudget.innerHTML = BUDGETS.map(function (b) { return '<option value="' + b.id + '">' + b.label + '</option>'; }).join('');
  fBudget.addEventListener('change', function (e) { state.budget = e.target.value; shown = 12; showResults(false); });
  $('#sresClear').addEventListener('click', function () { state = { degree: null, uni: null, spec: null, budget: 'any' }; syncFields(); showResults(false); });
  $('#sresClose').addEventListener('click', function () { res.hidden = true; form.scrollIntoView({ block: 'center' }); });

  /* used by the degree cards: run a search for one degree */
  window.ydSearch = function (deg) {
    state = { degree: deg, uni: null, spec: null, budget: 'any' }; syncFields();
    load().then(function () { shown = 12; showResults(true); });
  };

  /* keep the pill glued to its segment while the bar re-lays out (button expanding, window resize) */
  var settle = null;
  function track() {
    if (!active || !glide) return;
    var el = form.querySelector('.seg[data-seg="' + active + '"]');
    glide.classList.add('jump');
    glide.style.width = el.offsetWidth + 'px'; glide.style.transform = 'translateX(' + el.offsetLeft + 'px)';
    clearTimeout(settle); settle = setTimeout(function () { glide.classList.remove('jump'); }, 120);
  }
  if (window.ResizeObserver) { var ro = new ResizeObserver(track); form.querySelectorAll('.seg').forEach(function (el) { ro.observe(el); }); }
  window.addEventListener('resize', track);
  syncFields();
  ['pointerenter', 'focusin'].forEach(function (ev) { form.addEventListener(ev, load, { once: true }); });
})();
