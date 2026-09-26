// Shared state for the door: which display and knob are fitted, what the
// screen shows, and which item the knob is pointing at.
import routeData from './routes.json';

// "Shuffle as you get closer": the most useful section moves to the top.
export const DISTANCES = [
  { id: 'far', short: 'Far', label: 'down the hall', order: ['route', 'weather', 'remind'] },
  { id: 'near', short: 'Near', label: 'a few steps away', order: ['weather', 'route', 'remind'] },
  { id: 'door', short: 'At door', label: 'at the door', order: ['remind', 'route', 'weather'] },
];

// Weather the screen can preview. "live" uses the real conditions outside.
export const SKIES = ['live', 'sunny', 'cloudy', 'rain', 'storm', 'snow', 'fog', 'hot', 'cold'];

export const ui = $state({
  layout: 'rect', // rect | strip
  knob: 'handle', // handle | joystick
  view: 'home', // home | weather | route | remind
  focus: -1, // nothing is selected until the knob or a touch picks something
  order: [...DISTANCES[0].order],
  distance: 0,
  manual: false,
  celsius: false,
  route: 0, // 0 walk, 1 drive
  sky: 'live',
  lever: 0, // handle angle nudged by the keyboard
  push: { x: 0, y: 0 }, // joystick offset nudged by the keyboard
  twist: 0, // joystick ring angle nudged by the keyboard
});

// ---------------------------------------------------------------- places + routes
export const home = { name: 'Home', lat: 39.1305, lon: -84.526 };
export const destination = { name: 'Design studio', place: 'DAAP 5401', short: 'DAAP', lat: 39.1343, lon: -84.5185, at: '9:00' };

// Real walking and driving routes (OpenStreetMap routing), saved in routes.json.
export const routes = [
  { mode: 'walk', label: 'Walk', via: 'Straight St', minutes: Math.round(routeData.walk.seconds / 60), meters: routeData.walk.meters, path: routeData.walk.path },
  // Driving adds five minutes to find parking on campus.
  { mode: 'drive', label: 'Drive', via: 'Clifton Ave', minutes: Math.round(routeData.drive.seconds / 60) + 5, meters: routeData.drive.meters, path: routeData.drive.path, note: 'incl. 5 min parking' },
];

// ---------------------------------------------------------------- calendar
// Times are hours of the day (13.5 is 1:30 PM).
export const events = [
  { id: 'studio', title: 'Design studio', from: 9, to: 11.83, where: 'DAAP 5401', color: '#e8784f' },
  { id: 'lunch', title: 'Lunch with Maya', from: 12.5, to: 13.5, where: 'Clifton Market', color: '#d8b24c' },
  { id: 'crit', title: 'Portfolio crit', from: 15, to: 16, where: 'Zoom', color: '#9a93ef' },
  { id: 'gym', title: 'Climbing', from: 18.5, to: 20, where: 'Rockquest', color: '#62b38c' },
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

// ---------------------------------------------------------------- clock
// Sample morning: the clock starts at 8:31 AM on today's date and runs in real time.
const started = Date.now();
const base = new Date();
base.setHours(8, 31, 0, 0);
export const clock = $state({ now: new Date(base) });
setInterval(() => (clock.now = new Date(base.getTime() + Date.now() - started)), 5000);

export const temp = (f) => (ui.celsius ? Math.round(((f - 32) * 5) / 9) : Math.round(f));
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

// ---------------------------------------------------------------- weather
// Live conditions for Cincinnati from Open-Meteo, with sample data as a fallback.
export const weather = $state({
  live: false,
  temp: 64, feels: 63, high: 72, low: 58, wind: 6, code: 2, isDay: true,
  hourly: [], // { offset (hours from now), temp, code, pop }
  precip: [], // mm per 15 minutes for the next three hours
  precipIn: null, // minutes until precipitation starts, null when none is coming
});

const LAT = 39.1031, LON = -84.512;
async function loadWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,apparent_temperature,weather_code,is_day,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&minutely_15=precipitation&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=2`;
    const d = await (await fetch(url)).json();
    const nowIso = d.current.time;
    const start = d.hourly.time.findIndex((t) => t >= nowIso.slice(0, 13));
    Object.assign(weather, {
      live: true,
      temp: d.current.temperature_2m, feels: d.current.apparent_temperature, code: d.current.weather_code,
      isDay: d.current.is_day === 1, wind: Math.round(d.current.wind_speed_10m),
      high: d.daily.temperature_2m_max[0], low: d.daily.temperature_2m_min[0],
      hourly: d.hourly.time.slice(Math.max(0, start), Math.max(0, start) + 10).map((t, i) => ({
        offset: i - new Date(nowIso).getMinutes() / 60, temp: d.hourly.temperature_2m[start + i], code: d.hourly.weather_code[start + i], pop: d.hourly.precipitation_probability[start + i],
      })),
    });
    const m = d.minutely_15;
    const from = m.time.findIndex((t) => t >= nowIso);
    const next = m.precipitation.slice(from, from + 12).findIndex((p) => p > 0.05);
    weather.precipIn = next < 0 ? null : next * 15;
    weather.precip = m.precipitation.slice(from, from + 12);
  } catch {
    weather.live = false;
  }
}
loadWeather();
setInterval(loadWeather, 10 * 60 * 1000);

export function kindOf(code, t) {
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code === 3) return 'cloudy';
  if (t >= 88) return 'hot';
  if (t <= 32) return 'cold';
  return code === 2 ? 'partly' : 'sunny';
}

// What the screen shows: the live reading, or a preview picked in the side panel.
const PREVIEW = {
  sunny: { temp: 74, code: 0, text: 'Sunny', precipIn: null },
  cloudy: { temp: 61, code: 3, text: 'Overcast', precipIn: null },
  rain: { temp: 57, code: 63, text: 'Rain', precipIn: 0 },
  storm: { temp: 69, code: 95, text: 'Thunderstorms', precipIn: 20 },
  snow: { temp: 28, code: 73, text: 'Snow', precipIn: 0 },
  fog: { temp: 52, code: 45, text: 'Fog', precipIn: null },
  hot: { temp: 97, code: 0, text: 'Hot and sunny', precipIn: null },
  cold: { temp: 14, code: 1, text: 'Clear and frigid', precipIn: null },
};
const TEXT = { sunny: 'Clear', partly: 'Partly cloudy', cloudy: 'Overcast', rain: 'Rain', storm: 'Thunderstorms', snow: 'Snow', fog: 'Fog', hot: 'Hot', cold: 'Cold and clear' };

export function conditions() {
  if (ui.sky !== 'live') {
    const p = PREVIEW[ui.sky];
    const kind = ui.sky === 'sunny' ? 'sunny' : ui.sky;
    const hourly = Array.from({ length: 10 }, (_, i) => ({ offset: i - 0.5, temp: p.temp + Math.round(Math.sin(i / 2.5) * 5 + i * 0.6), code: p.code, pop: p.precipIn === null ? 5 : 70 - i * 4 }));
    const wet = { rain: 1.2, storm: 2.6, snow: 0.8 }[kind] ?? 0;
    const precip = Array.from({ length: 12 }, (_, i) => (p.precipIn === null || i * 15 < p.precipIn ? 0 : wet * (0.5 + Math.sin(i * 0.9) * 0.4 + (i % 3) * 0.15)));
    return { ...p, kind, isDay: true, feels: p.temp - 2, high: p.temp + 5, low: p.temp - 7, wind: 9, hourly, precip, live: false };
  }
  const kind = kindOf(weather.code, weather.temp);
  const precipIn = kind === 'rain' || kind === 'snow' || kind === 'storm' ? 0 : weather.precipIn;
  return { ...weather, kind, text: TEXT[kind], precipIn };
}

// One factual line under the reading: when precipitation starts, otherwise how it feels.
export function outlook(c) {
  if (c.precipIn) return `Starting around ${time(new Date(clock.now.getTime() + c.precipIn * 60000))}`;
  return `Feels like ${temp(c.feels)}°`;
}

// ---------------------------------------------------------------- knob navigation
// The knob walks one list: each card, and inside the open card its controls.
// Landing on a card is selecting it: at the door it opens in place and the
// other two shrink to their sentence; farther away it is only emphasised.
const controlsOf = (k) => (k === 'weather' ? ['unit'] : k === 'route' ? ['route0', 'route1'] : reminders.map((r) => r.id));
const isCard = (key) => ui.order.includes(key);

export function items() {
  const out = [];
  for (const k of ui.order) {
    out.push(k);
    if (ui.view === k) out.push(...controlsOf(k));
  }
  return out;
}

// point the knob at a card (and open it when you're close enough to read it)
function land(key) {
  ui.view = ui.distance === 2 ? key : 'home';
  ui.focus = items().indexOf(key);
}

export function move(step) {
  touch();
  const list = items();
  const n = list.length;
  const i = ui.focus < 0 ? (step > 0 ? 0 : n - 1) : (ui.focus + step + n) % n;
  const key = list[i];
  if (isCard(key)) land(key);
  else ui.focus = i;
}

export function select(key = items()[ui.focus]) {
  if (key === undefined) return move(1);
  touch();
  if (isCard(key)) {
    // selecting the card you're already on puts everything back to rest
    if (ui.view === key || (ui.view === 'home' && items()[ui.focus] === key && ui.distance < 2)) {
      back(true);
      hoverBlocked = key; // don't let a resting mouse reopen what was just closed
    }
    else land(key);
  } else if (key === 'unit') {
    ui.celsius = !ui.celsius;
  } else if (key.startsWith('route')) {
    ui.route = Number(key.slice(5));
  } else {
    const r = reminders.find((r) => r.id === key);
    if (r) r.done = !r.done;
  }
}

export function back(rest = false) {
  const from = ui.view;
  ui.view = 'home';
  ui.focus = rest ? -1 : Math.max(-1, items().indexOf(from));
}

// Nothing stays open for long untouched: after a while all three return to rest.
const IDLE_MS = 20000;
let lastTouch = Date.now();
export function touch() { lastTouch = Date.now(); }
setInterval(() => { if ((ui.view !== 'home' || ui.focus >= 0) && Date.now() - lastTouch > IDLE_MS) back(true); }, 1000);

// A tap (or click) points the knob at what was touched and selects it.
export function tap(key) {
  touch();
  if (isCard(key)) return select(key);
  ui.focus = items().indexOf(key);
  select(key);
}

// Hovering a card with a pointer is the same as turning the knob onto it.
let hoverBlocked = null;
export function hover(key) {
  if (key === hoverBlocked) return;
  touch();
  if (ui.view !== key && items()[ui.focus] !== key) land(key);
}
export function unhover(key) {
  if (key === hoverBlocked) hoverBlocked = null;
}

// How close you are sets how much the screen says: from down the hall only
// the three sentences, a few steps away their detail lines too, and at the
// door everything, including opening the card you point at.
export function setDistance(i) {
  const key = items()[ui.focus];
  ui.distance = i;
  if (isCard(key)) land(key);
  else if (i < 2) back(ui.focus < 0);
}

export function reorder(key, index) {
  const focused = ui.view === 'home' ? items()[ui.focus] : null;
  const order = ui.order.filter((k) => k !== key);
  order.splice(index, 0, key);
  ui.order = order;
  ui.manual = true;
  ui.focus = focused ? items().indexOf(focused) : -1;
}

export function setLayout(layout) {
  ui.layout = layout;
  ui.view = 'home';
  ui.focus = -1;
}
