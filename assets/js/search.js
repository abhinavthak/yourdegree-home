/* YourDegree hero search: Airbnb-style segmented search over the online-programme catalogue */
(function () {
  var form = document.getElementById('ydSearch');
  if (!form) return;

  var DEG = {
    mba: ['MBA', 'Master of Business Administration', 'pg'], mca: ['MCA', 'Master of Computer Applications', 'pg'],
    ma: ['MA', 'Master of Arts', 'pg'], mcom: ['M.Com', 'Master of Commerce', 'pg'], msc: ['M.Sc', 'Master of Science', 'pg'],
    msw: ['MSW', 'Master of Social Work', 'pg'], mlis: ['MLIS', 'Master of Library & Information Science', 'pg'],
    pgdca: ['PGDCA', 'PG Diploma in Computer Applications', 'pg'],
    bba: ['BBA', 'Bachelor of Business Administration', 'ug'], bca: ['BCA', 'Bachelor of Computer Applications', 'ug'],
    bcom: ['B.Com', 'Bachelor of Commerce', 'ug'], ba: ['BA', 'Bachelor of Arts', 'ug'], bsc: ['B.Sc', 'Bachelor of Science', 'ug']
  };
  var BUDGETS = [
    { id: 'any', label: 'Any budget', min: 0, max: Infinity },
    { id: 'u1', label: 'Under ₹1 lakh', min: 0, max: 100000 },
    { id: '1-2', label: '₹1 – 2 lakh', min: 100000, max: 200000 },
    { id: '2-3', label: '₹2 – 3 lakh', min: 200000, max: 300000 },
    { id: '3p', label: 'Above ₹3 lakh', min: 300000, max: Infinity }
  ];
  var SITE = 'https://www.yourdegree.com/';

  var data = null, loading = null;
  var state = { degree: null, spec: null, budget: 'any' };
  var active = null, from = null, shown = 12, sort = 'fee';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var panel = $('#spanel'), qDeg = $('#qDeg'), qSpec = $('#qSpec'), bBudget = $('#bBudget');
  var res = $('#sres'), mq = window.matchMedia('(max-width:759px)');

  function load() {
    if (data) return Promise.resolve(data);
    if (!loading) loading = fetch('assets/data/programs.json?v=43c8bfc6').then(function (r) { return r.json(); }).then(function (j) {
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
    if (o.spec && p.s !== o.spec) return false;
    var b = budgetOf(o.budget);
    if (b.id !== 'any' && (p.f == null || p.f < b.min || p.f >= b.max)) return false;
    return true;
  }
  function count(o) { return data.filter(function (p) { return match(p, o); }).length; }

  /* ---------- segments ---------- */
  function setActive(seg) {
    active = seg;
    form.classList.toggle('on', !!seg);
    form.querySelectorAll('.seg').forEach(function (s) { s.classList.toggle('act', s.dataset.seg === seg); });
    [qDeg, qSpec].forEach(function (i) { i.setAttribute('aria-expanded', String(i.closest('.seg').dataset.seg === seg)); });
    bBudget.setAttribute('aria-expanded', String(seg === 'budget'));
    if (!seg) { panel.hidden = true; document.body.classList.remove('slock'); syncFields(); return; }
    load().then(function () { render(); panel.hidden = false; if (mq.matches) document.body.classList.add('slock'); });
  }
  function syncFields() {
    if (active !== 'degree') qDeg.value = state.degree ? DEG[state.degree][0] : '';
    if (active !== 'spec') qSpec.value = state.spec || '';
    bBudget.querySelector('.val').textContent = state.budget === 'any' ? 'Choose your budget' : budgetOf(state.budget).label;
    bBudget.classList.toggle('has', state.budget !== 'any');
    form.querySelectorAll('.segclr').forEach(function (c) {
      var k = c.dataset.clear, has = k === 'budget' ? state.budget !== 'any' : !!state[k];
      c.hidden = !has;
    });
  }
  function next(after) {
    active = null; syncFields();
    if (after === 'degree') { setActive('spec'); qSpec.focus(); }
    else if (after === 'spec') { setActive('budget'); bBudget.focus(); }
    else { setActive(null); form.querySelector('.sbtn').focus(); }
  }

  /* ---------- panels ---------- */
  function sheetHead(title) {
    return '<div class="sp-head"><b>' + title + '</b><button type="button" class="sp-x" data-close aria-label="Close">' +
      '<svg class="ico"><use href="#i-close"/></svg></button></div>';
  }
  function render() {
    panel.dataset.seg = active;
    if (active === 'degree') renderDegree();
    else if (active === 'spec') renderSpec();
    else renderBudget();
  }
  function renderDegree() {
    var q = norm(qDeg.value), html = sheetHead('Choose a degree');
    if (!q || (state.degree && qDeg.value === DEG[state.degree][0])) {
      ['pg', 'ug'].forEach(function (lvl) {
        html += '<p class="sp-k">' + (lvl === 'pg' ? 'Postgraduate' : 'Undergraduate') + '</p><div class="sp-tiles">';
        Object.keys(DEG).forEach(function (k) {
          if (DEG[k][2] !== lvl) return;
          var n = count({ degree: k, spec: null, budget: 'any' });
          if (!n) return;
          html += '<button type="button" class="sp-tile' + (state.degree === k ? ' sel' : '') + '" data-deg="' + k + '"><b>' + DEG[k][0] +
            '</b><span>' + DEG[k][1] + '</span><i>' + n + ' programmes</i></button>';
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
    data.forEach(function (p) { if ((!state.degree || p.d === state.degree)) counts[p.s] = (counts[p.s] || 0) + 1; });
    var names = Object.keys(counts).filter(function (s) { return !q || norm(s).indexOf(q) > -1; })
      .sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    var html = sheetHead('Choose a specialisation') + '<p class="sp-k">' + (state.degree ? 'Specialisations in ' + DEG[state.degree][0] : 'Popular specialisations') + '</p><ul class="sp-list sp-scroll" role="listbox">';
    if (!q) html += '<li><button type="button" role="option" data-spec=""' + (!state.spec ? ' class="sel"' : '') + '><span><b>Any specialisation</b><small>' +
      count({ degree: state.degree, spec: null, budget: 'any' }) + ' programmes</small></span></button></li>';
    names.slice(0, q ? 40 : 60).forEach(function (s) {
      html += '<li><button type="button" role="option" data-spec="' + esc(s) + '"' + (state.spec === s ? ' class="sel"' : '') + '><span><b>' + esc(s) +
        '</b><small>' + counts[s] + ' programme' + (counts[s] > 1 ? 's' : '') + '</small></span></button></li>';
    });
    if (!names.length) html += '<li class="sp-none">No specialisations match “' + esc(qSpec.value) + '”.</li>';
    panel.innerHTML = html + '</ul>';
  }
  function renderBudget() {
    var base = { degree: state.degree, spec: state.spec, budget: 'any' };
    var fees = data.filter(function (p) { return match(p, base) && p.f != null; }).map(function (p) { return p.f; });
    var top = Math.max(400000, Math.ceil((fees.length ? Math.max.apply(null, fees) : 0) / 100000) * 100000);
    top = Math.min(top, 600000);
    var bins = 24, w = top / bins, h = new Array(bins).fill(0);
    fees.forEach(function (f) { h[Math.min(bins - 1, Math.floor(f / w))]++; });
    var mx = Math.max.apply(null, h.concat(1)), b = budgetOf(state.budget);
    var html = sheetHead('Choose your budget') + '<p class="sp-k">Total programme fee' + (fees.length ? ' · ' + fees.length + ' programmes with fees listed' : '') + '</p>';
    html += '<div class="sp-hist" aria-hidden="true">';
    h.forEach(function (v, i) {
      var lo = i * w, inR = b.id === 'any' || (lo >= b.min && lo < b.max);
      html += '<i class="' + (inR ? 'in' : '') + '" style="height:' + (v ? Math.max(6, Math.round(v / mx * 100)) : 2) + '%"></i>';
    });
    html += '</div><div class="sp-axis"><span>₹0</span><span>' + lakh(top / 2) + '</span><span>' + lakh(top) + '+</span></div><div class="sp-chips">';
    BUDGETS.forEach(function (o) {
      var n = count({ degree: state.degree, spec: state.spec, budget: o.id });
      html += '<button type="button" data-budget="' + o.id + '"' + (state.budget === o.id ? ' class="sel"' : '') + (n || o.id === 'any' ? '' : ' disabled') + '>' +
        o.label + '<small>' + n + '</small></button>';
    });
    panel.innerHTML = html + '</div>';
  }

  panel.addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
  panel.addEventListener('click', function (e) {
    var btn = e.target.closest('button'); if (!btn) return;
    if (btn.hasAttribute('data-close')) { setActive(null); return; }
    if (btn.dataset.deg !== undefined) {
      var changed = state.degree !== btn.dataset.deg;
      state.degree = btn.dataset.deg;
      if (btn.dataset.spec !== undefined) { state.spec = btn.dataset.spec; next('spec'); return; }
      if (changed) state.spec = null;
      qDeg.blur(); next('degree'); return;
    }
    if (btn.dataset.spec !== undefined) { state.spec = btn.dataset.spec || null; qSpec.blur(); next('spec'); return; }
    if (btn.dataset.budget) { state.budget = btn.dataset.budget; render(); syncFields(); setTimeout(function () { next('budget'); }, 180); }
  });

  [qDeg, qSpec].forEach(function (inp) {
    var seg = inp.closest('.seg').dataset.seg;
    inp.addEventListener('focus', function () { if (active !== seg) { from = inp; setActive(seg); } inp.select(); });
    inp.addEventListener('input', function () { if (data) render(); });
    inp.addEventListener('keydown', function (e) {
      var opts = [].slice.call(panel.querySelectorAll('[data-deg],[data-spec]'));
      if (e.key === 'ArrowDown' && opts.length) { e.preventDefault(); opts[0].focus(); }
      if (e.key === 'Enter') { e.preventDefault(); if (opts.length && inp.value.trim()) opts[0].click(); else next(seg); }
    });
  });
  bBudget.addEventListener('click', function () { setActive(active === 'budget' ? null : 'budget'); });
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
      if (k === 'budget') state.budget = 'any'; else state[k] = null;
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
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && active) { var a = active; setActive(null); (a === 'budget' ? bBudget : a === 'spec' ? qSpec : qDeg).focus(); } });

  /* ---------- results ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var tyDeg = norm(qDeg.value);
    if (!state.degree && tyDeg) Object.keys(DEG).forEach(function (k) { if (norm(DEG[k][0]) === tyDeg || k === tyDeg) state.degree = k; });
    setActive(null); qDeg.blur(); qSpec.blur();
    load().then(function () { shown = 12; showResults(true); });
  });
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
  $('#sresClear').addEventListener('click', function () { state = { degree: null, spec: null, budget: 'any' }; syncFields(); showResults(false); });
  $('#sresClose').addEventListener('click', function () { res.hidden = true; form.scrollIntoView({ block: 'center' }); });

  syncFields();
  ['pointerenter', 'focusin'].forEach(function (ev) { form.addEventListener(ev, load, { once: true }); });
})();
