<script>
  import Display from './Display.svelte';
  import HandleKnob from './HandleKnob.svelte';
  import JoystickKnob from './JoystickKnob.svelte';
  import { ui, DISTANCES, SKIES, move, select, back, setDistance, setLayout } from './door.svelte.js';

  const doors = [
    { id: 'rect', name: 'Panel' },
    { id: 'strip', name: 'Strip' },
  ];
  // Where the knob sits on each door, as a share of the door's width and height.
  const knobAt = {
    handle: { rect: [82, 62], strip: [58, 50] },
    joystick: { rect: [78, 62], strip: [48, 50] },
  };
  const at = $derived(knobAt[ui.knob][ui.layout]);

  function pulse(key, value, reset) {
    ui[key] = value;
    setTimeout(() => (ui[key] = reset), 170);
  }

  function onkey(event) {
    const k = event.key;
    // Let real buttons keep Enter/Space for themselves.
    if (event.target.closest?.('button') && (k === 'Enter' || k === ' ')) return;
    if (k === 'Escape' || k === 'Backspace') back(true);
    else if (k === 'l' || k === 'L') select();
    else if (ui.knob === 'handle') {
      if (k === 'ArrowDown') { pulse('lever', 24, 0); move(1); }
      else if (k === 'ArrowUp' || k === 'Enter') { pulse('lever', -24, 0); select(); }
      else return;
    } else {
      const dir = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k];
      if (dir) { pulse('push', { x: dir[0] * 9, y: dir[1] * 9 }, { x: 0, y: 0 }); move(dir[0] + dir[1]); }
      else if (k === 'Enter' || k === ' ') { pulse('twist', 40, 0); select(); }
      else return;
    }
    event.preventDefault();
  }
</script>

<svelte:window onkeydown={onkey} />
<svelte:head><title>Smart door</title></svelte:head>

<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
    <feDisplacementMap in="SourceGraphic" scale="1.6" />
  </filter>
</svg>

<main>
  <section class="stage" aria-label="Smart door">
    <div class="door" data-layout={ui.layout}>
      <Display />
      {#if ui.knob === 'handle'}
        <HandleKnob --x="{at[0]}%" --y="{at[1]}%" />
      {:else}
        <JoystickKnob --x="{at[0]}%" --y="{at[1]}%" />
      {/if}
    </div>
    <div class="floor" aria-hidden="true"></div>
  </section>

  <aside class="notes">
    <header>
      <h1>smart door</h1>
      <div class="legend"><span><i class="swatch blue"></i>displays</span><span><i class="swatch green"></i>knobs</span></div>
    </header>

    <section>
      <h2>Doors</h2>
      <div class="picks">
        {#each doors as d}
          <button class="pick" class:on={ui.layout === d.id} aria-pressed={ui.layout === d.id} onclick={() => setLayout(d.id)}>
            <svg viewBox="0 0 40 70" aria-hidden="true">
              <rect x="2" y="2" width="36" height="66" class="ink" />
              {#if d.id === 'rect'}<rect x="7" y="7" width="26" height="26" class="disp" />
              {:else}<rect x="26" y="6" width="8" height="52" class="disp" />{/if}
              {#if ui.knob === 'handle'}<path d={d.id === 'strip' ? 'M17 36h6' : 'M25 40h6'} class="knob" /><circle cx={d.id === 'strip' ? 23 : 31} cy={d.id === 'strip' ? 36 : 40} r="1.6" class="knob dot" />
              {:else}<circle cx={d.id === 'strip' ? 20 : 30} cy={d.id === 'strip' ? 36 : 40} r="2.6" class="knob" />{/if}
            </svg>
            <span>{d.name}</span>
          </button>
        {/each}
      </div>
    </section>

    <hr />

    <section>
      <h2>Knobs</h2>
      <div class="knob-picks">
        <button class="pick wide" class:on={ui.knob === 'handle'} aria-pressed={ui.knob === 'handle'} onclick={() => (ui.knob = 'handle')}>Handle knob</button>
        <button class="pick wide" class:on={ui.knob === 'joystick'} aria-pressed={ui.knob === 'joystick'} onclick={() => (ui.knob = 'joystick')}>Joystick knob</button>
      </div>
      {#if ui.knob === 'handle'}
        <ul class="how">
          <li>down to go to next element</li>
          <li>up to select</li>
          <li>or push lock in to select</li>
        </ul>
      {:else}
        <ul class="how">
          <li>push to navigate</li>
          <li>twist knob or push lock to select</li>
        </ul>
      {/if}
      <p class="aside">{ui.knob === 'handle' ? 'drag the handle, or use ↓ ↑' : 'drag the knob, or use the arrow keys'} · esc goes back</p>
    </section>

    <hr />

    <section>
      <h2>Weather</h2>
      <div class="skies" role="radiogroup" aria-label="Weather shown on the screen">
        {#each SKIES as s}
          <button role="radio" aria-checked={ui.sky === s} class:on={ui.sky === s} onclick={() => (ui.sky = s)}>{s === 'live' ? 'live' : s}</button>
        {/each}
      </div>
    </section>

      <hr />
      <section>
        <h2 class="red">* more detail as you get closer</h2>
        <div class="distance" role="radiogroup" aria-label="How close you are">
          {#each DISTANCES as d, i}
            <button role="radio" aria-checked={ui.distance === i} class:on={ui.distance === i} onclick={() => setDistance(i)}>
              <span class="step" style:--n={i}></span>{d.label}
            </button>
          {/each}
        </div>
        <p class="red or">-or- drag &amp; drop{#if ui.manual}<span class="aside"> (your order)</span>{/if}</p>
      </section>

  </aside>
</main>
