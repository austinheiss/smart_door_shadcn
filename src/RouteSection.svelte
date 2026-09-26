<script>
  // Directions: how long until you should leave, drawn over our own map of
  // the neighbourhood with the route lit and a dot walking it.
  import NeighborhoodMap from './NeighborhoodMap.svelte';
  import Icon from './Icon.svelte';
  import { ui, routes, destination, clock, time, leaveBy, minutesLeft, urgency, tap } from './door.svelte.js';

  let { expanded = false, compact = false, narrow = false, focused = () => false } = $props();

  const route = $derived(routes[ui.route]);
  const mins = $derived(minutesLeft());
  const status = $derived(urgency());
  const km = (m) => (m / 1000).toFixed(1) + ' km';
  const verb = $derived(route.mode === 'walk' ? 'Walk' : 'Drive');
  const frame = $derived(narrow ? { pad: 0.2, offset: [0, 0.16] } : expanded ? { pad: 0.24, offset: [0.2, 0.02] } : { pad: 0.2, offset: [0.24, 0.17] });
</script>

<div class="route {status}" class:expanded class:compact class:narrow>
  <div class="bg"><NeighborhoodMap pad={frame.pad} offset={frame.offset} label={!narrow} /></div>
  <div class="scrim"></div>

  <div class="content">
    <span class="lead"><Icon name={route.mode === 'walk' ? 'walk' : 'car'} size="1em" />{narrow ? verb : `${verb} · ${km(route.meters)} via ${route.via}`}</span>
    {#if narrow}
      <span class="sentence"><b>{route.minutes} min</b> to {destination.short}</span>
    {:else}
      <span class="sentence">It will take <b>{route.minutes} min</b> to get to {destination.name}</span>
    {/if}
    <span class="line when">{#if mins > 0}Leave in {mins} min{narrow ? '' : `, by ${time(leaveBy())}`}{:else if mins === 0}Leave now{:else}{-mins} min late{/if}</span>
  </div>

  {#if expanded}
    <div class="modes">
      {#each routes as r, i}
        <button class:chosen={ui.route === i} class:focus={focused(`route${i}`)} aria-pressed={ui.route === i} onclick={() => tap(`route${i}`)}>
          <span class="m-icon"><Icon name={r.mode === 'walk' ? 'walk' : 'car'} size="1em" /></span>
          <span class="m-name">{r.label}</span>
          {#if !narrow}<span class="m-via">{r.via} · {km(r.meters)}</span>{/if}
          <span class="m-time">{r.minutes} min</span>
          {#if !narrow}<span class="m-leave">{time(leaveBy(i))}</span>{/if}
        </button>
      {/each}
      {#if !narrow && route.note}<span class="note">Driving includes {route.note.replace('incl. ', '')}.</span>{/if}
    </div>
  {/if}
</div>

<style>
  .route { position: relative; height: 100%; --route: #f3eee4; }
  .route.soon { --route: #f2b35b; }
  .route.now { --route: #f07a5f; }

  .bg { position: absolute; inset: 0; -webkit-mask-image: var(--fade); mask-image: var(--fade); -webkit-mask-composite: source-in; mask-composite: intersect; }
  .scrim { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to right, rgba(0, 0, 0, .78) 0%, rgba(0, 0, 0, .45) 40%, transparent 70%); }

  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; padding: var(--pt) var(--px) 0; pointer-events: none; }
  .lead { display: inline-flex; align-items: center; gap: .45em; font-size: var(--t-body); color: var(--ink2); --hole: #000; }
  .lead :global(.icon) { color: var(--ink); }
  .big { display: flex; align-items: baseline; margin-top: .1em; }
  .num { font-size: var(--t-display); font-weight: 300; letter-spacing: -.05em; line-height: 1; font-variant-numeric: tabular-nums; color: var(--route); transition: color .4s; }
  .num.word { letter-spacing: -.03em; }
  .unit { font-size: var(--t-title); font-weight: 400; margin-left: .25em; color: var(--ink2); }
  .line { font-size: var(--t-body); color: var(--ink2); margin-top: .45em; font-variant-numeric: tabular-nums; }
  .when { color: var(--route); transition: color .4s; }
  .route:not(.soon):not(.now) .when { color: var(--ink2); }
  .sentence { max-width: 72%; }
  .narrow .sentence, .expanded .sentence { max-width: none; }

  .modes { position: absolute; left: var(--px); right: var(--px); bottom: var(--pb); z-index: 1; display: flex; flex-direction: column; }
  .modes button { display: grid; grid-template-columns: 1.6em auto 1fr auto 3.4em; align-items: baseline; gap: .6em; padding: .7em .2em; border-top: 1px solid var(--hair); font-size: var(--t-body); color: var(--ink2); text-align: left; --hole: #000; }
  .modes button:last-of-type { border-bottom: 1px solid var(--hair); }
  .modes .chosen { color: var(--ink); }
  .modes .chosen .m-icon { color: var(--route); }
  .m-name { font-weight: 500; }
  .m-via { color: var(--ink3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .m-time, .m-leave { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
  .m-leave { color: var(--ink3); }
  .chosen .m-leave { color: var(--ink2); }
  .note { font-size: var(--t-cap); color: var(--ink3); margin-top: .6em; }

  .narrow .content { align-items: center; text-align: center; padding: calc(var(--pt) + 1.6em) var(--px) 0; }
  /* open: keep the route off the walk and drive rows */
  .expanded .scrim { background: linear-gradient(to top, rgba(0, 0, 0, .92) 0%, rgba(0, 0, 0, .6) 30%, transparent 55%), linear-gradient(to right, rgba(0, 0, 0, .7), transparent 60%); }
  .narrow .scrim { background: linear-gradient(to bottom, rgba(0, 0, 0, .75), transparent 55%); }
  .narrow .modes button { grid-template-columns: 1.4em 1fr auto; }
  .compact .lead, .compact .line, .compact :global(.radar-layer) { display: none; }
  .compact .content { padding-top: var(--pt); }
</style>
