<script>
  // Today: the next thing, in the same three lines as the other cards. Opened,
  // it becomes the day's timetable beside what to bring.
  import Icon from './Icon.svelte';
  import { clock, events, reminders, hourText, tap } from './door.svelte.js';

  let { expanded = false, compact = false, narrow = false, focused = () => false } = $props();

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

<div class="cal" class:expanded class:compact class:narrow>
  <div class="content">
    {#if !expanded}
      {#if next}
        <span class="lead"><i class="dot" style:background={next.color}></i>{narrow ? hourText(next.from) : until}</span>
        {#if left.length}
          <span class="sentence">{#if narrow}Bring the <b>{left[0].title.toLowerCase()}</b>{:else}Don't forget the <b>{left[0].title.toLowerCase()}</b> for {next.title}{/if}</span>
        {:else}
          <span class="sentence">{narrow ? next.title : `Next up is ${next.title}`}</span>
        {/if}
        <span class="line">{narrow ? `${hourText(next.from)}, ${next.where}` : `${next.title}, ${hourText(next.from)} to ${hourText(next.to)}, ${next.where}`}</span>
      {:else}
        <span class="lead">{date}</span>
        <span class="sentence">Nothing else today</span>
      {/if}


    {:else}
      <span class="lead">{date}</span>
      <span class="sentence">{#if next && left.length}{#if narrow}Bring the <b>{left[0].title.toLowerCase()}</b>{:else}Don't forget the <b>{left[0].title.toLowerCase()}</b> for {next.title}{/if}{:else if next}{narrow ? next.title : `Next up is ${next.title}`}{:else}Nothing else today{/if}</span>
      <div class="columns">
        <ul class="day">
          {#each events as e}
            <li class:past={e.to <= nowH} class:is-next={e === next}>
              <span class="t">{hourText(e.from)}</span>
              <span class="what"><strong>{e.title}</strong>{#if !narrow}<span>{e.where} · until {hourText(e.to)}</span>{/if}</span>
            </li>
          {/each}
        </ul>
        <div class="todo">
          <span class="todo-head">Bring</span>
          {#each reminders as r}
            <button class:done={r.done} class:focus={focused(r.id)} aria-pressed={r.done} aria-label={`${r.done ? 'Uncheck' : 'Check off'} ${r.title}`} onclick={() => tap(r.id)}>
              <span class="check">{#if r.done}<Icon name="check" size=".7em" />{/if}</span><span>{r.title}</span>
            </button>
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
  .line { font-size: var(--t-body); color: var(--ink2); margin-top: .45em; font-variant-numeric: tabular-nums; }
  .sentence { max-width: 92%; }
  .narrow .sentence { max-width: none; }

  .content > * { flex-shrink: 0; }
  .t { width: 2.8em; flex: none; text-align: right; color: var(--ink3); font-variant-numeric: tabular-nums; }

  .columns { flex: 1; min-height: 0; width: 100%; display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.6em; margin-top: .8em; }
  .day { list-style: none; margin: 0; padding: 0; }
  .day li { display: flex; gap: 1em; padding: .6em 0; border-top: 1px solid var(--hair); font-size: var(--t-body); }
  .day li:last-child { border-bottom: 1px solid var(--hair); }
  .day .past { opacity: .4; }
  .what { display: flex; flex-direction: column; gap: .15em; min-width: 0; }
  .what strong { font-weight: 500; }
  .what span { color: var(--ink3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .is-next .what strong { color: var(--ink); }
  .todo { display: flex; flex-direction: column; }
  .todo-head { font-size: var(--t-body); color: var(--ink3); padding: .6em 0; border-top: 1px solid var(--hair); }
  .todo button { display: flex; align-items: center; gap: .7em; font-size: var(--t-body); padding: .55em .3em; margin: 0 -.3em; border-radius: .4em; text-align: left; }
  .check { width: 1.05em; height: 1.05em; border-radius: 50%; border: 1px solid var(--ink3); display: grid; place-items: center; flex: none; color: #000; transition: background .2s; }
  .todo .done .check { background: var(--ink); border-color: var(--ink); }
  .todo .done span:last-child { color: var(--ink3); text-decoration: line-through; text-decoration-thickness: 1px; }

  .narrow .content { align-items: center; text-align: center; }
  .narrow .columns { grid-template-columns: 1fr; gap: .6em; }
  .narrow .day li { flex-direction: column; gap: .15em; text-align: left; }
  .narrow .t { text-align: left; }
  .compact .lead, .compact .line, .compact :global(.radar-layer) { display: none; }
  .compact .content { padding-top: var(--pt); }
</style>
