import { useEffect, useState } from "react";

/** A free vertical strip of the screen, in CSS pixels from the top. */
export interface Band {
  top: number;
  bottom: number;
  /** How far up the band may stretch when it is too short (hero only: under "Maira"). */
  reach?: number;
}

export interface Bands {
  /** From under "Faryal" in the big name down to the honours, in the hero. The portrait
   *  overlaps "Malik", and may also cover "Faryal" (up to `reach`) when space is tight. */
  hero: Band | null;
  /** Between the header and a book room's title block. */
  book: Band | null;
  /** Width in CSS pixels of the widest line of the big name in the hero. */
  nameWidth: number | null;
}

const GAP = 14;

function measure(): Bands {
  const first = document.querySelector(".giant--hero span:nth-child(1)");
  const name = document.querySelector(".giant--hero span:nth-child(2)");
  const intro = document.querySelector(".hero-foot");
  const header = document.querySelector(".chrome--top");
  const copy = document.querySelector(".book-copy__main");
  const band = (a: Element | null, b: Element | null): Band | null =>
    a && b ? { top: a.getBoundingClientRect().bottom + GAP, bottom: b.getBoundingClientRect().top - GAP } : null;
  // Measure the letters themselves, not the full-width line boxes they sit in.
  const range = document.createRange();
  const widths = [...document.querySelectorAll(".giant--hero span")].map((span) => {
    range.selectNodeContents(span);
    return range.getBoundingClientRect().width;
  });
  const nameWidth = widths.length ? Math.max(...widths) : null;
  // The name's tight line height makes its boxes shorter than the letters; clear the descent.
  const hero = band(name, intro);
  if (hero && name && first) {
    const descent = parseFloat(getComputedStyle(name).fontSize) * 0.12;
    hero.top += descent;
    hero.reach = first.getBoundingClientRect().bottom + GAP + descent;
  }
  return { hero, book: band(header, copy), nameWidth };
}

/**
 * Where the text actually sits, so the 3D portrait and books can be fitted into the space
 * between it on any screen, from an iPhone mini to a desktop. Re-measured whenever the
 * window, the fonts or the text blocks change size.
 */
export function useBands(): Bands {
  const [bands, setBands] = useState<Bands>({ hero: null, book: null, nameWidth: null });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setBands(measure()));
    };
    update();
    void document.fonts.ready.then(update);
    window.addEventListener("resize", update);
    const observer = new ResizeObserver(update);
    document.querySelectorAll(".giant--hero, .hero-foot, .chrome--top, .book-copy__main").forEach((el) => observer.observe(el));
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      observer.disconnect();
    };
  }, []);

  return bands;
}
