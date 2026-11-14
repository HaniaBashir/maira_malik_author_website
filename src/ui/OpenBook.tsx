import { useEffect, useRef, useState } from "react";
import { books, type Book } from "../content";
import { bookAnchor } from "../state/anchor";
import { closeBook, useNav } from "../state/nav";

/**
 * What sits around the open book: a short note to one side and the shop button
 * directly beneath it. The book itself tells the button where its bottom edge is.
 */
export function OpenBook() {
  const id = useNav((s) => s.openBook);
  const open = books.find((b) => b.id === id);
  // Keep the last book's text while it fades out.
  const [shown, setShown] = useState<Book | undefined>(open);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) setShown(open);
    if (open) close.current?.focus({ preventScroll: true });
  }, [open]);

  return (
    <div
      ref={(el) => {
        bookAnchor.el = el;
      }}
      className={`opened${open ? " is-open" : ""}`}
      role="dialog"
      aria-label={shown ? `${shown.titleEn}, opened` : undefined}
      inert={!open}
    >
      {shown && (
        <>
          {/* The whole screen around the book closes it; Esc does too. */}
          <button ref={close} className="opened__dismiss" aria-label="Close the book" onClick={closeBook} />
          <p className="opened__hint mono" aria-hidden>
            Click anywhere to close
          </p>
          <div className="opened__note">
            <p className="bracket-label mono">[ {shown.kind} ]</p>
            <h2 className="opened__title" lang="ur" dir="rtl">
              {shown.titleUr}
            </h2>
            <p className="opened__meaning">{shown.titleMeaning}</p>
            <p className="opened__blurb">{shown.blurb}</p>
          </div>
          <div className="opened__shop">
            <button className="order" disabled>
              Shop now
            </button>
            <span className="mono">Coming soon</span>
          </div>
        </>
      )}
    </div>
  );
}
