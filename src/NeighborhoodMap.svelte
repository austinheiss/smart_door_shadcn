<script>
  // our own neighbourhood drawing from OSM data, route lit + walking dot
  import data from './neighborhood.json';
  import { routes, ui, home, destination } from './door.svelte.js';

  // area: [left, top, right, bottom] as fractions of the box, where routes get fitted
  let { area = [0.2, 0.2, 0.8, 0.8] } = $props();

  const LAT0 = (data.bbox[0] + data.bbox[2]) / 2;
  const KX = Math.cos((LAT0 * Math.PI) / 180) * 111320, KY = 110540;
  const px = (lon) => (lon - data.bbox[1]) * KX;
  const py = (lat) => (data.bbox[2] - lat) * KY;
  const toPath = (lines, close = false) => lines.map((l) => l.map(([la, lo], i) => `${i ? 'L' : 'M'}${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join('') + (close ? 'Z' : '')).join('');

  // built once, one path per layer
  const layers = {
    buildings: toPath(data.buildings, true),
    parks: toPath(data.parks, true),
    paths: toPath(data.path),
    minor: toPath(data.minor),
    major: toPath(data.major),
  };
  const routePaths = routes.map((r) => toPath([r.path]));
  const B = data.buildingsBbox;
  const bb = { x: px(B[1]), y: py(B[2]), w: px(B[3]) - px(B[1]), h: py(B[0]) - py(B[2]) };

  let w = $state(0);
  let h = $state(0);

  const frame = $derived.by(() => {
    if (!w || !h) return null;
    const pts = [...routes[0].path, ...routes[1].path];
    const xs = pts.map((p) => px(p[1])), ys = pts.map((p) => py(p[0]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const [a0, b0, a1, b1] = area;
    const scale = Math.min((w * (a1 - a0)) / (x1 - x0), (h * (b1 - b0)) / (y1 - y0)); // px per metre
    const vw = w / scale, vh = h / scale;
    const cx = (x0 + x1) / 2 - ((a0 + a1) / 2 - 0.5) * vw, cy = (y0 + y1) / 2 - ((b0 + b1) / 2 - 0.5) * vh;
    return { scale, box: `${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}` };
  });
  const u = (pxs) => (frame ? pxs / frame.scale : 0); // screen px to map units
</script>

<div class="nmap" bind:clientWidth={w} bind:clientHeight={h}>
  {#if frame}
    <svg width={w} height={h} viewBox={frame.box} aria-hidden="true">
      <path d={layers.parks} class="park" />
      <!-- building data covers less than streets, so fade it out before its edge -->
      <defs>
        <linearGradient id="b-x" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset=".18" stop-color="#fff" /><stop offset=".82" stop-color="#fff" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></linearGradient>
        <linearGradient id="b-y" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0" /><stop offset=".18" stop-color="#fff" /><stop offset=".82" stop-color="#fff" /><stop offset="1" stop-color="#fff" stop-opacity="0" /></linearGradient>
        <mask id="b-mx" maskUnits="userSpaceOnUse" x={bb.x} y={bb.y} width={bb.w} height={bb.h}><rect x={bb.x} y={bb.y} width={bb.w} height={bb.h} fill="url(#b-x)" /></mask>
        <mask id="b-my" maskUnits="userSpaceOnUse" x={bb.x} y={bb.y} width={bb.w} height={bb.h}><rect x={bb.x} y={bb.y} width={bb.w} height={bb.h} fill="url(#b-y)" /></mask>
      </defs>
      <g mask="url(#b-mx)"><path d={layers.buildings} class="building" mask="url(#b-my)" /></g>
      <path d={layers.paths} class="path" />
      <path d={layers.minor} class="minor" />
      <path d={layers.major} class="major" />

      {#each routePaths as d, i}
        {#if i !== ui.route}<path {d} class="alt" />{/if}
      {/each}
      <path d={routePaths[ui.route]} class="route-glow" />
      <path d={routePaths[ui.route]} class="route" id="today-route" />

      <circle cx={px(home.lon)} cy={py(home.lat)} r={u(4.5)} class="home" style:stroke-width="{u(1.6)}px" />
      <circle cx={px(destination.lon)} cy={py(destination.lat)} r={u(4)} class="dest" />
      <circle r={u(2.6)} class="walker">
        <animateMotion dur={ui.route === 0 ? '9s' : '4.5s'} repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear" path={routePaths[ui.route]} />
      </circle>
      <!-- end-anchored at the dot so long names don't run off the card -->
      <text x={px(destination.lon) + u(4)} y={py(destination.lat) - u(9)} font-size={u(11)} text-anchor="end" class="dest-label">{destination.short}</text>
    </svg>
  {/if}
</div>

<style>
  .nmap { position: absolute; inset: 0; }
  svg { display: block; }
  path { vector-effect: non-scaling-stroke; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .park { fill: rgba(150, 175, 130, .14); stroke: none; }
  .building { fill: rgba(243, 236, 222, .085); stroke: none; }
  .path { stroke: rgba(243, 236, 222, .16); stroke-width: .6; stroke-dasharray: 1 2.5; }
  .minor { stroke: rgba(243, 236, 222, .26); stroke-width: 1; }
  .major { stroke: rgba(243, 236, 222, .42); stroke-width: 1.8; }
  .alt { stroke: rgba(243, 236, 222, .32); stroke-width: 1.2; stroke-dasharray: 2 4; }
  .route-glow { stroke: var(--route); stroke-width: 9; opacity: .18; }
  .route { stroke: var(--route); stroke-width: 2.6; transition: stroke .4s; }
  .home { fill: #0c0b0a; stroke: var(--route); }
  .dest { fill: var(--route); }
  .walker { fill: #fff; }
  .dest-label { font-family: var(--d-font); font-weight: 600; fill: rgba(243, 238, 228, .85); letter-spacing: .02em; }
</style>
