<script>
  // A small slippy-map renderer: draws raster tile layers for a view that
  // either fits a set of points or sits on a centre + zoom. The overlay
  // snippet gets a project() function to place SVG over the map.
  let { fit = null, center = null, zoom = 13, pad = 0.18, offset = [0, 0], layers = [], overlay = null, attribution = '' } = $props();

  let w = $state(0);
  let h = $state(0);

  const world = (lat, lon, z) => {
    const s = 256 * 2 ** z;
    const sin = Math.sin((lat * Math.PI) / 180);
    return [((lon + 180) / 360) * s, (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s];
  };

  const view = $derived.by(() => {
    if (!w || !h) return null;
    if (fit?.length) {
      const lats = fit.map((p) => p[0]), lons = fit.map((p) => p[1]);
      const [x0, y0] = world(Math.max(...lats), Math.min(...lons), 0);
      const [x1, y1] = world(Math.min(...lats), Math.max(...lons), 0);
      const zx = Math.log2((w * (1 - 2 * pad)) / Math.max(1e-9, x1 - x0));
      const zy = Math.log2((h * (1 - 2 * pad)) / Math.max(1e-9, y1 - y0));
      const z = Math.min(zx, zy, 17);
      return { z, c: [((x0 + x1) / 2) * 2 ** z - offset[0] * w, ((y0 + y1) / 2) * 2 ** z - offset[1] * h] };
    }
    const [cx, cy] = world(center[0], center[1], zoom);
    return { z: zoom, c: [cx - offset[0] * w, cy - offset[1] * h] };
  });

  const project = (lat, lon) => {
    const [x, y] = world(lat, lon, view.z);
    return [x - view.c[0] + w / 2, y - view.c[1] + h / 2];
  };

  function tilesFor(layer) {
    if (!view) return [];
    const zi = Math.max(0, Math.min(layer.maxZoom ?? 18, Math.round(view.z)));
    const size = 256 * 2 ** (view.z - zi);
    const left = view.c[0] - w / 2, top = view.c[1] - h / 2;
    const out = [];
    const n = 2 ** zi;
    for (let ty = Math.floor(top / size); ty <= Math.floor((top + h) / size); ty++) {
      for (let tx = Math.floor(left / size); tx <= Math.floor((left + w) / size); tx++) {
        if (ty < 0 || ty >= n) continue;
        const x = ((tx % n) + n) % n;
        out.push({ key: `${zi}/${tx}/${ty}`, src: layer.url.replace('{z}', zi).replace('{x}', x).replace('{y}', ty), left: tx * size - left, top: ty * size - top, size });
      }
    }
    return out;
  }
</script>

<div class="map" bind:clientWidth={w} bind:clientHeight={h}>
  {#each layers as layer (layer.id)}
    <div class="layer {layer.className ?? ''}" style:opacity={layer.opacity ?? 1}>
      {#each tilesFor(layer) as t (t.key)}
        <img src={t.src} alt="" draggable="false" style:left="{t.left}px" style:top="{t.top}px" style:width="{t.size + 0.5}px" style:height="{t.size + 0.5}px" />
      {/each}
    </div>
  {/each}
  {#if view && overlay}
    <svg class="overlay" width={w} height={h} viewBox="0 0 {w} {h}">{@render overlay(project, view.z)}</svg>
  {/if}
  {#if attribution}<span class="attr">{attribution}</span>{/if}
</div>

<style>
  .map { position: absolute; inset: 0; overflow: hidden; }
  .layer { position: absolute; inset: 0; transition: opacity .5s; }
  img { position: absolute; max-width: none; user-select: none; pointer-events: none; }
  .overlay { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
  .attr { position: absolute; right: .6em; bottom: .3em; font-size: .42em; color: rgba(255, 255, 255, .35); letter-spacing: .02em; pointer-events: none; }
</style>
