/* Páternoster — the building's sound.
   Everything is synthesised: the lift's hum, the brass buttons, the paper
   sleeves, and a thirty-second preview for every record in the shop. */
(function () {
  'use strict';

  let ctx = null, master = null, comp = null, sfxBus = null, noiseBuf = null;
  let sfxOn = false, hum = null, current = null;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = .004; comp.release.value = .2;
    master = ctx.createGain(); master.gain.value = .85;
    master.connect(comp); comp.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = .55; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function noise(t, dur, dest, type, freq, q, vol, attack) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    s.playbackRate.value = .8 + Math.random() * .4;
    const f = ctx.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || .3, t + (attack || .002));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random()); s.stop(t + dur + .05);
    return f;
  }
  function tone(t, freq, dur, dest, type, vol, attack, release) {
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    const a = attack || .005, r = release || dur;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || .2, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + .01, r));
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + r + .05);
    return o;
  }

  /* ---------------- interface sounds ---------------- */

  const sfx = {
    press() { // brass call button
      if (!sfxOn || !ensure()) return; const t = ctx.currentTime;
      noise(t, .03, sfxBus, 'highpass', 3000, .7, .25);
      tone(t + .01, 1180, .35, sfxBus, 'sine', .05); tone(t + .01, 1770, .22, sfxBus, 'sine', .03);
    },
    clunk() { // a floor slab passing
      if (!sfxOn || !ensure()) return; const t = ctx.currentTime;
      const o = tone(t, 90, .28, sfxBus, 'sine', .35); o.frequency.exponentialRampToValueAtTime(48, t + .25);
      noise(t, .12, sfxBus, 'bandpass', 420, 1.2, .18);
    },
    swish() { // paper sleeve
      if (!sfxOn || !ensure()) return; const t = ctx.currentTime;
      const f = noise(t, .16, sfxBus, 'bandpass', 2600, .9, .12, .03);
      f.frequency.exponentialRampToValueAtTime(700, t + .15);
    },
    tick() {
      if (!sfxOn || !ensure()) return; const t = ctx.currentTime;
      noise(t, .018, sfxBus, 'highpass', 5000, .7, .12);
    },
    stamp() {
      if (!sfxOn || !ensure()) return; const t = ctx.currentTime;
      const o = tone(t, 120, .2, sfxBus, 'sine', .5); o.frequency.exponentialRampToValueAtTime(40, t + .18);
      noise(t, .09, sfxBus, 'lowpass', 1400, .5, .4);
    },
    brake() { // emergency stop
      if (!sfxOn || !ensure()) return; const t = ctx.currentTime;
      const f = noise(t, .7, sfxBus, 'bandpass', 900, 3, .22, .02); f.frequency.exponentialRampToValueAtTime(160, t + .65);
      tone(t + .62, 70, .4, sfxBus, 'sine', .4);
      noise(t + .62, .1, sfxBus, 'bandpass', 600, 2, .3);
    },
    start() { // restart motor
      if (!sfxOn || !ensure()) return; const t = ctx.currentTime;
      const o = tone(t, 45, 1.1, sfxBus, 'sawtooth', .05, .3, 1.1); o.frequency.exponentialRampToValueAtTime(95, t + 1);
      noise(t, .08, sfxBus, 'bandpass', 500, 2, .25);
    }
  };

  /* ---------------- the lift's hum ---------------- */

  function humStart() {
    if (!ensure() || hum) return;
    const t = ctx.currentTime;
    const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(.16, t + 1.2); out.connect(master);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 140; lp.Q.value = .8;
    const ng = ctx.createGain(); ng.gain.value = .9;
    src.connect(lp); lp.connect(ng); ng.connect(out); src.start();
    const m = ctx.createOscillator(); m.frequency.value = 50; const mg = ctx.createGain(); mg.gain.value = .07;
    m.connect(mg); mg.connect(out); m.start();
    const m2 = ctx.createOscillator(); m2.frequency.value = 100.4; const mg2 = ctx.createGain(); mg2.gain.value = .025;
    m2.connect(mg2); mg2.connect(out); m2.start();
    // the chain: a soft clack every 1.6 s
    const iv = setInterval(() => {
      if (!ctx) return; const tt = ctx.currentTime;
      noise(tt, .05, out, 'bandpass', 900 + Math.random() * 300, 3, .35);
      noise(tt + .07, .04, out, 'bandpass', 700, 3, .18);
    }, 1600);
    hum = { out, src, m, m2, iv };
  }
  function humStop() {
    if (!hum) return;
    const h = hum; hum = null; clearInterval(h.iv);
    const t = ctx.currentTime;
    h.out.gain.cancelScheduledValues(t); h.out.gain.setValueAtTime(h.out.gain.value, t);
    h.out.gain.exponentialRampToValueAtTime(0.0001, t + .6);
    setTimeout(() => { try { h.src.stop(); h.m.stop(); h.m2.stop(); } catch (e) { /* already stopped */ } }, 700);
  }
  function humSpeed(v) { // 0..1 — the machine labours when you scroll fast
    if (!hum) return;
    hum.m.frequency.setTargetAtTime(50 + v * 6, ctx.currentTime, .2);
  }

  /* ---------------- record previews ---------------- */

  const SCALES = {
    minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10],
    pent: [0, 3, 5, 7, 10], mixo: [0, 2, 4, 5, 7, 9, 10]
  };
  const PROG = { minor: [0, 5, 2, 6], major: [0, 4, 5, 3], dorian: [0, 3, 0, 3], pent: [0, 3, 2, 0], mixo: [0, 6, 3, 0] };

  //        kick / snare / hat — 16 steps; x = hit, o = soft
  const P = {
    synthpop: { scale: 'minor', k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', bass: 'eighth', pad: 1, arp: 'pluck', delay: .3 },
    kosmische: { scale: 'dorian', k: 'x.......x.......', s: '', h: '', bass: 'drone', pad: 1, arp: 'seq', delay: .5 },
    jazz: { scale: 'dorian', k: 'o.......o.......', s: '....o.......o...', h: 'x..ox..ox..ox..o', bass: 'walk', keys: 'comp', swing: .18, brush: 1 },
    swing: { scale: 'mixo', k: 'o...o...o...o...', s: '....o.......o...', h: 'x..ox..ox..ox..o', bass: 'walk', brass: 1, swing: .2, brush: 1 },
    house: { scale: 'minor', k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', bass: 'offbeat', keys: 'stab', delay: .25 },
    postpunk: { scale: 'minor', k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'drive', arp: 'chorus', grit: 1 },
    ambient: { scale: 'major', k: '', s: '', h: '', bass: 'none', pad: 2, bells: 1, delay: .6, water: 1 },
    library: { scale: 'mixo', k: 'x.....x...x.....', s: '....o.......o...', h: 'x.x.x.x.x.x.x.x.', bass: 'walk', bells: 2, delay: .2, brush: 1 },
    motorik: { scale: 'dorian', k: 'x...x...x...x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx', bass: 'eighth', pad: 1, arp: 'seq', delay: .2 },
    dub: { scale: 'minor', k: 'x...x...x...x...', s: '', h: '..o...o...o...o.', bass: 'sub', keys: 'dubstab', delay: .7, hiss: 1 },
    soul: { scale: 'mixo', k: 'x......x..x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'synco', keys: 'comp', brass: 1 },
    funk: { scale: 'dorian', k: 'x..x......x.....', s: '....x..o....x..o', h: 'xxxxxxxxxxxxxxxx', bass: 'synco', keys: 'stab' },
    chanson: { scale: 'minor', k: '', s: '', h: '', bass: 'oompah', accordion: 1, bells: 0, lead: 1 },
    beat: { scale: 'mixo', k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', bass: 'eighth', arp: 'twang' },
    baroque: { scale: 'major', k: '', s: '', h: '', bass: 'walk', arp: 'harpsi' },
    tones: { scale: 'major', tones: 1 },
    spacepop: { scale: 'major', k: 'x.......x.......', s: '....o.......o...', h: '', bass: 'oompah', accordion: 1, lead: 1, delay: .4 },
    disco: { scale: 'minor', k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.', bass: 'octave', pad: 1, delay: .15 },
    score: { scale: 'minor', k: '', s: '', h: '', bass: 'drone', pad: 2, theremin: 1, delay: .4 },
    'music-box': { scale: 'major', k: '', s: '', h: '', bass: 'none', bells: 3, delay: .3 },
    household: { scale: 'major', household: 1 },
    polka: { scale: 'major', k: '', s: '....x.......x...', h: '', bass: 'oompah', brass: 2, lead: 1 },
    birds: { scale: 'major', birds: 1 }
  };

  function seeded(str) {
    let h = 1779033703;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
    return function () { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }

  function play(rec, used, onProgress, onEnd) {
    if (!ensure()) return null;
    stopPreview();
    const p = P[rec.audio.preset] || P.synthpop;
    const bpm = rec.audio.bpm, root = rec.audio.root, step = 60 / bpm / 4;
    const r = seeded(rec.id);
    const scale = SCALES[p.scale], prog = PROG[p.scale];
    const deg = (d, oct) => root + 12 * (oct || 0) + scale[((d % scale.length) + scale.length) % scale.length] + 12 * Math.floor(d / scale.length);
    const motif = Array.from({ length: 16 }, () => r() < .55 ? Math.floor(r() * 8) : null);
    const DUR = 30, t0 = ctx.currentTime + .08;

    // signal chain: voices -> tone (age) -> out, with a delay send
    const out = ctx.createGain(); out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(.9, t0 + .6);
    out.gain.setValueAtTime(.9, t0 + DUR - 2.2); out.gain.exponentialRampToValueAtTime(0.0001, t0 + DUR);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = used ? 5200 : 14000;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = used ? 110 : 30;
    const bus = ctx.createGain(); bus.gain.value = .55;
    bus.connect(hp); hp.connect(lp); lp.connect(out); out.connect(master);
    let send = null;
    if (p.delay) {
      const dl = ctx.createDelay(2); dl.delayTime.value = step * 3;
      const fb = ctx.createGain(); fb.gain.value = Math.min(.72, p.delay);
      const df = ctx.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 2400;
      send = ctx.createGain(); send.gain.value = .45;
      send.connect(dl); dl.connect(df); df.connect(fb); fb.connect(dl); df.connect(bus);
    }
    // wow & flutter for old records
    const wow = used ? (() => { const o = ctx.createOscillator(); o.frequency.value = .55; const g = ctx.createGain(); g.gain.value = 4; o.connect(g); o.start(t0); o.stop(t0 + DUR); return g; })() : null;

    const nodes = [];
    function osc(t, f, dur, type, vol, a, rel, dest, detune) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
      if (detune) o.detune.value = detune;
      if (wow) wow.connect(o.detune);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a);
      g.gain.setValueAtTime(vol, t + Math.max(a, dur - rel)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + rel);
      o.connect(g); g.connect(dest && dest !== 'dry' ? dest : bus); if (send && dest !== 'dry') g.connect(send);
      o.start(t); o.stop(t + dur + rel + .05); nodes.push(o);
      return { o, g };
    }
    function filtered(t, f, dur, type, vol, cutoff, env, a, rel) {
      const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.Q.value = 4;
      flt.frequency.setValueAtTime(cutoff * (env || 1), t); flt.frequency.exponentialRampToValueAtTime(Math.max(80, cutoff), t + Math.min(dur, .25));
      flt.connect(bus); if (send) flt.connect(send);
      const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (wow) wow.connect(o.detune);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (a || .005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + (rel || .05));
      o.connect(g); g.connect(flt); o.start(t); o.stop(t + dur + (rel || .05) + .05); nodes.push(o);
    }
    const kick = (t, v) => { const o = osc(t, 150, .02, 'sine', v, .002, .3, 'dry'); o.o.frequency.exponentialRampToValueAtTime(44, t + .14); };
    const snare = (t, v) => { noise(t, p.brush ? .22 : .16, bus, p.brush ? 'highpass' : 'bandpass', p.brush ? 2500 : 1900, .8, v * (p.brush ? .35 : .55)); if (!p.brush) osc(t, 190, .02, 'triangle', v * .3, .002, .08, 'dry'); };
    const hat = (t, v) => noise(t, v > .5 ? .05 : .03, bus, 'highpass', 7600, .7, v * .22);

    function chordAt(bar) { const d = prog[bar % prog.length]; return [deg(d), deg(d + 2), deg(d + 4)]; }

    let i = 0, next = t0, timer = null, stopped = false;
    function schedule() {
      while (next < ctx.currentTime + .14 && next < t0 + DUR) {
        const s = i % 16, bar = Math.floor(i / 16), t = next + (p.swing && s % 2 ? step * p.swing : 0);
        const hit = (pat, idx) => pat && pat[idx] && pat[idx] !== '.' ? (pat[idx] === 'x' ? 1 : .45) : 0;
        let v;
        if ((v = hit(p.k, s))) kick(t, .9 * v);
        if ((v = hit(p.s, s))) snare(t, v);
        if ((v = hit(p.h, s))) hat(t, v);
        const ch = chordAt(bar);
        // bass
        const b0 = ch[0] - 24;
        switch (p.bass) {
          case 'eighth': if (s % 2 === 0) filtered(t, mtof(b0 + (s % 8 === 6 ? 12 : 0)), step * 1.6, 'sawtooth', .28, 420, 3); break;
          case 'offbeat': if (s % 4 === 2) filtered(t, mtof(b0), step * 1.5, 'sawtooth', .32, 380, 4); break;
          case 'drive': if (s % 2 === 0) filtered(t, mtof(b0), step * 1.8, 'square', .22, 900, 2); break;
          case 'walk': if (s % 4 === 0) osc(t, mtof(deg(prog[bar % prog.length] + [0, 2, 4, 5][s / 4] , -2)), step * 3.4, 'triangle', .38, .01, .08, 'dry'); break;
          case 'synco': if ([0, 3, 6, 10, 11].includes(s)) filtered(t, mtof(b0 + (s === 11 ? 12 : 0)), step * 1.2, 'sawtooth', .3, 600, 3); break;
          case 'octave': if (s % 2 === 0) filtered(t, mtof(b0 + (s % 4 === 2 ? 12 : 0)), step * 1.2, 'sawtooth', .28, 700, 3); break;
          case 'sub': if (s === 0 || s === 10) osc(t, mtof(b0), step * 5, 'sine', .45, .02, .2, 'dry'); break;
          case 'oompah': if (s % 8 === 0) osc(t, mtof(b0 + (s === 8 ? 7 : 0)), step * 2.5, p.brass ? 'sawtooth' : 'triangle', p.brass ? .14 : .35, .02, .1, 'dry'); break;
          case 'drone': if (s === 0 && bar % 2 === 0) osc(t, mtof(root - 12), step * 32, 'sawtooth', .07, 1.2, 1.5, 'dry', -6); break;
        }
        // harmony
        if (p.pad && s === 0) ch.forEach((n, k) => { osc(t, mtof(n), step * 15, 'sawtooth', .035 / p.pad, .5 * p.pad, .6, null, -7 + k * 5); osc(t, mtof(n), step * 15, 'sawtooth', .035 / p.pad, .5 * p.pad, .6, null, 7); });
        if (p.keys === 'comp' && (s === 2 || s === 7 || s === 11 || (s === 14 && r() < .5))) ch.forEach(n => osc(t, mtof(n + 12), step * 1.5, 'triangle', .06, .004, .25));
        if (p.keys === 'stab' && (s === 2 || s === 6 || s === 10 || s === 14)) ch.forEach(n => filtered(t, mtof(n + 12), step * .8, 'sawtooth', .05, 1400, 3));
        if (p.keys === 'dubstab' && (s === 3 || s === 11)) ch.forEach(n => filtered(t, mtof(n + 12), step, 'sawtooth', .06, 700, 4));
        if (p.accordion && s % 4 === 2) ch.forEach(n => { osc(t, mtof(n + 12), step * 1.6, 'sawtooth', .025, .02, .06, null, -9); osc(t, mtof(n + 12), step * 1.6, 'sawtooth', .025, .02, .06, null, 9); });
        if (p.brass && (s === 0 || (p.brass === 1 && s === 10)) && bar % 2 === 1) ch.forEach(n => filtered(t, mtof(n + 12), step * 2, 'sawtooth', .07, 1600, 1.5, .04, .1));
        // melody
        const m = motif[(s + (bar % 4 === 3 ? 4 : 0)) % 16];
        if (p.arp === 'pluck' && s % 2 === 0) filtered(t, mtof(ch[(s / 2) % 3] + 12), step * .9, 'square', .05, 2200, 2);
        if (p.arp === 'seq') filtered(t, mtof(ch[s % 3] + (s % 8 > 4 ? 24 : 12)), step * .8, 'sawtooth', .045, 1800, 2.5);
        if (p.arp === 'chorus' && s % 2 === 0) filtered(t, mtof(ch[0] + 12 + (s % 8 === 4 ? 3 : 0)), step * 1.4, 'sawtooth', .05, 2600, 1.5);
        if (p.arp === 'twang' && m !== null && s % 2 === 0) { const o = osc(t, mtof(deg(m, 0) + 12), step * 1.6, 'square', .045, .003, .2); o.o.frequency.setTargetAtTime(mtof(deg(m, 0) + 12) * 1.003, t, .1); }
        if (p.arp === 'harpsi') filtered(t, mtof(ch[[0, 1, 2, 1][s % 4]] + (s % 8 > 3 ? 24 : 12)), step * .9, 'sawtooth', .05, 3200, 2);
        if (p.bells && m !== null && (p.bells > 1 ? s % 2 === 0 : (s % 4 === 0 && r() < .5))) {
          const f = mtof(deg(m, 1) + (p.bells === 3 ? 12 : 0));
          osc(t, f, .02, 'sine', .09, .002, p.bells === 3 ? .6 : 1.2); osc(t, f * 3.98, .02, 'sine', .015, .002, .3);
        }
        if (p.lead && m !== null && s % 2 === 0) osc(t, mtof(deg(m, 1)), step * 1.7, p.brass ? 'sawtooth' : 'triangle', p.brass ? .05 : .08, .02, .08);
        if (p.theremin && s % 8 === 0 && m !== null) {
          const o = osc(t, mtof(deg(m, 1)), step * 7, 'sine', .1, .3, .4);
          const lfo = ctx.createOscillator(); lfo.frequency.value = 5.5; const lg = ctx.createGain(); lg.gain.value = 9;
          lfo.connect(lg); lg.connect(o.o.frequency); lfo.start(t); lfo.stop(t + step * 8); nodes.push(lfo);
        }
        if (p.water && s % 8 === 0) noise(t, step * 6, bus, 'lowpass', 300 + r() * 500, 2, .08, step * 3);
        if (p.hiss && s === 0) noise(t, step * 16, bus, 'highpass', 6000, .5, .015, step * 2);
        if (p.tones && s % 8 === 0) {
          if (bar % 2 === 0) osc(t, mtof(root + scale[Math.floor(r() * scale.length)] + 12), step * 7, 'sine', .14, .01, .05);
          else { const o = osc(t, 80, step * 7, 'sine', .1, .01, .05); o.o.frequency.exponentialRampToValueAtTime(2400, t + step * 7); }
        }
        if (p.birds && r() < .22) {
          const n = 2 + Math.floor(r() * 5), base = 2200 + r() * 2400;
          for (let k = 0; k < n; k++) { const o = osc(t + k * .07, base, .03, 'sine', .07, .004, .05); o.o.frequency.exponentialRampToValueAtTime(base * (1.3 + r() * .6), t + k * .07 + .05); }
        }
        if (p.birds && s === 0) noise(t, step * 16, bus, 'lowpass', 600, .5, .03, step * 4);
        if (p.household && s % 16 === 0) {
          const which = bar % 4;
          if (which === 0) { const o = osc(t, 900, step * 10, 'sine', .06, step * 6, .1); o.o.frequency.exponentialRampToValueAtTime(2300, t + step * 10); }
          if (which === 1) for (let k = 0; k < 6; k++) noise(t + k * step, .02, bus, 'highpass', 4000, 1, .2);
          if (which === 2) { noise(t, .3, bus, 'lowpass', 300, 1, .5); osc(t, 60, .1, 'sine', .4, .005, .3, 'dry'); }
          if (which === 3) osc(t, 50, step * 14, 'sawtooth', .04, .3, .3);
        }
        next += step; i++;
      }
      // crackle and pops for second-hand vinyl
      if (used) {
        const now = ctx.currentTime;
        for (let k = 0; k < 3; k++) if (Math.random() < .5) noise(now + Math.random() * .1, .004 + Math.random() * .006, out, 'highpass', 2000 + Math.random() * 4000, .5, .06 + Math.random() * .2);
        if (Math.random() < .03) noise(now + .02, .012, out, 'bandpass', 800, .8, .5);
      }
      if (!stopped) {
        const el = ctx.currentTime - t0;
        onProgress && onProgress(Math.max(0, Math.min(1, el / DUR)));
        if (el >= DUR) { finish(); return; }
      }
    }
    function finish() {
      if (stopped) return; stopped = true; clearInterval(timer);
      onProgress && onProgress(1); onEnd && onEnd();
      if (current && current.rec === rec) current = null;
    }
    timer = setInterval(schedule, 25); schedule();
    current = {
      rec,
      stop() {
        if (stopped) return; stopped = true; clearInterval(timer);
        const t = ctx.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(Math.max(out.gain.value, .0002), t);
        out.gain.exponentialRampToValueAtTime(0.0001, t + .25);
        setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch (e) { /* done */ } }); out.disconnect(); }, 400);
        onEnd && onEnd();
      }
    };
    return current;
  }
  function stopPreview() { if (current) { const c = current; current = null; c.stop(); } }

  window.PaternosterSound = {
    ensure,
    get on() { return sfxOn; },
    setOn(v) { sfxOn = !!v; if (sfxOn) { ensure(); humStart(); } else humStop(); },
    sfx, humSpeed, play, stopPreview,
    get playing() { return current ? current.rec.id : null; }
  };
})();
