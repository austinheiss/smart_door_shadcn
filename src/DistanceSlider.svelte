<script>
  // where you stand. drag the figure, click a zone name, or keys:
  // arrows = small step, PgUp/PgDn = next/prev zone, Home/End = ends
  import { Slider } from '$lib/components/ui/slider/index.js';
  import { DISTANCES, walk, walkTo, zoneAt } from './door.svelte.js';

  const STEP = 0.02;
  const ends = DISTANCES.map((d, i) => [d.from, DISTANCES[i + 1]?.from ?? 1]);
  const middle = (i) => (ends[i][0] + ends[i][1]) / 2;

  const zone = $derived(zoneAt(walk.target));
  const round = (v) => Math.round(v * 1000) / 1000;

  function onkeydown(event) {
    const t = walk.target;
    const go = {
      ArrowRight: () => round(t + STEP),
      ArrowUp: () => round(t + STEP),
      ArrowLeft: () => round(t - STEP),
      ArrowDown: () => round(t - STEP),
      PageUp: () => middle(Math.min(zone + 1, DISTANCES.length - 1)),
      PageDown: () => middle(Math.max(zone - 1, 0)),
      Home: () => 0,
      End: () => 1,
    }[event.key];
    if (!go) return;
    // skip the primitive's own key handling
    event.preventDefault();
    walkTo(go());
  }
</script>

<div class="distance">
  <div class="hall">
    <Slider
      class="walk"
      min={0}
      max={1}
      step={0.001}
      thumbPositioning="exact"
      bind:value={() => walk.target, walkTo}
      thumbProps={{ 'aria-label': 'Where you stand', 'aria-valuetext': DISTANCES[zone].label, onkeydown }}
    >
      {#each DISTANCES as d}
        <i class="tick" style:left="{d.from * 100}%"></i>
      {/each}
      {#snippet thumb()}
        <svg viewBox="0 0 16 28" aria-hidden="true">
          <circle cx="9" cy="4.5" r="3.2" />
          <path d="M8.6 8 7.4 17.2M8.4 10.4 4.2 14.6M8.4 10.4l4.4 3.4M7.4 17.2 3.6 26.6M7.4 17.2l5.2 9.2" />
        </svg>
      {/snippet}
    </Slider>
    <svg class="door-mark" viewBox="0 0 18 30" aria-hidden="true">
      <path class="frame" d="M2.5 29.2V1.6h13v27.6" />
      <path class="disp" d="M5.6 6.2h6.8" />
      <circle class="knob" cx="12.6" cy="17" r="1.3" />
    </svg>
  </div>
  <div class="zones" role="group" aria-label="Walk to">
    {#each DISTANCES as d, i}
      <button
        type="button"
        style:--at={ends[i][0]}
        style:--span={ends[i][1] - ends[i][0]}
        aria-current={i === zone ? 'true' : undefined}
        onclick={() => walkTo(i === DISTANCES.length - 1 ? 1 : middle(i))}>{d.label}</button
      >
    {/each}
  </div>
</div>
