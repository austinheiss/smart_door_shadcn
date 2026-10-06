<script>
  // next event; opened it's the day's timetable + what to bring
  import { Checkbox } from 'bits-ui';
  import Icon from './Icon.svelte';
  import { clock, events, reminders, hourText, tap, hall } from './door.svelte.js';

  let { expanded = false } = $props();

  const now = $derived(clock.now);
  const nowH = $derived(now.getHours() + now.getMinutes() / 60);
  const date = $derived(now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }));
  const left = $derived(reminders.filter((r) => !r.done));
  const next = $derived(events.find((e) => e.to > nowH));
  const until = $derived.by(() => {
    if (!next) return 'Nothing else today';
    if (next.from <= nowH) return `Now, until ${hourText(next.to)}`;
    const m = Math.round((next.from - nowH) * 60);
    return m < 60 ? `Next, in ${m} min` : `Next, in ${Math.floor(m / 60)} h ${m % 60} min`;
  });
</script>

{#snippet keys()}
  <!-- both sentences share one cell so height stays put while text crossfades -->
  <span class="sentence swap">
    <span class:shown={!hall.keysGone} aria-hidden={hall.keysGone}>Don't forget your <b>keys</b> for class</span>
    <span class:shown={hall.keysGone} aria-hidden={!hall.keysGone}>Looks like you forgot your <b>keys</b></span>
  </span>
{/snippet}

<div class="cal" class:expanded>
  <div class="content">
    {#if !expanded}
      {#if next}
        <span class="lead"><i class="dot" style:background={next.color}></i>{until}</span>
        {@render keys()}
        <span class="line">{next.title}, {hourText(next.from)} to {hourText(next.to)}, {next.where}</span>
      {:else}
        <span class="lead">{date}</span>
        {@render keys()}
      {/if}
    {:else}
      <span class="lead">{date}</span>
      {@render keys()}
      <div class="columns">
        <ul class="day">
          {#each events as e}
            <li class:past={e.to <= nowH} class:is-next={e === next}>
              <span class="t">{hourText(e.from)}</span>
              <span class="what"><strong>{e.title}</strong><span>{e.where} · until {hourText(e.to)}</span></span>
            </li>
          {/each}
        </ul>
        <div class="todo">
          <span class="todo-head">Bring</span>
          {#each reminders as r}
            <!-- whole row is the checkbox; bits' key handler dropped so Enter/Space click natively and go through tap -->
            <Checkbox.Root bind:checked={() => r.done, () => tap(r.id)} aria-label={`${r.done ? 'Uncheck' : 'Check off'} ${r.title}`}>
              {#snippet child({ props, checked })}
                {@const { onkeydown: _, ...rest } = props}
                <button {...rest} class:done={checked}>
                  <span class="check">{#if checked}<Icon name="check" size=".7em" />{/if}</span><span>{r.title}</span>
                </button>
              {/snippet}
            </Checkbox.Root>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .cal { position: relative; height: 100%; }
  .content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; align-items: flex-start; padding: var(--pt) var(--px) var(--pb); }
  .lead { display: inline-flex; align-items: center; gap: .55em; font-size: var(--t-body); color: var(--ink2); }
  .dot { width: .5em; height: .5em; border-radius: 50%; flex: none; }
  .sentence { max-width: 92%; }
  .swap { display: grid; }
  .swap > span { grid-area: 1 / 1; opacity: 0; transform: translateY(.35em); filter: blur(4px); transition: opacity .6s ease, transform .6s cubic-bezier(.3, .8, .2, 1), filter .6s ease; }
  .swap > span.shown { opacity: 1; transform: none; filter: none; }
  @media (prefers-reduced-motion: reduce) { .swap > span { transition: opacity .2s; transform: none; filter: none; } }

  .content > * { flex-shrink: 0; }
  .t { width: 2.8em; flex: none; text-align: right; color: var(--ink3); font-variant-numeric: tabular-nums; }

  .columns { flex: 1; min-height: 0; width: 100%; display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.6em; margin-top: .6em; }
  .day { list-style: none; margin: 0; padding: 0; }
  .day li { display: flex; gap: 1em; padding: .26em 0; line-height: 1.2; border-top: 1px solid var(--hair); font-size: var(--t-body); }
  .day li:last-child { border-bottom: 1px solid var(--hair); }
  .day .past { opacity: .4; }
  .what { display: flex; flex-direction: column; min-width: 0; }
  .what strong { font-weight: 500; }
  .what span { font-size: .86em; color: var(--ink3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .is-next .what strong { color: var(--ink); }
  .todo { display: flex; flex-direction: column; }
  .todo-head { font-size: var(--t-body); color: var(--ink3); padding: .26em 0; border-top: 1px solid var(--hair); }
  .todo button { display: flex; align-items: center; gap: .7em; font-size: var(--t-body); padding: .55em .3em; margin: 0 -.3em; border-radius: .4em; text-align: left; }
  .check { width: 1.05em; height: 1.05em; border-radius: 50%; border: 1px solid var(--ink3); display: grid; place-items: center; flex: none; color: #000; transition: background .2s; }
  .todo .done .check { background: var(--ink); border-color: var(--ink); }
  .todo .done > span:last-child { color: var(--ink3); text-decoration: line-through; text-decoration-thickness: 1px; }

</style>
