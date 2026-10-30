(function () {
  'use strict';

  var CFG = window.TRIP_CONFIG || {};
  var form = document.getElementById('intake');
  var doneBox = document.getElementById('done');
  var exploringBox = document.getElementById('exploring');
  var toInput = document.getElementById('to');
  var submitBtn = document.getElementById('submit');
  var startedAt = null;
  var lastPayload = null;

  /* ---------- option lists (value, label) ---------- */
  var OPTS = {
    when: ['radio', [['weekend', 'Coming weekend'], ['dates', 'Specific dates'], ['month', 'Tentative month']]],
    who: ['radio', [['solo', 'Solo'], ['couple', 'Couple'], ['friends', 'Friends'], ['family', 'Family']]],
    constraints: ['checkbox', [['under10', 'Someone under 10'], ['over60', 'Someone over 60'], ['mobility', 'Mobility limits']]],
    feel: ['checkbox', [['mountains', 'Mountains'], ['beaches', 'Beaches'], ['experiences', 'Experiences'], ['culture', 'Culture and heritage'], ['wildlife', 'Wildlife'], ['city-food', 'City and food']]],
    effort: ['radio', [['road-4h', 'Up to 4 hours by road'], ['road-8h', 'Up to 8 hours by road'], ['flight', 'Flight is fine']]],
    weather: ['radio', [['cool', 'Cool'], ['warm', 'Warm'], ['any', 'Do not mind']]],
    budget: ['radio', [['lean', 'Lean'], ['mid', 'Mid'], ['comfortable', 'Comfortable'], ['splurge', 'Splurge']]],
    lovedTags: ['checkbox', [['beaches', 'Beaches'], ['mountains', 'Mountains'], ['food', 'Food'], ['history', 'History'], ['photography', 'Photography'], ['road-trips', 'Road trips'], ['wildlife', 'Wildlife'], ['cafes', 'Cafes']]],
    pace: ['radio', [['slow', 'Slow: two plans a day'], ['balanced', 'Balanced: three, one light'], ['packed', 'Packed: three plans a day']]],
    vibes: ['checkbox', [['beaches-chill', 'Beaches and chill'], ['water-adventure', 'Water adventure'], ['history-culture', 'History and culture'], ['nature-trails', 'Nature and trails'], ['offbeat', 'Offbeat'], ['food-cafes', 'Food and cafes']]],
    water: ['radio', [['non-swimmer', 'Not a swimmer'], ['shallow-ok', 'Okay in shallow water'], ['confident', 'Confident swimmer']]],
    why: ['radio', [['relax', 'Relax'], ['thrill', 'Thrill'], ['romance', 'Romance'], ['photography', 'Photography'], ['reset', 'A reset']]],
    avoid: ['checkbox', [['early-starts', 'Early starts'], ['long-travel', 'Long travel days'], ['crowds', 'Crowds'], ['motion-sickness', 'Motion sickness'], ['spicy-food', 'Spicy food']]],
    base: ['radio', [['hop', 'Hop between places'], ['settle', 'Settle in one base']]],
    planSources: ['checkbox', [['youtube', 'YouTube'], ['instagram', 'Instagram'], ['friends-family', 'Friends and family'], ['travel-sites', 'Travel sites'], ['other', 'Other']]]
  };

  function buildOptions() {
    Object.keys(OPTS).forEach(function (name) {
      var box = form.querySelector('[data-opts="' + name + '"]');
      if (!box) return;
      var type = OPTS[name][0];
      OPTS[name][1].forEach(function (pair) {
        var label = document.createElement('label');
        label.className = 'opt';
        var input = document.createElement('input');
        input.type = type;
        input.name = name;
        input.value = pair[0];
        var span = document.createElement('span');
        span.textContent = pair[1];
        label.appendChild(input);
        label.appendChild(span);
        box.appendChild(label);
      });
    });

    var days = document.getElementById('days');
    for (var d = 2; d <= 10; d++) addOption(days, String(d), d + ' days');
    addOption(days, '11+', '11 days or more');

    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var monthSel = document.getElementById('month');
    months.forEach(function (m) { addOption(monthSel, m, m); });

    var times = [['', 'Not booked yet'], ['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']];
    ['arrive', 'depart'].forEach(function (id) {
      var sel = document.getElementById(id);
      times.forEach(function (t) { addOption(sel, t[0], t[1]); });
    });
  }
  function addOption(sel, value, label) {
    var o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    sel.appendChild(o);
  }

  /* ---------- show and hide sections ---------- */
  function checkedValue(name) {
    var c = form.querySelector('input[name="' + name + '"]:checked');
    return c ? c.value : '';
  }
  function refresh() {
    var s = { when: checkedValue('when'), who: checkedValue('who'), explore: exploringBox.checked ? '1' : '0' };
    form.querySelectorAll('[data-if]').forEach(function (el) {
      var ok = el.getAttribute('data-if').split(';').every(function (rule) {
        var p = rule.split('=');
        return p[1].split(',').indexOf(s[p[0]]) > -1;
      });
      el.hidden = !ok;
    });
    toInput.disabled = exploringBox.checked;
    if (exploringBox.checked) toInput.value = '';
  }

  /* ---------- errors ---------- */
  function showErr(name, msg) {
    var el = document.getElementById('err-' + name);
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
  }
  function clearErrs() {
    form.querySelectorAll('.err').forEach(function (e) { e.hidden = true; e.textContent = ''; });
  }

  /* ---------- collect ---------- */
  var SINGLE = { exploring: 1, consent: 1 };
  function collect() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled || el.closest('[hidden]')) return;
      if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; return; }
      if (el.type === 'checkbox') {
        if (!el.checked) return;
        if (SINGLE[el.name]) { data[el.name] = true; return; }
        (data[el.name] = data[el.name] || []).push(el.value);
        return;
      }
      var v = el.value.trim();
      if (v !== '') data[el.name] = v;
    });
    return data;
  }

  /* ---------- validate ---------- */
  function validate(d) {
    var errs = [];
    function need(name, msg) { errs.push({ name: name, msg: msg }); }
    if (!d.when) need('when', 'Choose when you can go.');
    if (d.when === 'dates') {
      if (!d.tripStart || !d.tripEnd) need('when', 'Add both a start and an end date.');
      else if (d.tripEnd < d.tripStart) need('when', 'The end date is before the start date.');
    }
    if (d.when === 'month' && !d.month) need('when', 'Choose a month.');
    if (!d.days) need('days', 'Choose the number of days.');
    if (!d.who) need('who', 'Choose who is travelling.');
    if (d.who === 'friends') {
      var n = Number(d.groupSize);
      if (!n || n < 2) need('who', 'Enter how many people are going, at least 2.');
    }
    if (!d.from) need('from', 'Enter the city you start from.');
    if (!d.exploring && !d.to) need('to', 'Enter where you want to go, or tick "I am exploring".');
    if (d.exploring) {
      if (!d.feel || !d.feel.length) need('feel', 'Pick at least one feel.');
      if (!d.effort) need('effort', 'Choose how far you will travel.');
      if (!d.weather) need('weather', 'Choose the weather you want.');
      if (!d.budget) need('budget', 'Choose a budget band.');
    }
    if (!d.pace) need('pace', 'Choose a pace.');
    if (!d.vibes || !d.vibes.length) need('vibes', 'Pick at least one vibe.');
    if (!d.water) need('water', 'Choose your comfort in water.');
    if (!d.why) need('why', 'Choose what the trip is for.');
    if (!d.contact) need('contact', 'Tell us how to reach you.');
    else if (!/^[+\d][\d\s\-()]{7,}$/.test(d.contact) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact)) need('contact', 'Enter a phone number or an email address.');
    if (!d.consent) need('consent', 'Please agree to continue.');
    return errs;
  }

  /* ---------- send ---------- */
  function send(payload) {
    var url = CFG.endpoint;
    if (!url) return Promise.resolve({ demo: true });
    var gas = /script\.google\.com/.test(url);
    var opts = gas
      ? { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }
      : { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) };
    return fetch(url, opts).then(function (r) {
      if (!gas && !r.ok) throw new Error('Bad status ' + r.status);
      return { ok: true };
    });
  }

  function copyText(text, btn) {
    var done = function () { if (btn) { var old = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = old; }, 1500); } };
    function fallback() {
      var ta = document.getElementById('demoOut');
      document.getElementById('demoBox').hidden = false;
      ta.value = text;
      ta.focus();
      ta.select();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  /* ---------- events ---------- */
  form.addEventListener('focusin', function () { if (!startedAt) startedAt = Date.now(); });

  form.addEventListener('change', function (e) {
    var t = e.target;
    var box = t.closest && t.closest('[data-opts]');
    if (box && t.type === 'checkbox') {
      var max = Number(box.getAttribute('data-max'));
      if (max && box.querySelectorAll('input:checked').length > max) {
        t.checked = false;
        showErr(t.name, 'You can pick up to ' + max + '.');
        return;
      }
      showErr(t.name, '');
    }
    if (t.name) showErr(t.name, '');
    refresh();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrs();
    var data = collect();
    if (data.website) return; // honeypot
    var errs = validate(data);
    if (errs.length) {
      errs.forEach(function (x) { showErr(x.name, x.msg); });
      var first = document.getElementById('err-' + errs[0].name);
      if (first && first.scrollIntoView) first.scrollIntoView({ block: 'center' });
      var focusTarget = form.querySelector('[name="' + errs[0].name + '"]');
      if (focusTarget && focusTarget.focus) focusTarget.focus({ preventScroll: true });
      return;
    }
    var now = Date.now();
    data.intakeSeconds = startedAt ? Math.round((now - startedAt) / 1000) : '';
    data.submittedAt = new Date(now).toISOString();
    lastPayload = data;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending';
    send(data).then(function (res) {
      form.hidden = true;
      doneBox.hidden = false;
      document.getElementById('doneText').textContent = res.demo ? 'Demo mode. Nothing was sent.' : (CFG.doneText || 'We will message you with your next step.');
      if (res.demo) {
        document.getElementById('demoBox').hidden = false;
        document.getElementById('demoOut').value = JSON.stringify(data, null, 2);
      }
      doneBox.focus();
      window.scrollTo(0, 0);
    }).catch(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send my answers';
      showErr('submit', 'We could not send your answers. Check your connection and try again. If it keeps failing, copy your answers from the next screen and send them to us directly.');
    });
  });

  document.getElementById('copyBtn').addEventListener('click', function () {
    if (lastPayload) copyText(JSON.stringify(lastPayload, null, 2), this);
  });
  document.getElementById('againBtn').addEventListener('click', function () {
    form.reset();
    refresh();
    startedAt = null;
    doneBox.hidden = true;
    form.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send my answers';
    window.scrollTo(0, 0);
  });

  /* ---------- start ---------- */
  if (CFG.siteName) {
    document.getElementById('siteName').textContent = CFG.siteName;
    document.title = CFG.siteName;
  }
  buildOptions();
  refresh();
})();
