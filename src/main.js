/* Paternoster — the machine.
   The site is a building with a paternoster in it: scrolling rides up through
   the floors, records travel in cabins, the bottom of the page goes over the top.
   Motion rule: only transforms and opacity animate. */
(function () {
  'use strict';

  const D = window.PATERNOSTER_DATA, Covers = window.PaternosterCovers, Sound = window.PaternosterSound;

  /* stand-in if the animation library fails to load: jump to end states */
  if (!window.gsap) {
    const apply = (t, v) => [].concat(typeof t === 'string' ? Array.from(document.querySelectorAll(t)) : t).forEach(el => { if (el && el.style) { if ('opacity' in v) el.style.opacity = v.opacity; } });
    const done = v => { v && v.onComplete && setTimeout(v.onComplete, 0); return { kill() {} }; };
    const tl = o => { const t = { to(a, v) { apply(a, v); return t; }, fromTo(a, x, v) { apply(a, v); return t; }, from() { return t; }, set(a, v) { apply(a, v); return t; }, add(f) { typeof f === 'function' && f(); return t; } }; o && o.onComplete && setTimeout(o.onComplete, 0); return t; };
    window.gsap = { to: (t, v) => { apply(t, v); return done(v); }, fromTo: (t, a, b) => { apply(t, b); return done(b); }, from: () => done(), set: apply, timeline: tl, killTweensOf() {}, delayedCall: (d, f) => setTimeout(f, d * 1000), registerPlugin() {}, ticker: { add(f) { let last = performance.now(); (function loop(n) { f(n / 1000, n - last); last = n; requestAnimationFrame(loop); })(last); }, lagSmoothing() {} } };
  }
  const gsap = window.gsap, ST = window.ScrollTrigger;
  if (ST) gsap.registerPlugin(ST);

  /* ---------- helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad2 = n => String(n).padStart(2, '0');
  const czk = n => n.toLocaleString('en-US') + ' CZK';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }
  };
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_L = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const shortDate = d => d.getDate() + ' ' + MON[d.getMonth()];
  const dayDate = d => DOW[d.getDay()] + ' ' + shortDate(d);

  /* ---------- catalogue ---------- */
  const NEW = D.NEW.map(r => Object.assign({ kind: 'new' }, r)).sort((a, b) => a.cabin - b.cabin);
  const BAZ = D.BAZAR.map(r => Object.assign({ kind: 'used' }, r));
  const BY_ID = new Map(NEW.concat(BAZ).map(r => [r.id, r]));
  const SEC = Object.fromEntries(D.BAZAR_SECTIONS.map(s => [s.key, s]));
  const cover = r => Covers.render(r, r.kind === 'used');
  const rpm = r => /7″|EP/.test(r.format) ? 45 : 33;
  const SESSIONS = D.upcomingSessions(new Date());

  /* ---------- the building ---------- */
  const FLOORS = ['P', '1', '2', '3', '4', '5'];
  const FLOOR_EL = { P: '#p', 1: '#f1', 2: '#f2', 3: '#f3', 4: '#f4', 5: '#f5' };
  const FLOOR_NAME = { P: 'Ground', 1: 'New in', 2: 'Second-hand', 3: 'The lap', 4: 'Cabin 7', 5: 'Visit' };
  const TONE = { blue: ['var(--blue)', 'var(--white)'], white: ['var(--white)', 'var(--ink)'], ink: ['var(--ink)', 'var(--white)'] };

  /* ---------- Prague time ---------- */
  function prague() {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const g = t => (p.find(x => x.type === t) || {}).value;
    return { dow: DOW.indexOf(g('weekday')), h: +g('hour'), m: +g('minute') };
  }
  const HOURS = [
    { d: 1, open: null }, { d: 2, open: [12, 20] }, { d: 3, open: [12, 20] }, { d: 4, open: [12, 21] },
    { d: 5, open: [12, 20] }, { d: 6, open: [11, 19] }, { d: 0, open: [13, 18] }
  ];
  function shopState() {
    const t = prague(), mins = t.h * 60 + t.m;
    if (t.dow === 2 && mins >= 540 && mins < 580) return { kind: 'service', text: 'Lift stopped for maintenance until 9:40' };
    const today = HOURS.find(h => h.d === t.dow);
    if (today.open && mins >= today.open[0] * 60 && mins < today.open[1] * 60) return { kind: 'open', text: 'Open until ' + today.open[1] + ':00' };
    for (let i = (today.open && mins < today.open[0] * 60) ? 0 : 1; i < 8; i++) {
      const h = HOURS.find(x => x.d === (t.dow + i) % 7);
      if (h.open) return { kind: 'closed', text: 'Closed · opens ' + (i === 0 ? 'today' : i === 1 ? 'tomorrow' : DOW_L[h.d]) + ' ' + h.open[0] + ':00' };
    }
    return { kind: 'closed', text: 'Closed' };
  }

  /* ---------- scroll engine ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    try {
      lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
      if (ST) { lenis.on('scroll', ST.update); ST.addEventListener('refresh', () => lenis && lenis.resize()); }
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } catch (e) { lenis = null; }
  }
  const scrollY = () => window.scrollY || document.documentElement.scrollTop;
  function jump(y) { if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); window.scrollTo(0, y); }
  let locks = 0;
  function lock(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    const l = locks > 0;
    document.body.classList.toggle('is-locked', l);
    if (lenis) l ? lenis.stop() : lenis.start();
  }

  const speed = { v: 0, boost: 0, y: scrollY(), sc: null };
  gsap.ticker.add((t, dtMs) => {
    const dt = Math.max(1, dtMs || 16) / 1000, y = scrollY();
    speed.v = lerp(speed.v, (y - speed.y) / dt, 1 - Math.exp(-dt * 10)); speed.y = y;
    speed.boost = lerp(speed.boost, Math.min(Math.abs(speed.v) / 260, 8), 1 - Math.exp(-dt * 5));
    Sound.humSpeed(Math.min(speed.boost / 8, 1));
    const sc = y > 8; if (sc !== speed.sc) { speed.sc = sc; $('#hud').classList.toggle('is-scrolled', sc); }
  });

  /* ---------- static grain ---------- */
  (function () {
    const c = document.createElement('canvas'); c.width = c.height = 160;
    const x = c.getContext('2d'), img = x.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    document.documentElement.style.setProperty('--grain-img', 'url(' + c.toDataURL() + ')');
  })();

  /* ---------- the loop mark: two cabins riding the logo ---------- */
  const LOOP_LEN = 32 + Math.PI * 22;
  function loopPoint(u) {
    let d = (((u % 1) + 1) % 1) * LOOP_LEN; const arc = Math.PI * 11;
    if (d < 16) return [3, 30 - d]; d -= 16;
    if (d < arc) { const a = d / 11; return [14 - 11 * Math.cos(a), 14 - 11 * Math.sin(a)]; } d -= arc;
    if (d < 16) return [25, 14 + d]; d -= 16;
    const b = d / 11; return [14 + 11 * Math.cos(b), 30 + 11 * Math.sin(b)];
  }
  const marks = $$('svg.mark').filter(m => m.querySelector('.cab-a')).map(m => ({ a: $('.cab-a', m), b: $('.cab-b', m), big: m.classList.contains('mark--big') }));
  let markU = 0;
  function placeMarks() {
    marks.forEach(m => {
      const p = loopPoint(markU), q = loopPoint(markU + .5);
      m.a.setAttribute('x', (p[0] - 4).toFixed(2)); m.a.setAttribute('y', (p[1] - 4.5).toFixed(2));
      m.b.setAttribute('x', (q[0] - 4).toFixed(2)); m.b.setAttribute('y', (q[1] - 4.5).toFixed(2));
    });
  }
  placeMarks();
  const lift = { stopped: false, service: false, booting: true };
  gsap.ticker.add((t, dtMs) => {
    if (reduce || (lift.stopped && !lift.booting)) return;
    markU += ((dtMs || 16) / 1000) * (lift.booting ? .55 : .05 * (1 + speed.boost));
    placeMarks();
  });

  /* ---------- toast & cursor chip ---------- */
  const toastEl = $('#toast'); let toastT = 0;
  function toast(msg, ms) { toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('is-on'), ms || 2600); }
  if (fine) {
    const chip = $('#chip'), lab = document.createElement('span'); chip.appendChild(lab);
    let cx = -100, cy = -100, tx = -100, ty = -100, label = '';
    window.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    document.addEventListener('pointerover', e => {
      const el = e.target.closest && e.target.closest('[data-chip]'); const l = el ? el.dataset.chip : '';
      if (l !== label) { label = l; if (l) lab.textContent = l; chip.classList.toggle('is-on', !!l); }
    });
    document.documentElement.addEventListener('mouseleave', () => { label = ''; chip.classList.remove('is-on'); });
    gsap.ticker.add(() => { cx = lerp(cx, tx, .25); cy = lerp(cy, ty, .25); chip.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)'; });
  }

  /* ---------- live status ---------- */
  function renderStatus() {
    const s = shopState(), el = $('#status');
    el.classList.toggle('is-closed', s.kind === 'closed');
    el.classList.toggle('is-service', s.kind === 'service');
    $('#statusText').textContent = s.text;
    lift.service = s.kind === 'service';
  }
  renderStatus(); setInterval(renderStatus, 30000);

  /* ==========================================================================
     HOLD — records kept at the till
     ========================================================================== */
  const holds = new Set((store.get('pt.hold', []) || []).filter(id => BY_ID.has(id)));
  function syncHolds() {
    store.set('pt.hold', Array.from(holds));
    const c = $('#holdCount'), n = String(holds.size);
    if (c.textContent !== n) { c.textContent = n; gsap.fromTo(c, { scale: 1.5 }, { scale: 1, duration: .5, ease: 'back.out(3)' }); }
    $$('[data-hold-id]').forEach(b => {
      const on = holds.has(b.dataset.holdId);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? 'Held ✓' : 'Hold';
    });
    if (cv.rec) { const on = holds.has(cv.rec.id); $('#cvHold').setAttribute('aria-pressed', on); $('#cvHoldTx').textContent = on ? 'Held ✓' : 'Hold'; }
  }
  function toggleHold(id) {
    const r = BY_ID.get(id); if (!r) return;
    if (holds.has(id)) { holds.delete(id); toast('Back on the shelf'); }
    else { holds.add(id); toast('Held for 48 hours: ' + r.title); Sound.sfx.press(); }
    syncHolds();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-hold-id]');
    if (b) { e.preventDefault(); e.stopPropagation(); toggleHold(b.dataset.holdId); }
  });

  const docket = $('#docket'); let dkReturn = null;
  function renderDocket() {
    const items = Array.from(holds).map(id => BY_ID.get(id));
    $('#dkList').innerHTML = items.map(r => '<li><img src="' + cover(r) + '" alt=""><span><b>' + esc(r.artist) + '</b><span class="t">' + esc(r.title) + '</span></span><span class="r">' + czk(r.price) + '<button type="button" data-unhold="' + r.id + '">Remove</button></span></li>').join('');
    $('#dkEmpty').hidden = items.length > 0;
    $('#dkForm').hidden = items.length === 0;
    $('#dkTotal').innerHTML = items.length ? '<span>' + items.length + (items.length === 1 ? ' record' : ' records') + '</span><span>' + czk(items.reduce((a, r) => a + r.price, 0)) + '</span>' : '';
    $('#dkMsg').textContent = ''; $('#dkMsg').classList.remove('err');
  }
  $('#dkList').addEventListener('click', e => { const b = e.target.closest('[data-unhold]'); if (b) { holds.delete(b.dataset.unhold); syncHolds(); renderDocket(); } });
  function openDocket() {
    renderDocket(); dkReturn = document.activeElement; docket.hidden = false; lock(true);
    gsap.fromTo('.dk-paper', { xPercent: 100 }, { xPercent: 0, duration: .55, ease: 'power3.out' });
    gsap.fromTo(docket, { opacity: 0 }, { opacity: 1, duration: .3 });
    gsap.set('#dkStamp', { opacity: 0 });
    $('#dkClose').focus({ preventScroll: true });
  }
  function closeDocket() {
    let shut = false;
    const fin = () => { if (shut) return; shut = true; docket.hidden = true; lock(false); dkReturn && dkReturn.focus && dkReturn.focus({ preventScroll: true }); };
    gsap.to('.dk-paper', { xPercent: 100, duration: .4, ease: 'power3.in', onComplete: fin });
    setTimeout(fin, 800);
  }
  $('#holdBtn').addEventListener('click', openDocket);
  $('#dkClose').addEventListener('click', closeDocket);
  docket.addEventListener('click', e => { if (e.target === docket) closeDocket(); });
  $('#dkForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#dkName').value.trim().replace(/\.+$/, ''), msg = $('#dkMsg');
    if (name.length < 2) { msg.textContent = 'Add a name so the till knows whose they are.'; msg.classList.add('err'); $('#dkName').focus(); return; }
    let h = 7; for (const c of name + holds.size + Date.now()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const no = String(1000 + h % 9000);
    $('#dkStampNo').textContent = 'No. ' + no;
    msg.classList.remove('err');
    msg.textContent = 'Done, ' + name + '. Give number ' + no + ' at the till within 48 hours.';
    Sound.sfx.stamp();
    gsap.fromTo('#dkStamp', { opacity: 0, scale: 2, rotation: -4 }, { opacity: .9, scale: 1, rotation: -14, duration: .3, ease: 'power4.in' });
  });

  /* ==========================================================================
     RECORD VIEW — stepping out of the cabin
     ========================================================================== */
  const cvEl = $('#cv');
  const cv = { rec: null, list: [], i: 0, open: false, playing: false, returnTo: null, discX: 0 };
  function labelInk(hex) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#1a1a18' : '#f2e6cf';
  }
  function fillCabin(r) {
    cv.rec = r;
    const used = r.kind === 'used';
    $('#cvCover').src = cover(r); $('#cvCover').alt = r.artist + ', ' + r.title;
    const st = $('#cvSticker'); st.hidden = !used; if (used) st.innerHTML = r.price.toLocaleString('en-US') + '<small>CZK</small>';
    $('#cvKicker').textContent = used ? 'Second-hand · ' + SEC[r.sec].cs : 'Cabin ' + pad2(r.cabin) + ' · ' + r.tag;
    $('#cvArtist').textContent = r.artist;
    $('#cvTitle').textContent = r.title;
    $('#cvPrice').textContent = czk(r.price);
    const rows = [['Label', r.label + ' ' + r.cat], ['Year', r.orig ? r.orig + ' (reissue ' + r.year + ')' : r.year], ['Format', r.format], ['Condition', used ? r.media + ' / ' + r.sleeve : 'New, sealed']];
    $('#cvMeta').innerHTML = rows.map(([k, v]) => '<dt>' + k + '</dt><dd>' + esc(v) + '</dd>').join('');
    $('#cvNote').textContent = r.note;
    $('#cvTracks').innerHTML = r.tracks.map(t => '<li><span>' + t[0] + '</span><span>' + esc(t[1]) + '</span><span>' + t[2] + '</span></li>').join('');
    const lab = $('#cvLabel'), ink = r.cover.ink[0];
    lab.style.background = ink; lab.style.color = labelInk(ink);
    $('#cvLabelTop').textContent = r.label;
    $('#cvLabelBot').textContent = r.cat;
    const fast = rpm(r) === 45;
    $('.cv-rpm').textContent = fast ? '45' : '33⅓';
    lab.style.setProperty('--rev', fast ? '1.333s' : '1.8s');
    stopPlay(true); setDisc(0, false); syncHolds();
  }
  function setDisc(x, animate) { cv.discX = x; if (animate) gsap.to('#cvDisc', { x, duration: .7, ease: 'power3.out' }); else gsap.set('#cvDisc', { x }); }
  const discMax = () => $('#cvSleeve').offsetWidth * .42;
  function stopPlay(silent) {
    if (cv.playing) Sound.stopPreview();
    cv.playing = false;
    $('#cvPlay').setAttribute('aria-pressed', 'false'); $('#cvPlayTx').textContent = 'Listen';
    $('#cvLabel').classList.remove('is-spinning');
    gsap.to('#cvRing', { strokeDashoffset: 295.3, duration: silent ? 0 : .4 });
  }
  function startPlay() {
    const r = cv.rec; if (!r) return;
    const h = Sound.play(r, r.kind === 'used', p => { $('#cvRing').style.strokeDashoffset = (295.3 * (1 - p)).toFixed(1); }, () => {
      if (cv.rec === r) { cv.playing = false; $('#cvPlay').setAttribute('aria-pressed', 'false'); $('#cvPlayTx').textContent = 'Again'; $('#cvLabel').classList.remove('is-spinning'); }
    });
    if (!h) { toast('This browser cannot play audio'); return; }
    cv.playing = true;
    $('#cvPlay').setAttribute('aria-pressed', 'true'); $('#cvPlayTx').textContent = 'Stop';
    $('#cvLabel').classList.add('is-spinning');
    if (cv.discX < discMax() * .5) setDisc(discMax(), true);
  }
  $('#cvPlay').addEventListener('click', () => { cv.playing ? stopPlay() : startPlay(); });
  $('#cvHold').addEventListener('click', () => cv.rec && toggleHold(cv.rec.id));
  (function discDrag() {
    const d = $('#cvDisc'); let sx = 0, x0 = 0, drag = false, moved = false;
    d.addEventListener('pointerdown', e => { drag = true; moved = false; sx = e.clientX; x0 = cv.discX; d.setPointerCapture(e.pointerId); gsap.killTweensOf(d); });
    d.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - sx; if (Math.abs(dx) > 3) moved = true; cv.discX = clamp(x0 + dx, 0, discMax() * 1.05); gsap.set(d, { x: cv.discX }); });
    const up = () => { if (!drag) return; drag = false; const m = discMax(); setDisc(moved ? (cv.discX > m * .4 ? m : 0) : (cv.discX > m * .5 ? 0 : m), true); Sound.sfx.swish(); };
    d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
  })();
  if (fine) {
    const m = $('.cv-media'), s = $('#cvSleeve');
    m.addEventListener('pointermove', e => {
      const b = s.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      gsap.to(s, { rotateY: clamp((x - .5) * 14, -9, 9), rotateX: clamp((.5 - y) * 12, -8, 8), transformPerspective: 900, duration: .6, ease: 'power2.out' });
      s.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); s.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    m.addEventListener('pointerleave', () => gsap.to(s, { rotateY: 0, rotateX: 0, duration: .8, ease: 'power3.out' }));
  }

  function openCabin(r, list, fromImg) {
    if (cv.open) return;
    cv.list = list && list.length ? list : [r]; cv.i = Math.max(0, cv.list.indexOf(r));
    cv.returnTo = document.activeElement; cv.open = true;
    fillCabin(r);
    cvEl.hidden = false; lock(true);
    Sound.sfx.clunk();
    const sleeve = $('#cvSleeve');
    gsap.fromTo('.cv-bg', { yPercent: 100 }, { yPercent: 0, duration: reduce ? 0 : .65, ease: 'power3.inOut' });
    gsap.fromTo(['.cv-info > *', '.cv-nav'], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .55, stagger: .04, ease: 'power3.out', delay: reduce ? 0 : .4 });
    gsap.fromTo('#cvDisc', { opacity: 0 }, { opacity: 1, duration: .3, delay: reduce ? 0 : .7 });
    const from = fromImg && fromImg.getBoundingClientRect();
    if (from && from.width > 10 && !reduce) {
      gsap.set(sleeve, { opacity: 0 });
      requestAnimationFrame(() => {
        const to = sleeve.getBoundingClientRect();
        const fly = document.createElement('img'); fly.className = 'cv-fly'; fly.src = $('#cvCover').src;
        Object.assign(fly.style, { left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px' });
        document.body.appendChild(fly);
        let landed = false;
        const land = () => { if (landed) return; landed = true; gsap.set(sleeve, { opacity: 1 }); fly.remove(); };
        gsap.fromTo(fly, { x: from.left - to.left, y: from.top - to.top, scale: from.width / to.width }, { x: 0, y: 0, scale: 1, duration: .8, ease: 'power3.inOut', delay: .05, onComplete: land });
        setTimeout(land, 1300);
      });
    } else gsap.fromTo(sleeve, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'power3.out', delay: reduce ? 0 : .35 });
    $('#cvClose').focus({ preventScroll: true });
  }
  function closeCabin() {
    if (!cv.open) return;
    stopPlay(true);
    let shut = false;
    const fin = () => {
      if (shut) return; shut = true;
      cvEl.hidden = true; cv.open = false; lock(false);
      gsap.set(['.cv-scroll', '.cv-nav'], { opacity: 1 });
      cv.returnTo && cv.returnTo.focus && cv.returnTo.focus({ preventScroll: true });
    };
    gsap.to(['.cv-scroll', '.cv-nav'], { opacity: 0, duration: .2 });
    gsap.to('.cv-bg', { yPercent: -100, duration: reduce ? 0 : .55, ease: 'power3.inOut', delay: .08, onComplete: fin });
    setTimeout(fin, 1000);
  }
  function swapCabin(step) {
    const n = cv.list.length; if (n < 2) return;
    const ni = ((cv.i + step) % n + n) % n, dir = step > 0 ? 1 : -1; cv.i = ni;
    stopPlay(true);
    gsap.to(['.cv-media', '.cv-info'], { y: -50 * dir, opacity: 0, duration: .25, ease: 'power2.in', overwrite: true });
    setTimeout(() => {
      fillCabin(cv.list[ni]); Sound.sfx.clunk();
      gsap.fromTo(['.cv-media', '.cv-info'], { y: 50 * dir, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'power3.out', stagger: .04, overwrite: true });
    }, 260);
  }
  $('#cvClose').addEventListener('click', closeCabin);
  $('#cvPrev').addEventListener('click', () => swapCabin(-1));
  $('#cvNext').addEventListener('click', () => swapCabin(1));

  /* ==========================================================================
     HUD, travel, directory
     ========================================================================== */
  const hud = $('#hud'); let floorNow = 'P', traveling = false;
  function setTone(tone) { const t = TONE[tone] || TONE.blue; hud.style.setProperty('--hud-bg', t[0]); hud.style.setProperty('--hud-fg', t[1]); }
  function setFloor(f, tone) {
    if (tone) setTone(tone);
    if (f === floorNow) return;
    const up = FLOORS.indexOf(f) > FLOORS.indexOf(floorNow); floorNow = f;
    const num = $('#hudNum');
    gsap.timeline().to(num, { yPercent: up ? 70 : -70, opacity: 0, duration: .14, ease: 'power2.in' })
      .add(() => { num.textContent = f; $('#hudName').textContent = FLOOR_NAME[f]; })
      .fromTo(num, { yPercent: up ? -70 : 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .3, ease: 'power3.out' });
    $$('#dirList a').forEach(a => a.classList.toggle('is-current', a.dataset.floorLink === f));
    if (!traveling) Sound.sfx.clunk();
  }
  setTone('blue');

  function travelTo(f) {
    const target = $(FLOOR_EL[f]); if (!target) return;
    const y = target.getBoundingClientRect().top + scrollY();
    try { history.replaceState(null, '', f === 'P' ? location.pathname + location.search : '#' + target.id); } catch (e) { /* sandboxed */ }
    if (reduce || traveling) { jump(y); setFloor(f, target.dataset.tone); return; }
    const a = FLOORS.indexOf(floorNow), b = FLOORS.indexOf(f);
    if (a === b && Math.abs(scrollY() - y) < 4) return;
    traveling = true; lock(true);
    const goingUp = b >= a, travel = $('#travel'), slab = $('.travel-slab'), num = $('#travelNum');
    num.textContent = floorNow; travel.style.visibility = 'visible';
    const steps = []; for (let i = a; goingUp ? i <= b : i >= b; i += goingUp ? 1 : -1) steps.push(FLOORS[i]);
    const enter = goingUp ? -110 : 110, hold = Math.max(200, (steps.length - 1) * 120);
    let finished = false, jumped = false;
    const doJump = () => { if (jumped) return; jumped = true; jump(y); steps.slice(1).forEach((s, i) => setTimeout(() => { num.textContent = s; Sound.sfx.tick(); }, i * 120)); };
    const fin = () => { if (finished) return; finished = true; doJump(); setFloor(f, target.dataset.tone); travel.style.visibility = 'hidden'; traveling = false; lock(false); };
    gsap.fromTo(slab, { yPercent: enter }, { yPercent: 0, duration: .45, ease: 'power2.in' });
    setTimeout(doJump, 460);
    setTimeout(() => { setFloor(f, target.dataset.tone); gsap.to(slab, { yPercent: -enter, duration: .55, ease: 'power2.out', onComplete: fin }); }, 460 + hold);
    setTimeout(fin, 460 + hold + 900);
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-floor-link]'); if (!a) return;
    e.preventDefault(); Sound.sfx.press();
    const f = a.dataset.floorLink;
    if (!directory.hidden) closeDirectory(() => travelTo(f)); else travelTo(f);
  });

  const directory = $('#directory'); let dirReturn = null;
  function openDirectory() {
    dirReturn = document.activeElement; directory.hidden = false; lock(true);
    $$('#dirList a').forEach(a => a.classList.toggle('is-current', a.dataset.floorLink === floorNow));
    gsap.fromTo(directory, { opacity: 0 }, { opacity: 1, duration: .25 });
    gsap.fromTo('.dir-board', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: reduce ? 0 : .5, ease: 'power3.out' });
    if (!reduce) gsap.fromTo('#dirList li', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .04, delay: .1, ease: 'power3.out' });
    Sound.sfx.press();
    $('#dirClose').focus({ preventScroll: true });
  }
  function closeDirectory(after) {
    let shut = false;
    const fin = () => { if (shut) return; shut = true; directory.hidden = true; lock(false); if (typeof after === 'function') after(); else dirReturn && dirReturn.focus && dirReturn.focus({ preventScroll: true }); };
    gsap.to('.dir-board', { y: -20, opacity: 0, duration: reduce ? 0 : .25, ease: 'power2.in' });
    gsap.to(directory, { opacity: 0, duration: .25, onComplete: fin });
    setTimeout(fin, 600);
  }
  $('#hudFloor').addEventListener('click', openDirectory);
  $('#floorsBtn').addEventListener('click', openDirectory);
  $('#dirClose').addEventListener('click', () => closeDirectory());
  directory.addEventListener('click', e => { if (e.target === directory) closeDirectory(); });

  const soundBtn = $('#soundBtn');
  soundBtn.addEventListener('click', () => {
    const on = !Sound.on; Sound.setOn(on);
    soundBtn.setAttribute('aria-pressed', on);
    soundBtn.setAttribute('aria-label', on ? 'Turn sound off' : 'Turn sound on');
    if (on) { Sound.sfx.press(); toast('Sound on. You can hear the lift.'); }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (cv.open) closeCabin(); else if (!docket.hidden) closeDocket(); else if (!directory.hidden) closeDirectory(); return; }
    if (cv.open) { if (e.key === 'ArrowRight') swapCabin(1); if (e.key === 'ArrowLeft') swapCabin(-1); if (e.key === 'Tab') trap(e, cvEl); return; }
    if (!docket.hidden) { if (e.key === 'Tab') trap(e, docket); return; }
    if (!directory.hidden && e.key === 'Tab') trap(e, directory);
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target; if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable)) return;
    const k = e.key.toUpperCase(), f = k === '0' ? 'P' : k;
    if (FLOORS.includes(f)) { e.preventDefault(); Sound.sfx.press(); if (!directory.hidden) closeDirectory(() => travelTo(f)); else travelTo(f); }
  });
  function trap(e, root) {
    const f = $$('button:not([disabled]), a[href], input, select, [tabindex="0"]', root).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  ['.cv-scroll', '.dk-paper', '#directory'].forEach(s => $(s).setAttribute('data-lenis-prevent', ''));

  /* ==========================================================================
     P — the paternoster
     ========================================================================== */
  function cabInner(slot) {
    if (slot.type === 'rec') {
      const r = slot.rec, lean = ((r.cabin * 37) % 7 - 3) * .6;
      return '<div class="cab-box"><span class="cab-lamp"></span><div class="cab-rec" style="--lean:' + lean.toFixed(1) + 'deg"><img src="' + cover(r) + '" alt="" draggable="false"><span class="cab-tag">' + czk(r.price) + '</span></div><span class="cab-no">' + pad2(r.cabin) + '</span></div>';
    }
    if (slot.type === 'seven') {
      const s = SESSIONS[0];
      return '<div class="cab-box"><span class="cab-lamp"></span><div class="cab-seven"><span class="plate plate--red" style="--pw:64px"><b>7</b></span><p>Concerts</p><p>' + (s ? dayDate(s.date) : '') + '</p></div><span class="cab-no">07</span></div>';
    }
    return '<div class="cab-box"><span class="cab-lamp"></span><div class="cab-empty"><p>Empty</p><p>Just sold</p></div><span class="cab-no">14</span></div>';
  }
  function slotText(slot, dir) {
    const arrow = dir === 'up' ? '▲ ' : '▼ ';
    if (slot.type === 'rec') { const r = slot.rec; return '<b>' + arrow + 'Cabin ' + pad2(r.cabin) + ' · ' + czk(r.price) + '</b><span>' + esc(r.artist) + ' — ' + esc(r.title) + '</span>'; }
    if (slot.type === 'seven') { const s = SESSIONS[0]; return '<b>' + arrow + 'Cabin 07 · Concerts</b><span>' + (s ? 'Next: ' + esc(s.artist) + ', ' + dayDate(s.date) : '') + '</span>'; }
    return '<b>' + arrow + 'Cabin 14</b><span>Empty. Just sold.</span>';
  }
  function slotAct(slot, img) {
    if (slot.type === 'rec') openCabin(slot.rec, NEW, img);
    else if (slot.type === 'seven') travelTo('4');
    else toast('Empty cabin. Try the next one.');
  }

  function buildLift() {
    const shafts = { up: $('#shaftUp'), down: $('#shaftDown') };
    const slots = [];
    for (let c = 1; c <= 14; c++) { const r = NEW.find(x => x.cabin === c); slots.push(r ? { type: 'rec', rec: r } : { type: c === 7 ? 'seven' : 'empty' }); }
    const ins = {};
    ['up', 'down'].forEach(k => { const d = document.createElement('div'); d.className = 'shaft-in'; shafts[k].appendChild(d); ins[k] = d; });
    const els = slots.map((s, i) => {
      const mk = () => { const d = document.createElement('div'); d.className = 'cab'; d.dataset.slot = i; d.innerHTML = cabInner(s); return d; };
      const e = { up: mk(), down: mk(), vis: { up: null, down: null } };
      ins.up.appendChild(e.up); ins.down.appendChild(e.down); return e;
    });
    const st = { s: 0, mult: 1, inertia: 0, hover: false, drag: false, active: true, H: 0, pitch: 0, cab: 0, Hs: 0, L: 0, w0: 0, base: 0, near: { up: -1, down: -1 }, last: null };
    function measure() {
      st.H = shafts.up.clientHeight; if (!st.H) return;
      st.pitch = Math.round(st.H * .8); st.cab = Math.round(st.pitch * .87);
      st.Hs = 7 * st.pitch; st.L = 14 * st.pitch; st.w0 = (st.Hs - st.H) / 2; st.base = st.pitch / 9;
      els.forEach(e => { e.up.style.height = e.down.style.height = st.cab + 'px'; });
    }
    measure(); st.s = st.pitch * 6.6;
    window.addEventListener('resize', () => { const p = st.s / (st.L || 1); measure(); st.s = p * st.L; });
    const ro = $$('#readout .ro');
    function readout(k, i) {
      const btn = ro[k === 'up' ? 0 : 1], t = $('.ro-text', btn);
      btn.dataset.slot = i; t.innerHTML = slotText(slots[i], k);
      btn.setAttribute('aria-label', t.textContent);
      if (!reduce) gsap.fromTo(t, { yPercent: k === 'up' ? 100 : -100 }, { yPercent: 0, duration: .5, ease: 'power3.out' });
    }
    ro.forEach(b => b.addEventListener('click', () => { const i = +b.dataset.slot; if (!isNaN(i)) slotAct(slots[i], null); }));

    gsap.ticker.add((t, dtMs) => {
      if (!st.active || !st.H) return;
      const dt = Math.min(.05, (dtMs || 16) / 1000);
      if (!st.drag) {
        const halt = lift.stopped || lift.service;
        st.mult = lerp(st.mult, halt ? 0 : (st.hover ? .2 : 1) + speed.boost, 1 - Math.exp(-dt * (halt ? 7 : 2.5)));
        st.s += st.base * st.mult * dt + st.inertia;
        st.inertia *= Math.exp(-dt * 3.5); if (Math.abs(st.inertia) < .01) st.inertia = 0;
      }
      const H = st.H, best = { up: [-1, 1e9], down: [-1, 1e9] };
      for (let i = 0; i < els.length; i++) {
        const p = ((st.s + i * st.pitch) % st.L + st.L) % st.L, e = els[i];
        const k = p < st.Hs ? 'up' : 'down', other = k === 'up' ? 'down' : 'up';
        const top = (k === 'up' ? st.Hs - p : p - st.Hs) - st.cab - st.w0;
        if (top < H && top + st.cab > 0) {
          e[k].style.transform = 'translate3d(0,' + top.toFixed(1) + 'px,0)';
          if (e.vis[k] !== true) { e[k].style.visibility = 'visible'; e.vis[k] = true; }
          const dc = Math.abs(top + st.cab / 2 - H / 2); if (dc < best[k][1]) best[k] = [i, dc];
        } else if (e.vis[k] !== false) { e[k].style.visibility = 'hidden'; e.vis[k] = false; }
        if (e.vis[other] !== false) { e[other].style.visibility = 'hidden'; e.vis[other] = false; }
      }
      ['up', 'down'].forEach(k => { if (best[k][0] !== -1 && best[k][0] !== st.near[k]) { st.near[k] = best[k][0]; readout(k, best[k][0]); } });
      const fl = Math.floor(st.s / st.pitch);
      if (st.last !== null && fl !== st.last && Sound.on) Sound.sfx.clunk();
      st.last = fl;
    });

    Object.keys(shafts).forEach(k => {
      const sh = shafts[k]; let sy = 0, s0 = 0, last = 0, lastT = 0, vel = 0, moved = false, pid = null;
      sh.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') st.hover = true; });
      sh.addEventListener('pointerleave', () => { st.hover = false; });
      sh.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        pid = e.pointerId; sy = last = e.clientY; s0 = st.s; lastT = performance.now(); vel = 0; moved = false;
        if (e.pointerType === 'mouse') { st.drag = true; st.inertia = 0; sh.setPointerCapture(pid); }
      });
      sh.addEventListener('pointermove', e => {
        if (pid !== e.pointerId) return;
        if (Math.abs(e.clientY - sy) > 5) moved = true;
        if (!st.drag) return;
        const sign = k === 'up' ? -1 : 1;
        st.s = s0 + sign * (e.clientY - sy);
        const now = performance.now(); vel = sign * (e.clientY - last) / Math.max(1, now - lastT) * 16; last = e.clientY; lastT = now;
      });
      const end = e => {
        if (pid !== e.pointerId) return; pid = null;
        if (st.drag) { st.drag = false; st.inertia = clamp(vel, -40, 40); }
        if (!moved && e.type === 'pointerup') {
          const hit = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.classList && el.classList.contains('cab') && sh.contains(el));
          if (hit) { Sound.sfx.press(); slotAct(slots[+hit.dataset.slot], $('img', hit)); }
        }
      };
      sh.addEventListener('pointerup', end); sh.addEventListener('pointercancel', end);
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { st.active = es[0].isIntersecting; }, { rootMargin: '100px' }).observe($('#landing'));
  }

  const stopBtn = $('#stopBtn');
  function setStopped(on, quiet) {
    lift.stopped = on;
    stopBtn.setAttribute('aria-pressed', on);
    stopBtn.setAttribute('aria-label', on ? 'Start the lift' : 'Stop the lift');
    $('#stopLabel').textContent = on ? 'Start' : 'Stop';
    if (quiet) return;
    if (on) { Sound.sfx.brake(); gsap.fromTo('.shaft-in', { y: 0 }, { keyframes: [{ y: 8, duration: .12, ease: 'power2.out' }, { y: -3, duration: .16 }, { y: 0, duration: .4, ease: 'power2.out' }], delay: .3 }); }
    else Sound.sfx.start();
  }
  stopBtn.addEventListener('click', () => setStopped(!lift.stopped));
  if (reduce) setStopped(true, true);

  /* wordmarks sized to the full width */
  const wm = $('.wm');
  wm.innerHTML = wm.textContent.split('').map(c => '<span class="ch">' + c + '</span>').join('');
  function fit(el, box) {
    const cs = getComputedStyle(box), avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    el.style.fontSize = '100px'; const prev = el.style.display; el.style.display = 'inline-block';
    const w = el.getBoundingClientRect().width; el.style.display = prev;
    if (w > 0 && avail > 0) el.style.fontSize = (100 * avail / w * .995).toFixed(2) + 'px';
  }
  function fitAll() {
    fit(wm, $('#wordmark'));
    const fm = $('.foot-mark span'); fit(fm, $('.foot-mark'));
    $('#wordmark').style.overflow = 'hidden';
    const land = $('#landing');
    const stacked = getComputedStyle($('.p-grid')).gridTemplateColumns.trim().split(/s+/).length === 1;
    if (!stacked) {
      const grid = $('.p-grid'), top = grid.getBoundingClientRect().top + scrollY();
      const fixed = $('.door-sign').offsetHeight + 8 + $('#readout').offsetHeight + 14 + parseFloat(getComputedStyle(grid).paddingTop) + parseFloat(getComputedStyle($('#p')).paddingBottom) + 8;
      const doorW = $('#shaftUp').clientWidth || 200;
      land.style.setProperty('--door-h', clamp(Math.min(window.innerHeight - top - fixed, doorW * 1.75), 260, 600) + 'px');
    } else land.style.removeProperty('--door-h');
  }
  function syncFloor() {
    let f = 'P'; FLOORS.forEach(x => { if ($(FLOOR_EL[x]).getBoundingClientRect().top <= window.innerHeight * .4) f = x; });
    const over = $('#over').getBoundingClientRect().top <= window.innerHeight * .4;
    setFloor(over ? '5' : f, over ? 'ink' : $(FLOOR_EL[f]).dataset.tone);
  }

  /* ==========================================================================
     1 — New in
     ========================================================================== */
  const inv = $('#inv');
  function buildInventory() {
    inv.innerHTML = NEW.map(r => '<li class="inv-row" data-id="' + r.id + '">' +
      '<button type="button" class="inv-btn" data-chip="Step in"><span class="inv-cab">' + pad2(r.cabin) + '</span><img class="inv-thumb" src="' + cover(r) + '" alt="">' +
      '<span class="inv-main"><span class="inv-artist">' + esc(r.artist) + '</span><span class="inv-title">' + esc(r.title) + '</span></span>' +
      '<span class="inv-tag">' + esc(r.tag) + '</span><span class="inv-price">' + czk(r.price) + '</span></button>' +
      '<button type="button" class="inv-hold" data-hold-id="' + r.id + '" aria-pressed="false">Hold</button></li>').join('');
  }
  const call = { order: NEW.slice(), idx: 0, pitch: 0, cab: 0, H: 0 };
  function buildCallStrip() {
    const sh = $('#callShaft'), H = sh.clientHeight; if (!H) return;
    call.H = H; call.pitch = Math.round(H * .92); call.cab = Math.round(call.pitch * .88);
    $('#callStrip').innerHTML = call.order.map((r, i) => '<div class="cab" style="height:' + call.cab + 'px;transform:translate3d(0,' + (i * call.pitch) + 'px,0)">' + cabInner({ type: 'rec', rec: r }) + '</div>').join('');
    callTo(call.idx, true);
  }
  function callTo(i, instant) {
    const prev = call.idx; call.idx = i;
    const y = -(i * call.pitch) + (call.H - call.cab) / 2;
    $('#callNo').textContent = pad2(call.order[i].cabin);
    const arrow = $('#callArrow');
    if (instant || reduce) { gsap.set('#callStrip', { y }); arrow.textContent = '■'; return; }
    arrow.textContent = i > prev ? '▲' : i < prev ? '▼' : '■';
    gsap.to('#callStrip', { y, duration: clamp(.45 + Math.abs(i - prev) * .15, .45, 1.5), ease: 'power2.inOut', overwrite: true, onComplete: () => { arrow.textContent = '■'; } });
  }
  let callT = 0;
  inv.addEventListener('pointerover', e => {
    const row = e.target.closest('.inv-row'); if (!row) return;
    clearTimeout(callT);
    callT = setTimeout(() => { const i = call.order.findIndex(r => r.id === row.dataset.id); if (i >= 0 && i !== call.idx) callTo(i); }, 60);
  });
  inv.addEventListener('focusin', e => { const row = e.target.closest('.inv-row'); if (!row) return; const i = call.order.findIndex(r => r.id === row.dataset.id); if (i >= 0) callTo(i); });
  inv.addEventListener('click', e => {
    const btn = e.target.closest('.inv-btn'); if (!btn) return;
    const row = btn.closest('.inv-row'), r = BY_ID.get(row.dataset.id);
    const img = window.innerWidth > 1100 ? $$('#callStrip img')[call.order.indexOf(r)] : $('.inv-thumb', row);
    Sound.sfx.press(); openCabin(r, call.order, img);
  });
  $('#callShaft').addEventListener('click', () => { const r = call.order[call.idx]; if (r) openCabin(r, call.order, $$('#callStrip img')[call.idx]); });

  let invFilter = 'all', invSort = 'cabin';
  function applyInv() {
    let list = NEW.slice();
    if (invFilter === 'edice') list = list.filter(r => r.edice); else if (invFilter !== 'all') list = list.filter(r => r.genre === invFilter);
    const by = { cabin: (a, b) => a.cabin - b.cabin, price: (a, b) => a.price - b.price || a.cabin - b.cabin, year: (a, b) => (a.orig || a.year) - (b.orig || b.year) };
    list.sort(by[invSort]);
    const rows = new Map($$('.inv-row', inv).map(r => [r.dataset.id, r]));
    rows.forEach(r => r.classList.add('is-out'));
    list.forEach(r => { const el = rows.get(r.id); el.classList.remove('is-out'); inv.appendChild(el); });
    if (!reduce) gsap.fromTo(list.map(r => rows.get(r.id)), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .4, stagger: .025, ease: 'power3.out', overwrite: true });
    call.order = list; call.idx = 0; buildCallStrip();
  }
  $('#filters').addEventListener('click', e => {
    const b = e.target.closest('.chipbtn'); if (!b) return;
    invFilter = b.dataset.filter; Sound.sfx.press();
    $$('.chipbtn').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    applyInv();
  });
  $('.sort').addEventListener('click', e => {
    const b = e.target.closest('.sbtn'); if (!b) return;
    invSort = b.dataset.sort; Sound.sfx.tick();
    $$('.sbtn').forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on); });
    applyInv();
  });

  /* ==========================================================================
     2 — Second-hand crate
     ========================================================================== */
  const crate = { items: [], cur: 1, els: [] };
  D.BAZAR_SECTIONS.forEach((s, si) => { crate.items.push({ type: 'div', sec: s, si }); BAZ.filter(r => r.sec === s.key).forEach(r => crate.items.push({ type: 'rec', rec: r })); });
  $('#crateAll').textContent = pad2(BAZ.length);
  const stack = $('#stack');
  function buildCrate() {
    crate.items.forEach((it, i) => {
      const el = document.createElement('div'); el.className = 'sl'; el.dataset.i = i;
      if (it.type === 'div') {
        el.innerHTML = '<div class="sl-face"><div class="sl-div"><strong>' + esc(it.sec.cs) + '</strong></div></div><span class="sl-tab" style="left:' + [4, 33, 62][it.si % 3] + '%">' + esc(it.sec.cs) + '</span><div class="sl-face sl-back" style="background:#B9A47A"></div><span class="sl-shade"></span>';
      } else {
        const r = it.rec;
        el.innerHTML = '<div class="sl-face"><img src="' + cover(r) + '" alt="" draggable="false"><span class="sticker">' + r.price.toLocaleString('en-US') + '<small>CZK</small></span></div>' +
          '<div class="sl-face sl-back"><b>' + esc(r.artist) + '</b>' + r.tracks.map(t => '<p>' + t[0] + ' ' + esc(t[1]) + '</p>').join('') + '</div><span class="sl-shade"></span>';
      }
      stack.appendChild(el); crate.els.push(el);
    });
  }
  const tabs = $('#crateTabs');
  tabs.innerHTML = D.BAZAR_SECTIONS.map(s => '<button type="button" class="tab" data-sec="' + s.key + '">' + esc(s.cs) + '</button>').join('');
  tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (!b) return; const i = crate.items.findIndex(x => x.type === 'div' && x.sec.key === b.dataset.sec); Sound.sfx.swish(); crateTo(i + 1); });
  function crateLayout() {
    const sw = stack.offsetWidth;
    crate.els.forEach((el, i) => {
      const d = i - crate.cur; let t, shade = 0, vis = true;
      if (d < 0) { const n = -d; vis = n <= 4; t = 'translateZ(' + (36 + n * 9) + 'px) translateY(' + (n * 2) + 'px) rotateX(' + (-(58 + n * 5)) + 'deg)'; shade = Math.min(.5, n * .1); }
      else if (d === 0) t = 'translateZ(0px) rotateX(6deg)';
      else { vis = d <= 8; t = 'translateZ(' + (-d * sw * .045) + 'px) translateY(' + (-d * sw * .006) + 'px) rotateX(' + (8 + Math.min(d, 4)) + 'deg)'; shade = Math.min(.6, d * .08); }
      el.style.setProperty('--t', t); el.style.transform = t; el.style.setProperty('--shade', shade);
      el.style.visibility = vis ? 'visible' : 'hidden';
      el.classList.toggle('is-peek', d > 0 && d <= 8);
    });
    const it = crate.items[crate.cur], key = it.type === 'div' ? it.sec.key : it.rec.sec;
    $$('.tab', tabs).forEach(t => t.classList.toggle('is-on', t.dataset.sec === key));
    $('#crateNow').textContent = pad2(Math.max(1, crate.items.slice(0, crate.cur + 1).filter(x => x.type === 'rec').length));
    renderBz(it);
  }
  function crateTo(i) { i = clamp(i, 0, crate.items.length - 1); if (i === crate.cur) return; crate.cur = i; crateLayout(); }
  function crateStep(d) {
    const n = clamp(crate.cur + d, 0, crate.items.length - 1);
    if (n === crate.cur) { gsap.fromTo(stack, { x: d * 6 }, { x: 0, duration: .4, ease: 'power3.out' }); return; }
    Sound.sfx.swish(); crateTo(n);
  }
  $('#cratePrev').addEventListener('click', () => crateStep(-1));
  $('#crateNext').addEventListener('click', () => crateStep(1));
  const crateEl = $('#crate');
  const openCur = () => { const it = crate.items[crate.cur]; if (it.type === 'rec') { Sound.sfx.press(); openCabin(it.rec, BAZ, $('img', crate.els[crate.cur])); } else crateStep(1); };
  crateEl.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); crateStep(1); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); crateStep(-1); }
    if (e.key === 'Enter') openCur();
  });
  (function () {
    let pid = null, sx = 0, sy = 0, acc = 0, moved = false, touch = false;
    crateEl.addEventListener('pointerdown', e => { pid = e.pointerId; sx = e.clientX; sy = e.clientY; acc = 0; moved = false; touch = e.pointerType !== 'mouse'; if (!touch) crateEl.setPointerCapture(pid); });
    crateEl.addEventListener('pointermove', e => {
      if (pid !== e.pointerId) return;
      if (Math.abs(e.clientX - sx) > 6 || Math.abs(e.clientY - sy) > 6) moved = true;
      if (touch && Math.abs(e.clientY - sy) > Math.abs(e.clientX - sx)) return;
      const d = touch ? -(e.clientX - sx) : (e.clientY - sy), step = touch ? 46 : 54;
      while (d - acc > step) { acc += step; crateStep(1); }
      while (d - acc < -step) { acc -= step; crateStep(-1); }
    });
    const end = e => {
      if (pid !== e.pointerId) return; pid = null;
      if (moved || e.type !== 'pointerup') return;
      const hit = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.classList && el.classList.contains('sl')); if (!hit) return;
      const i = +hit.dataset.i;
      if (i === crate.cur) openCur(); else { Sound.sfx.swish(); crateTo(i); }
    };
    crateEl.addEventListener('pointerup', end); crateEl.addEventListener('pointercancel', end);
  })();

  const GRADES = ['M', 'NM', 'VG+', 'VG', 'VG−', 'G+', 'G'];
  const bz = $('#bz'); let bzPlaying = null;
  const gradeRow = (label, g) => '<div class="grade-row"><dt>' + label + '</dt><dd>' + GRADES.map(x => '<span class="' + (x === g ? 'on' : '') + '">' + x + '</span>').join('') + '</dd></div>';
  function renderBz(it) {
    if (it.type === 'div') {
      bz.innerHTML = '<p class="bz-sec mono">Divider</p><h3 class="bz-artist">' + esc(it.sec.cs) + '</h3><p class="bz-title">' + esc(it.sec.en) + '</p><div class="bz-actions"><button type="button" class="pill pill--solid" data-next>Flip ↓</button></div>';
      $('[data-next]', bz).addEventListener('click', () => crateStep(1));
    } else {
      const r = it.rec, playing = bzPlaying === r.id;
      bz.innerHTML = '<span class="sticker" aria-hidden="true">' + r.price.toLocaleString('en-US') + '<small>CZK</small></span>' +
        '<p class="bz-sec mono">' + esc(SEC[r.sec].cs) + ' · ' + r.year + '</p>' +
        '<h3 class="bz-artist">' + esc(r.artist) + '</h3><p class="bz-title">' + esc(r.title) + '</p>' +
        '<dl class="grade">' + gradeRow('Record', r.media) + gradeRow('Sleeve', r.sleeve) + '</dl>' +
        '<p class="bz-note">' + esc(r.note) + '</p>' +
        '<div class="bz-actions"><button type="button" class="pill pill--solid" data-play aria-pressed="' + playing + '">' + (playing ? '■ Stop' : '▶ Listen') + '</button>' +
        '<button type="button" class="pill" data-hold-id="' + r.id + '" aria-pressed="' + holds.has(r.id) + '">' + (holds.has(r.id) ? 'Held ✓' : 'Hold') + '</button>' +
        '<button type="button" class="pill" data-open>Open ↗</button></div>';
      $('[data-play]', bz).addEventListener('click', ev => {
        if (bzPlaying === r.id) { Sound.stopPreview(); bzPlaying = null; renderBz(it); return; }
        const h = Sound.play(r, true, null, () => { if (bzPlaying === r.id) { bzPlaying = null; if (crate.items[crate.cur] === it) renderBz(it); } });
        if (h) { bzPlaying = r.id; ev.currentTarget.setAttribute('aria-pressed', 'true'); ev.currentTarget.textContent = '■ Stop'; }
      });
      $('[data-open]', bz).addEventListener('click', () => openCabin(r, BAZ, $('img', crate.els[crate.cur])));
    }
    if (!reduce) gsap.fromTo(bz.children, { y: 8, opacity: .3 }, { y: 0, opacity: 1, duration: .35, stagger: .02, ease: 'power2.out', overwrite: true });
  }

  /* ==========================================================================
     3 — The lap: 3:52
     ========================================================================== */
  const LAP = 232, LV = { 5: 100, 4: 165, 3: 230, 2: 295, 1: 360, P: 425, S: 490 };
  const XL = 110, XR = 160, RAD = 25, CX = 135, SEG = [325, Math.PI * RAD, 390, Math.PI * RAD, 65], TOTAL = SEG.reduce((a, b) => a + b, 0);
  function lapPos(t) {
    t = ((t % LAP) + LAP) % LAP;
    if (t < 70) { const k = t / 70; return { x: XL, y: LV.P - 325 * k, len: 325 * k, dir: 'up' }; }
    if (t < 102) { const k = (t - 70) / 32, a = Math.PI * k; return { x: CX - RAD * Math.cos(a), y: LV[5] - RAD * Math.sin(a), len: SEG[0] + SEG[1] * k, dir: 'top' }; }
    if (t < 186) { const k = (t - 102) / 84; return { x: XR, y: LV[5] + 390 * k, len: SEG[0] + SEG[1] + 390 * k, dir: 'down' }; }
    if (t < 218) { const k = (t - 186) / 32, a = Math.PI * k; return { x: CX + RAD * Math.cos(a), y: LV.S + RAD * Math.sin(a), len: SEG[0] + SEG[1] + SEG[2] + SEG[3] * k, dir: 'bottom' }; }
    const k = (t - 218) / 14; return { x: XL, y: LV.S - 65 * k, len: TOTAL - 65 + 65 * k, dir: 'up' };
  }
  const STOPS = [
    [0, 'Step on. Mind the gap.'], [14, 'New records. Twelve this week.'], [28, 'The crates. You can smell the cardboard.'],
    [42, 'The office. Someone’s on the phone.'], [56, 'The queue for cabin 7.'], [70, 'Top floor. The hum gets louder.'],
    [76, 'Over the top. It’s safe. Since 1931.'], [102, 'Going down. Every floor again.'], [186, 'The cellar. 38,000 records waiting.'],
    [196, 'Under the cellar. The quiet part.'], [218, 'Coming back up.'], [231, 'Back where you started.']
  ];
  const LAP_NAME = { S: 'Cellar', P: 'Ground', 1: 'New in', 2: 'Second-hand', 3: 'Office', 4: 'Cabin 7', 5: 'Top floor' };
  (function drawLap() {
    let h = '<rect x="58" y="' + (LV[2] + 2) + '" width="154" height="' + (LV.P - LV[2] - 4) + '" class="shop"/>';
    Object.keys(LV).forEach(f => { const y = LV[f]; h += '<rect class="lv-slab" x="54" y="' + (y - 2) + '" width="162" height="4"/><text class="lv-n" x="22" y="' + (y + 6) + '">' + f + '</text>'; });
    h += '<rect x="54" y="28" width="162" height="4" class="lv-slab"/><rect x="54" y="' + (LV.S + 62) + '" width="162" height="4" class="lv-slab"/>';
    h += '<line class="lv" x1="56" y1="30" x2="56" y2="' + (LV.S + 64) + '"/><line class="lv" x1="214" y1="30" x2="214" y2="' + (LV.S + 64) + '"/>';
    h += '<rect class="sh" x="' + (XL - 14) + '" y="' + (LV[5] - 40) + '" width="28" height="' + (LV.S - LV[5] + 80) + '"/><rect class="sh" x="' + (XR - 14) + '" y="' + (LV[5] - 40) + '" width="28" height="' + (LV.S - LV[5] + 80) + '"/>';
    const d = 'M' + XL + ' ' + LV.P + ' L' + XL + ' ' + LV[5] + ' A' + RAD + ' ' + RAD + ' 0 0 1 ' + XR + ' ' + LV[5] + ' L' + XR + ' ' + LV.S + ' A' + RAD + ' ' + RAD + ' 0 0 1 ' + XL + ' ' + LV.S + ' Z';
    h += '<path class="loop" d="' + d + '"/><path class="loop-done" id="lapDone" d="' + d + '" stroke-dasharray="' + TOTAL.toFixed(2) + '" stroke-dashoffset="' + TOTAL.toFixed(2) + '"/>';
    h += '<g class="cabmark" id="lapCab"><rect x="-9" y="-13" width="18" height="26" rx="2"/></g>';
    $('#lapDraw').innerHTML = h;
  })();
  const lapState = { target: 0, t: -1, stop: -1 };
  function lapRender(t) {
    const p = lapPos(t >= LAP ? LAP - .001 : t), sec = Math.round(t);
    $('#lapTime').textContent = Math.floor(sec / 60) + ':' + pad2(sec % 60);
    $('#lapCab').setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
    $('#lapDone').setAttribute('stroke-dashoffset', (TOTAL - (t >= LAP ? TOTAL : p.len)).toFixed(1));
    let where;
    if (p.dir === 'top') where = 'Over the top';
    else if (p.dir === 'bottom') where = 'Under the cellar';
    else {
      const tt = ((t % LAP) + LAP) % LAP;
      const f = tt < 70 ? ['P', '1', '2', '3', '4', '5'][Math.floor(tt / 14)] : tt < 186 ? ['5', '4', '3', '2', '1', 'P'][Math.min(5, Math.floor((tt - 102) / 14))] : tt < 218 ? 'S' : (tt < 231 ? 'S' : 'P');
      where = LAP_NAME[f] + ' · ' + p.dir;
    }
    $('#lapWhere').textContent = where;
    let si = 0; STOPS.forEach((s, i) => { if (t >= s[0] - .5) si = i; });
    if (si !== lapState.stop) {
      const down = si < lapState.stop; lapState.stop = si;
      const el = $('#lapText'); el.textContent = STOPS[si][1];
      if (!reduce) gsap.fromTo(el, { y: down ? -20 : 20, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'power3.out', overwrite: true });
    }
  }
  lapRender(0);
  gsap.ticker.add((tm, dtMs) => {
    if (Math.abs(lapState.target - lapState.t) < .02) return;
    lapState.t = lapState.t < 0 ? lapState.target : lerp(lapState.t, lapState.target, 1 - Math.exp(-((dtMs || 16) / 1000) * 7));
    lapRender(lapState.t);
  });

  /* ==========================================================================
     4 — Cabin 7 sessions
     ========================================================================== */
  const booked = store.get('pt.booked', {}) || {};
  function lapClock(s, n) { const [h, m] = s.time.split(':').map(Number); const t = h * 60 + m + Math.round((n - 1) * 232 / 60); return pad2(Math.floor(t / 60) % 24) + ':' + pad2(t % 60); }
  function seatMap(s) {
    const seats = new Array(s.laps).fill(0); let left = s.taken, k = 0;
    while (left > 0 && k < 999) { const i = (k * 7 + s.n * 3) % s.laps; if (seats[i] < 2) { seats[i]++; left--; } k++; }
    const mine = booked[s.n]; if (mine && seats[mine - 1] < 2) seats[mine - 1]++;
    return seats;
  }
  const logRows = $('#logRows');
  function renderLog() {
    logRows.innerHTML = SESSIONS.map(s => {
      const seats = seatMap(s), free = seats.reduce((a, x) => a + 2 - x, 0), mine = booked[s.n];
      const stamp = mine ? '<span class="lg-stamp is-mine">Booked · lap ' + mine + '</span>' : free === 0 ? '<span class="lg-stamp">Sold out</span>' : '';
      const opts = seats.map((x, i) => x < 2 ? '<option value="' + (i + 1) + '">Lap ' + (i + 1) + ' · ' + lapClock(s, i + 1) + '</option>' : '').join('');
      return '<li class="lg" data-n="' + s.n + '"><button type="button" class="lg-row" aria-expanded="false" aria-controls="lgm' + s.n + '">' +
        '<span class="lg-date"><b>' + shortDate(s.date) + '</b><span>' + DOW[s.date.getDay()] + ' ' + s.time + '</span></span>' +
        '<span class="lg-who"><strong>' + esc(s.artist) + '</strong><span>' + esc(s.what) + '</span></span>' +
        '<span class="lg-laps">' + s.laps + ' laps</span>' +
        '<span class="lg-seats" aria-label="' + free + ' places left">' + (free === 0 && !mine ? '' : seats.map(x => '<i class="' + (x === 2 ? 't' : '') + '"' + (x === 1 ? ' style="background:linear-gradient(90deg,var(--white) 50%,transparent 50%)"' : '') + '></i>').join('')) + '</span>' +
        stamp + '</button><div class="lg-more" id="lgm' + s.n + '"><div class="lg-more-in"><p>' + esc(s.text) + '</p>' +
        (mine ? '<p class="lg-msg">Lap ' + mine + ', ' + lapClock(s, mine) + '. Ground floor, five minutes early.</p>'
          : free === 0 ? '<p class="lg-msg">Sold out. Ask at the till for the waiting list.</p>'
            : '<form class="lg-form" novalidate><label for="lgn' + s.n + '">Name</label><input id="lgn' + s.n + '" name="name" type="text" autocomplete="name" required><label for="lge' + s.n + '">Email</label><input id="lge' + s.n + '" name="email" type="email" autocomplete="email" required><label for="lgl' + s.n + '">Lap</label><div class="row2"><select id="lgl' + s.n + '" name="lap">' + opts + '</select><button type="submit">Book</button></div><p class="lg-msg" role="status"></p></form>') +
        '</div></div></li>';
    }).join('');
  }
  renderLog();
  logRows.addEventListener('click', e => {
    const b = e.target.closest('.lg-row'); if (!b) return;
    const open = b.getAttribute('aria-expanded') === 'true';
    $$('.lg-row[aria-expanded="true"]', logRows).forEach(x => { if (x !== b) { x.setAttribute('aria-expanded', 'false'); gsap.to(x.nextElementSibling, { height: 0, duration: .4, ease: 'power3.inOut' }); } });
    b.setAttribute('aria-expanded', !open);
    gsap.to(b.nextElementSibling, { height: open ? 0 : 'auto', duration: reduce ? 0 : .45, ease: 'power3.inOut', onComplete: () => ST && ST.refresh() });
    Sound.sfx.tick();
  });
  logRows.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, n = +f.closest('.lg').dataset.n, s = SESSIONS.find(x => x.n === n), msg = $('.lg-msg', f);
    const name = f.name.value.trim(), mail = f.email.value.trim(), lapN = +f.lap.value;
    if (name.length < 2) { msg.textContent = 'Add your name.'; msg.classList.add('err'); f.name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { msg.textContent = 'Check the email address.'; msg.classList.add('err'); f.email.focus(); return; }
    booked[n] = lapN; store.set('pt.booked', booked); Sound.sfx.stamp(); renderLog();
    const li = $('.lg[data-n="' + n + '"]', logRows); $('.lg-row', li).setAttribute('aria-expanded', 'true'); $('.lg-more', li).style.height = 'auto';
    gsap.fromTo($('.lg-stamp', li), { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: .3, ease: 'power4.in' });
    toast('Booked: ' + s.artist + ', lap ' + lapN + ' at ' + lapClock(s, lapN));
  });

  function buildMini() {
    const sh = $('#miniShaft'), strip = document.createElement('div'); strip.className = 'mini-strip'; sh.appendChild(strip);
    const seq = [{ type: 'rec', rec: NEW[2] }, { type: 'seven' }, { type: 'rec', rec: NEW[5] }, { type: 'rec', rec: NEW[9] }];
    let pitch = 0, y = 0, vis = false;
    const build = () => { const H = sh.clientHeight; if (!H) return; pitch = Math.round(H * .42); strip.innerHTML = seq.concat(seq).map((s, i) => '<div class="cab" style="height:' + Math.round(pitch * .86) + 'px;transform:translate3d(0,' + (i * pitch) + 'px,0)">' + cabInner(s) + '</div>').join(''); };
    build(); window.addEventListener('resize', build);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(sh);
    gsap.ticker.add((t, dtMs) => {
      if (!vis || !pitch || lift.stopped) return;
      y -= (pitch / 7) * ((dtMs || 16) / 1000) * (1 + speed.boost * .5);
      if (-y >= pitch * seq.length) y += pitch * seq.length;
      strip.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    });
  }

  /* ==========================================================================
     5 — Visit
     ========================================================================== */
  (function () {
    const t = prague();
    $('#hours tbody').innerHTML = HOURS.map(h => '<tr class="' + (h.d === t.dow ? 'is-today' : '') + '"><td>' + DOW[h.d] + '</td><td>' + (h.open ? h.open[0] + ':00–' + h.open[1] + ':00' : 'Closed') + '</td></tr>').join('');
  })();
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-copy]'); if (!b) return;
    const label = b.textContent;
    const ok = () => { b.textContent = 'Copied ✓'; b.classList.add('is-done'); setTimeout(() => { b.textContent = label; b.classList.remove('is-done'); }, 1600); };
    const fallback = () => { const sel = b.previousElementSibling && b.previousElementSibling.classList.contains('sel') ? b.previousElementSibling : $('#addr'); const rg = document.createRange(); rg.selectNodeContents(sel); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); toast('Selected. Press Ctrl+C to copy.'); };
    try { navigator.clipboard.writeText(b.dataset.copy).then(ok, fallback); } catch (err) { fallback(); }
  });
  $('#postForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#postEmail').value.trim(), m = $('#postMsg');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { m.textContent = 'Check the email address.'; m.classList.add('err'); $('#postEmail').focus(); return; }
    m.classList.remove('err'); m.textContent = 'Done. First email on the 1st.'; $('#postEmail').value = ''; Sound.sfx.stamp();
  });
  (function wheel() {
    const c = $('#wheel'), x = c.getContext('2d'); let ang = 0, vis = false, size = 0;
    const resize = () => { const dpr = Math.min(2, window.devicePixelRatio || 1); size = Math.round((c.clientWidth || 500) * dpr); c.width = c.height = size; };
    resize(); window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(c);
    const W = '#F2EFE6';
    function draw() {
      const S = size, cx = S / 2, cy = S * .44, R = S * .3;
      x.clearRect(0, 0, S, S);
      const lh = S * .04, off = (ang * R) % (lh * 2);
      x.lineWidth = S * .006; x.strokeStyle = 'rgba(242,239,230,.5)';
      [-1, 1].forEach(side => { const lx = cx + side * (R + S * .02); for (let i = -1; i < 16; i++) { const yy = cy + i * lh * 2 + (side < 0 ? -off : off); if (yy < cy) continue; x.strokeRect(lx - S * .012, yy, S * .024, lh * 1.5); } });
      x.save(); x.translate(cx, cy); x.rotate(ang); x.fillStyle = W;
      for (let i = 0; i < 28; i++) { x.save(); x.rotate(i * Math.PI * 2 / 28); x.beginPath(); x.moveTo(-S * .018, -R); x.lineTo(-S * .01, -R - S * .035); x.lineTo(S * .01, -R - S * .035); x.lineTo(S * .018, -R); x.closePath(); x.fill(); x.restore(); }
      x.beginPath(); x.arc(0, 0, R, 0, Math.PI * 2); x.lineWidth = S * .03; x.strokeStyle = W; x.stroke();
      for (let i = 0; i < 6; i++) { x.save(); x.rotate(i * Math.PI / 3); x.beginPath(); x.moveTo(-S * .012, -R * .2); x.lineTo(-S * .006, -R * .9); x.lineTo(S * .006, -R * .9); x.lineTo(S * .012, -R * .2); x.closePath(); x.fill(); x.restore(); }
      x.beginPath(); x.arc(0, 0, R * .22, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.arc(0, 0, R * .1, 0, Math.PI * 2); x.fillStyle = '#1F45A8'; x.fill();
      x.restore();
      x.fillStyle = '#C42F26'; x.beginPath(); x.moveTo(cx, cy - R - S * .07); x.lineTo(cx - S * .014, cy - R - S * .1); x.lineTo(cx + S * .014, cy - R - S * .1); x.closePath(); x.fill();
    }
    draw();
    gsap.ticker.add((t, dtMs) => { if (!vis) return; if (!lift.stopped && !reduce) ang += ((dtMs || 16) / 1000) * .12 * (1 + speed.boost); draw(); });
  })();

  /* ==========================================================================
     Scroll choreography
     ========================================================================== */
  let wrapping = false, booted = false;
  function setupScroll() {
    if (!ST) return;
    ST.create({ trigger: '#lap', start: 'top top+=' + $('#hud').offsetHeight, end: () => '+=' + Math.round(window.innerHeight * 2.6), pin: true, invalidateOnRefresh: true, onUpdate: self => { lapState.target = self.progress * LAP; } });
    FLOORS.forEach(f => { const el = $(FLOOR_EL[f]); ST.create({ trigger: el, start: 'top 40%', end: 'bottom 40%', onToggle: self => { if (self.isActive) setFloor(f, el.dataset.tone); } }); });
    ST.create({ trigger: '#over', start: 'top 40%', end: 'bottom bottom', onToggle: self => { if (self.isActive) setFloor('5', 'ink'); } });
    if (!reduce) $$('.slab').forEach(s => gsap.fromTo($('.slab-num', s), { yPercent: 80 }, { yPercent: -80, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } }));
    const fill = $('#oaFill'), len = fill.getTotalLength(), cab = $('#oaCab');
    fill.style.strokeDasharray = len; fill.style.strokeDashoffset = len;
    const place = p => { const pt = fill.getPointAtLength(len * p); fill.style.strokeDashoffset = len * (1 - p); cab.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')'); $('#overPct').textContent = Math.round(p * 100); };
    place(0);
    ST.create({ trigger: '#over', start: 'top top', end: 'bottom bottom', onUpdate: self => { place(self.progress); if (self.progress > .992 && !wrapping && booted) overTheTop(); } });
  }
  function overTheTop() {
    wrapping = true; lock(true);
    const laps = (store.get('pt.laps', 1) || 1) + 1; store.set('pt.laps', laps);
    const travel = $('#travel'), slab = $('.travel-slab'), num = $('#travelNum');
    num.textContent = '5'; travel.style.visibility = 'visible'; Sound.sfx.clunk();
    let finished = false;
    const fin = () => { if (finished) return; finished = true; travel.style.visibility = 'hidden'; gsap.set(slab, { xPercent: 0, yPercent: 0 }); lock(false); setTimeout(() => { wrapping = false; }, 600); };
    gsap.fromTo(slab, { xPercent: 100, yPercent: 0 }, { xPercent: 0, duration: .6, ease: 'power3.in' });
    setTimeout(() => { jump(0); ['4', '3', '2', '1', 'P'].forEach((s, i) => setTimeout(() => { num.textContent = s; Sound.sfx.tick(); }, 90 + i * 100)); }, 620);
    setTimeout(() => { setFloor('P', 'blue'); gsap.to(slab, { xPercent: -100, duration: .6, ease: 'power3.out', onComplete: fin }); toast('Lap ' + laps + '. Welcome back to the ground floor.', 3200); }, 1350);
    setTimeout(fin, 2400);
  }

  /* ==========================================================================
     Boot: call the lift
     ========================================================================== */
  async function boot() {
    const loader = $('#loader'), seq = ['5', '4', '3', '2', '1', 'P'];
    let k = 0;
    const tick = setInterval(() => { if (k < seq.length - 1) { k++; $('#loaderFloor').textContent = seq[k]; } }, reduce ? 10 : 230);
    const t0 = performance.now();
    try {
      await Promise.race([
        Promise.all(['900 100px "Archivo"', '800 100px "Archivo"', 'italic 400 30px "Newsreader"', 'italic 300 30px "Newsreader"', '500 14px "IBM Plex Mono"'].map(f => document.fonts.load(f))),
        new Promise(r => setTimeout(r, 3000))
      ]);
    } catch (e) { /* system fonts */ }
    const all = NEW.concat(BAZ);
    for (let i = 0; i < all.length; i++) { cover(all[i]); if (i % 4 === 3) await new Promise(r => setTimeout(r, 0)); }
    fitAll(); buildLift(); buildInventory(); buildCrate(); buildMini(); syncHolds();
    fitAll(); buildCallStrip(); crateLayout(); setupScroll();
    await new Promise(r => setTimeout(r, Math.max(0, (reduce ? 0 : 1300) - (performance.now() - t0))));
    clearInterval(tick); $('#loaderFloor').textContent = 'P';
    await new Promise(r => setTimeout(r, reduce ? 0 : 250));
    lift.booting = false;
    let done = false;
    const fin = () => { if (done) return; done = true; loader.remove(); booted = true; if (ST) ST.refresh(); syncFloor(); };
    gsap.to(loader, { yPercent: -100, duration: reduce ? 0 : .9, ease: 'power3.inOut', onComplete: fin });
    setTimeout(fin, 1500);
    if (!reduce) {
      gsap.from('.wm .ch', { yPercent: 100, duration: 1, stagger: .03, ease: 'power4.out', delay: .35 });
      gsap.from(['.p-thesis', '.p-lede', '.status', '.p-plate'], { y: 24, opacity: 0, duration: .8, stagger: .06, ease: 'power3.out', delay: .6 });
      gsap.from('.landing', { y: 40, opacity: 0, duration: .9, ease: 'power3.out', delay: .55 });
    }
    const hash = location.hash.replace('#', ''), f = Object.keys(FLOOR_EL).find(x => FLOOR_EL[x] === '#' + hash);
    if (f && f !== 'P') setTimeout(() => travelTo(f), reduce ? 0 : 1200);
  }

  window.addEventListener('resize', () => { fitAll(); buildCallStrip(); crateLayout(); });
  if (ST) ST.addEventListener('refresh', () => { if (booted) syncFloor(); });
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? 'The lift is waiting · Paternoster' : 'Paternoster Records'; });
  console.log('%cPATERNOSTER', 'font: 900 28px Archivo, sans-serif;', '\nHiring: shop assistant, Tue–Sat. Must step off a moving lift without spilling coffee.');
  boot();
})();
