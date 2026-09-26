<script>
  // Radar as an instrument: precipitation around home inside range rings,
  // no base map. Live mode loops the last two hours of RainViewer frames;
  // previews draw sample cells.
  import { onMount } from 'svelte';
  import MapView from './MapView.svelte';
  import { home } from './door.svelte.js';

  let { live = true, kind = 'rain', zoom = 7.5, showStamp = false } = $props();

  let frames = $state([]);
  let index = $state(0);

  onMount(() => {
    let timer;
    if (live) {
      fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then((r) => r.json())
        .then((d) => {
          frames = [...d.radar.past, ...(d.radar.nowcast ?? [])].map((f) => ({ time: f.time, url: `${d.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png` }));
          index = frames.length - 1;
          const tick = () => { index = (index + 1) % frames.length; timer = setTimeout(tick, index === frames.length - 1 ? 1600 : 420); };
          timer = setTimeout(tick, 1200);
        })
        .catch(() => (frames = []));
    }
    return () => clearTimeout(timer);
  });

  const layers = $derived(frames.map((f, i) => ({ id: `r${f.time}`, url: f.url, maxZoom: 7, opacity: i === index ? 0.9 : 0, className: 'radar' })));
  const stamp = $derived(frames[index] ? new Date(frames[index].time * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '');
  const cells = $derived(kind === 'snow'
    ? [[-0.9, 0.2, 0.9, 'snow'], [0.3, -0.35, 0.7, 'snow'], [-0.1, 0.7, 0.5, 'snow']]
    : [[-1.1, 0.1, 0.9, 'rain'], [0.15, -0.45, 0.65, kind === 'storm' ? 'storm' : 'rain'], [-0.3, 0.6, 0.5, 'rain'], [0.7, 0.35, 0.4, kind === 'storm' ? 'storm' : 'rain']]);
  const MILES = [10, 25, 50];
</script>

<div class="scope">
  <MapView center={[home.lat, home.lon]} {zoom} {layers}>
    {#snippet overlay(project)}
      {@const [hx, hy] = project(home.lat, home.lon)}
      {@const perMile = hy - project(home.lat + 1 / 69, home.lon)[1]}
      <defs>
        <radialGradient id="rs-rain"><stop offset="0" stop-color="#f4d35e" stop-opacity=".9" /><stop offset=".35" stop-color="#5fc98f" stop-opacity=".75" /><stop offset="1" stop-color="#2a7f5c" stop-opacity="0" /></radialGradient>
        <radialGradient id="rs-storm"><stop offset="0" stop-color="#f25f5c" stop-opacity=".95" /><stop offset=".3" stop-color="#f4a259" stop-opacity=".85" /><stop offset=".6" stop-color="#5fc98f" stop-opacity=".55" /><stop offset="1" stop-color="#2a7f5c" stop-opacity="0" /></radialGradient>
        <radialGradient id="rs-snow"><stop offset="0" stop-color="#ffffff" stop-opacity=".85" /><stop offset=".45" stop-color="#a9d2ff" stop-opacity=".55" /><stop offset="1" stop-color="#5a8fd8" stop-opacity="0" /></radialGradient>
      </defs>
      {#each MILES as m}
        <circle cx={hx} cy={hy} r={m * perMile} class="ring" />
        <text x={hx + m * perMile * 0.707 + 3} y={hy - m * perMile * 0.707 - 3} class="ring-label">{m} mi</text>
      {/each}
      <path d="M{hx - 50 * perMile} {hy}H{hx + 50 * perMile}M{hx} {hy - 50 * perMile}V{hy + 50 * perMile}" class="cross" />
      {#if !live}
        <g class="cells">
          {#each cells as [dx, dy, r, c]}<ellipse cx={hx + dx * 25 * perMile} cy={hy + dy * 25 * perMile} rx={r * 30 * perMile} ry={r * 20 * perMile} fill="url(#rs-{c})" />{/each}
        </g>
      {/if}
      <circle cx={hx} cy={hy} r="10" class="pulse" />
      <circle cx={hx} cy={hy} r="3.2" class="me" />
    {/snippet}
  </MapView>
  {#if showStamp}<span class="stamp">{live ? stamp : 'Sample radar'}</span>{/if}
</div>

<style>
  .scope { position: absolute; inset: 0; }
  .scope :global(.radar) { mix-blend-mode: screen; }
  .ring { fill: none; stroke: rgba(243, 238, 228, .16); stroke-width: 1; }
  .cross { stroke: rgba(243, 238, 228, .07); stroke-width: 1; }
  .ring-label { font: 500 .5em var(--d-font); fill: rgba(243, 238, 228, .4); }
  .cells { animation: drift 16s linear infinite; }
  @keyframes drift { from { transform: translate(-30px, -5px); } to { transform: translate(30px, 5px); } }
  .me { fill: #fff; }
  .pulse { fill: rgba(255, 255, 255, .25); transform-box: fill-box; transform-origin: center; animation: pulse 2.6s ease-out infinite; }
  @keyframes pulse { from { transform: scale(.3); opacity: 1; } to { transform: scale(2); opacity: 0; } }
  .stamp { position: absolute; right: var(--px); bottom: var(--pb); font-size: var(--t-cap); color: var(--ink3); font-variant-numeric: tabular-nums; }
</style>
