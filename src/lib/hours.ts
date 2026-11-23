import type { Place } from '../data/types';

/** Current hour (fractional) in Dubai time, which is UTC+4 all year (no daylight saving). */
export function dubaiHour(now = new Date()) {
  return (now.getUTCHours() + 4 + now.getUTCMinutes() / 60) % 24;
}

function fmt(h: number) {
  const x = h % 24;
  const hh = Math.floor(x);
  const mm = Math.round((x - hh) * 60);
  const ampm = hh < 12 ? 'am' : 'pm';
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return mm ? `${h12}:${mm.toString().padStart(2, '0')}${ampm}` : `${h12}${ampm}`;
}

export interface OpenState {
  open: boolean;
  label: string;
}

/** "Open now · until 1am" style hint. Null when we have no verified hours. */
export function openState(p: Place, now = new Date()): OpenState | null {
  if (!p.hours) return null;
  const [o, c] = p.hours;
  const h = dubaiHour(now);
  // Hours past midnight (c > 24) also cover the early-morning hours.
  const open = (h >= o && h < c) || (c > 24 && h < c - 24);
  if (open) {
    const left = (c - (h < o ? h + 24 : h)) * 60;
    return { open: true, label: left <= 60 ? `Closes soon · ${fmt(c)}` : `Open now · until ${fmt(c)}` };
  }
  return { open: false, label: `Closed · opens ${fmt(o)}` };
}
