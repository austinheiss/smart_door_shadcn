<script>
  // The screen on the door: directions, weather and today, stacked and
  // blended into one another through black. Selecting a section lets it
  // take over the whole screen.
  import { flip } from 'svelte/animate';
  import RouteSection from './RouteSection.svelte';
  import WeatherSection from './WeatherSection.svelte';
  import CalendarSection from './CalendarSection.svelte';
  import { ui, clock, time, items, tap, hover, unhover, reorder } from './door.svelte.js';

  const names = { route: 'directions', weather: 'weather', remind: 'calendar' };
  const parts = { route: RouteSection, weather: WeatherSection, remind: CalendarSection };
  const grow = { route: 1, weather: 1, remind: 1 };

  let dragging = $state(null);
  const focused = (key) => items()[ui.focus] === key;
  const narrow = $derived(ui.layout === 'strip');

  // Soft fades as one continuous eased curve: many smoothstep stops, so the
  // falloff never shows the kinks that a few straight segments leave behind.
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
  // The sky is one layer with one vertical fade, full width; the map fades in
  // from the left so the directions text sits on black.
  function fade(key) {
    if (key === 'weather') return ui.view === key ? (ui.order[0] === key ? soft('to bottom', 0, 0, 55, 100) : soft('to bottom', 0, 14, 55, 100)) : soft('to bottom', 0, 36, 54, 96);
    if (ui.view === key) return `${soft('to bottom', 0, 14, 60, 100)}, ${soft('to right', 0, 12, 80, 100)}`;
    return `${soft('to bottom', 0, 20, 54, 90)}, ${soft('to right', 18, 52, 80, 100)}`;
  }

  function startDrag(event, key) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragging = key;
  }
  function dragMove(event) {
    if (!dragging) return;
    const over = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-sec]');
    const target = over?.getAttribute('data-sec');
    if (target && target !== dragging) reorder(dragging, ui.order.indexOf(target));
  }
</script>

<div class="display {ui.layout} d{ui.distance}" data-view={ui.view}>
  <div class="screen">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="stack" class:expanded={ui.view !== 'home'} class:picking={ui.focus >= 0} onpointermove={dragMove} onpointerup={() => (dragging = null)} onpointercancel={() => (dragging = null)}>
      {#each ui.order as key, i (key)}
        {@const Part = parts[key]}
        {@const open = ui.view === key}
        {@const compact = ui.view !== 'home' && !open}
        <div class="sec" data-sec={key} class:open class:compact class:focus={ui.view !== key && focused(key)} class:dragging={dragging === key}
             style:--grow={open ? 3.4 : compact ? (narrow ? 1.25 : 1) : grow[key]} style:--fade={fade(key)} animate:flip={{ duration: 450 }}>
          <Part expanded={open} {compact} {narrow} {focused} />
          {#if !open}
            <button class="hit" onclick={() => tap(key)} onpointermove={(e) => e.pointerType === 'mouse' && hover(key)} onpointerleave={() => unhover(key)} aria-label={`Open ${names[key]}`}></button>
          {/if}
          {#if ui.view === 'home'}
            <span class="grip" title="Drag to reorder" onpointerdown={(e) => startDrag(e, key)} aria-hidden="true"></span>
          {:else if open}
            <!-- tapping the open card's sentence puts all three back to rest -->
            <button class="close-hit" onclick={() => tap(key)} aria-label={`Close ${names[key]}`}></button>
          {/if}
        </div>
      {/each}
    </div>

    {#if ui.view === 'home'}<span class="clock">{time(clock.now)}</span>{/if}
  </div>
</div>

<style>
  .display {
    position: absolute;
    container-type: size;
    background: #000;
    color: #fff;
    border: 2px solid var(--blue);
    border-radius: 10px;
    overflow: hidden;
    font-family: var(--d-font);
    font-feature-settings: 'ss01', 'cv11';
    -webkit-font-smoothing: antialiased;
  }
  /* the glass: a black border inside the bezel, a soft inner shadow and a faint sheen */
  /* a whisper of grain over the glass hides 8-bit banding in the long fades */
  .screen::after { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 5; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E"); background-size: 160px; opacity: .06; mix-blend-mode: overlay; }
  .display::after { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit; z-index: 3;
    box-shadow: inset 0 0 0 3px #000;
    background: linear-gradient(118deg, rgba(255, 255, 255, .07) 0%, rgba(255, 255, 255, .02) 28%, transparent 42%); }
  .rect { left: 11%; top: 6%; width: 78%; height: 46%; }
  .strip { left: 67%; top: 7%; width: 27%; height: 76%; }

  /* one spacing rhythm and type scale for every section */
  .screen { position: absolute; inset: 0; font-size: calc(var(--k) * 1cqi); line-height: 1.25;
    --px: 1.6em; --pt: 1em; --pb: 1em; --gap: .5em;
    --t-say: 1.38em; --t-cap: .66em; --t-body: .8em; --t-small: .8em; --t-title: 1.15em; --t-head: 1.55em; --t-display: 3.1em;
    --ink: #f3eee4; --ink2: rgba(243, 238, 228, .64); --ink3: rgba(243, 238, 228, .4); --hair: rgba(243, 238, 228, .12);
    color: var(--ink); }
  .strip .screen { --px: .5em; }
  .strip .screen { --t-display: 2.3em; --t-body: .72em; --t-say: 1.05em; }
  .rect .screen { --k: 4.2; }
  .strip .screen { --k: 12.5; }

  button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; text-align: inherit; -webkit-tap-highlight-color: transparent; }
  /* Distance: from down the hall (d0) only the sentences show, set large; a few
     steps away (d1) the detail line joins them; at the door (d2) everything.
     Small text folds away smoothly rather than popping. */
  .screen :global(.lead), .screen :global(.content > .line) { max-height: 3em; overflow: hidden; transition: opacity .45s, max-height .55s cubic-bezier(.3, .8, .2, 1), margin .55s; }
  .d0 .screen :global(.sec:not(.open) .lead), .d0 .screen :global(.sec:not(.open) .content > .line),
  .d1 .screen :global(.sec:not(.open) .lead) { opacity: 0; max-height: 0; margin-top: 0; }
  .d0 .clock, .d1 .clock { opacity: 0; }
  .clock { transition: opacity .45s; }
  .d0 .screen { --t-say: 1.95em; }
  .d1 .screen { --t-say: 1.62em; }
  .d0.strip .screen { --t-say: 1.4em; }
  .d1.strip .screen { --t-say: 1.2em; }
  .screen :global(.sentence) { transition: font-size .55s cubic-bezier(.3, .8, .2, 1); }
  /* the headline of every card is a sentence; its figure is set a little heavier */
  .screen :global(.sentence) { font-size: var(--t-say); font-weight: 300; letter-spacing: -.028em; line-height: 1.14; margin-top: .25em; text-wrap: balance; color: var(--ink); }
  .screen :global(.sentence b) { font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
  /* inside an open card the knob's item gets a soft lit pill, never a hard outline */
  .screen :global(.focus:not(.sec)), .screen :global(button:focus-visible) { outline: none; background: rgba(243, 238, 228, .1); box-shadow: 0 0 0 .35em rgba(243, 238, 228, .1); border-radius: .6em; transition: background .25s, box-shadow .25s; }

  /* cards: inset from the frame and from each other */
  .stack { position: absolute; inset: var(--inset); display: flex; flex-direction: column; gap: var(--inset); --inset: .9em; }
  .strip .stack { --inset: .45em; }
  .sec { position: relative; z-index: 1; flex: var(--grow) 1 0; min-height: 0; border-radius: 1.1em; transform-origin: center; transition: flex-grow .5s cubic-bezier(.3, .8, .2, 1), opacity .4s, font-size .4s cubic-bezier(.3, .8, .2, 1); }
  /* each card's picture reaches into the gap above and below it, so neighbours dissolve into one another */
  .sec:not(.open) :global(.bg) { top: -18%; bottom: -18%; }
  .sec :global(.bg) { transition: top .55s cubic-bezier(.3, .8, .2, 1), bottom .55s cubic-bezier(.3, .8, .2, 1), left .55s, right .55s; }
  /* while one card is open, the others shrink to their sentence and step back */
  .sec.compact { opacity: .62; }
  .sec.compact.focus { opacity: 1; }
  /* the sky runs to the screen's edges like the map, with no box shape */
  .sec[data-sec='weather'] :global(.bg:first-child) { left: calc(-1 * var(--inset)); right: calc(-1 * var(--inset)); }
  .stack > .sec[data-sec='weather'].open:first-child :global(.bg:first-child) { top: calc(-1 * var(--inset)); }
  .sec[data-sec='weather']:not(.open) :global(.bg:first-child) { top: -30%; bottom: -30%; }
  /* the card the knob is on floats forward; the rest sink back */
  /* (grown through layout and type size rather than a transform: transforms leave seams at the soft edges) */
  .stack.picking:not(.expanded) .sec:not(.focus) { opacity: .42; }
  .stack:not(.expanded) .sec.focus { z-index: 2; font-size: 1.06em; }
  .strip .sec { border-radius: .8em; }
  .sec.dragging { opacity: .55; }
  .close-hit { position: absolute; left: 0; right: 0; top: 0; height: 17%; z-index: 2; }
  .hit { position: absolute; inset: 0; z-index: 2; border-radius: inherit; }
  .grip { position: absolute; right: .35em; top: 50%; translate: 0 -50%; width: .8em; height: 1.4em; z-index: 2; cursor: grab; touch-action: none; opacity: 0; transition: opacity .2s;
    background: radial-gradient(circle, rgba(255, 255, 255, .8) 1px, transparent 1.5px) 0 0 / .4em .4em; }
  .stack:hover .grip, .sec.dragging .grip { opacity: .6; }
  .strip .grip { right: 50%; translate: 50% 0; top: auto; bottom: 18%; width: 1.4em; height: .7em; }

  .clock { position: absolute; top: calc(var(--pt) + .7em); right: calc(var(--px) + .7em); z-index: 2; font-size: var(--t-body); font-weight: 400; color: var(--ink2); font-variant-numeric: tabular-nums; pointer-events: none; }
  .strip .clock { right: 50%; translate: 50% 0; }


</style>
