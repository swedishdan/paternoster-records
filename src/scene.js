/* Paternoster — the shaft, in three dimensions.
   You stand on the ground-floor landing in front of the enamel wall. Fourteen oak
   cabins ride a continuous loop behind two openings. Scroll flies the camera in
   and up through the slab. Units are metres; one floor is 4.2 m. */
(function () {
  'use strict';

  const FH = 4.2, FLOORS = 6, R = 0.8, YBOT = -3, YTOP = 5 * FH + 3.5;
  const LS = YTOP - YBOT, ARC = Math.PI * R, LOOP = 2 * LS + 2 * ARC, N = 14, PITCH = LOOP / N;
  const CW = 1.0, CH = 2.2, CD = 0.95;
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  function pathPoint(d) {
    d = ((d % LOOP) + LOOP) % LOOP;
    if (d < LS) return [-R, YBOT + d, 'up'];
    d -= LS;
    if (d < ARC) { const a = d / R; return [-R * Math.cos(a), YTOP + R * Math.sin(a), 'top']; }
    d -= ARC;
    if (d < LS) return [R, YTOP - d, 'down'];
    d -= LS; const a = d / R;
    return [R * Math.cos(a), YBOT - R * Math.sin(a), 'bottom'];
  }

  function create(canvas, opts) {
    const THREE = window.THREE;
    const col = h => new THREE.Color(h).convertSRGBToLinear();
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 1.75));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    const FOG = col('#0a1028');
    scene.background = FOG; scene.fog = new THREE.Fog(FOG, 6, 22);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 80);

    function canvasTex(w, h, draw, repeat) {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
      if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
      return t;
    }
    const noise = (x, w, h, a, dark) => { for (let i = 0; i < w * h * .08; i++) { x.fillStyle = (Math.random() < .5 ? (dark || 'rgba(0,0,0,') : 'rgba(255,255,255,') + (Math.random() * a) + ')'; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };

    const oakTex = canvasTex(256, 512, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#a3734a'); g.addColorStop(.45, '#7b5536'); g.addColorStop(1, '#3b2819');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { const px = Math.random() * w; x.strokeStyle = 'rgba(45,25,10,' + (Math.random() * .14) + ')'; x.lineWidth = .5 + Math.random() * 1.5; x.beginPath(); x.moveTo(px, 0); x.bezierCurveTo(px + 6, h * .3, px - 6, h * .6, px + 3, h); x.stroke(); }
      for (let i = 1; i < 4; i++) { x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(i * w / 4 - 1, 0, 2, h); }
      const r = x.createRadialGradient(w / 2, 0, 0, w / 2, 0, h * .65); r.addColorStop(0, 'rgba(255,214,140,.65)'); r.addColorStop(1, 'rgba(255,214,140,0)');
      x.fillStyle = r; x.fillRect(0, 0, w, h);
    });
    const darkWood = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#2e1f14'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? '#3a271a' : '#33231a'; x.fillRect(0, i * h / 6, w, h / 6 - 2); } });
    const concrete = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#25272c'; x.fillRect(0, 0, w, h); noise(x, w, h, .12); }, [2, 10]);
    const slabTex = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#17181b'; x.fillRect(0, 0, w, h); noise(x, w, h, .1); x.fillStyle = 'rgba(242,239,230,.5)'; x.fillRect(0, 0, w, 2); }, [8, 1]);
    const wallTex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#1F45A8'; x.fillRect(0, 0, w, h); noise(x, w, h, .05, 'rgba(10,20,60,'); }, [6, 12]);
    function plateTex(label, inv) {
      return canvasTex(256, 200, (x, w, h) => {
        const bg = inv ? '#F2EFE6' : '#1F45A8', fg = inv ? '#1F45A8' : '#F2EFE6';
        x.fillStyle = bg; x.beginPath(); x.roundRect ? x.roundRect(0, 0, w, h, 26) : x.rect(0, 0, w, h); x.fill();
        x.strokeStyle = fg; x.lineWidth = 7; x.beginPath(); x.roundRect ? x.roundRect(14, 14, w - 28, h - 28, 16) : x.rect(14, 14, w - 28, h - 28); x.stroke();
        x.fillStyle = fg; x.font = '700 130px Archivo, Arial Narrow, sans-serif'; if ('fontStretch' in x) x.fontStretch = 'condensed';
        x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, w / 2, h / 2 + 8);
        const sh = x.createLinearGradient(0, 0, w, h); sh.addColorStop(0, 'rgba(255,255,255,.28)'); sh.addColorStop(.45, 'rgba(255,255,255,0)'); x.fillStyle = sh; x.fillRect(0, 0, w, h);
      });
    }
    function signTex(text) {
      return canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#F2EFE6'; x.font = '500 34px "IBM Plex Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, h / 2); });
    }

    /* ---------- the building ---------- */
    const wallShape = new THREE.Shape();
    wallShape.moveTo(-8, YBOT - 3); wallShape.lineTo(8, YBOT - 3); wallShape.lineTo(8, YTOP + 6); wallShape.lineTo(-8, YTOP + 6); wallShape.lineTo(-8, YBOT - 3);
    const holes = [];
    for (let f = 0; f < FLOORS; f++) {
      const y0 = f * FH;
      [[-1.35, -0.25], [0.25, 1.35]].forEach(([a, b]) => { const h = new THREE.Path(); h.moveTo(a, y0); h.lineTo(a, y0 + 2.3); h.lineTo(b, y0 + 2.3); h.lineTo(b, y0); h.lineTo(a, y0); wallShape.holes.push(h); holes.push([a, b, y0]); });
    }
    const wallGeo = new THREE.ShapeGeometry(wallShape);
    const uv = wallGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 16, uv.getY(i) / 16);
    const wall = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ map: wallTex, roughness: .42, metalness: .05 }));
    scene.add(wall);
    const white = new THREE.MeshStandardMaterial({ color: col('#F2EFE6'), roughness: .35 });
    holes.forEach(([a, b, y0]) => {
      const w = b - a, cx = (a + b) / 2, t = .07;
      [[w + 2 * t, t, cx, y0 + 2.3 + t / 2], [t, 2.3, a - t / 2, y0 + 1.15], [t, 2.3, b + t / 2, y0 + 1.15]].forEach(([bw, bh, x, y]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, .06), white); m.position.set(x, y, .03); scene.add(m);
      });
    });
    const plateGeo = new THREE.PlaneGeometry(.44, .34), signGeo = new THREE.PlaneGeometry(.6, .15);
    ['P', '1', '2', '3', '4', '5'].forEach((f, i) => {
      const p = new THREE.Mesh(plateGeo, new THREE.MeshStandardMaterial({ map: plateTex(f, true), roughness: .3 }));
      p.position.set(0, i * FH + 1.62, .02); scene.add(p);
      const up = new THREE.Mesh(signGeo, new THREE.MeshBasicMaterial({ map: signTex('▲ UP'), transparent: true }));
      up.position.set(-.8, i * FH + 2.55, .02); scene.add(up);
      const dn = new THREE.Mesh(signGeo, new THREE.MeshBasicMaterial({ map: signTex('▼ DOWN'), transparent: true }));
      dn.position.set(.8, i * FH + 2.55, .02); scene.add(dn);
    });
    // landings: concrete slabs in front of the wall, one per floor
    const slabMat = new THREE.MeshStandardMaterial({ map: slabTex, roughness: .9 });
    const floorTop = new THREE.MeshStandardMaterial({ color: col('#34363b'), roughness: .7 });
    const slabCenters = [];
    for (let f = 0; f < FLOORS + 1; f++) {
      const y = f * FH - .16; slabCenters.push(y);
      const s = new THREE.Mesh(new THREE.BoxGeometry(16, .32, 3.6), [slabMat, slabMat, floorTop, slabMat, slabMat, slabMat]);
      s.position.set(0, y, 1.8); scene.add(s);
    }
    // the shaft behind the wall
    const shaftMat = new THREE.MeshStandardMaterial({ map: concrete, roughness: .95 });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(3.6, YTOP - YBOT + 12), shaftMat);
    back.position.set(0, (YTOP + YBOT) / 2, -1.25); scene.add(back);
    [-1.75, 1.75].forEach(x => { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.3, YTOP - YBOT + 12), shaftMat); s.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; s.position.set(x, (YTOP + YBOT) / 2, -.62); scene.add(s); });
    const railMat = new THREE.MeshStandardMaterial({ color: col('#3a3d44'), roughness: .4, metalness: .7 });
    [-1.38, -.22, .22, 1.38].forEach(x => { const r = new THREE.Mesh(new THREE.BoxGeometry(.05, YTOP - YBOT + 12, .07), railMat); r.position.set(x, (YTOP + YBOT) / 2, -1.12); scene.add(r); });
    const chainMat = new THREE.MeshStandardMaterial({ color: col('#4a4d55'), roughness: .5, metalness: .8 });
    [-1.1, -.5, .5, 1.1].forEach(x => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, YTOP - YBOT + 12, 6), chainMat); c.position.set(x, (YTOP + YBOT) / 2, -1.18); scene.add(c); });

    /* ---------- lights ---------- */
    scene.add(new THREE.AmbientLight(col('#6b7ab0'), .55));
    scene.add(new THREE.HemisphereLight(col('#9fb4ff'), col('#1a1208'), .35));
    for (let f = 0; f < FLOORS; f++) { const l = new THREE.PointLight(col('#ffd9a0'), .7, 9, 2); l.position.set(0, f * FH + 3.4, 2.2); scene.add(l); }

    /* ---------- cabins ---------- */
    const loader = new THREE.TextureLoader();
    const recGeo = new THREE.PlaneGeometry(.64, .64);
    const cabins = [], pickables = [];
    function makeCabin(slot, i) {
      const g = new THREE.Group();
      const oak = new THREE.MeshStandardMaterial({ map: oakTex, emissive: col('#ffffff'), emissiveMap: oakTex, emissiveIntensity: .42, roughness: .8 });
      const side = new THREE.MeshStandardMaterial({ map: oakTex, emissive: col('#ffffff'), emissiveMap: oakTex, emissiveIntensity: .22, roughness: .85, side: THREE.DoubleSide });
      const floor = new THREE.MeshStandardMaterial({ map: darkWood, emissive: col('#3a2414'), emissiveIntensity: .4, roughness: .9 });
      const frame = new THREE.MeshStandardMaterial({ color: col('#1b1713'), roughness: .6 });
      const backP = new THREE.Mesh(new THREE.PlaneGeometry(CW, CH), oak); backP.position.z = -CD / 2; g.add(backP);
      [-1, 1].forEach(sd => { const s = new THREE.Mesh(new THREE.PlaneGeometry(CD, CH), side); s.rotation.y = sd * Math.PI / 2; s.position.x = sd * CW / 2; g.add(s); });
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(CW, CD), floor); fl.rotation.x = -Math.PI / 2; fl.position.y = -CH / 2; g.add(fl);
      const ce = new THREE.Mesh(new THREE.PlaneGeometry(CW, CD), floor); ce.rotation.x = Math.PI / 2; ce.position.y = CH / 2; g.add(ce);
      const top = new THREE.Mesh(new THREE.BoxGeometry(CW + .08, .14, CD + .04), frame); top.position.y = CH / 2 + .07; g.add(top);
      const bot = new THREE.Mesh(new THREE.BoxGeometry(CW + .08, .18, CD + .04), frame); bot.position.y = -CH / 2 - .09; g.add(bot);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(CW, .02, .04), white); lip.position.set(0, -CH / 2 + .005, CD / 2 - .02); g.add(lip);
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(.34, .035, .14), new THREE.MeshBasicMaterial({ color: col('#ffd58a') })); lamp.position.y = CH / 2 - .03; g.add(lamp);
      let face = null;
      if (slot.cover) {
        const m = new THREE.MeshBasicMaterial({ color: col('#e9e6df') });
        loader.load(slot.cover, t => { t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; m.map = t; m.needsUpdate = true; });
        face = new THREE.Mesh(recGeo, m); face.position.set(0, -CH / 2 + .02 + .32, -CD / 2 + .1); face.rotation.x = -.07; face.rotation.z = ((i * 37) % 7 - 3) * .01; g.add(face);
      } else if (slot.label) {
        face = new THREE.Mesh(new THREE.PlaneGeometry(.5, .39), new THREE.MeshBasicMaterial({ map: plateTex(slot.label, false) }));
        face.position.set(0, -CH / 2 + .9, -CD / 2 + .05); g.add(face);
      }
      [backP, fl].concat(face ? [face] : []).forEach(m => { m.userData.slot = i; pickables.push(m); });
      g.userData = { oak, side, glow: .42, target: .42 };
      scene.add(g);
      return g;
    }
    opts.slots.forEach((s, i) => cabins.push(makeCabin(s, i)));

    /* ---------- state ---------- */
    const st = { s: PITCH * 0.3, mult: 1, progress: 0, intro: 0, px: 0, py: 0, tx: 0, ty: 0, hover: -1, near: { up: -1, down: -1 }, w: 1, h: 1, dark: 0 };
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();

    function resize(w, h) {
      st.w = w; st.h = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < .8 ? 62 : w / h < 1.2 ? 48 : 36;
      camera.updateProjectionMatrix();
    }
    function pick(cx, cy) {
      ndc.set(cx / st.w * 2 - 1, -(cy / st.h) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      return hit ? hit.object.userData.slot : -1;
    }

    function frame(dt, speedBoost) {
      // cabins
      const halt = opts.isStopped();
      st.mult = lerp(st.mult, halt ? 0 : (st.hover >= 0 ? .25 : 1) + speedBoost, 1 - Math.exp(-dt * (halt ? 6 : 2.2)));
      st.s += .55 * st.mult * dt;
      const best = { up: [-1, 1e9], down: [-1, 1e9] };
      cabins.forEach((g, i) => {
        const [x, y, dir] = pathPoint(st.s + i * PITCH);
        g.position.set(x, y, -.58);
        const u = g.userData; u.target = i === st.hover ? .95 : .42;
        u.glow = lerp(u.glow, u.target, 1 - Math.exp(-dt * 8)); u.oak.emissiveIntensity = u.glow; u.side.emissiveIntensity = u.glow * .5;
        if (dir === 'up' || dir === 'down') { const d = Math.abs(y - 1.15); if (d < best[dir][1]) best[dir] = [i, d]; }
      });
      ['up', 'down'].forEach(k => { if (best[k][0] !== st.near[k]) { st.near[k] = best[k][0]; opts.onPassing && opts.onPassing(k, best[k][0]); } });

      // camera: intro drop, scroll flight, pointer parallax
      st.px = lerp(st.px, st.tx, 1 - Math.exp(-dt * 3)); st.py = lerp(st.py, st.ty, 1 - Math.exp(-dt * 3));
      const p = st.progress, p1 = smooth(0, .55, p), p2 = smooth(.4, 1, p);
      const introY = st.intro * st.intro * 9.5;
      const z = lerp(opts.mobile ? 6.4 : 5.6, 2.4, p1);
      const y = lerp(1.55, 2.05, p1) + p2 * (slabCenters[1] - 2.05) + introY;
      const x = lerp(0, -.25, p2);
      const free = 1 - p2;
      camera.position.set(x + st.px * .45 * free, y + st.py * .22 * free, z);
      camera.lookAt(x * .6 + st.px * .1, y - .15 - introY * .25 + (opts.mobile ? .25 : 0), 0);
      camera.rotation.z += st.px * -.012 * free;
      // the slab swallows the camera
      let dark = 0;
      slabCenters.forEach(c => { dark = Math.max(dark, 1 - Math.max(0, Math.abs(camera.position.y - c) - .14) / .75); });
      st.dark = Math.max(0, Math.min(1, dark));
      renderer.render(scene, camera);
      return st.dark;
    }

    return {
      resize, frame, pick,
      set progress(v) { st.progress = v; }, get progress() { return st.progress; },
      set intro(v) { st.intro = v; }, get intro() { return st.intro; },
      pointer(x, y) { st.tx = x; st.ty = y; },
      hover(i) { st.hover = i; },
      dispose() { renderer.dispose(); }
    };
  }

  function supported() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; }
  }
  window.PaternosterScene = { create, supported };
})();
