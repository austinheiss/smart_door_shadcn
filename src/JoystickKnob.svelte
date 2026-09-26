<script>
  // Joystick knob from the sketch: push it any direction to navigate,
  // twist the knob (or push it in) to select.
  import { ui, move, select } from './door.svelte.js';

  let svg;
  let push = $state(null);
  let twist = $state(null);
  const offset = $derived(push ? push : ui.push);
  const turn = $derived(twist ? twist.turn : ui.twist);

  function centre() {
    const r = svg.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, scale: 120 / r.width };
  }
  function nudge(dx, dy) {
    ui.push = { x: dx * 9, y: dy * 9 };
    setTimeout(() => (ui.push = { x: 0, y: 0 }), 170);
    move(dx + dy > 0 ? 1 : -1);
  }

  function capDown(event) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    push = { x: 0, y: 0, sx: event.clientX, sy: event.clientY };
  }
  function capMove(event) {
    if (!push) return;
    const { scale } = centre();
    let x = (event.clientX - push.sx) * scale, y = (event.clientY - push.sy) * scale;
    const d = Math.hypot(x, y);
    if (d > 9) { x *= 9 / d; y *= 9 / d; }
    push = { ...push, x, y };
  }
  function capUp() {
    if (!push) return;
    const { x, y } = push;
    push = null;
    if (Math.hypot(x, y) < 5) return select();
    move(Math.abs(x) > Math.abs(y) ? Math.sign(x) : Math.sign(y));
  }

  const angleAt = (event) => { const c = centre(); return (Math.atan2(event.clientY - c.y, event.clientX - c.x) * 180) / Math.PI; };
  function ringDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    twist = { start: angleAt(event), turn: 0 };
  }
  function ringMove(event) {
    if (!twist) return;
    let d = angleAt(event) - twist.start;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    twist = { ...twist, turn: Math.max(-60, Math.min(60, d)) };
  }
  function ringUp() {
    if (!twist) return;
    twist = null;
    ui.twist = 40;
    setTimeout(() => (ui.twist = 0), 220);
    select();
  }
</script>

<div class="joystick">
  <svg bind:this={svg} viewBox="0 0 120 120" aria-hidden="true">
    <g class="arrows" filter="url(#rough)">
      <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
      <path d="M60 14V2m-5 5 5-5 5 5" onclick={() => nudge(0, -1)} />
      <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
      <path d="M60 106v12m-5-5 5 5 5-5" onclick={() => nudge(0, 1)} />
      <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
      <path d="M14 60H2m5-5-5 5 5 5" onclick={() => nudge(-1, 0)} />
      <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
      <path d="M106 60h12m-5-5 5 5-5 5" onclick={() => nudge(1, 0)} />
    </g>
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events (pointer-only physical control; keyboard equivalents are the buttons below) -->
    <g class="ring" class:grabbing={twist} style:transform={`rotate(${turn}deg)`}
       onpointerdown={ringDown} onpointermove={ringMove} onpointerup={ringUp} onpointercancel={() => (twist = null)}>
      <circle cx="60" cy="60" r="36" filter="url(#rough)" />
      <path d="M60 25v5M95 60h-5M60 95v-5M25 60h5" />
    </g>
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events (pointer-only physical control; keyboard equivalents are the buttons below) -->
    <g class="cap" class:grabbing={push} style:transform={`translate(${offset.x}px, ${offset.y}px)`}
       onpointerdown={capDown} onpointermove={capMove} onpointerup={capUp} onpointercancel={() => (push = null)}>
      <g style:transform={`rotate(${turn}deg)`} style:transform-origin="60px 60px">
        <circle cx="60" cy="60" r="21" filter="url(#rough)" />
        <path filter="url(#rough)" d="M50 60a10 10 0 1 1 7 9.5M70 60H50" />
        <path d="M50 55l0 5 5-1" />
      </g>
    </g>
  </svg>
  <button class="sr" onclick={() => move(-1)}>Push joystick up: previous</button>
  <button class="sr" onclick={() => move(1)}>Push joystick down: next</button>
  <button class="sr" onclick={() => select()}>Twist knob: select</button>
</div>

<style>
  .joystick { position: absolute; left: var(--x); top: var(--y); width: 24%; translate: -50% -50%; }
  svg { display: block; width: 100%; overflow: visible; fill: none; stroke: var(--green); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .arrows path { opacity: .5; cursor: pointer; stroke-width: 2; pointer-events: stroke; }
  .arrows path:hover { opacity: 1; }
  .ring, .cap { transform-origin: 60px 60px; transition: transform .22s cubic-bezier(.3, 1.6, .5, 1); cursor: grab; touch-action: none; }
  .grabbing { transition: none; cursor: grabbing; }
  .ring circle { fill: var(--door); stroke-width: 3; }
  .ring path { stroke-width: 2; }
  .cap circle { fill: color-mix(in srgb, var(--green) 12%, var(--door)); }
  .cap g { transition: transform .22s; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
