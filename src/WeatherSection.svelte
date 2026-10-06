<script>
  // weather over the animated sky; radar shows up when precip is coming
  import WeatherSky from './WeatherSky.svelte';
  import RadarScope from './RadarScope.svelte';
  import Icon from './Icon.svelte';
  import { clock, time, conditions, temp } from './door.svelte.js';

  let { expanded = false } = $props();

  const c = $derived(conditions());
  const night = $derived(!c.isDay);
  // night sky is always clear (moon); hours ahead reuse the current weather
  const icon = $derived(night ? 'night' : c.kind);
  const radar = $derived(c.precipIn !== null);
  const hourAt = (offset) => { const d = new Date(clock.now.getTime() + offset * 3600000); const h = d.getHours(); return `${((h + 11) % 12) + 1}${h < 12 ? 'a' : 'p'}`; };
  const ahead = $derived(c.hourly.filter((p) => p.offset > 0.5).filter((_, i) => i % 2 === 1).slice(0, 3));
  const hours = $derived(c.hourly.filter((p) => p.offset > -0.5).slice(0, 8));
  const precipLine = $derived(c.precipIn === 0
    ? (c.kind === 'snow' ? 'Snowing now. Watch your step.' : 'Raining now. Take an umbrella.')
    : `${c.kind === 'snow' ? 'Snow' : 'Rain'} from ${time(new Date(clock.now.getTime() + c.precipIn * 60000))}. Take an umbrella.`);
</script>

<div class="weather" class:expanded>
  <div class="bg"><WeatherSky kind={c.kind} {night} /></div>
  {#if radar && !expanded}
    <div class="bg radar-layer"><RadarScope kind={c.kind} zoom={7.1} /></div>
  {/if}

  <div class="content">
    <span class="lead"><Icon name={icon} size="1.1em" strokeWidth={2} />{c.text}, {temp(c.temp)}° now</span>
    <span class="sentence">It feels like <b>{temp(c.feels)}°</b> outside</span>
    {#if !expanded}
      {#if radar}
        <span class="line">{precipLine}</span>
      {:else}
        <span class="line">High {temp(c.high)}°, low {temp(c.low)}°{#if ahead[1]}, {temp(ahead[1].temp)}° by {hourAt(ahead[1].offset)}{/if}</span>
      {/if}
    {/if}
  </div>

  {#if expanded}
    <!-- open: headline and radar share a row so rings never sit under text -->
    {#if radar}
      <div class="radar-box"><RadarScope kind={c.kind} zoom={6.6} /></div>
    {/if}
    <div class="panel-head">{radar ? precipLine : `High ${temp(c.high)}°, low ${temp(c.low)}°. Wind ${c.wind} mph.`}</div>
    <ol class="hours">
      {#each hours as p, i}
        <li>
          <span class="h">{i === 0 ? 'Now' : hourAt(p.offset)}</span>
          <Icon name={icon} size="1.4em" strokeWidth={2} />
          <strong>{temp(p.temp)}°</strong>
          <span class="pop" class:show={p.pop >= 20}>{p.pop}%</span>
        </li>
      {/each}
    </ol>
  {/if}
</div>

<style>
  /* small text sits on bright skies, so brighten secondary inks and dim the text side (not the sun) */
  .weather { position: relative; height: 100%; --ink2: rgba(243, 238, 228, .92); --ink3: rgba(243, 238, 228, .8); }
  .bg { position: absolute; inset: 0; -webkit-mask-image: var(--fade); mask-image: var(--fade); -webkit-mask-composite: source-in; mask-composite: intersect; }
  .bg:first-child::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0, 0, 0, .4), rgba(0, 0, 0, .26) 50%, transparent 84%); pointer-events: none; }
  /* open: hours run full width, so dim under them too */
  .expanded .bg:first-child::after { background: linear-gradient(0deg, rgba(0, 0, 0, .3), transparent 55%), linear-gradient(90deg, rgba(0, 0, 0, .4), rgba(0, 0, 0, .26) 50%, transparent 84%); }
  .radar-layer { left: 56%; --fade: radial-gradient(closest-side, #000 55%, transparent 100%); }

  /* open: centred block, same insets as other cards; radar on the right, hours full width below */
  .expanded { display: grid; grid-template-columns: 1fr auto; align-content: center; column-gap: 1em; padding: var(--pt) var(--px) var(--pb); }
  .expanded .content { grid-area: 1 / 1; min-width: 0; padding: 0; }
  .expanded .sentence { max-width: none; }
  .radar-box { grid-area: 1 / 2 / 3 / 3; align-self: center; position: relative; z-index: 1; width: 6.2em; aspect-ratio: 1; }
  .radar-box :global(.map) { -webkit-mask-image: radial-gradient(closest-side, #000 72%, transparent 100%); mask-image: radial-gradient(closest-side, #000 72%, transparent 100%); }

  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; padding: var(--pt) var(--px) 0; pointer-events: none; }
  .lead { display: inline-flex; align-items: center; gap: .45em; font-size: var(--t-body); color: var(--ink2); font-weight: 450; }
  .sentence { max-width: 82%; }
  .content > .line { font-weight: 450; }

  .panel-head { grid-area: 2 / 1; align-self: end; position: relative; z-index: 1; margin-top: .9em; padding-bottom: .7em; font-size: var(--t-body); font-weight: 450; color: var(--ink2); }
  .hours { grid-area: 3 / 1 / 4 / 3; position: relative; z-index: 1; list-style: none; margin: 0; padding: .6em 0 0; border-top: 1px solid var(--hair); display: flex; justify-content: space-between; }
  .hours li { display: flex; flex-direction: column; align-items: center; gap: .25em; font-size: var(--t-body); }
  .h { color: var(--ink3); font-weight: 450; }
  .hours strong { font-weight: 500; font-variant-numeric: tabular-nums; }
  .pop { font-size: .82em; font-weight: 500; color: #cfe6ff; visibility: hidden; }
  .pop.show { visibility: visible; }
</style>
