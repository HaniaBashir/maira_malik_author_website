import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { author } from "../content";
import { enter, reducedMotion, useNav } from "../state/nav";

/** A counted entrance: the room is lit once everything has loaded. */
export function Preloader() {
  const { progress, active } = useProgress();
  const entered = useNav((s) => s.entered);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = active ? Math.min(progress, 99) : 100;
    if (count >= target) return;
    const id = window.setTimeout(() => setCount((c) => Math.min(target, c + (reducedMotion ? 25 : 3))), 24);
    return () => window.clearTimeout(id);
  }, [count, progress, active]);

  const ready = count >= 100;

  return (
    <div className={`preloader${entered ? " is-gone" : ""}`} aria-hidden={entered}>
      <p className="preloader__name" lang="ur" dir="rtl">
        {author.nameUr}
      </p>
      <p className="preloader__name-en">{author.nameEn}</p>
      <button className="bracket preloader__enter" data-sound="own" onClick={enter} disabled={!ready} autoFocus>
        {ready ? "Enter" : "Loading"}
      </button>
      <div
        className={`loader${ready ? " is-done" : ""}`}
        role="progressbar"
        aria-label="Loading"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={count}
      >
        <span className="loader__bar">
          <span style={{ transform: `scaleX(${count / 100})` }} />
        </span>
        <span className="mono tabular">{String(count).padStart(3, "0")}</span>
      </div>
    </div>
  );
}
