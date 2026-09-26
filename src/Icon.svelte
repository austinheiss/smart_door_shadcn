<script>
  // Quiet line icons for the door display: one weight, no colour of their own.
  let { name, size = '1em' } = $props();
  const cloud = 'M14 36h19.5a6.5 6.5 0 0 0 .7-13A9.5 9.5 0 0 0 16.4 21 7.6 7.6 0 0 0 14 36Z';
</script>

<svg class="icon" width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  {#if name === 'sun'}
    <circle cx="24" cy="24" r="7" /><path d="M24 7v4M24 37v4M7 24h4M37 24h4M12 12l2.8 2.8M33.2 33.2 36 36M12 36l2.8-2.8M33.2 14.8 36 12" />
  {:else if name === 'partly'}
    <path d="M22 13.5a7 7 0 0 1 11.8 5.6M27 6v3M36.5 10l-2 2M40 19h-3" /><path d={cloud} />
  {:else if name === 'cloud'}
    <path d={cloud} />
  {:else if name === 'storm'}
    <path d="M14 31h19.5a6.5 6.5 0 0 0 .7-13A9.5 9.5 0 0 0 16.4 16 7.6 7.6 0 0 0 14 31Z" /><path d="m25 34-4 6h6l-3 5" />
  {:else if name === 'umbrella'}
    <path d="M6 24a18 18 0 0 1 36 0Z" /><path d="M24 24v14a4 4 0 0 1-8 0" /><path d="M24 6v2" />
  {:else if name === 'route'}
    <circle cx="12" cy="36" r="4" /><path d="M16 36h10a6 6 0 0 0 0-12h-6a6 6 0 0 1 0-12h10" /><path d="m27 7 5 5-5 5" />
  {:else if name === 'bag'}
    <rect x="9" y="16" width="30" height="24" rx="4" /><path d="M18 16v-3a6 6 0 0 1 12 0v3" />
  {:else if name === 'check'}
    <path d="m12 25 8 8 16-17" />
  {:else if name === 'back'}
    <path d="M29 12 17 24l12 12" />
  {:else if name === 'walk'}
    <g fill="currentColor" stroke="none">
      <circle cx="27" cy="7.5" r="4.2" />
      <path d="M22.6 14.2c1.6-1 3.6-1.3 5.3-.5l2.1 1c1.2.6 2 1.6 2.4 2.8l1.7 5 4.2 2.2a2.2 2.2 0 1 1-2 3.9l-5-2.6a3 3 0 0 1-1.4-1.6l-.6-1.8-1.9 7.7 4.4 5c.4.5.7 1 .8 1.6l1.6 7.4a2.3 2.3 0 0 1-4.5 1l-1.5-6.8-5-5.4-1.9 7.2c-.2.6-.5 1.2-1 1.6l-5.6 5.2a2.3 2.3 0 0 1-3.1-3.4l5.2-4.8 3.7-15.3-2.2 1.2-2 5.2a2.2 2.2 0 1 1-4.1-1.6l2.3-5.9c.3-.8.8-1.4 1.5-1.8Z" />
    </g>
  {:else if name === 'car'}
    <g fill="currentColor" stroke="none">
      <path d="M14.6 10.5c.9-2.7 3.4-4.5 6.2-4.5h6.4c2.8 0 5.3 1.8 6.2 4.5l2.4 7.1 1.7.4a4 4 0 0 1 3 3.9V34a2 2 0 0 1-2 2h-1.3v3.5a3 3 0 0 1-6 0V36H14.8v3.5a3 3 0 0 1-6 0V36H7.5a2 2 0 0 1-2-2V21.9a4 4 0 0 1 3-3.9l1.7-.4Zm2.5 7h13.8l-1.8-5.5c-.3-.9-1.1-1.5-2-1.5h-6.2c-.9 0-1.7.6-2 1.5Z" transform="translate(0 2)" />
      <circle cx="13" cy="28" r="2.8" fill="var(--hole, #000)" /><circle cx="35" cy="28" r="2.8" fill="var(--hole, #000)" />
    </g>
  {/if}
</svg>

<style>
  .icon { display: block; flex: none; }
</style>
