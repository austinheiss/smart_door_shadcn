<script>
  import Display from './Display.svelte';
  import HandleKnob from './HandleKnob.svelte';
  import Hallway from './Hallway.svelte';
  import { ui, SKIES, back } from './door.svelte.js';
  import DistanceSlider from './DistanceSlider.svelte';
  import { ToggleGroup } from '$lib/components/ui/toggle-group/index.js';
  import PickItem from './PickItem.svelte';
  import Icon from './Icon.svelte';
  import { Separator } from '$lib/components/ui/separator/index.js';

  // handle position, % of door w/h. lines up with display's right edge (11% + 78%)
  const at = [89, 58];

  // ignore the toggle group's own writes so it never deselects; each item's click picks
  const keep = () => {};

  // esc/backspace go back to rest
  function onkey(event) {
    if (event.key !== 'Escape' && event.key !== 'Backspace') return;
    back();
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
    <Hallway>
      <div class="door">
        <Display />
        <HandleKnob --x="{at[0]}%" --y="{at[1]}%" />
      </div>
    </Hallway>
  </section>

  <aside class="notes">
    <h1>smart door</h1>

    <section>
      <h2>Weather</h2>
      <ToggleGroup type="single" rovingFocus={false} bind:value={() => ui.sky, keep}>
        {#snippet child({ props })}
          <div {...props} class="skies" role="radiogroup" aria-label="Weather shown on the screen">
            {#each SKIES as s}
              <PickItem value={s} onclick={() => (ui.sky = s)}><Icon name={s} class="glyph" strokeWidth={1.75} /><span>{s}</span></PickItem>
            {/each}
          </div>
        {/snippet}
      </ToggleGroup>
    </section>

    <Separator />

    <section>
      <h2>Where you stand</h2>
      <p class="note">* more detail as you get closer</p>
      <DistanceSlider />
    </section>

    <section class="push">
      <h2>What you're seeing</h2>
      <ul class="about">
        <li>A camera on the door notices when you're leaving without something you need, like your keys.</li>
        <li>The screen's layout changes with your distance, so it stays readable.</li>
        <li>The map gives directions from your calendar and your usual travel.</li>
      </ul>
    </section>
  </aside>
</main>
