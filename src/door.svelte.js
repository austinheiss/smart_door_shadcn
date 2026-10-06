// Shared state for the door - what the screen shows, and which card a tap has opened.
import { untrack } from 'svelte';
import routeData from './routes.json';

// How far down the hall you stand.
// "from" is where each distance begins along the hall (0 the far end, 1 at the door).
export const DISTANCES = [
  { label: 'down the hall', from: 0 },
  { label: 'a few steps away', from: 0.4 },
  { label: 'at the door', from: 0.78 },
];

// Weather the screen can show, picked in the side panel.
export const SKIES = ['sunny', 'cloudy', 'rain', 'storm', 'snow', 'hot', 'cold', 'night'];

export const ui = $state({
  view: 'home',
  order: ['route', 'weather', 'remind'],
  distance: 0,
  route: 1,
  sky: 'sunny',
});

export const home = { lat: 39.1305, lon: -84.526 };
export const destination = { name: 'Langsam Library', short: 'Langsam', lat: 39.1345, lon: -84.515 };

// Real walking and driving routes (OpenStreetMap routing), saved in routes.json.
export const routes = [
  { mode: 'walk', label: 'Walk', via: 'UC MainStreet', minutes: Math.round(routeData.walk.seconds / 60), meters: routeData.walk.meters, path: routeData.walk.path },
  // Driving adds five minutes to find parking on campus.
  { mode: 'drive', label: 'Drive', via: 'Clifton Ave', minutes: Math.round(routeData.drive.seconds / 60) + 5, meters: routeData.drive.meters, path: routeData.drive.path },
];

// Times are hours of the day (13.5 is 1:30 PM).
export const events = [
  { id: 'studio', title: 'Design studio', from: 9, to: 11.83, where: 'DAAP 5401', color: '#e8784f' },
  { id: 'lunch', title: 'Lunch with Liam', from: 12.5, to: 13.5, where: 'Currito', color: '#d8b24c' },
  { id: 'gym', title: 'Workout', from: 18.5, to: 20, where: 'Crunch', color: '#62b38c' },
];
export const hourText = (h) => {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')}`;
};

export const reminders = $state([
  { id: 'sketchbook', title: 'Sketchbook', done: false },
  { id: 'charger', title: 'Laptop charger', done: false },
  { id: 'package', title: 'Package slip', done: false },
]);

// The clock starts at 8:31 AM on today's date and runs in real time.
const started = Date.now();
const base = new Date();
base.setHours(8, 31, 0, 0);
export const clock = $state({ now: new Date(base) });
setInterval(() => (clock.now = new Date(base.getTime() + Date.now() - started)), 5000);

export const temp = (f) => Math.round(f);
export const time = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '');

export function leaveBy(index = ui.route) {
  const d = new Date(clock.now);
  d.setHours(9, 0, 0, 0);
  return new Date(d.getTime() - routes[index].minutes * 60000);
}
export function minutesLeft(index = ui.route) {
  return Math.round((leaveBy(index).getTime() - clock.now.getTime()) / 60000);
}
// calm: plenty of time, soon: five minutes or less, now: time to go (or late)
export function urgency() {
  const m = minutesLeft();
  return m > 5 ? 'calm' : m > 0 ? 'soon' : 'now';
}

// What the screen shows: the scene picked in the side panel.
const PREVIEW = {
  sunny: { temp: 74, text: 'Sunny', precipIn: null },
  cloudy: { temp: 61, text: 'Overcast', precipIn: null },
  rain: { temp: 57, text: 'Rain', precipIn: 0 },
  storm: { temp: 69, text: 'Thunderstorms', precipIn: 20 },
  snow: { temp: 28, text: 'Snow', precipIn: 0 },
  hot: { temp: 97, text: 'Hot and sunny', precipIn: null },
  cold: { temp: 14, text: 'Clear and frigid', precipIn: null },
  night: { temp: 52, text: 'Clear night', precipIn: null },
};

export function conditions() {
  const p = PREVIEW[ui.sky] ?? PREVIEW.sunny;
  const night = ui.sky === 'night';
  const kind = night ? 'sunny' : ui.sky;
  // the night cools through the small hours instead of warming toward noon
  const hourly = Array.from({ length: 10 }, (_, i) => ({ offset: i - 0.5, temp: night ? p.temp - Math.round(i * 0.8) : p.temp + Math.round(Math.sin(i / 2.5) * 5 + i * 0.6), pop: p.precipIn === null ? 5 : 70 - i * 4 }));
  return { ...p, kind, isDay: !night, feels: p.temp - 2, high: night ? p.temp + 16 : p.temp + 5, low: p.temp - 7, wind: night ? 4 : 9, hourly };
}

// Tapping a card opens it in place and the other two shrink to their sentence, and tapping the open card (or another one) closes it or hands the screen over.
const isCard = (key) => ui.order.includes(key);

export function tap(key) {
  touch();
  if (isCard(key)) ui.view = ui.view === key ? 'home' : key;
  else if (key.startsWith('route')) ui.route = Number(key.slice(5));
  else {
    const r = reminders.find((r) => r.id === key);
    if (r) r.done = !r.done;
  }
}

export function back() {
  ui.view = 'home';
}

// Nothing stays open for long untouched: after a while all three return to rest.
const IDLE_MS = 20000;
let lastTouch = Date.now();
function touch() { lastTouch = Date.now(); }
setInterval(() => { if (ui.view !== 'home' && Date.now() - lastTouch > IDLE_MS) back(); }, 1000);

// Where you stand in the hallway, 0 the far end and 1 at the door. The slider
// writes `target`; `at` follows it smoothly and is what the scene draws from.
// Crossing a distance's `from` changes ui.distance.
export const walk = $state({ target: 0.1, at: 0.1 });
// Whether the keys on the hall's wall hook are still in view; the hall sets it as you
// walk, and the reminder notices once you have passed them.
export const hall = $state({ keysGone: false });
export const zoneAt = (at) => DISTANCES.findLastIndex((d) => at >= d.from);
export function walkTo(at) {
  walk.target = Math.max(0, Math.min(1, at));
}

// `at` is a critically damped spring on `target`: a drag is followed closely,
// a long jump glides there and settles without overshooting. With reduced
// motion it jumps. The frame loop only runs while there is somewhere to go;
// any write to `target` (the slider, walkTo, or the console) wakes it.
const STIFF = 11; // the spring's natural frequency, per second
let speed = 0;
let frame = 0;
let last = 0;
const still = matchMedia('(prefers-reduced-motion: reduce)');

function arrive(at) {
  walk.at = at;
  const z = zoneAt(at);
  if (z !== ui.distance) ui.distance = z;
}

function step(now) {
  const dt = Math.min(0.1, (now - (last || now)) / 1000);
  last = now;
  // the exact step of a critically damped spring, so it is stable at any frame rate
  const off = walk.at - walk.target;
  const e = Math.exp(-STIFF * dt);
  const k = (speed + STIFF * off) * dt;
  speed = (speed - STIFF * k) * e;
  const next = walk.target + (off + k) * e;
  if (Math.abs(next - walk.target) < 1e-4 && Math.abs(speed) < 1e-3) {
    speed = 0;
    frame = 0;
    arrive(walk.target);
    return;
  }
  arrive(next);
  frame = requestAnimationFrame(step);
}

function wake() {
  if (still.matches) {
    cancelAnimationFrame(frame);
    frame = 0;
    speed = 0;
    arrive(walk.target);
  } else if (!frame && walk.at !== walk.target) {
    last = 0;
    frame = requestAnimationFrame(step);
  }
}

// Stepping back from the door puts an open card away: the screen returns to
// rest for wherever you now stand. Stepping closer leaves it open.
let was = walk.target;
$effect.root(() => {
  $effect(() => {
    const to = walk.target;
    untrack(() => {
      if (to < was && ui.view !== 'home') back();
      was = to;
      wake();
    });
  });
});

// In development, `walk` is on window so the hall can be checked from the console.
if (import.meta.env.DEV) window.walk = walk;
