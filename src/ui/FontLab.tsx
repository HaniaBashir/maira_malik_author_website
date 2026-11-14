import { useEffect, useState } from "react";

/**
 * A tryout panel for English type pairings. It only appears with ?fonts in the address,
 * so visitors never see it. Each pairing sets the three font roles used across the site.
 */
interface Pairing {
  name: string;
  display: string;
  body: string;
  ui: string;
  /** Google Fonts `family=` parameters; empty for the fonts already loaded. */
  load: string[];
}

const PAIRINGS: Pairing[] = [
  { name: "Literary (current)", display: "Cormorant Garamond", body: "Lora", ui: "IBM Plex Mono", load: [] },
  {
    name: "Editorial",
    display: "Instrument Serif",
    body: "Manrope",
    ui: "JetBrains Mono",
    load: ["Instrument+Serif:ital@0;1", "Manrope:wght@400;500;600", "JetBrains+Mono:wght@400;500"],
  },
  {
    name: "Warm modern",
    display: "Fraunces",
    body: "DM Sans",
    ui: "DM Mono",
    load: ["Fraunces:ital,wght@0,400;1,400", "DM+Sans:wght@400;500;600", "DM+Mono:wght@400;500"],
  },
  {
    name: "Classic print",
    display: "Playfair Display",
    body: "Source Serif 4",
    ui: "Courier Prime",
    load: ["Playfair+Display:ital,wght@0,400;1,400", "Source+Serif+4:wght@400;600", "Courier+Prime:wght@400;700"],
  },
  {
    name: "Fashion",
    display: "Bodoni Moda",
    body: "Karla",
    ui: "Space Mono",
    load: ["Bodoni+Moda:ital,wght@0,400;1,400", "Karla:wght@400;500;600", "Space+Mono:wght@400;700"],
  },
];

const loaded = new Set<string>();

function apply(p: Pairing) {
  const missing = p.load.filter((f) => !loaded.has(f));
  if (missing.length) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${missing.map((f) => `family=${f}`).join("&")}&display=swap`;
    document.head.appendChild(link);
    missing.forEach((f) => loaded.add(f));
  }
  const root = document.documentElement.style;
  root.setProperty("--serif", `"${p.display}", serif`);
  root.setProperty("--sans", `"${p.body}", system-ui, sans-serif`);
  root.setProperty("--mono", `"${p.ui}", ui-monospace, monospace`);
}

export function FontLab() {
  const enabled = new URLSearchParams(window.location.search).has("fonts");
  const [choice, setChoice] = useState(0);

  useEffect(() => {
    if (enabled) apply(PAIRINGS[choice]);
  }, [enabled, choice]);

  if (!enabled) return null;

  return (
    <fieldset className="fontlab">
      <legend className="mono">Try fonts</legend>
      {PAIRINGS.map((p, i) => (
        <label key={p.name}>
          <input type="radio" name="pairing" checked={i === choice} onChange={() => setChoice(i)} />
          <span>
            <strong>{p.name}</strong>
            <small>
              {p.display} · {p.body} · {p.ui}
            </small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
