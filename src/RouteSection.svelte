<script>
  // time-to-leave over our neighbourhood map with the route lit
  import NeighborhoodMap from './NeighborhoodMap.svelte';
  import Icon from './Icon.svelte';
  import { ToggleGroup } from '$lib/components/ui/toggle-group/index.js';
  import PickItem from './PickItem.svelte';
  import { ui, routes, destination, time, leaveBy, minutesLeft, urgency, tap } from './door.svelte.js';

  let { expanded = false } = $props();

  const route = $derived(routes[ui.route]);
  const mins = $derived(minutesLeft());
  const status = $derived(urgency());
  const mi = (m) => (m / 1609.344).toFixed(1) + ' mi';
  const verb = $derived(route.mode === 'walk' ? 'Walk' : 'Drive');
  // single-choice, never deselects; every press goes through tap().
  // roving focus off so arrows don't hop rows
  const chosen = () => String(ui.route);
  const choose = (v) => tap(`route${v || ui.route}`);
  // route area: right of text, below clock, clear of faded edges
  const area = $derived(expanded ? [0.62, 0.32, 0.86, 0.58] : [0.72, 0.46, 0.88, 0.72]);
</script>

<div class="route {status}" class:expanded>
  <div class="bg"><NeighborhoodMap {area} /></div>
  <div class="scrim"></div>

  <div class="content">
    <span class="lead"><Icon name={route.mode === 'walk' ? 'walk' : 'car'} size="1em" />{verb} {mi(route.meters)} via {route.via}</span>
    <span class="sentence">It will take <b>{route.minutes} min</b> to get to {destination.name}</span>
    <span class="line when">{#if mins > 0}Leave in {mins} min, by {time(leaveBy())}{:else if mins === 0}Leave now{:else}{-mins} min late{/if}</span>
  </div>

  {#if expanded}
    <ToggleGroup type="single" orientation="vertical" rovingFocus={false} class="modes" bind:value={chosen, choose}>
      {#each routes as r, i}
        <PickItem value={String(i)} class={[ui.route === i && 'chosen']}>
          <span class="m-icon"><Icon name={r.mode === 'walk' ? 'walk' : 'car'} size="1em" /></span>
          <span class="m-name">{r.label}</span>
          <span class="m-via">{r.via}, {mi(r.meters)}</span>
          <span class="m-time">{r.minutes} min</span>
          <span class="m-leave">{time(leaveBy(i))}</span>
        </PickItem>
      {/each}
    </ToggleGroup>
  {/if}
</div>

<style>
  .route { position: relative; height: 100%; --route: #f3eee4; }
  .route.soon { --route: #f2b35b; }
  .route.now { --route: #f07a5f; }

  .bg { position: absolute; inset: 0; -webkit-mask-image: var(--fade); mask-image: var(--fade); -webkit-mask-composite: source-in; mask-composite: intersect; }
  .scrim { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to right, rgba(0, 0, 0, .78) 0%, rgba(0, 0, 0, .45) 40%, transparent 70%); }

  .content { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-start; padding: var(--pt) var(--px) 0; pointer-events: none; }
  .lead { display: inline-flex; align-items: center; gap: .45em; font-size: var(--t-body); color: var(--ink2); }
  .lead :global(.icon) { color: var(--ink); }
  .when { color: var(--route); transition: color .4s; }
  .route:not(.soon):not(.now) .when { color: var(--ink2); }
  .sentence { max-width: 72%; }
  :global(.d0) .sentence, :global(.d1) .sentence { max-width: 88%; }
  .expanded .sentence { max-width: none; }

  /* shadcn ToggleGroup isn't scoped here. unlayered css beats its utilities; :where keeps
     specificity under the focus pill so the pill still shows on focused rows */
  .route :global(:where(.modes)) { width: auto; align-items: normal; gap: 0; border-radius: 0; }
  .route :global(:where(.modes) > button) { height: auto; min-width: auto; flex-shrink: 1; justify-content: normal; white-space: inherit; font-weight: inherit; line-height: inherit; background: none; border-radius: 0; box-shadow: none; transition: none; z-index: auto; }
  .route :global(:where(.modes) > button svg) { width: 1em; height: 1em; flex-shrink: 1; pointer-events: inherit; }

  .route :global(.modes) { position: absolute; left: var(--px); right: var(--px); bottom: var(--pb); z-index: 1; display: flex; flex-direction: column; }
  .route :global(.modes button) { display: grid; grid-template-columns: 1.6em auto 1fr auto 3.4em; align-items: baseline; gap: .6em; padding: .7em .2em; border-top: 1px solid var(--hair); font-size: var(--t-body); color: var(--ink2); text-align: left; }
  .route :global(.modes button:last-of-type) { border-bottom: 1px solid var(--hair); }
  .route :global(.modes .chosen) { color: var(--ink); }
  .route :global(.modes .chosen .m-icon) { color: var(--route); }
  .m-name { font-weight: 500; }
  .m-via { color: var(--ink3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .m-time, .m-leave { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
  .m-leave { color: var(--ink3); }
  .route :global(.chosen .m-leave) { color: var(--ink2); }

  /* open: keep route off the walk/drive rows */
  .expanded .scrim { background: linear-gradient(to top, rgba(0, 0, 0, .92) 0%, rgba(0, 0, 0, .6) 30%, transparent 55%), linear-gradient(to right, rgba(0, 0, 0, .7), transparent 60%); }
</style>
