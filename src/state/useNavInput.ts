import { useEffect } from "react";
import { closeBook, getNav, goTo, step } from "./nav";

const scroller = (target: EventTarget | null) =>
  (target as Element | null)?.closest?.<HTMLElement>("[data-scrolls]") ?? null;

const canScroll = (el: HTMLElement, dy: number) =>
  dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;

/** Wheel, keyboard and swipe all move one room at a time. */
export function useNavInput() {
  useEffect(() => {
    let acc = 0;
    let idle: number | undefined;

    const onWheel = (e: WheelEvent) => {
      if (getNav().openBook || !getNav().entered) return;
      // Vertical scrolling inside a room that scrolls (the author room) scrolls it until it reaches the end.
      const box = scroller(e.target);
      if (box && Math.abs(e.deltaY) > Math.abs(e.deltaX) && canScroll(box, e.deltaY)) return;
      e.preventDefault();
      acc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => (acc = 0), 180);
      if (Math.abs(acc) > 45) {
        step(acc > 0 ? 1 : -1);
        acc = 0;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      // Arrow keys inside form controls (e.g. the font tryout) belong to the control.
      if ((e.target as HTMLElement | null)?.closest?.("input, select, textarea")) return;
      const nav = getNav();
      if (nav.openBook) {
        if (e.key === "Escape") closeBook();
        return;
      }
      if (!nav.entered) return;
      if (["ArrowRight", "ArrowDown", "PageDown"].includes(e.key)) step(1);
      else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) step(-1);
      else if (e.key === "Home") goTo(0);
      else if (e.key === "End") goTo(Infinity);
    };

    let startX = 0;
    let startY = 0;
    let startBox: HTMLElement | null = null;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startBox = scroller(e.target);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (getNav().openBook || !getNav().entered) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      // In a scrolling room, up/down swipes scroll it; only sideways swipes change rooms.
      if (startBox && startBox.scrollHeight > startBox.clientHeight + 1 && Math.abs(dy) > Math.abs(dx)) return;
      const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(d) > 50) step(d < 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);
}
