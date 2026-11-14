import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Peek {
  src: string;
  x: number;
  y: number;
  /** Touch: shown centred until the next tap. */
  pinned: boolean;
}

let show: (p: Peek | null) => void = () => {};

/** Show a photo beside the pointer (mouse) or centred on screen (touch). */
export const peek = {
  at(src: string, x: number, y: number) {
    show({ src, x, y, pinned: false });
  },
  pin(src: string) {
    show({ src, x: 0, y: 0, pinned: true });
  },
  hide() {
    show(null);
  },
};

/** Preload so the photo appears the instant it is asked for. */
export function preloadPhotos(srcs: string[]) {
  srcs.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

/**
 * The floating photo card. Rendered at the top of the page (outside the author room,
 * whose edges fade out) so it is never clipped.
 */
export function PhotoPeek() {
  const [current, setCurrent] = useState<Peek | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    show = (p) => {
      if (p) setCurrent(p);
      setVisible(!!p);
    };
    return () => {
      show = () => {};
    };
  }, []);

  // A pinned (tapped) photo closes on the next tap anywhere.
  useEffect(() => {
    if (!current?.pinned || !visible) return;
    const close = () => setVisible(false);
    const id = window.setTimeout(() => window.addEventListener("pointerdown", close, { once: true }), 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointerdown", close);
    };
  }, [current, visible]);

  if (!current) return null;

  // Beside the cursor, flipped to its left on the right half of the screen, kept on screen.
  const style: React.CSSProperties = current.pinned
    ? {}
    : {
        left: current.x > window.innerWidth / 2 ? current.x - 28 : current.x + 28,
        top: Math.min(Math.max(current.y, 170), window.innerHeight - 170),
        translate: current.x > window.innerWidth / 2 ? "-100% -50%" : "0 -50%",
      };

  return createPortal(
    <figure
      className={`peek${visible ? " is-visible" : ""}${current.pinned ? " is-pinned" : ""}`}
      style={style}
      aria-hidden
    >
      <img src={current.src} alt="" />
    </figure>,
    document.body,
  );
}
