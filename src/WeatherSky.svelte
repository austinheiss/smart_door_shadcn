<script>
  // animated canvas sky behind the weather card, one scene per condition
  import { onMount } from 'svelte';
  let { kind = 'sunny', night = false } = $props();

  let canvas;

  const SKY = {
    sunny: ['#0f4c92', '#2f7fcf', '#7fbdf0'],
    cloudy: ['#2b333e', '#4a5563', '#77828f'],
    rain: ['#10161f', '#232d3a', '#3b4757'],
    storm: ['#07090e', '#141a25', '#262d3b'],
    snow: ['#2c3848', '#56667a', '#9aabbf'],
    hot: ['#8f2a0e', '#d8611f', '#f7b24a'],
    cold: ['#0a2240', '#2e5e8e', '#a8d0ee'],
  };
  const NIGHT = ['#02050d', '#07122a', '#15264a'];

  const hex = (c) => (Array.isArray(c) ? c : [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
  const blend = (a, b, t) => { const x = hex(a), y = hex(b); return x.map((v, i) => v + (y[i] - v) * t); };
  const mix = (a, b, t) => `rgb(${blend(a, b, t).map(Math.round).join(',')})`;

  function cloudSprite(tone) {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 150;
    const g = c.getContext('2d');
    const puffs = [[70, 95, 52], [130, 70, 64], [200, 82, 58], [255, 100, 42], [160, 108, 50], [100, 112, 40], [225, 115, 38]];
    for (const [x, y, r] of puffs) {
      const rg = g.createRadialGradient(x, y - r * 0.25, r * 0.1, x, y, r);
      rg.addColorStop(0, `rgba(${tone},0.95)`);
      rg.addColorStop(0.6, `rgba(${tone},0.6)`);
      rg.addColorStop(1, `rgba(${tone},0)`);
      g.fillStyle = rg;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
    return c;
  }

  function bolt(x, y, h) {
    const pts = [[x, y]];
    let cx = x, cy = y;
    while (cy < y + h) { cy += 8 + Math.random() * 14; cx += (Math.random() - 0.5) * 26; pts.push([cx, cy]); }
    const branch = pts.slice(2 + Math.floor(Math.random() * 3)).slice(0, 4).map(([px, py], i) => [px + (i + 1) * (10 + Math.random() * 8), py + i * 10]);
    return { pts, branch };
  }

  onMount(() => {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0, last = performance.now();
    let clouds = [], drops = [], flakes = [], stars = [], glints = [];
    let flash = 0, nextFlash = 2 + Math.random() * 3, strike = null;
    const grey = cloudSprite('176,184,196'), dark = cloudSprite('58,64,76');

    function seed() {
      const k = kind;
      const rand = (a, b) => a + Math.random() * (b - a);
      const cloudCount = { cloudy: 7, rain: 7, storm: 8, snow: 6 }[k] ?? 0;
      clouds = Array.from({ length: cloudCount }, (_, i) => ({ x: rand(-0.3, 1.1) * w, y: rand(-0.15, 0.55) * h, s: rand(0.6, 1.4) * (w / 320), v: rand(4, 12) * (i % 2 ? 1 : 0.6), sprite: k === 'storm' || k === 'rain' ? dark : grey, a: rand(0.55, 0.95) }));
      const dropCount = k === 'storm' ? 260 : k === 'rain' ? 170 : 0;
      drops = Array.from({ length: dropCount }, () => { const z = Math.random(); return { x: rand(0, w), y: rand(-h, h), z, len: 8 + z * 16, v: 520 + z * 620 }; });
      const flakeCount = k === 'snow' ? 150 : k === 'cold' ? 40 : 0;
      flakes = Array.from({ length: flakeCount }, () => { const z = Math.random(); return { x: rand(0, w), y: rand(0, h), z, r: (k === 'cold' ? 0.5 : 0.8) + z * (k === 'cold' ? 1.2 : 2.6), v: 14 + z * 42, p: rand(0, 6.28) }; });
      stars = night ? Array.from({ length: 70 }, () => ({ x: rand(0, w), y: rand(0, h * 0.8), r: rand(0.3, 1.2), p: rand(0, 6.28) })) : [];
      glints = k === 'cold' ? Array.from({ length: 26 }, () => ({ x: rand(0, w), y: rand(0, h), p: rand(0, 6.28), s: rand(1.5, 3.5) })) : [];
    }

    // card height changes as focus moves and resizing clears the canvas, so
    // rescale particles and repaint now instead of reseeding (no blink)
    let seeded = false;
    function resize() {
      // layout size, not screen box: the hall scales the door with a transform
      const nw = Math.max(1, canvas.offsetWidth), nh = Math.max(1, canvas.offsetHeight);
      if (seeded && Math.abs(nw - w) < 0.5 && Math.abs(nh - h) < 0.5) return;
      const sx = seeded ? nw / w : 1, sy = seeded ? nh / h : 1;
      // walking up close zooms ~2x, so render at 2x dpr
      dpr = Math.min(4, (window.devicePixelRatio || 1) * 2);
      w = nw; h = nh;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!seeded) { seed(); seeded = true; }
      else for (const list of [clouds, drops, flakes, stars, glints]) for (const p of list) { p.x *= sx; p.y *= sy; }
      draw(performance.now());
    }

    function sky(t) {
      const cols = night ? NIGHT : SKY[kind] ?? SKY.sunny;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      // smoothstep blend so there's no kink at the middle stop
      for (let i = 0; i <= 24; i++) {
        const t = i / 24, u = t < 0.55 ? t / 0.55 : (t - 0.55) / 0.45;
        const e = u * u * (3 - 2 * u);
        // lower half only drifts a bit toward the horizon colour, avoids a bright band
        g.addColorStop(t, t < 0.55 ? mix(cols[0], cols[1], e) : mix(cols[1], blend(cols[1], cols[2], 0.35), e));
      }
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      if (!night && ['sunny', 'hot', 'cold'].includes(kind)) {
        const sx = w * 0.8, sy = h * (kind === 'hot' ? 0.28 : 0.22);
        const pulse = 1 + Math.sin(t * 0.6) * 0.04;
        const r = Math.min(w, h) * (kind === 'hot' ? 0.9 : 0.7) * pulse;
        const tone = kind === 'hot' ? '255,214,120' : kind === 'cold' ? '230,244,255' : '255,236,170';
        const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        rg.addColorStop(0, `rgba(${tone},0.95)`); rg.addColorStop(0.08, `rgba(${tone},0.75)`); rg.addColorStop(0.3, `rgba(${tone},0.22)`); rg.addColorStop(1, `rgba(${tone},0)`);
        ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(t * 0.02); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 12; i++) {
          ctx.rotate((Math.PI * 2) / 12);
          const lg = ctx.createLinearGradient(0, 0, r * 1.3, 0);
          lg.addColorStop(0, `rgba(${tone},${kind === 'hot' ? 0.1 : 0.06})`); lg.addColorStop(1, `rgba(${tone},0)`);
          ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 1.3, -r * 0.06); ctx.lineTo(r * 1.3, r * 0.06); ctx.fill();
        }
        ctx.restore();
      }
      if (night) {
        for (const s of stars) { ctx.fillStyle = `rgba(255,255,255,${0.35 + Math.sin(t * 2 + s.p) * 0.3})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill(); }
        // waxing gibbous moon, no halo: limb shading, faint earthshine, a few maria
        const mx = w * 0.78, my = h * 0.25, mr = Math.min(w, h) * 0.08;
        ctx.save();
        ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.clip();
        ctx.fillStyle = 'rgba(150,165,200,.16)'; ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
        const lit = ctx.createRadialGradient(mx - mr * 0.25, my - mr * 0.3, mr * 0.1, mx, my, mr * 1.05);
        lit.addColorStop(0, '#f6f4ec'); lit.addColorStop(0.75, '#e3e1d6'); lit.addColorStop(1, '#c9c7bd');
        ctx.fillStyle = lit;
        // terminator is an ellipse edge so the shadow side looks round
        ctx.beginPath(); ctx.arc(mx, my, mr, -Math.PI / 2, Math.PI / 2); ctx.ellipse(mx, my, mr * 0.55, mr, 0, Math.PI / 2, -Math.PI / 2); ctx.fill();
        ctx.fillStyle = 'rgba(120,122,130,.22)';
        for (const [dx, dy, r] of [[0.15, -0.35, 0.22], [0.45, 0.05, 0.16], [0.2, 0.3, 0.2], [0.6, -0.4, 0.1]]) { ctx.beginPath(); ctx.arc(mx + dx * mr, my + dy * mr, r * mr, 0, 7); ctx.fill(); }
        ctx.restore();
      }
    }

    function frame(now) {
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function draw(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const t = now / 1000;
      sky(t);

      if (kind === 'hot') {
        // heat shimmer bands
        for (let i = 0; i < 5; i++) {
          const y = h * (0.55 + i * 0.09) + Math.sin(t * 1.3 + i) * 4;
          const g = ctx.createLinearGradient(0, y - 10, 0, y + 10);
          g.addColorStop(0, 'rgba(255,230,180,0)'); g.addColorStop(0.5, `rgba(255,230,180,${0.06 + Math.sin(t * 2 + i) * 0.03})`); g.addColorStop(1, 'rgba(255,230,180,0)');
          ctx.fillStyle = g; ctx.fillRect(0, y - 10, w, 20);
        }
      }

      for (const c of clouds) {
        c.x += c.v * dt;
        const cw = 320 * c.s;
        if (c.x > w + 20) c.x = -cw;
        ctx.globalAlpha = c.a; ctx.drawImage(c.sprite, c.x, c.y, cw, 150 * c.s); ctx.globalAlpha = 1;
      }

      if (drops.length) {
        ctx.lineCap = 'round';
        for (const d of drops) {
          d.y += d.v * dt; d.x -= d.v * dt * 0.12;
          if (d.y > h) { d.y = -d.len - Math.random() * 40; d.x = Math.random() * (w + 60); }
          ctx.strokeStyle = `rgba(190,210,235,${0.18 + d.z * 0.4})`; ctx.lineWidth = 0.6 + d.z * 0.9;
          ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.len * 0.12, d.y - d.len); ctx.stroke();
        }
      }

      for (const f of flakes) {
        f.y += f.v * dt; f.x += Math.sin(t * 0.9 + f.p) * 12 * dt;
        if (f.y > h + 4) { f.y = -4; f.x = Math.random() * w; }
        ctx.fillStyle = `rgba(255,255,255,${0.45 + f.z * 0.5})`; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
      }

      for (const g of glints) {
        const a = Math.max(0, Math.sin(t * 1.6 + g.p));
        if (a < 0.05) continue;
        ctx.strokeStyle = `rgba(235,248,255,${a * 0.85})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(g.x - g.s * a, g.y); ctx.lineTo(g.x + g.s * a, g.y); ctx.moveTo(g.x, g.y - g.s * a); ctx.lineTo(g.x, g.y + g.s * a); ctx.stroke();
      }

      if (kind === 'storm') {
        nextFlash -= dt;
        if (nextFlash <= 0) { flash = 1; strike = bolt(w * (0.2 + Math.random() * 0.6), -4, h * (0.5 + Math.random() * 0.3)); nextFlash = 3 + Math.random() * 5; }
        if (flash > 0) {
          const f = flash * (0.6 + Math.random() * 0.4);
          ctx.fillStyle = `rgba(200,210,255,${f * 0.35})`; ctx.fillRect(0, 0, w, h);
          if (strike && flash > 0.35) {
            ctx.save(); ctx.shadowColor = 'rgba(190,200,255,1)'; ctx.shadowBlur = 14; ctx.strokeStyle = `rgba(245,247,255,${f})`; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
            ctx.beginPath(); strike.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
            ctx.lineWidth = 0.9; ctx.beginPath(); strike.branch.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
            ctx.restore();
          }
          flash -= dt * 2.6;
        }
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener('reseed', seed);
    resize();
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  });

  $effect(() => {
    kind; night;
    canvas?.dispatchEvent(new Event('reseed'));
  });
</script>

<canvas bind:this={canvas} class="sky" aria-hidden="true"></canvas>

<style>
  .sky { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
</style>
