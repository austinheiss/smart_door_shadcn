<script>
  // Weather: what it's like outside, over a sky that moves like the real one.
  // When precipitation is coming, a radar scope around home appears beside it.
  import WeatherSky from './WeatherSky.svelte';
  import RadarScope from './RadarScope.svelte';
  import WxIcon from './WxIcon.svelte';
  import { ui, clock, time, conditions, temp, kindOf, tap } from './door.svelte.js';

  let { expanded = false, compact = false, narrow = false, focused = () => false } = $props();

  const c = $derived(conditions());
  const night = $derived(!c.isDay);
  const radar = $derived(c.precipIn !== null);
  const hourAt = (offset) => { const d = new Date(clock.now.getTime() + offset * 3600000); const h = d.getHours(); return `${((h + 11) % 12) + 1}${h < 12 ? 'a' : 'p'}`; };
  // the next few whole hours, two apart
  const ahead = $derived(c.hourly.filter((p) => p.offset > 0.5).filter((_, i) => i % 2 === 1).slice(0, 3));
  const hours = $derived(c.hourly.filter((p) => p.offset > -0.5).slice(0, narrow ? 6 : 8));
  const precipLine = $derived(c.precipIn === 0
    ? (c.kind === 'snow' ? 'Snowing now. Watch your step.' : 'Raining now. Take an umbrella.')
    : `${c.kind === 'snow' ? 'Snow' : 'Rain'} from ${time(new Date(clock.now.getTime() + c.precipIn * 60000))}. Take an umbrella.`);
</script>

<div class="weather" class:expanded class:compact class:narrow class:has-radar={radar}>
  <div class="bg"><WeatherSky kind={c.kind} {night} /></div>
  {#if radar && !narrow}
    <div class="bg radar-layer"><RadarScope live={ui.sky === 'live'} kind={c.kind} zoom={expanded ? 7.6 : 7.1} showStamp={expanded} /></div>
  {/if}

  <div class="content">
    <span class="lead"><WxIcon kind={c.kind} {night} size="1.1em" />{narrow ? c.text : `${c.text}, ${temp(c.temp)}° now`}</span>
    {#if narrow}
      <span class="sentence">Feels like <b>{temp(c.feels)}°</b></span>
    {:else}
      <span class="sentence">It feels like <b>{temp(c.feels)}°</b> outside</span>
    {/if}
    {#if !expanded}
      {#if radar}
        <span class="line">{narrow ? `${c.kind === 'snow' ? 'Snow' : 'Rain'} ${c.precipIn ? `at ${time(new Date(clock.now.getTime() + c.precipIn * 60000))}` : 'now'}` : precipLine}</span>
      {:else if narrow}
        <span class="line">{temp(c.high)}° / {temp(c.low)}°</span>
      {:else}
        <span class="line">High {temp(c.high)}°, low {temp(c.low)}°{#if ahead[1]}, {temp(ahead[1].temp)}° by {hourAt(ahead[1].offset)}{/if}</span>
      {/if}
    {/if}
  </div>

  {#if expanded}
    <div class="panel">
      <div class="panel-head">
        <span>{radar ? precipLine : `High ${temp(c.high)}°, low ${temp(c.low)}°. Wind ${c.wind} mph.`}</span>
        <button class="unit" class:focus={focused('unit')} onclick={() => tap('unit')} aria-label={`Show ${ui.celsius ? 'Fahrenheit' : 'Celsius'}`}><span class:on={!ui.celsius}>°F</span><span class:on={ui.celsius}>°C</span></button>
      </div>
      <ol class="hours">
        {#each hours as p, i}
          <li>
            <span class="h">{i === 0 ? 'Now' : hourAt(p.offset)}</span>
            <WxIcon kind={kindOf(p.code, p.temp)} size="1.4em" />
            <strong>{temp(p.temp)}°</strong>
            <span class="pop" class:show={p.pop >= 20}>{p.pop}%</span>
          </li>
        {/each}
      </ol>
    </div>
  {/if}
</div>

<style>
  .weather { position: relative; height: 100%; }
  .bg { position: absolute; inset: 0; -webkit-mask-image: var(--fade); mask-image: var(--fade); -webkit-mask-composite: source-in; mask-composite: intersect; }
  .radar-layer { left: 56%; --fade: radial-gradient(closest-side, #000 55%, transparent 100%); }
  .expanded .radar-layer { left: 30%; top: 22%; bottom: 30%; }

  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; padding: var(--pt) var(--px) 0; pointer-events: none; }
  .lead { display: inline-flex; align-items: center; gap: .45em; font-size: var(--t-body); color: var(--ink2); text-shadow: 0 1px 2px rgba(0, 0, 0, .2); }
  .line { font-size: var(--t-body); color: var(--ink2); margin-top: .45em; font-variant-numeric: tabular-nums; }
  .sentence { max-width: 82%; }
  .narrow .sentence { max-width: none; }

  .panel { position: absolute; left: var(--px); right: var(--px); bottom: var(--pb); z-index: 1; }
  .panel-head { display: flex; justify-content: space-between; align-items: baseline; gap: 1em; font-size: var(--t-body); color: var(--ink2); padding-bottom: .7em; border-bottom: 1px solid var(--hair); }
  .unit { display: inline-flex; gap: .5em; font-weight: 500; }
  .unit span { color: var(--ink3); }
  .unit .on { color: var(--ink); }
  .hours { list-style: none; margin: 0; padding: .7em 0 0; display: flex; justify-content: space-between; }
  .hours li { display: flex; flex-direction: column; align-items: center; gap: .35em; font-size: var(--t-body); }
  .h { color: var(--ink3); }
  .hours strong { font-weight: 500; font-variant-numeric: tabular-nums; }
  .pop { font-size: .82em; color: #8fc3ff; visibility: hidden; }
  .pop.show { visibility: visible; }

  .narrow .content { align-items: center; text-align: center; padding: var(--pt) var(--px) 0; }
  .narrow .lead { flex-direction: column; gap: .3em; }
  .narrow .panel-head { flex-direction: column; align-items: center; text-align: center; }
  .narrow .hours { flex-direction: column; gap: .5em; }
  .narrow .hours li { flex-direction: row; justify-content: space-between; }
  .narrow .pop { display: none; }
  .compact .lead, .compact .line, .compact :global(.radar-layer) { display: none; }
  .compact .content { padding-top: var(--pt); }
</style>
