<script>
  // Our own drawing of the neighbourhood from OpenStreetMap data: buildings,
  // streets and paths in quiet warm lines, with today's route lit up and a
  // small dot walking it.
  import data from './neighborhood.json';
  import { routes, ui, home, destination } from './door.svelte.js';

  let { pad = 0.2, offset = [0, 0], label = true } = $props();

  const LAT0 = (data.bbox[0] + data.bbox[2]) / 2;
  const KX = Math.cos((LAT0 * Math.PI) / 180) * 111320, KY = 110540;
  const px = (lon) => (lon - data.bbox[1]) * KX;
  const py = (lat) => (data.bbox[2] - lat) * KY;
  const toPath = (lines, close = false) => lines.map((l) => l.map(([la, lo], i) => `${i ? 'L' : 'M'}${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join('') + (close ? 'Z' : '')).join('');

  // built once: every layer is a single path
  const layers = {
    buildings: toPath(data.buildings, true),
    parks: toPath(data.parks, true),
    paths: toPath(data.path),
    minor: toPath(data.minor),
    major: toPath(data.major),
  };
  const routePaths = routes.map((r) => toPath([r.path]));

  let w = $state(0);
  let h = $state(0);

  const frame = $derived.by(() => {
    if (!w || !h) return null;
    const pts = [...routes[0].path, ...routes[1].path];
    const xs = pts.map((p) => px(p[1])), ys = pts.map((p) => py(p[0]));
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const scale = Math.min((w * (1 - 2 * pad)) / (x1 - x0), (h * (1 - 2 * pad)) / (y1 - y0)); // px per metre
    const vw = w / scale, vh = h / scale;
    const cx = (x0 + x1) / 2 - offset[0] * vw, cy = (y0 + y1) / 2 - offset[1] * vh;
    return { scale, box: `${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}` };
  });
  const u = (pxs) => (frame ? pxs / frame.scale : 0); // screen px to map units
</script>

<div class="nmap" bind:clientWidth={w} bind:clientHeight={h}>
  {#if frame}
    <svg width={w} height={h} viewBox={frame.box} aria-hidden="true">
      <path d={layers.parks} class="park" />
      <path d={layers.buildings} class="building" />
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
      {#if label}
        <text x={px(destination.lon) + u(9)} y={py(destination.lat) + u(3.5)} font-size={u(11)} class="dest-label">{destination.short}</text>
      {/if}
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
