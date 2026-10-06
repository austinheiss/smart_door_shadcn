<script>
  // lever swings on drag and springs back, lock pushes in. neither touches the screen.
  let drag = $state(null);
  let pressed = $state(false);
  const angle = $derived(drag ? drag.angle : 0);

  function down(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag = { y: event.clientY, angle: 0 };
  }
  function moveLever(event) {
    if (!drag) return;
    drag.angle = Math.max(-28, Math.min(28, (event.clientY - drag.y) * 0.7));
  }
  function pushLock() {
    pressed = true;
    setTimeout(() => (pressed = false), 160);
  }
</script>

<div class="handle" aria-hidden="true">
  <svg viewBox="0 0 140 90">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <g class="lever" class:grabbing={drag} style:transform={`rotate(${-angle}deg)`}
       onpointerdown={down} onpointermove={moveLever} onpointerup={() => (drag = null)} onpointercancel={() => (drag = null)}>
      <path filter="url(#rough)" d="M104 38C86 37 64 33 44 34 30 35 18 35 14 40c-3 4 0 9 6 10 16 2 38-1 58 0 10 0 18 2 26 2" />
      <rect x="4" y="20" width="104" height="44" fill="transparent" stroke="none" />
    </g>
    <circle class="rose" cx="104" cy="45" r="17" filter="url(#rough)" />
    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
    <g class="lock" class:pressed onpointerdown={(e) => e.stopPropagation()} onclick={pushLock}>
      <circle cx="104" cy="45" r="8" filter="url(#rough)" />
      <path d="M100 45h8" />
    </g>
  </svg>
</div>

<style>
  /* --x = rose's right edge (x 121.2 of 140) */
  .handle { position: absolute; left: var(--x); top: var(--y); width: 34%; translate: calc(-121.2 / 140 * 100%) -50%; }
  svg { display: block; width: 100%; overflow: visible; fill: none; stroke: var(--green); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .lever { transform-origin: 104px 45px; transition: transform .25s cubic-bezier(.3, 1.6, .5, 1); cursor: grab; touch-action: none; }
  .lever.grabbing { transition: none; cursor: grabbing; }
  .lever path { fill: var(--door); }
  .rose { fill: var(--door); }
  .lock { cursor: pointer; transform-origin: 104px 45px; transition: scale .12s; }
  .lock circle { fill: color-mix(in srgb, var(--green) 14%, var(--door)); }
  .lock.pressed { scale: .82; }
</style>
