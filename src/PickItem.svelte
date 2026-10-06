<script>
  // toggle item minus bits-ui's keydown handler, so enter/space click natively
  // (space on keyup, no repeat while held) like a plain button
  import { ToggleGroupItem } from '$lib/components/ui/toggle-group/index.js';
  let { children, ...rest } = $props();
</script>

<ToggleGroupItem {...rest}>
  {#snippet child({ props })}
    {@const { onkeydown: _, ...own } = props}
    <button {...own}>{@render children?.()}</button>
  {/snippet}
</ToggleGroupItem>
