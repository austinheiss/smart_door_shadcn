<script>
  // Rendered weather icons: soft gradients and a little depth, drawn in SVG.
  let { kind = 'sunny', size = '2em', night = false } = $props();
  const id = $props.id();
  const cloud = 'M15 40h22.5a8.5 8.5 0 0 0 1.4-16.9A12 12 0 0 0 16.2 20.4 9.8 9.8 0 0 0 15 40Z';
  const showSun = $derived(['sunny', 'partly', 'hot'].includes(kind) && !night);
  const showMoon = $derived(['sunny', 'partly', 'cold'].includes(kind) && night);
  const showCloud = $derived(['partly', 'cloudy', 'rain', 'storm', 'snow', 'fog'].includes(kind));
  const dark = $derived(kind === 'storm' || kind === 'rain');
</script>

<svg class="wx" width={size} height={size} viewBox="0 0 56 56" aria-hidden="true">
  <defs>
    <radialGradient id="{id}-sun" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff6c2" /><stop offset=".45" stop-color="#ffd34d" /><stop offset="1" stop-color="#ff9f1c" /></radialGradient>
    <radialGradient id="{id}-glow"><stop offset="0" stop-color="#ffcf4d" stop-opacity=".55" /><stop offset="1" stop-color="#ffcf4d" stop-opacity="0" /></radialGradient>
    <linearGradient id="{id}-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color={dark ? '#c9d0db' : '#ffffff'} /><stop offset="1" stop-color={dark ? '#7d8796' : '#cfd8e6'} /></linearGradient>
    <linearGradient id="{id}-drop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff" /><stop offset="1" stop-color="#2f8cff" /></linearGradient>
    <linearGradient id="{id}-bolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3a6" /><stop offset="1" stop-color="#ffb800" /></linearGradient>
    <radialGradient id="{id}-moon" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff" /><stop offset="1" stop-color="#c9d3e6" /></radialGradient>
    <filter id="{id}-soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.6" flood-color="#000" flood-opacity=".35" /></filter>
  </defs>

  {#if kind === 'cold' && !night}
    <g stroke="#bfe6ff" stroke-width="3" stroke-linecap="round" filter="url(#{id}-soft)">
      {#each [0, 60, 120] as a}<g transform="rotate({a} 28 28)"><path d="M28 8v40M22 12l6 5 6-5M22 44l6-5 6 5" fill="none" /></g>{/each}
    </g>
  {/if}
  {#if showSun}
    {@const cx = kind === 'partly' ? 34 : 28}{@const cy = kind === 'partly' ? 20 : 28}{@const r = kind === 'partly' ? 10 : kind === 'hot' ? 13 : 12}
    <circle {cx} {cy} r={r * 2.1} fill="url(#{id}-glow)" />
    <circle {cx} {cy} {r} fill="url(#{id}-sun)" />
  {/if}
  {#if showMoon}
    <path d="M36 12a15 15 0 1 0 10 25A13 13 0 0 1 36 12Z" fill="url(#{id}-moon)" transform={kind === 'partly' ? 'translate(4 -6) scale(.8)' : ''} filter="url(#{id}-soft)" />
  {/if}
  {#if showCloud}
    <path d={cloud} fill="url(#{id}-cloud)" filter="url(#{id}-soft)" transform={kind === 'rain' || kind === 'storm' || kind === 'snow' ? 'translate(0 -6)' : kind === 'fog' ? 'translate(0 -5)' : ''} />
  {/if}
  {#if kind === 'rain'}
    {#each [[19, 40], [28, 43], [37, 40]] as [x, y]}<path d="M{x} {y}l-2.5 6.5a2.6 2.6 0 1 0 5 0Z" fill="url(#{id}-drop)" />{/each}
  {:else if kind === 'storm'}
    <path d="M30 32l-8 11h6.5l-4 10 10.5-13H28.5l3.5-8Z" fill="url(#{id}-bolt)" filter="url(#{id}-soft)" />
    <path d="M17 39l-2 5M40 39l-2 5" stroke="url(#{id}-drop)" stroke-width="2.6" stroke-linecap="round" />
  {:else if kind === 'snow'}
    {#each [[19, 42], [28, 46], [37, 42]] as [x, y]}<circle cx={x} cy={y} r="2.6" fill="#fff" filter="url(#{id}-soft)" />{/each}
  {:else if kind === 'fog'}
    <g stroke="#d9dee6" stroke-width="3" stroke-linecap="round"><path d="M12 42h32M16 48h24" /></g>
  {/if}
</svg>

<style>
  .wx { display: block; flex: none; overflow: visible; }
</style>
