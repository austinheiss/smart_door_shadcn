# Smart door

An interactive version of the paper sketch (`tmp/pdfs/smart-doors.png`), built with Svelte 5. The page, door and knobs keep the sketch's look (black ink doors, blue displays, green knobs).

The screen on the door has three cards, inset from the frame and spaced apart, each with its picture feathered to black at the edges:
- **Directions:** minutes until you should leave, walking or driving, over our own drawing of the neighbourhood (OpenStreetMap streets, paths, parks and buildings in `src/neighborhood.json`) with the route lit and a dot walking it.
- **Weather:** live conditions for Cincinnati over an animated sky (sun, clouds, rain, lightning, snow, fog, heat, frost), and the next few hours in one line. When precipitation is coming, a radar scope with range rings around home fades in beside it.
- **Today:** set like a timetable: the next event in full, what follows, and what to bring.

Each card leads with a sentence ("It will take 15 min to get to Design studio", "It feels like 71° outside", "Don't forget the sketchbook for Design studio"). Pointing the knob at a card lifts it and dims the others; selecting it opens it in place while the other two shrink to their sentence. The display font is Geist.

Earlier versions are saved next to this folder: `smart_door_v1` (the original oak door), `smart_door_v2_apple` (Apple-style restyle) and `smart_door_v3_departure` (departure-board display) `smart_door_v4_live` (first version of the live screen) `smart_door_v5` (before the original weather and calendar designs) and `smart_door_v6` (before the spacing pass), `smart_door_v7` (before the page layout fix) `smart_door_v8` (before the calm redesign of the screen) and `smart_door_v9` (before the cards).

## Run

```sh
npm install
npm run dev
```

Open the URL printed by Vite. `npm run check` checks the Svelte components and `npm run build` creates the production build.

## What's in it

**Two doors**, from the sketch's display concepts:
- **Panel:** the three sections stacked.
- **Strip:** a tall display beside the knob with the same three sections.

**Two knobs**, working as annotated:
- **Handle knob:** push the lever down to go to the next element, lift it up to select, or push the lock in to select. Keys: ↓ next, ↑ select.
- **Joystick knob:** push it in any direction to navigate, twist the ring or push the cap in to select. Keys: arrows to navigate, Enter to select.

The outline on the screen shows what the knob is pointing at. You can also tap the screen directly. Esc goes back.

**Shuffle as you get closer, or drag & drop:** pick how close you are and the most useful section moves to the top (down the hall: directions, a few steps away: weather, at the door: today), or drag the dots on a section to set your own order.

The route line and countdown turn amber five minutes before you need to leave and red when it's time to go.

Data sources: weather from Open-Meteo and radar from RainViewer (both live, no key), map tiles from Stadia Maps (free on localhost; a hosted copy needs a Stadia API key), and the walking and driving routes from OpenStreetMap routing, saved in `src/routes.json`. The calendar is sample data, and the clock starts at 8:31 AM on today's date. The side panel can preview any weather condition.

## Files

- `src/door.svelte.js`: shared state and the knob actions (next, select, back, reorder).
- `src/Display.svelte`: the three display layouts and their detail screens.
- `src/HandleKnob.svelte`, `src/JoystickKnob.svelte`: the knobs.
- `src/RouteSection.svelte`, `src/WeatherSection.svelte`, `src/CalendarSection.svelte`: the three screen sections.
- `src/MapView.svelte`: a small tile-map renderer used for the route and the radar (`src/RadarMap.svelte`).
- `src/WeatherSky.svelte`: the animated sky. `src/WxIcon.svelte`, `src/Icon.svelte`: icons.
