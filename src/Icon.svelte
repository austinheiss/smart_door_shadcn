<script>
  // lucide icons by name (weather + route, side panel picks)
  import { Sun, Moon, Cloud, CloudRain, CloudLightning, CloudSnow, ThermometerSun, ThermometerSnowflake, Check, Footprints, Car, Wifi, Bluetooth } from '@lucide/svelte';
  let { name, size = '1em', strokeWidth = 2.2, class: cls = 'icon' } = $props();
  const ICONS = { sunny: Sun, night: Moon, cloudy: Cloud, rain: CloudRain, storm: CloudLightning, snow: CloudSnow, hot: ThermometerSun, cold: ThermometerSnowflake, check: Check, walk: Footprints, car: Car, wifi: Wifi, bluetooth: Bluetooth };
  const Glyph = $derived(ICONS[name]);
</script>

<Glyph class={cls} {size} {strokeWidth} aria-hidden="true" />

<style>
  :global(.icon) { display: block; flex: none; }
</style>
