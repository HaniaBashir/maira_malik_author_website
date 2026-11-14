import { useEffect } from "react";
import { sfx } from "./sound";

/** A soft tick on hovering any enabled button, and a tap on clicking one. */
export function useInterfaceSounds() {
  useEffect(() => {
    let current: Element | null = null;

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = (e.target as Element).closest?.("button:not(:disabled)") ?? null;
      if (target && target !== current && !target.classList.contains("opened__dismiss")) sfx.hover();
      current = target;
    };

    const onClick = (e: MouseEvent) => {
      const target = (e.target as Element).closest?.("button:not(:disabled)");
      // Buttons that open, close or move between rooms have their own sounds.
      if (target && !target.matches(".opened__dismiss, .dot, [data-sound='own']")) sfx.click();
    };

    document.addEventListener("pointerover", onOver);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
}
