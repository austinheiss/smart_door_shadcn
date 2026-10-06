# Smart Door

A screen on the front door that tells you what you need to know on your way out. From down the hall it shows three short sentences. Walk closer and it fills in the details.

You can try it at [smart-door-shadcn.vercel.app](https://smart-door-shadcn.vercel.app/).

<img src="docs/images/final-overview.jpg" alt="The prototype: a hand-drawn hallway with a door at the end, and a side panel on the right." width="720">

The prototype runs in the browser. The hallway and side panel are drawn in the style of my sketches and the screen on the door is the actual design. The panel lets you change the weather and walk toward the door.

## The idea

Before leaving the house I generally want to know how long it takes to get where I'm going, what it's like outside, and whether I forgot anything. The front door is the one place I always pass right before leaving, so I designed a display for it. It started from one page of sketches, including a note that the screen should change as you get closer.

There is also [scientific evidence](https://pubmed.ncbi.nlm.nih.gov/25412111/) backing up the need for this product, showing that walking through doors causes you to forget things as you enter a new environment.

<img src="docs/images/sketch.png" alt="Pen sketch of door shapes, display layouts and knobs." width="360">

The original sketch. The top half models different places for a screen on a door. The middle models layouts for weather, a predicted route and calendar reminders. The bottom shows two physical controls, a joystick knob and a handle you push down to move between items, which I did not end up using based on user feedback.

## Design

A door screen is read in a few seconds, often from across the room and often with full hands. That shaped most of the decisions.

The screen leads with sentences rather than bare numbers. "9 min" on its own makes you work out what it refers to. "It will take 9 min to get to Langsam Library" does not. The number stays in the sentence, set in a heavier weight so it still stands out.

The screen is split into three stacked parts: directions, weather and reminders. Their order never changes, so you learn where to look. Instead of tabs or menus, each part can be opened in place with a tap.

The map and the weather skies fade into black on every side, so there are no borders between the three parts and the screen reads as one surface. I avoided glows, outlines and drop shadows.

## Interface

### Walking toward the door

The door sits at the end of a hallway drawn in one-point perspective. The "Where you stand" slider in the side panel moves you down the hall. You can drag the walking figure, click one of the three zone names under it, or use the arrow keys. The view follows the slider smoothly, and the door grows as you approach.

<img src="docs/images/final-hall-walking-0.3.jpg" alt="The hallway partway to the door." width="720">

Partway down the hall.

The screen has three levels of detail. It switches between them about 40% and 78% of the way to the door. Between those points the text still scales smoothly with your distance, so nothing jumps.

<img src="docs/images/final-dist-far-screen.jpg" alt="The screen from down the hall." width="320">

From down the hall, the screen shows only three sentences in large type. From that far away you can't read anything smaller, so nothing smaller is shown.

<img src="docs/images/final-dist-mid-screen.jpg" alt="The screen from a few steps away." width="320">

A few steps away, a supporting line appears under each sentence: when to leave, the high and low for the day, and your next event.

<img src="docs/images/final-dist-door-screen.jpg" alt="The screen at the door." width="320">

At the door, it shows everything. A small line above each sentence adds the travel mode and route, the current conditions, and how long until your next event. The clock appears in the top-right corner.

<img src="docs/images/final-clock-icons.png" alt="The clock reading 8:31 with Wi-Fi and Bluetooth icons." width="180">

The clock with the Wi-Fi and Bluetooth icons, the two connections a door like this would rely on. In the prototype the clock starts at 8:31 AM and then runs in real time, so the leave-by times count down.

### Opening a part

Each part leads with a sentence. Tap one to open it in place, and the other two shrink to their sentence. Esc or 20 seconds without a touch puts it away, and so does stepping backward.

Tapping one of the shrunk sentences switches straight to that part. Stepping back closes an open part because you couldn't read it from farther away anyway. Stepping closer leaves it open. Hovering does nothing, since a door screen is a touch screen and nothing should depend on a mouse.

### Directions

<img src="docs/images/final-card-directions-drive-screen.jpg" alt="The directions card opened with driving selected." width="320">

The directions part says "It will take 9 min to get to Langsam Library", the library on my campus. Behind it is a street map I drew from an OpenStreetMap snapshot of the neighborhood, with streets, footpaths, parks and buildings kept faint so the route stands out. A small dot travels along the route. Opened, it lists driving and walking. Driving is 1.1 miles via Clifton Ave and takes 9 minutes, including five minutes to find parking. Each row shows the time you'd have to leave.

<img src="docs/images/final-card-directions-walk-screen.jpg" alt="The directions card with walking selected." width="320">

Tapping Walk switches to the walking route: 0.9 miles via UC MainStreet, 19 minutes. The map redraws the route and the sentence updates. The leave-by line turns amber when you have five minutes or less and red when you're late.

### Weather

<img src="docs/images/final-card-weather-sunny-screen.jpg" alt="The weather card opened on a sunny day." width="320">

The weather part says what it feels like outside, for example "It feels like 72° outside". Opened, it shows the high, the low, the wind and an hourly row for now and the next seven hours.

<img src="docs/images/final-card-weather-rain-radar-screen.jpg" alt="The weather card opened during rain, with radar." width="320">

When it's raining, snowing or a storm is on the way, the line under the sentence tells you to take an umbrella, and a small radar scope appears. It shows rain cells drifting around home, with a 10-mile ring for scale.

Every kind of weather has its own animated sky, drawn on a canvas. You pick the weather in the side panel: sunny, cloudy (shown as Overcast on the screen), rain, storm, snow, hot, cold and night.

<img src="docs/images/final-panel-weather.jpg" alt="The weather picks in the side panel." width="360">

The weather picks in the side panel.

<img src="docs/images/final-weather-snow-door-screen.jpg" alt="The screen with a snowy sky." width="320">

Snow, with falling flakes and a blue-white radar.

<img src="docs/images/final-weather-hot-door-screen.jpg" alt="The screen with a hot, hazy orange sky." width="320">

A hot day, with an orange sky and a bright sun.

<img src="docs/images/final-weather-night-door-screen.jpg" alt="The screen with a night sky and the moon." width="320">

A clear night with the moon.

### Reminders

<img src="docs/images/final-card-calendar-screen.jpg" alt="The reminders card opened." width="320">

The reminders part shows the reminder most likely to matter right now, with the next event under it. Opened, it shows the day's schedule next to a "Bring" list (sketchbook, laptop charger, package slip). Tap an item to check it off.

In the concept, a camera on the door notices when you're leaving without something. The prototype acts this out with keys on a wall hook in the hallway.

<img src="docs/images/final-keys-before.jpg" alt="The hallway with keys on the wall hook and the screen saying Don't forget your keys for class." width="720">

Before you walk past the hook, the screen says "Don't forget your keys for class".

<img src="docs/images/final-keys-after.jpg" alt="Closer to the door, the keys are out of view and the screen says Looks like you forgot your keys." width="720">

Once the keys have passed out of view, the sentence fades to "Looks like you forgot your keys". If you walk back, it changes back.

### The side panel

The panel next to the hallway is not part of the product. It is there so someone trying the prototype can change the weather, walk toward the door and read what a real door would do.

<img src="docs/images/final-panel-explainer.jpg" alt="The What you're seeing notes in the side panel." width="360">

The "What you're seeing" notes explain three things the prototype can only pretend to do: notice what you're carrying, adapt to your distance, and plan directions from your calendar and usual travel.

## Process

The design went through many versions. Three turning points changed it the most.

<img src="docs/images/history-v9-screen.jpg" alt="An earlier version of the screen with a grey street map and a sky band." width="320">

Early versions were busy, with big countdown numbers, map tiles from a web service and a calendar styled after Apple's. I asked for a full rethink rather than more tweaks. This version is calmer and closer to print. The map tiles were replaced with my own drawing of the neighborhood, and the radar became a simple scope with range rings instead of a full radar map.

<img src="docs/images/history-v25-down-the-hall-screen.jpg" alt="An earlier version from down the hall, showing three sentences." width="320">

The second turning point was making the screen respond to distance. My sketch said the sections should shuffle as you get closer, and earlier versions did reorder them. Moving things around made the screen harder to follow, so instead the order stays fixed and more detail appears as you approach. At the same time, opening a part moved into the screen itself, which removed the separate detail views and their Back buttons.

<img src="docs/images/history-shadcn-hallway-oct5.jpg" alt="The first version of the hallway." width="720">

Up to this point you picked a distance from a list. The last turning point put the door in a hallway you actually walk down, so the change in detail is something you see happen. Around the same time the app was rebuilt on shadcn-svelte, and I cut the extra door shapes and the knob controls so the screen became the only way to interact.

## How it's built

The app uses Svelte 5 and Vite, with Tailwind CSS 4. The slider, the weather and route toggles and the separator come from shadcn-svelte, the checklist uses a Bits UI checkbox, and the icons are from Lucide. All of them are restyled to match the drawing. The screen uses the Geist font; the side panel uses Caveat for the handwriting and Atkinson Hyperlegible for small text. To run it, use `npm install` and then `npm run dev`.

The code is in `src/`. `door.svelte.js` holds the shared state: where you stand, which part is open, the weather pick, the clock, the saved routes and the 20-second idle timer. Every component reads from it.

- `App.svelte` lays out the hallway and the side panel.
- `Hallway.svelte` draws the hallway in one-point perspective as SVG from a few measurements (hall width, ceiling height, eye height), and works out when the keys have left the view. The door is a real page element that is only moved and scaled, so the screen never re-lays out its text while you walk.
- `DistanceSlider.svelte` is the "Where you stand" slider. The view follows it like a spring that eases into place without bouncing. With reduced motion turned on, it jumps.
- `Display.svelte` is the screen. It stacks the three parts, applies the distance levels, builds the soft fades, and clips the screen to a rounded square with smooth corners.
- `RouteSection.svelte` and `NeighborhoodMap.svelte` are the directions part and the map. The map draws `neighborhood.json`, an OpenStreetMap snapshot with about 3,800 buildings plus streets, paths and parks. The walking and driving routes come from OpenStreetMap routing and are saved in `routes.json`.
- `WeatherSection.svelte`, `WeatherSky.svelte` and `RadarScope.svelte` are the weather part, the canvas skies and the radar.
- `CalendarSection.svelte` is the reminders part, including the keys sentence and the checklist.
- `HandleKnob.svelte` is the door handle. It swings when you drag it but doesn't control anything.

## Future work

The camera and calendar were never connected. The keys on the hook stand in for the camera, and the schedule and destination are sample data. A real version would read your calendar, learn how you usually travel, and use a camera to notice what you're carrying.

<img src="docs/images/history-v4-rain-radar-screen.jpg" alt="An earlier version in rain, with a radar map beside the weather." width="320">

Live weather and radar were built and worked for most of the project. I removed them near the end so the demo always shows the weather picked in the panel. The code still exists in an earlier version, so bringing it back means porting it into the final build.

An open part is closed by tapping its top edge, but that area is invisible and doesn't line up with the headline, so tapping the headline does nothing. A clearer close target is the next fix.

I also built and then removed some ideas from the sketch.

<img src="docs/images/history-v3-arch-joystick.jpg" alt="An earlier version with an arched door and a hand-drawn joystick knob." width="720">

The sketch had several door shapes and two physical controls. Pushing the joystick moved between sections, and twisting or pressing it selected one. The handle could also step through items. Both worked, but tapping the screen turned out to be simpler, so the knobs, the arched door and the narrow strip door were cut.

<img src="docs/images/history-v19-drag-grips-screen.jpg" alt="An earlier version showing drag handles on each section." width="320">

The sketch also suggested dragging the sections into your own order. That was built too, and later removed in favor of a fixed order.

<img src="docs/images/history-shadcn-fog-screen.jpg" alt="An earlier version with a fog sky." width="320">

A fog sky and a Fahrenheit and Celsius toggle were also removed.

## Built with Claude

I built this with the assistance of Claude Code. I made the sketches, directed every design decision, and gave feedback through screenshots over many rounds. Claude wrote most of the code for animations and the 3D space. Several agents worked on separate parts at once, and a reviewer agent checked each round in a browser before I saw it. It also helped me with this readme, gathering my images and formatting it in the right way.

I found that working this way allowed me to explore more design possibilities, and push the project closer to what I envisioned in my head.

Map data © OpenStreetMap contributors.
