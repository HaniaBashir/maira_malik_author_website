import { useSyncExternalStore } from "react";
import gsap from "gsap";
import { sections } from "../content";
import { sfx, unlockAudio } from "../sound";

interface NavState {
  index: number;
  openBook: string | null;
  entered: boolean;
}

// A link like /#meri-raat lands straight in that book's room.
const linked = Math.max(0, sections.findIndex((s) => `#${s.id}` === window.location.hash));

let state: NavState = { index: linked, openBook: null, entered: false };
const listeners = new Set<() => void>();

/** Tweened values read every frame by both the DOM and the 3D scene. */
export const motion = { progress: linked, open: 0 };

export const reducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function set(patch: Partial<NavState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useNav<T>(select: (s: NavState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

export const getNav = () => state;

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const palette = sections.map((s) => ({ bg: rgb(s.palette.bg), ink: rgb(s.palette.ink) }));

/** The current page colours (0–255), read by the 3D fog. */
export const colors = { bg: [...palette[linked].bg], ink: [...palette[linked].ink] };

const mix = (out: number[], a: number[], b: number[], t: number) => {
  a.forEach((v, i) => (out[i] = Math.round(v + (b[i] - v) * t)));
  return `rgb(${out.join(",")})`;
};

let tracks: HTMLElement[] = [];

/**
 * Slide the HTML layers and blend the page background. Only transforms and the body's
 * background change per frame; text colours are fixed per room, so nothing re-renders text mid-slide.
 */
function paint() {
  const p = motion.progress;
  const i = Math.min(Math.floor(p), palette.length - 1);
  const j = Math.min(i + 1, palette.length - 1);
  const t = p - i;
  if (!tracks.length) tracks = Array.from(document.querySelectorAll<HTMLElement>(".track"));
  const shift = `translate3d(${(-p * 100).toFixed(3)}vw,0,0)`;
  tracks.forEach((el) => (el.style.transform = shift));
  document.body.style.backgroundColor = mix(colors.bg, palette[i].bg, palette[j].bg, t);
  mix(colors.ink, palette[i].ink, palette[j].ink, t);
}

/** The fixed frame (header, dots, open-book note) takes the colours of the room being entered. */
function setRoomColours(index: number) {
  const root = document.documentElement.style;
  root.setProperty("--bg", sections[index].palette.bg);
  root.setProperty("--ink", sections[index].palette.ink);
}

/** Called once the layers are in the DOM. */
export const paintNow = () => {
  tracks = [];
  setRoomColours(state.index);
  paint();
};

let busy = false;

export function goTo(index: number) {
  const next = Math.max(0, Math.min(sections.length - 1, index));
  if (next === state.index || state.openBook) return;
  set({ index: next });
  setRoomColours(next);
  history.replaceState(null, "", next ? `#${sections[next].id}` : window.location.pathname);
  busy = true;
  sfx.slide(next);
  gsap.to(motion, {
    progress: next,
    duration: reducedMotion ? 0.4 : 1.4,
    ease: "power3.inOut",
    overwrite: "auto",
    onUpdate: paint,
    onComplete: () => {
      busy = false;
    },
  });
}

export const step = (dir: 1 | -1) => !busy && goTo(state.index + dir);

export function openBook(id: string) {
  if (state.openBook || busy || sections[state.index].id !== id) return;
  set({ openBook: id });
  sfx.open();
  gsap.to(motion, { open: 1, duration: reducedMotion ? 0.3 : 1.8, ease: "power2.inOut", overwrite: "auto" });
}

export function closeBook() {
  if (!state.openBook) return;
  set({ openBook: null });
  sfx.close();
  gsap.to(motion, { open: 0, duration: reducedMotion ? 0.3 : 1.3, ease: "power2.inOut", overwrite: "auto" });
}

export function enter() {
  // Entering is the visitor's first gesture, so sound can start here.
  void unlockAudio().then(sfx.enter);
  set({ entered: true });
}
