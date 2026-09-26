<script>
  // Handle knob from the sketch: push the lever down to go to the next
  // element, lift it up to select, or push the lock in to select.
  import { ui, move, select } from './door.svelte.js';

  let drag = $state(null);
  let pressed = $state(false);
  const angle = $derived(drag ? drag.angle : ui.lever);

  function down(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag = { y: event.clientY, angle: 0, moved: false };
  }
  function moveLever(event) {
    if (!drag) return;
    const dy = event.clientY - drag.y;
    drag.angle = Math.max(-28, Math.min(28, dy * 0.7));
    if (Math.abs(dy) > 4) drag.moved = true;
  }
  function up() {
    if (!drag) return;
    const { angle, moved } = drag;
    drag = null;
    if (angle < -12) select();
    else if (angle > 12 || !moved) move(1);
  }
  function pushLock() {
    pressed = true;
    setTimeout(() => (pressed = false), 160);
    select();
  }
</script>

<div class="handle">
  <svg viewBox="0 0 140 90" aria-hidden="true">
    <g class="hints" filter="url(#rough)">
      <path d="M58 20V6m-5 5 5-5 5 5" />
      <path d="M58 70v14m-5-5 5 5 5-5" />
      <path d="M92 20a24 24 0 0 1 30 4m-5-7 5 7-8 1" />
      <path d="M92 70a24 24 0 0 0 30-4m-5 7 5-7-8-1" />
    </g>
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events (pointer-only physical control; keyboard equivalents are the buttons below) -->
    <g class="lever" class:grabbing={drag} style:transform={`rotate(${-angle}deg)`}
       onpointerdown={down} onpointermove={moveLever} onpointerup={up} onpointercancel={() => (drag = null)}>
      <path filter="url(#rough)" d="M104 38C86 37 64 33 44 34 30 35 18 35 14 40c-3 4 0 9 6 10 16 2 38-1 58 0 10 0 18 2 26 2" />
      <rect x="4" y="20" width="104" height="44" fill="transparent" stroke="none" />
    </g>
    <circle class="rose" cx="104" cy="45" r="17" filter="url(#rough)" />
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events (pointer-only physical control; keyboard equivalents are the buttons below) -->
    <g class="lock" class:pressed onpointerdown={(e) => e.stopPropagation()} onclick={pushLock}>
      <circle cx="104" cy="45" r="8" filter="url(#rough)" />
      <path d="M100 45h8" />
    </g>
  </svg>
  <button class="sr" onclick={() => move(1)}>Push handle down: next element</button>
  <button class="sr" onclick={() => select()}>Lift handle up: select</button>
</div>

<style>
  .handle { position: absolute; left: var(--x); top: var(--y); width: 34%; translate: -76% -50%; }
  svg { display: block; width: 100%; overflow: visible; fill: none; stroke: var(--green); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .hints { opacity: .45; stroke-width: 1.8; pointer-events: none; }
  .lever { transform-origin: 104px 45px; transition: transform .25s cubic-bezier(.3, 1.6, .5, 1); cursor: grab; touch-action: none; }
  .lever.grabbing { transition: none; cursor: grabbing; }
  .lever path { fill: var(--door); }
  .rose { fill: var(--door); }
  .lock { cursor: pointer; transform-origin: 104px 45px; transition: scale .12s; }
  .lock circle { fill: color-mix(in srgb, var(--green) 14%, var(--door)); }
  .lock.pressed { scale: .82; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
