import { useSyncExternalStore } from "react";
import { author, books, sections } from "../content";
import { isSoundOn, onSoundChange, toggleSound } from "../sound";
import { goTo, useNav } from "../state/nav";

const pad = (n: number) => String(n).padStart(2, "0");

/** Fixed frame: wordmark, room counter, dots. */
export function Chrome() {
  const index = useNav((s) => s.index);
  const open = useNav((s) => s.openBook);
  const sound = useSyncExternalStore(onSoundChange, isSoundOn);

  return (
    <>
      <header className="chrome chrome--top">
        <button className="mono chrome__mark" data-sound="own" onClick={() => goTo(0)}>
          {author.nameEn}
        </button>
        <span className="chrome__ur" lang="ur" dir="rtl">
          {author.nameUr}
        </span>
        <div className="chrome__right">
          <button className="bracket chrome__sound" data-sound="own" aria-pressed={sound} onClick={toggleSound}>
            Sound {sound ? "on" : "off"}
          </button>
          <span className="mono tabular chrome__count">
            [ {pad(index + 1)} / {pad(sections.length)} ]
          </span>
        </div>
      </header>

      <footer className={`chrome chrome--bottom${open ? " is-hidden" : ""}`}>
        <span className="mono chrome__hint">{index < sections.length - 1 ? "Scroll →" : "← Back"}</span>
        <nav aria-label="Rooms">
          <ol className="dots">
            {sections.map((s, i) => {
              const book = books.find((b) => b.id === s.id);
              return (
                <li key={s.id} className={book ? "has-cover" : undefined}>
                  {/* Each book's cover stands over its dot, except on that book's own page.
                      The dot below does the same job for keyboards and screen readers. */}
                  {book && (
                    <button
                      className={`dot-cover${i === index ? " is-here" : ""}`}
                      data-sound="own"
                      tabIndex={-1}
                      aria-hidden
                      onClick={() => goTo(i)}
                    >
                      <img src={book.cover} alt="" />
                    </button>
                  )}
                  <button
                    className={`dot${i === index ? " is-active" : ""}`}
                    aria-label={s.label}
                    aria-current={i === index ? "step" : undefined}
                    onClick={() => goTo(i)}
                  >
                    <span className="dot__label mono">{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
        {/* The landing page already shows her name three times; the label is for the other rooms. */}
        <span className="mono chrome__label">{index > 0 ? sections[index].label : ""}</span>
      </footer>
    </>
  );
}
