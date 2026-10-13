/* Páternoster — generative sleeve printer.
   Every cover is drawn once, from the record's id, in the language of
   Czech interwar and post-war print: offset inks, halftone, cut paper. */
(function () {
  'use strict';

  const S = 640;
  const cache = new Map();

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const DISPLAY = '"Archivo", "Arial Narrow", Arial, sans-serif';
  const SERIF = '"Newsreader", Georgia, serif';
  const MONO = '"IBM Plex Mono", ui-monospace, monospace';

  function font(ctx, weight, size, family, stretch, style) {
    ctx.font = (style || '') + ' ' + weight + ' ' + size + 'px ' + family;
    if ('fontStretch' in ctx) ctx.fontStretch = stretch || 'normal';
  }
  function fit(ctx, text, maxW, size, weight, family, stretch) {
    let s = size;
    font(ctx, weight, s, family, stretch);
    const w = ctx.measureText(text).width;
    if (w > maxW) { s = Math.floor(s * maxW / w); font(ctx, weight, s, family, stretch); }
    return s;
  }
  function wrapUpper(text, maxChars) {
    const words = text.toUpperCase().split(' ');
    const lines = []; let cur = '';
    words.forEach(w => {
      if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
      else cur = (cur + ' ' + w).trim();
    });
    if (cur) lines.push(cur);
    return lines;
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ---------- compositions ---------- */

  function teige(ctx, r, rec) {
    const [a, b] = rec.cover.ink, v = rec.cover.variant || 0;
    ctx.fillStyle = rec.cover.paper; ctx.fillRect(0, 0, S, S);
    // the big disc
    const cx = S * (v === 1 ? .34 : v === 2 ? .62 : .58), cy = S * (v === 2 ? .38 : .44), rad = S * (.26 + r() * .08);
    ctx.fillStyle = a; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
    // diagonal bar
    ctx.save(); ctx.translate(S / 2, S / 2); ctx.rotate((v === 1 ? 1 : -1) * (.32 + r() * .2));
    ctx.fillStyle = b; ctx.fillRect(-S, -S * .045, S * 2, S * .09);
    ctx.restore();
    // thin rules
    ctx.fillStyle = b;
    ctx.fillRect(S * .08, S * .08, S * .84, 3);
    ctx.fillRect(S * .08, S * .1, S * .24, 3);
    // title, condensed, set against the bar
    const lines = wrapUpper(rec.title, 12);
    let y = S * (v === 2 ? .7 : .74);
    lines.forEach((ln, i) => {
      const s = fit(ctx, ln, S * .84, 96, 900, DISPLAY, 'condensed');
      ctx.fillStyle = i % 2 ? a : b; ctx.textBaseline = 'alphabetic';
      ctx.fillText(ln, S * .08, y + i * s * .92);
    });
    // artist set vertically
    ctx.save(); ctx.translate(S * .93, S * .14); ctx.rotate(Math.PI / 2);
    font(ctx, 600, 20, DISPLAY, 'expanded'); ctx.fillStyle = b;
    ctx.fillText(rec.artist.toUpperCase(), 0, 0); ctx.restore();
    font(ctx, 500, 15, MONO); ctx.fillStyle = b;
    ctx.fillText(rec.cat, S * .08, S * .06);
  }

  function grid(ctx, r, rec) {
    const [a, b] = rec.cover.ink, v = rec.cover.variant || 0;
    ctx.fillStyle = rec.cover.paper; ctx.fillRect(0, 0, S, S);
    const n = [5, 4, 6, 4, 3, 5][v % 6], m = S * .08, top = S * .26;
    const cell = (S - m * 2) / n, rows = Math.floor((S - top - m) / cell);
    for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
      const x = m + i * cell, y = top + j * cell, k = r();
      ctx.fillStyle = r() > .5 ? a : b;
      if (k < .22) ctx.fillRect(x, y, cell, cell);
      else if (k < .5) {
        const q = Math.floor(r() * 4); const ox = x + (q % 2 ? cell : 0), oy = y + (q > 1 ? cell : 0);
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.arc(ox, oy, cell, q * Math.PI / 2, q * Math.PI / 2 + Math.PI / 2); ctx.closePath();
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, cell, cell); ctx.clip();
        ctx.beginPath(); ctx.arc(ox, oy, cell, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else if (k < .64) {
        ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell * .42, 0, Math.PI * 2); ctx.fill();
      } else if (k < .72) {
        ctx.fillRect(x, y + cell * .4, cell, cell * .2);
      }
    }
    ctx.fillStyle = b;
    const s = fit(ctx, rec.title.toUpperCase(), S * .84, 46, 800, DISPLAY, 'expanded');
    ctx.fillText(rec.title.toUpperCase(), m, m + s * .8);
    font(ctx, 500, 20, DISPLAY, 'normal');
    ctx.fillText(rec.artist, m, m + s * .8 + 34);
    font(ctx, 500, 14, MONO); ctx.textAlign = 'right';
    ctx.fillText(rec.cat, S - m, m + s * .8 + 34); ctx.textAlign = 'left';
  }

  function glow(ctx, r, rec) {
    const [a, b] = rec.cover.ink, v = rec.cover.variant || 0;
    ctx.fillStyle = rec.cover.paper; ctx.fillRect(0, 0, S, S);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const x = S * (.2 + r() * .6), y = S * (.2 + r() * .55), rad = S * (.18 + r() * .3);
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, hexA(i % 2 ? a : b, .34)); g.addColorStop(1, hexA(i % 2 ? a : b, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    }
    ctx.globalCompositeOperation = 'source-over';
    // photogram objects: rings, a rod, a coin, soft-edged
    ctx.save(); ctx.filter = 'blur(1.4px)';
    ctx.strokeStyle = hexA(b, .85); ctx.lineWidth = 2;
    const rings = 3 + Math.floor(r() * 4), rcx = S * (.35 + r() * .3), rcy = S * (.36 + r() * .2);
    for (let i = 0; i < rings; i++) { ctx.beginPath(); ctx.arc(rcx, rcy, S * (.05 + i * .045), 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = hexA(b, .9);
    ctx.translate(S * .5, S * .5); ctx.rotate(r() * Math.PI);
    if (v !== 1) ctx.fillRect(-S * .38, -2, S * .76, 4);
    ctx.restore();
    if (v === 1) { // dub: horizontal fog lines
      for (let i = 0; i < 26; i++) { ctx.fillStyle = hexA(a, .05 + r() * .08); ctx.fillRect(0, S * (.15 + i * .028), S, 2 + r() * 6); }
    }
    ctx.fillStyle = hexA(b, .92);
    font(ctx, 500, 15, DISPLAY, 'expanded');
    ctx.fillText(rec.artist.toUpperCase(), S * .07, S * .86);
    font(ctx, 400, 34, SERIF, 'normal', 'italic');
    ctx.fillText(rec.title, S * .07, S * .92);
    font(ctx, 400, 13, MONO); ctx.textAlign = 'right'; ctx.fillText(rec.cat, S * .93, S * .92); ctx.textAlign = 'left';
  }

  function lines(ctx, r, rec) {
    const [a, b] = rec.cover.ink, v = rec.cover.variant || 0;
    ctx.fillStyle = rec.cover.paper; ctx.fillRect(0, 0, S, S);
    if (v === 1) { // motorway: lines into a vanishing point
      const vx = S * .5, vy = S * .38;
      ctx.strokeStyle = a; ctx.lineWidth = 3;
      for (let i = -18; i <= 18; i++) { ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + i * S * .09, S * 1.05); ctx.stroke(); }
      ctx.fillStyle = rec.cover.paper; ctx.fillRect(0, 0, S, vy);
      ctx.fillStyle = b;
      for (let i = 0; i < 9; i++) { const y = vy + Math.pow(i / 9, 2) * S * .62; ctx.fillRect(0, y, S, 1 + i * .9); }
    } else if (v === 3) { // oscillator: Lissajous
      ctx.strokeStyle = a; ctx.lineWidth = 2.2; ctx.beginPath();
      const fx = 3, fy = 2 + Math.floor(r() * 3), ph = r() * Math.PI;
      for (let t = 0; t <= Math.PI * 2 + .01; t += .004) {
        const x = S * .5 + Math.sin(fx * t + ph) * S * .33, y = S * .44 + Math.sin(fy * t) * S * .3;
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = b; ctx.beginPath(); ctx.arc(S * .5, S * .44, 7, 0, Math.PI * 2); ctx.fill();
    } else { // wave field
      const n = 46, amp = S * (.05 + r() * .05), freq = 2 + r() * 3;
      ctx.strokeStyle = a; ctx.lineWidth = v === 2 ? 2 : 2.6;
      for (let i = 0; i < n; i++) {
        const y0 = S * .1 + i * (S * .62 / n);
        ctx.beginPath();
        for (let x = 0; x <= S; x += 6) {
          const d = Math.exp(-Math.pow((x - S * .5) / (S * .18), 2));
          const y = y0 - d * amp * Math.sin(i / n * Math.PI * freq) * 2.2;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    ctx.fillStyle = v === 1 ? b : a;
    const tl = rec.title.toUpperCase();
    const s = fit(ctx, tl, S * .86, 92, 900, DISPLAY, 'condensed');
    ctx.fillText(tl, S * .07, S * .93);
    font(ctx, 600, 18, DISPLAY, 'expanded');
    ctx.fillText(rec.artist.toUpperCase(), S * .07, S * .93 - s - 6);
  }

  function type(ctx, r, rec) {
    const [a, b] = rec.cover.ink, v = rec.cover.variant || 0;
    ctx.fillStyle = rec.cover.paper; ctx.fillRect(0, 0, S, S);
    const words = rec.title.toUpperCase().split(' ');
    ctx.save();
    if (v === 2) { ctx.translate(S, 0); ctx.rotate(Math.PI / 2); }
    let y = S * .2;
    const rows = Math.max(words.length, 3);
    for (let i = 0; i < rows; i++) {
      const w = words[i % words.length];
      const s = fit(ctx, w, S * 1.02, 300, 900, DISPLAY, i % 2 ? 'ultra-condensed' : 'condensed');
      ctx.fillStyle = i === 0 ? a : (i % 2 ? b : hexA(b, .12));
      y += s * .74; ctx.fillText(w, -4, y);
      if (y > S * 1.1) break;
    }
    ctx.restore();
    ctx.fillStyle = b; ctx.fillRect(0, S * .085, S, 6);
    font(ctx, 600, 17, DISPLAY, 'expanded'); ctx.fillStyle = b;
    ctx.fillText(rec.artist.toUpperCase(), S * .05, S * .06);
    font(ctx, 400, 14, MONO); ctx.textAlign = 'right'; ctx.fillText(rec.cat + ' · ' + (rec.orig || rec.year), S * .95, S * .06); ctx.textAlign = 'left';
  }

  function sun(ctx, r, rec) {
    const [a, b] = rec.cover.ink, v = rec.cover.variant || 0;
    ctx.fillStyle = rec.cover.paper; ctx.fillRect(0, 0, S, S);
    const cx = S * .5, cy = S * (.42 + (v % 2) * .04), R = S * .34, step = 13;
    ctx.fillStyle = a;
    for (let y = cy - R; y < cy + R; y += step) for (let x = cx - R; x < cx + R; x += step) {
      const d = Math.hypot(x - cx, y - cy) / R; if (d > 1) continue;
      const rad = step * .5 * (1 - d * .85) * (y < cy + R * .2 ? 1 : .5);
      ctx.beginPath(); ctx.arc(x, y, Math.max(.6, rad), 0, Math.PI * 2); ctx.fill();
    }
    // horizon bands
    ctx.fillStyle = b;
    let hy = cy + R * .25;
    for (let i = 0; i < 9; i++) { const hh = 2 + i * 3.4; ctx.fillRect(0, hy, S, hh); hy += hh + 9 - i * .6; }
    ctx.fillRect(0, hy, S, S - hy);
    ctx.fillStyle = rec.cover.paper;
    font(ctx, 400, 50, SERIF, 'normal', 'italic');
    const t = rec.title; let s = 50; while (ctx.measureText(t).width > S * .86 && s > 22) { s -= 2; font(ctx, 400, s, SERIF, 'normal', 'italic'); }
    ctx.fillText(t, S * .07, S - S * .07);
    ctx.fillStyle = b;
    font(ctx, 700, 20, DISPLAY, 'expanded');
    ctx.fillText(rec.artist.toUpperCase(), S * .07, S * .09);
    font(ctx, 400, 14, MONO); ctx.textAlign = 'right'; ctx.fillText(rec.cat, S * .93, S * .09); ctx.textAlign = 'left';
  }

  function jagged(ctx, r, x, y, w, h) {
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let i = 0; i <= 10; i++) ctx.lineTo(x + w * i / 10, y + (r() - .5) * 5);
    for (let i = 0; i <= 10; i++) ctx.lineTo(x + w + (r() - .5) * 5, y + h * i / 10);
    for (let i = 10; i >= 0; i--) ctx.lineTo(x + w * i / 10, y + h + (r() - .5) * 5);
    for (let i = 10; i >= 0; i--) ctx.lineTo(x + (r() - .5) * 5, y + h * i / 10);
    ctx.closePath();
  }
  function collage(ctx, r, rec) {
    const [a, b] = rec.cover.ink, v = rec.cover.variant || 0;
    ctx.fillStyle = rec.cover.paper; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.translate(S * (.2 + r() * .6), S * (.25 + r() * .45)); ctx.rotate((r() - .5) * .9);
      ctx.fillStyle = i % 2 ? a : b; ctx.globalAlpha = i === 3 ? .85 : 1;
      jagged(ctx, r, -S * (.12 + r() * .14), -S * (.08 + r() * .14), S * (.24 + r() * .26), S * (.16 + r() * .24));
      ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1;
    // halftone disc pasted on
    const hx = S * (v ? .3 : .7), hy = S * .3, hr = S * .17;
    ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#efe9dc'; ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
    ctx.fillStyle = '#1a1a18';
    for (let y = hy - hr; y < hy + hr; y += 8) for (let x = hx - hr; x < hx + hr; x += 8) {
      const k = .5 + .5 * Math.sin((x - hx) * .03 + (y - hy) * .05 + r() * .3);
      ctx.beginPath(); ctx.arc(x, y, 3.8 * k, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // label-maker strip for the title
    ctx.save(); ctx.translate(S * .08, S * .8); ctx.rotate(-.035);
    font(ctx, 800, 40, DISPLAY, 'condensed');
    const tl = rec.title.toUpperCase(); const tw = Math.min(ctx.measureText(tl).width, S * .78);
    ctx.fillStyle = '#141512'; ctx.fillRect(-10, -38, tw + 20, 52);
    ctx.fillStyle = '#efe9dc'; ctx.fillText(tl, 0, 0, S * .78);
    ctx.restore();
    font(ctx, 600, 18, DISPLAY, 'expanded'); ctx.fillStyle = '#141512';
    ctx.fillText(rec.artist.toUpperCase(), S * .08, S * .92);
    font(ctx, 400, 13, MONO); ctx.fillText(rec.cat, S * .08, S * .07);
  }

  const STYLES = { teige, grid, glow, lines, type, sun, collage };

  /* ---------- print & age ---------- */

  function grain(ctx, r, amt) {
    const img = ctx.getImageData(0, 0, S, S), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (r() - .5) * amt;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  function age(ctx, r, rec) {
    const w = rec.wear || {};
    // ring wear: the record pressing through the sleeve
    if (w.ring) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = 'rgba(235,228,210,' + (.18 * w.ring) + ')';
      for (let k = 0; k < 7; k++) {
        ctx.lineWidth = 6 + r() * 14; ctx.beginPath();
        const rad = S * .455 + (r() - .5) * 8, st = r() * Math.PI * 2, len = Math.PI * (.4 + r() * 1.2);
        ctx.arc(S / 2, S / 2, rad, st, st + len); ctx.stroke();
      }
      const g = ctx.createRadialGradient(S / 2, S / 2, S * .05, S / 2, S / 2, S * .46);
      g.addColorStop(0, 'rgba(235,228,210,' + (.07 * w.ring) + ')'); g.addColorStop(1, 'rgba(235,228,210,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      ctx.restore();
    }
    // edge and corner wear
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const e = ctx.createLinearGradient(0, 0, 18, 0); e.addColorStop(0, 'rgba(230,222,205,.35)'); e.addColorStop(1, 'rgba(230,222,205,0)');
    ctx.fillStyle = e; ctx.fillRect(0, 0, 18, S);
    [[0, 0], [S, 0], [0, S], [S, S]].forEach(([x, y]) => {
      const c = ctx.createRadialGradient(x, y, 0, x, y, 40 + r() * 30);
      c.addColorStop(0, 'rgba(232,225,208,.45)'); c.addColorStop(1, 'rgba(232,225,208,0)');
      ctx.fillStyle = c; ctx.fillRect(x - 80, y - 80, 160, 160);
    });
    ctx.restore();
    if (w.seam) {
      ctx.strokeStyle = 'rgba(240,234,220,.85)'; ctx.lineWidth = 2.5; ctx.beginPath();
      let y = S * .62; ctx.moveTo(S - 3, y);
      for (let i = 0; i < 12; i++) { y += 9; ctx.lineTo(S - 3 - r() * 5, y); }
      ctx.stroke();
    }
    if (w.writing) {
      ctx.save(); ctx.translate(S * .1, S * .3); ctx.rotate(-.12);
      font(ctx, 500, 30, SERIF, 'normal', 'italic'); ctx.fillStyle = 'rgba(32,52,140,.78)';
      ctx.fillText(w.writing, 0, 0); ctx.restore();
    }
    if (w.stamp) {
      ctx.save(); ctx.translate(S * .76, S * .74); ctx.rotate(-.3);
      ctx.strokeStyle = 'rgba(96,46,120,.62)'; ctx.fillStyle = 'rgba(96,46,120,.62)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 54, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.stroke();
      font(ctx, 700, 12, MONO); ctx.textAlign = 'center';
      ctx.fillText('LIBRARY', 0, -6); ctx.fillText('OSTRAVA', 0, 9); ctx.fillText('4471', 0, 24);
      ctx.restore(); ctx.textAlign = 'left';
    }
  }

  function render(rec, used) {
    if (cache.has(rec.id)) return cache.get(rec.id);
    const c = document.createElement('canvas'); c.width = c.height = S;
    const ctx = c.getContext('2d');
    const r = rng(hash(rec.id + rec.title));
    ctx.textBaseline = 'alphabetic';
    (STYLES[rec.cover.style] || teige)(ctx, r, rec);
    ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (used) age(ctx, r, rec);
    grain(ctx, r, used ? 30 : 20);
    // faint sheen of a laminated sleeve
    const g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, 'rgba(255,255,255,.05)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.08)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    const url = c.toDataURL('image/jpeg', .88);
    cache.set(rec.id, url);
    return url;
  }

  window.PaternosterCovers = { render, size: S };
})();
