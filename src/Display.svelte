<script>
  import RouteSection from './RouteSection.svelte';
  import WeatherSection from './WeatherSection.svelte';
  import CalendarSection from './CalendarSection.svelte';
  import Icon from './Icon.svelte';
  import { ui, clock, time, tap, walk } from './door.svelte.js';

  const names = { route: 'directions', weather: 'weather', remind: 'calendar' };
  const parts = { route: RouteSection, weather: WeatherSection, remind: CalendarSection };

  // lots of eased stops so the fades don't show kinks
  const ease = (t) => t * t * t * (t * (6 * t - 15) + 10); // smootherstep
  function soft(dir, a, b, c, d) {
    const stops = [];
    const ramp = (from, to, rising) => {
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const alpha = rising ? ease(t) : 1 - ease(t);
        stops.push(`rgba(0,0,0,${alpha.toFixed(4)}) ${(from + (to - from) * t).toFixed(2)}%`);
      }
    };
    if (b > a) ramp(a, b, true); else stops.push(`#000 ${a}%`);
    if (d > c) ramp(c, d, false); else stops.push(`#000 ${c}%`);
    return `linear-gradient(${dir}, ${stops.join(', ')})`;
  }
  // fixed-depth fade at each end, so the open sky's edge lands on the card edge
  function edges(len) {
    const stops = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16; stops.push(`rgba(0,0,0,${ease(t).toFixed(4)}) calc(${len} * ${t.toFixed(4)})`); }
    for (let i = 0; i <= 16; i++) { const t = i / 16; stops.push(`rgba(0,0,0,${(1 - ease(t)).toFixed(4)}) calc(100% - ${len} * ${(1 - t).toFixed(4)})`); }
    return `linear-gradient(to bottom, ${stops.join(', ')})`;
  }
  // map fades in from the left so the directions text sits on black
  function fade(key) {
    if (key === 'weather') return ui.view === key ? edges('2 * var(--inset)') : soft('to bottom', 0, 36, 54, 96);
    if (ui.view === key) return `${soft('to bottom', 0, 14, 60, 100)}, ${soft('to right', 0, 12, 80, 100)}`;
    return `${soft('to bottom', 0, 20, 54, 90)}, ${soft('to right', 18, 52, 80, 100)}`;
  }

  // compact cards all take the tallest measured height so they're equal bands
  const heights = $state({});
  function measure(node, key) {
    const content = () => node.querySelector('.content');
    const set = () => { const c = content(); if (c) heights[key] = Math.ceil(c.offsetHeight); };
    const ro = new ResizeObserver(set);
    const c = content();
    if (c) ro.observe(c, { box: 'border-box' }); // padding changes when compact
    set();
    return { destroy: () => ro.disconnect() };
  }
  const band = $derived(Math.max(0, ...ui.order.filter((k) => ui.view !== 'home' && k !== ui.view).map((k) => heights[k] ?? 0)));

  // squircle corners (|x|^5 + |y|^5 = 1), path in the screen's own px
  function squircle(node) {
    const set = () => {
      const w = node.offsetWidth, h = node.offsetHeight;
      const r = Math.min(w, h) * 0.11, n = 5, steps = 14;
      const pts = [];
      const corner = (cx, cy, from) => {
        for (let i = 0; i <= steps; i++) {
          const a = from + (Math.PI / 2) * (i / steps);
          const c = Math.cos(a), s = Math.sin(a);
          pts.push([cx + r * Math.sign(c) * Math.abs(c) ** (2 / n), cy + r * Math.sign(s) * Math.abs(s) ** (2 / n)]);
        }
      };
      corner(w - r, r, -Math.PI / 2);
      corner(w - r, h - r, 0);
      corner(r, h - r, Math.PI / 2);
      corner(r, r, Math.PI);
      node.style.clipPath = `path('M${pts.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z')`;
    };
    const ro = new ResizeObserver(set);
    ro.observe(node);
    set();
    return { destroy: () => ro.disconnect() };
  }
</script>

<!-- open card = read up close, so use the at-the-door type (d2) -->
<div class="display d{ui.view === 'home' ? ui.distance : 2}" data-view={ui.view} style:--near={walk.at.toFixed(4)} use:squircle>
  <div class="screen">
    <div class="stack" class:expanded={ui.view !== 'home'}>
      {#each ui.order as key (key)}
        {@const Part = parts[key]}
        {@const open = ui.view === key}
        {@const compact = ui.view !== 'home' && !open}
        <div class="sec" data-sec={key} class:open class:compact
             style:--grow={compact ? 0 : 1} use:measure={key} style:--h={band ? `${band}px` : null} style:--fade={fade(key)}>
          <Part expanded={open} />
          {#if open}
            <button class="close-hit" onclick={() => tap(key)} aria-label={`Close ${names[key]}`}></button>
          {:else}
            <button class="hit" onclick={() => tap(key)} aria-label={`Open ${names[key]}`}></button>
          {/if}
        </div>
      {/each}
    </div>

    {#if ui.view === 'home'}
      <span class="clock">{time(clock.now)}<span class="links" aria-label="Wi-Fi and Bluetooth connected" role="img"><Icon name="wifi" /><Icon name="bluetooth" /></span></span>
    {/if}
  </div>
</div>

<style>
  .display {
    position: absolute;
    container-type: size;
    background: #000;
    color: #fff;
    overflow: hidden;
    font-family: var(--d-font);
    font-feature-settings: 'ss01', 'cv11';
    -webkit-font-smoothing: antialiased;
    left: 11%; top: 6%; width: 78%; height: 46%;
  }
  /* grain hides banding in the long fades */
  .screen::after { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 5; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 160px; opacity: .06; mix-blend-mode: overlay; }
  /* glass sheen */
  .display::after { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 3;
    background: linear-gradient(118deg, rgba(255, 255, 255, .07) 0%, rgba(255, 255, 255, .02) 28%, transparent 42%); }

  .screen { position: absolute; inset: 0; font-size: calc(4.2 * 1cqi); line-height: 1.25;
    --px: 1.6em; --pt: 1em; --pb: 1em; --t-say: 1.38em; --t-body: .8em;
    --ink: #f3eee4; --ink2: rgba(243, 238, 228, .64); --ink3: rgba(243, 238, 228, .4); --hair: rgba(243, 238, 228, .12);
    color: var(--ink); }

  button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent; }
  /* d0 = down the hall (sentences only), d1 = + detail line, d2 = at the door (all) */
  .screen :global(.lead), .screen :global(.content > .line) { max-height: 3em; overflow: hidden; transition: opacity .45s, max-height .55s cubic-bezier(.3, .8, .2, 1), margin .55s, font-size .55s cubic-bezier(.3, .8, .2, 1); }
  .d0 .screen :global(.sec:not(.open) .lead), .d0 .screen :global(.sec:not(.open) .content > .line),
  .d1 .screen :global(.sec:not(.open) .lead) { opacity: 0; max-height: 0; margin-top: 0; }
  .d0 .clock, .d1 .clock { opacity: 0; }
  /* at rest type scales with --near: sentences shrink to door size by .9, detail line
     from .6 to .9. door grows faster than type shrinks, so text still looks bigger up close */
  .display[data-view='home'] .screen { --t-say: calc((1.38 + .49 * (1 - min(1, var(--near) / .9))) * 1em); }
  .display[data-view='home'] .screen :global(.sec .content > .line) { font-size: calc((.8 + .17 * clamp(0, (.9 - var(--near)) / .3, 1)) * 1em); text-wrap: balance; }
  /* calendar sentence is longest, give it full width to stay on 2 lines */
  .d0 .screen :global(.sec:not(.open) .cal .sentence), .d1 .screen :global(.sec:not(.open) .cal .sentence) { max-width: none; }
  /* at rest: text centred in each band */
  .stack:not(.expanded) .sec > :global(:is(.route, .weather, .cal)) { display: flex; flex-direction: column; height: 100%; }
  .stack:not(.expanded) .sec :global(.content) { height: auto; margin-block: auto; padding-top: 0; padding-bottom: 0; }
  .screen :global(.sentence) { transition: font-size .55s cubic-bezier(.3, .8, .2, 1); font-size: var(--t-say); font-weight: 300; letter-spacing: -.028em; line-height: 1.14; margin-top: .25em; text-wrap: balance; color: var(--ink); }
  .screen :global(.sentence b) { font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
  /* :where so a card can recolour it */
  :global(:where(.screen .content > .line)) { font-size: var(--t-body); color: var(--ink2); margin-top: .45em; font-variant-numeric: tabular-nums; }
  .screen :global(button:focus-visible) { outline: none; background: rgba(243, 238, 228, .1); box-shadow: 0 0 0 .35em rgba(243, 238, 228, .1); border-radius: .6em; transition: background .25s, box-shadow .25s; }

  .stack { position: absolute; inset: var(--inset); display: flex; flex-direction: column; gap: var(--inset); --inset: .9em; }
  .sec { position: relative; z-index: 1; flex: var(--grow) 1 0; min-height: 0; border-radius: 1.1em; transition: flex-grow .5s cubic-bezier(.3, .8, .2, 1), flex-basis .5s cubic-bezier(.3, .8, .2, 1), opacity .4s; }
  /* bg bleeds into the gaps so neighbours blend */
  .sec:not(.open) :global(.bg) { top: -18%; bottom: -18%; }
  .sec :global(.bg) { pointer-events: none; transition: top .55s cubic-bezier(.3, .8, .2, 1), bottom .55s cubic-bezier(.3, .8, .2, 1), left .55s, right .55s; }
  /* animate flex-basis to the measured height so nothing snaps */
  .sec.compact { opacity: .62; flex-basis: var(--h, 4em); }
  /* sky goes full width like the map */
  .sec[data-sec='weather'] :global(.bg:first-child) { left: calc(-1 * var(--inset)); right: calc(-1 * var(--inset)); }
  /* open sky reaches into the gaps so content looks centred */
  .sec[data-sec='weather'].open :global(.bg:first-child) { top: calc(-1 * var(--inset)); bottom: calc(-1 * var(--inset)); }
  .sec.compact :global(.sentence) { margin-top: 0; }
  .sec.compact > :global(:is(.route, .weather, .cal)) { display: flex; flex-direction: column; }
  .sec.compact :global(.content) { margin-block: auto; padding-top: .75em; padding-bottom: .75em; height: auto; }
  .sec.compact :global(:is(.lead, .content > .line, .radar-layer)) { display: none; }
  .sec[data-sec='weather']:not(.open) :global(.bg:first-child) { top: -30%; bottom: -30%; }
  .close-hit { position: absolute; left: 0; right: 0; top: 0; height: 17%; z-index: 2; }
  .hit { position: absolute; inset: 0; z-index: 2; border-radius: inherit; }
  .clock { position: absolute; top: calc(var(--pt) + .7em); right: calc(var(--px) + .7em); z-index: 2; display: flex; align-items: center; gap: .45em; font-size: var(--t-body); font-weight: 400; color: var(--ink2); font-variant-numeric: tabular-nums; pointer-events: none; transition: opacity .45s; }
  .links { display: flex; gap: .3em; }
</style>
