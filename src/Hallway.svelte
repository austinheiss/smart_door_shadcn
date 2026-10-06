<script>
  // hall in one-point perspective. world units = door widths (door is 1 x 2.05).
  // camera walks toward the door as walk.at goes 0 -> 1. the door is the real DOM
  // node (children), only moved/scaled by transform so the screen never reflows.
  import { walk, hall } from './door.svelte.js';

  let { children } = $props();

  const DOOR_H = 2.05;
  const HALF = 0.95; // half hall width
  const CEIL = 2.75;
  const EYE = 1.65; // eye height (~1.6 m for a 2 m door)
  const NEAR_D = 4; // where the hall view ends (long lens keeps the hall in view)
  const FAR_D = 7.8; // at walk 0: door ~half size, still readable
  const S1 = 0.94; // door scale at NEAR_D
  // past this you keep stepping in till the screen nearly fills the view, gaze lifting to it
  const CLOSE_FROM = 0.78;
  const SCREEN = { top: 0.06, height: 0.46, width: 0.78 }; // matches .display in Display.svelte
  const FILL = 0.9;
  const ease = (u) => u * u * (3 - 2 * u);
  const CLIP = 0.06; // near plane
  const BACK = 12; // hall keeps going behind you

  let w = $state(0);
  let h = $state(0);
  let dw = $state(0);
  let dh = $state(0);

  const f2 = (n) => Math.round(n * 10) / 10;

  // sutherland-hodgman against the near plane; polyline, or polygon if closed
  function clip(pts, d, closed = false) {
    const inside = (p) => d - p[2] >= CLIP;
    const out = [];
    const n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      if (inside(a)) out.push(a);
      if (inside(a) !== inside(b)) {
        const k = (d - CLIP - a[2]) / (b[2] - a[2]);
        out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, d - CLIP]);
      }
    }
    if (!closed && n > 1 && inside(pts[n - 1])) out.push(pts[n - 1]);
    return out;
  }

  const g = $derived.by(() => {
    if (!w || !h || !dw) return null;
    const t = walk.at;
    const doorH = dh || dw * DOOR_H;
    // FAR_D -> NEAR_D, then past CLOSE_FROM lean in more (u*u so entering the zone doesn't jerk)
    const u = Math.max(0, (t - CLOSE_FROM) / (1 - CLOSE_FROM));
    const sEnd = Math.max(S1, Math.min((FILL * h) / (SCREEN.height * doorH), (FILL * w) / (SCREEN.width * dw)));
    const dEnd = (S1 * NEAR_D) / sEnd;
    const d = FAR_D + (NEAR_D - FAR_D) * t - (NEAR_D - dEnd) * u * u;
    const F = (S1 * dw * NEAR_D);
    const cx = w / 2;
    // horizon: door foot near frame bottom, then tilt so the screen centre ends mid-frame
    const yStand = 0.975 * h - (EYE * F) / NEAR_D;
    const screenMid = DOOR_H * (1 - SCREEN.top - SCREEN.height / 2); // world units
    const yLook = h / 2 - ((EYE - screenMid) * F) / d;
    const yh = yStand + (yLook - yStand) * ease(u);

    const pr = (p) => {
      const k = F / (d - p[2]);
      return [cx + p[0] * k, yh + (EYE - p[1]) * k];
    };
    const draw = (qs) => qs.map((q, i) => `${i ? 'L' : 'M'}${f2(q[0])} ${f2(q[1])}`).join('');
    const toPath = (pts, closed) => (pts.length < 2 ? '' : draw(pts.map(pr)) + (closed ? 'Z' : ''));
    const poly = (pts) => toPath(clip(pts, d, true), true);
    const line = (pts) => toPath(clip(pts, d), false);
    const seg = (a, b) => line([a, b]);
    const lines = (list) => list.map(([a, b]) => seg(a, b)).join('');
    const vis = (z) => d - z > CLIP + 0.02;
    const ring = (x, y, z, r, n = 28) => {
      const pts = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([x + r * Math.cos(a), y, z + r * Math.sin(a)]); }
      return pts;
    };
    const hull = (pts) => {
      const p = pts.map(pr).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lo = [], up = [];
      for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
      for (const q of [...p].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
      const all = lo.slice(0, -1).concat(up.slice(0, -1));
      return draw(all) + 'Z';
    };

    // side wall coords: u along the hall (z), v height, out = off the wall into the hall
    const wall = (side) => (u, v, out = 0) => [side * (HALF - out), v, u];
    const L = wall(-1), R = wall(1);
    const rect = (P, u0, u1, v0, v1, out = 0) => poly([P(u0, v0, out), P(u1, v0, out), P(u1, v1, out), P(u0, v1, out)]);
    // sides + top only, no line along the floor
    const jamb = (P, u0, u1, v1) => lines([[P(u0, 0), P(u0, v1)], [P(u0, v1), P(u1, v1)], [P(u1, v1), P(u1, 0)]]);
    const disc = (P, u, v, r, out = 0, n = 24) =>
      poly(Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return P(u + r * Math.cos(a), v + r * Math.sin(a), out); }));

    // z positions, from the end wall toward you
    const CAS = 0.08; // casing width
    const a1 = 1.1, b1 = 2.0; // closed door, left wall
    const a2 = 3.3, b2 = 4.2; // open doorway, right wall
    const LEAF = 2.0;

    // ---- hall box
    const ceiling = poly([[-HALF, CEIL, 0], [HALF, CEIL, 0], [HALF, CEIL, BACK], [-HALF, CEIL, BACK]]);
    const floor = poly([[-HALF, 0, 0], [HALF, 0, 0], [HALF, 0, BACK], [-HALF, 0, BACK]]);
    const leftWall = poly([[-HALF, 0, 0], [-HALF, CEIL, 0], [-HALF, CEIL, BACK], [-HALF, 0, BACK]]);
    const rightWall = poly([[HALF, 0, 0], [HALF, CEIL, 0], [HALF, CEIL, BACK], [HALF, 0, BACK]]);
    const endWall = poly([[-HALF, 0, 0], [HALF, 0, 0], [HALF, CEIL, 0], [-HALF, CEIL, 0]]);
    const edges = lines([
      [L(0, 0), L(BACK, 0)],
      [R(0, 0), R(a2 - CAS, 0)], [R(b2 + CAS, 0), R(BACK, 0)], // floor continues into the open room
      [L(0, CEIL), L(BACK, CEIL)], [R(0, CEIL), R(BACK, CEIL)],
      [L(0, 0), L(0, CEIL)], [R(0, 0), R(0, CEIL)], [L(0, CEIL), R(0, CEIL)], [L(0, 0), R(0, 0)],
    ]);

    // ---- floorboards, staggered joints (rug covers them)
    const BOARD = 0.19;
    const boardLines = [];
    const nb = Math.round((2 * HALF) / BOARD);
    const bw = (2 * HALF) / nb;
    for (let k = 1; k < nb; k++) boardLines.push([[-HALF + k * bw, 0, 0], [-HALF + k * bw, 0, BACK]]);
    for (let k = 0; k < nb; k++) {
      const x0 = -HALF + k * bw, x1 = x0 + bw;
      for (let z = ((k * 0.61) % 1.7) + 0.5; z < BACK; z += 1.7) if (vis(z)) boardLines.push([[x0, 0, z], [x1, 0, z]]);
    }
    const boards = lines(boardLines);

    // ---- skirting, broken at each casing
    const SK = 0.11;
    const skirting = lines([
      [L(0, SK), L(a1 - CAS, SK)], [L(b1 + CAS, SK), L(BACK, SK)],
      [R(0, SK), R(a2 - CAS, SK)], [R(b2 + CAS, SK), R(BACK, SK)],
      [[-HALF, SK, 0], [-0.5 - 0.12, SK, 0]], [[0.5 + 0.12, SK, 0], [HALF, SK, 0]],
    ]);

    // ---- smart door casing
    const EC = 0.12;
    const casing = poly([[-0.5 - EC, 0, 0], [0.5 + EC, 0, 0], [0.5 + EC, DOOR_H + EC, 0], [-0.5 - EC, DOOR_H + EC, 0]]);
    const casingLine = lines([
      [[-0.5 - EC, 0, 0], [-0.5 - EC, DOOR_H + EC, 0]], [[-0.5 - EC, DOOR_H + EC, 0], [0.5 + EC, DOOR_H + EC, 0]], [[0.5 + EC, DOOR_H + EC, 0], [0.5 + EC, 0, 0]],
    ]);

    // ---- closed door, left wall; knob on the stile
    const sideDoor = {
      casing: rect(L, a1 - CAS, b1 + CAS, 0, LEAF + CAS),
      casingLine: jamb(L, a1 - CAS, b1 + CAS, LEAF + CAS),
      leaf: rect(L, a1, b1, 0, LEAF),
      leafLine: jamb(L, a1, b1, LEAF),
      panels: rect(L, a1 + 0.14, b1 - 0.14, 0.22, 0.88) + rect(L, a1 + 0.14, b1 - 0.14, 1.08, 1.82),
      knob: disc(L, b1 - 0.07, 0.98, 0.032),
    };

    // ---- open doorway, right wall, its door swung back into the room
    const RW = HALF + 2.4; // room's far wall
    const open = {
      casing: rect(R, a2 - CAS, b2 + CAS, 0, LEAF + CAS),
      casingLine: jamb(R, a2 - CAS, b2 + CAS, LEAF + CAS),
      hole: rect(R, a2, b2, 0, LEAF),
      holeLine: jamb(R, a2, b2, LEAF),
      roomFloor: poly([[HALF, 0, a2 - 2.5], [RW, 0, a2 - 2.5], [RW, 0, b2 + 2.5], [HALF, 0, b2 + 2.5]]),
      roomBase: seg([RW, 0, a2 - 2.5], [RW, 0, b2 + 2.5]),
      // leaf in plane z = a2, hinged on the far jamb
      leaf: poly([[HALF, 0, a2], [HALF + 0.9, 0, a2], [HALF + 0.9, LEAF, a2], [HALF, LEAF, a2]]),
      threshold: seg(R(a2, 0), R(b2, 0)),
    };

    // ---- hook rail, right wall, keys on one hook. drawn at fixed z facing you so they keep their shape
    const HV = 1.62;
    const hookZ = [1.5, 1.9, 2.3];
    const at = (z, o, v) => R(z, v, o); // o = out from wall, v = height
    // hook profile (out, height above HV): arm, round crook, tip up
    const HC = [0.042, -0.026], HR = 0.016;
    const crook = Array.from({ length: 13 }, (_, i) => { const a = ((200 + (160 * i) / 12) * Math.PI) / 180; return [HC[0] + HR * Math.cos(a), HC[1] + HR * Math.sin(a)]; });
    const profile = [[0, 0.012], ...crook, [HC[0] + HR, -0.006]];
    const hookPath = (z) => line(profile.map(([o, v]) => at(z, o, HV + v)));
    const low = [HC[0], HV + HC[1] - HR]; // crook bottom, where things hang
    const kz = hookZ[2], RR = 0.022;
    const ring0 = [low[0], low[1] - RR];
    const key = (tilt) => {
      const c = Math.cos(tilt), sn = Math.sin(tilt);
      const P = (a, b) => at(kz, ring0[0] + a * c - b * sn, ring0[1] - RR + a * sn + b * c);
      const W = 0.009;
      return {
        blade: poly([[-W, -0.04], [W, -0.04], [W, -0.118], [0, -0.128], [-W, -0.118], [-W, -0.104], [-W - 0.011, -0.098], [-W, -0.09], [-W - 0.011, -0.082], [-W, -0.076]].map(([a, b]) => P(a, b))),
        bow: poly(Array.from({ length: 20 }, (_, i) => { const a = (i / 20) * Math.PI * 2; return P(0.024 * Math.cos(a), -0.026 + 0.024 * Math.sin(a)); })),
        hole: poly(Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return P(0.007 * Math.cos(a), -0.012 + 0.007 * Math.sin(a)); })),
      };
    };
    const hooks = {
      rail: rect(R, 1.38, 2.42, HV - 0.035, HV + 0.035),
      hooks: hookZ.map(hookPath).join(''),
      keyRing: vis(kz) ? toPath(Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return at(kz, ring0[0] + RR * Math.cos(a), ring0[1] + RR * Math.sin(a)); }), true) : '',
      keys: vis(kz) ? [key(-0.22), key(0.3)] : [],
    };
    // keys are gone once off the right edge (or behind you)
    const keysGone = !vis(kz) || pr(at(kz, ring0[0] + RR + 0.03, ring0[1]))[0] > w;

    // ---- framed sketch, left wall
    const pa = 2.6, pb = 3.2, pv0 = 1.18, pv1 = 1.66, PM = 0.06;
    const pu = (s) => pa + PM + 0.05 + (pb - pa - 2 * PM - 0.1) * s;
    const pv = (s) => pv0 + PM + 0.05 + (pv1 - pv0 - 2 * PM - 0.1) * s;
    const picture = {
      frame: rect(L, pa, pb, pv0, pv1),
      mat: rect(L, pa + PM, pb - PM, pv0 + PM, pv1 - PM),
      hills: line([[0, 0], [0.22, 0.5], [0.4, 0.28], [0.62, 0.68], [0.85, 0.32], [1, 0.45]].map(([s, t]) => L(pu(s), pv(t)))),
      sun: disc(L, pu(0.3), pv(0.85), 0.03),
    };

    // ---- runner rug
    const rx = 0.42, r0 = 0.3, r1 = 8.5, RB = 0.06;
    const rug = {
      body: poly([[-rx, 0, r0], [rx, 0, r0], [rx, 0, r1], [-rx, 0, r1]]),
      border: poly([[-rx + RB, 0, r0 + RB], [rx - RB, 0, r0 + RB], [rx - RB, 0, r1 - RB], [-rx + RB, 0, r1 - RB]]),
    };

    // ---- one pendant lamp only, so the frame top never cuts a near one into a second shape
    const LZ = 0.9;
    const lamps = d - LZ > 0.45 ? [(() => {
      const top = ring(0, 2.47, LZ, 0.06), rim = ring(0, 2.27, LZ, 0.17);
      // fade as it leaves over the top, instead of a cut sliver
      const yTop = pr([0, 2.47, LZ])[1], yLow = pr([0, 2.27, LZ + 0.17])[1];
      const shown = Math.max(0, Math.min(1, yLow / Math.max(1, yLow - yTop)));
      return {
        fade: Math.max(0, Math.min(1, (shown - 0.45) / 0.45)).toFixed(3),
        rose: hull([...ring(0, CEIL, LZ, 0.05), ...ring(0, CEIL - 0.02, LZ, 0.05)]),
        cord: seg([0, CEIL - 0.02, LZ], [0, 2.47, LZ]),
        shade: hull([...top, ...rim]),
        rim: toPath(rim, true),
      };
    })()] : [];

    // ---- door placement + outline at a constant pen weight
    const k = F / d;
    const s = k / dw;
    const X = cx, Y = yh + EYE * k;
    const hw = (s * dw) / 2, top = Y - s * (dh || dw * DOOR_H);
    const doorLine = `M${f2(X - hw + 1.25)} ${f2(Y)}V${f2(top + 1.25)}H${f2(X + hw - 1.25)}V${f2(Y)}`;

    return {
      ceiling, floor, leftWall, rightWall, endWall, edges, boards, skirting, casing, casingLine,
      sideDoor, open, hooks, picture, rug, lamps, doorLine, keysGone,
      transform: `translate(calc(${f2(X)}px - 50%), calc(${f2(Y)}px - 100%)) scale(${s.toFixed(4)})`,
    };
  });

  $effect(() => {
    if (g) hall.keysGone = g.keysGone;
  });
</script>

<div class="hall" bind:clientWidth={w} bind:clientHeight={h}>
  {#if g}
    <svg class="back" width={w} height={h} viewBox="0 0 {w} {h}" aria-hidden="true">
      <defs><clipPath id="hall-doorway"><path d={g.open.hole} /></clipPath></defs>
      <!-- back to front -->
      <path d={g.ceiling} class="ceil" />
      <path d={g.leftWall} class="side" />
      <path d={g.rightWall} class="side" />
      <path d={g.floor} class="wood" />
      <path d={g.endWall} class="end" />
      <path d={g.boards} class="hair" />
      <path d={g.skirting} class="thin" />
      <path d={g.edges} class="line" />

      <path d={g.casing} class="paper" />
      <path d={g.casingLine} class="line" />

      <path d={g.open.casing} class="paper" />
      <path d={g.open.hole} class="room" />
      <g clip-path="url(#hall-doorway)">
        <path d={g.open.roomFloor} class="room-floor" />
        <path d={g.open.roomBase} class="thin" />
        <path d={g.open.leaf} class="paper thin-stroke" />
      </g>
      <path d={g.open.threshold} class="thin" />
      <path d={g.open.holeLine} class="thin" />
      <path d={g.open.casingLine} class="line" />

      <path d={g.sideDoor.casing} class="paper" />
      <path d={g.sideDoor.casingLine} class="line" />
      <path d={g.sideDoor.leaf} class="paper" />
      <path d={g.sideDoor.leafLine} class="thin" />
      <path d={g.sideDoor.panels} class="thin" />
      <path d={g.sideDoor.knob} class="paper thin-stroke" />

      <path d={g.picture.frame} class="paper line-stroke" />
      <path d={g.picture.mat} class="thin" />
      <path d={g.picture.hills} class="thin" />
      <path d={g.picture.sun} class="sun" />

      <g class="rack">
        <path d={g.hooks.rail} class="paper line-stroke" />
        <path d={g.hooks.hooks} class="line" />
        {#each g.hooks.keys as k, i}
          <path d={k.blade} class={i ? 'paper thin-stroke' : 'brass'} />
          <path d={k.bow} class={i ? 'paper thin-stroke' : 'brass'} />
          <path d={k.hole} class="side thin-stroke" />
        {/each}
        <path d={g.hooks.keyRing} class="thin" />
      </g>

      <path d={g.rug.body} class="rug" />
      <path d={g.rug.border} class="rug-line" />

      {#each g.lamps as l}
        <g opacity={l.fade}>
          <path d={l.cord} class="thin" />
          <path d={l.rose} class="paper thin-stroke" />
          <path d={l.shade} class="paper line-stroke" />
          <path d={l.rim} class="lit" />
        </g>
      {/each}
    </svg>
  {/if}

  <div class="place" bind:offsetWidth={dw} bind:offsetHeight={dh} style:transform={g?.transform} style:visibility={g ? null : 'hidden'}>
    {@render children()}
  </div>

  {#if g}
    <svg class="front" width={w} height={h} viewBox="0 0 {w} {h}" aria-hidden="true">
      <path d={g.doorLine} />
    </svg>
  {/if}
</div>

<style>
  .hall { position: absolute; inset: 0; }
  svg { position: absolute; inset: 0; display: block; pointer-events: none; overflow: hidden; }
  .back path { stroke-linejoin: round; stroke-linecap: round; }

  .ceil { fill: #f6f4ee; }
  .side { fill: #f4f1e9; }
  .end { fill: var(--paper); }
  .wood { fill: #efe7d8; }
  .room { fill: #e9e4d9; }
  .room-floor { fill: #e4dac8; }
  .paper { fill: var(--door); }

  /* two pen weights: structure + detail */
  .line, .thin, .hair, .rug-line { fill: none; }
  .line, .line-stroke { stroke: var(--ink); stroke-width: 2; }
  .thin, .thin-stroke { stroke: var(--ink); stroke-width: 1.2; }
  .hair { stroke: var(--ink); stroke-width: 1; stroke-opacity: .35; }

  .rug { fill: #f8f5ee; stroke: var(--ink); stroke-width: 1.2; }
  .rug-line { stroke: var(--red); stroke-width: 1.2; }
  .brass { fill: var(--yellow); stroke: var(--ink); stroke-width: 1.2; }
  .sun { fill: var(--yellow); stroke: var(--ink); stroke-width: 1; }
  .lit { fill: color-mix(in srgb, var(--yellow) 30%, var(--door)); stroke: var(--ink); stroke-width: 1.2; }

  .place { position: absolute; left: 0; top: 0; transform-origin: 50% 100%; }
  .front path { fill: none; stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: miter; }
</style>
