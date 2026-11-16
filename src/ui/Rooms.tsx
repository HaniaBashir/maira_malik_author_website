import { author, books, PAPER, sections, type Book, type Palette } from "../content";
import { useEffect, useRef, useState } from "react";
import { goTo, openBook, useNav } from "../state/nav";
import { peek, preloadPhotos } from "./PhotoPeek";

/** Each room carries its own text colour, so sliding never re-colours text. */
const tone = (p: Palette) => ({ "--ink": p.ink }) as React.CSSProperties;

/** Break a title into short lines for the giant background type. */
function giantLines(text: string) {
  return text.split(" ").reduce<string[]>((lines, word) => {
    const last = lines[lines.length - 1];
    if (last && last.length + word.length < 12) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
    return lines;
  }, []);
}

/** Giant type that sits behind the 3D objects. */
export function Backdrop() {
  return (
    <div className="track track--back" aria-hidden>
      <div className="room" style={tone(PAPER)}>
        <p className="giant giant--hero">
          <span>Maira</span>
          <span>Faryal</span>
          <span>Malik</span>
        </p>
      </div>
      {books.map((b) => (
        <div className="room" key={b.id} style={tone(b.palette)}>
          <p className="giant giant--book">
            {giantLines(b.titleMeaning).map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        </div>
      ))}
      <div className="room" style={tone(PAPER)}>
        <p className="giant giant--ur" lang="ur" dir="rtl">
          {author.roleUr}
        </p>
      </div>
    </div>
  );
}

/** A tiny row of her covers under the intro; each one slides straight to its book's room. */
function Shelf() {
  const [hovered, setHovered] = useState<Book | null>(null);
  return (
    <nav className="shelf" aria-label="Books">
      <ul className="shelf__row">
        {books.map((b, i) => (
          <li key={b.id}>
            <button
              className="shelf__book"
              data-sound="own"
              aria-label={`${b.titleEn}, ${b.kind}`}
              onClick={() => goTo(i + 1)}
              onPointerEnter={() => setHovered(b)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(b)}
              onBlur={() => setHovered(null)}
            >
              <img src={b.cover} alt="" />
            </button>
          </li>
        ))}
      </ul>
      <p className="shelf__label mono" aria-hidden>
        {hovered ? hovered.titleEn : `${books.length} books`}
      </p>
    </nav>
  );
}

function HeroCopy() {
  return (
    <div className="hero">
      <p className="bracket-label mono">[ {author.role} ]</p>
      <h1 className="visually-hidden">{author.nameEn}</h1>
      <p className="hero__intro">{author.intro}</p>
      <Shelf />
    </div>
  );
}

function BookCopy({ book, n }: { book: Book; n: number }) {
  const open = useNav((s) => s.openBook);
  return (
    <div className={`book-copy${open ? " is-hidden" : ""}`}>
      <div className="book-copy__main">
        <p className="bracket-label mono">
          [ {String(n).padStart(2, "0")} — {book.kind} ]
        </p>
        <h2 className="book-copy__ur" lang="ur" dir="rtl">
          {book.titleUr}
        </h2>
        <p className="book-copy__en">
          <span className="mono">{book.titleEn}</span>
          <em>{book.titleMeaning}</em>
        </p>
        <button className="bracket" data-sound="own" onClick={() => openBook(book.id)}>
          Open the book
        </button>
      </div>
      <dl className="specs mono">
        <div>
          <dt>Publisher</dt>
          <dd>{book.publisher}</dd>
        </div>
        <div>
          <dt>ISBN</dt>
          <dd className="tabular">{book.isbn}</dd>
        </div>
      </dl>
    </div>
  );
}

/** A role row that shows a photo of her: beside the cursor on hover, centred on tap. */
function RoleWithPhoto({ photo, label, children }: { photo: string; label: string; children: React.ReactNode }) {
  const touch = useRef(false);
  return (
    <button
      type="button"
      className="role-peek"
      aria-label={`${label} (shows a photo)`}
      onPointerDown={(e) => (touch.current = e.pointerType !== "mouse")}
      onPointerMove={(e) => e.pointerType === "mouse" && peek.at(photo, e.clientX, e.clientY)}
      onPointerLeave={(e) => e.pointerType === "mouse" && peek.hide()}
      onFocus={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        peek.at(photo, r.left, r.top + r.height / 2);
      }}
      onBlur={() => peek.hide()}
      onClick={() => touch.current && peek.pin(photo)}
    >
      {children}
    </button>
  );
}

function AuthorCopy() {
  const { journey, facts, otherBooks, roles } = author;
  useEffect(() => preloadPhotos(roles.flatMap((r) => (r.photo ? [r.photo] : []))), [roles]);
  return (
    // Scrolls on its own when it is taller than the screen, fading out before the dots.
    <div className="author" data-scrolls>
      <div className="author__story">
        <p className="bracket-label mono">[ {journey.headingEn} ]</p>
        <h2 className="author__heading" lang="ur" dir="rtl">
          {journey.headingUr}
        </h2>
        <blockquote className="author__quote">
          <p lang="ur" dir="rtl">
            {journey.quoteUr}
          </p>
          <p className="author__quote-en">{journey.quoteEn}</p>
        </blockquote>
        <p className="author__text">{journey.story}</p>
        <ul className="facts mono">
          {facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <div className="author__more">
        <p className="section-label mono">Other books</p>
        <ul className="also">
          {otherBooks.map((b) => (
            <li key={b.en}>
              <span lang="ur" dir="rtl">
                {b.ur}
              </span>
              <span className="also__en">
                <em>{b.en}</em>
                <span className="mono">{b.note}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="section-label mono">Roles</p>
        <ul className="also also--roles">
          {roles.map((r) => {
            const text = (
              <span className="also__en">
                <em>{r.en}</em>
                <span className="mono" lang={/[؀-ۿ]/.test(r.org) ? "ur" : undefined}>
                  {r.org}
                </span>
              </span>
            );
            return (
              <li key={r.en}>
                {r.photo ? (
                  <RoleWithPhoto photo={r.photo} label={`${r.en}, ${r.org}`}>
                    {text}
                  </RoleWithPhoto>
                ) : (
                  text
                )}
              </li>
            );
          })}
        </ul>
        <button className="bracket" data-sound="own" onClick={() => goTo(1)}>
          Back to the books
        </button>
      </div>
    </div>
  );
}

/** Readable copy and controls that sit above the 3D canvas. */
export function Foreground() {
  const index = useNav((s) => s.index);
  return (
    <main className="track track--front">
      {sections.map((s, i) => {
        const book = books.find((b) => b.id === s.id);
        return (
          <section key={s.id} className="room" style={tone(s.palette)} aria-label={s.label} inert={i !== index}>
            {s.id === "hero" && <HeroCopy />}
            {book && <BookCopy book={book} n={i} />}
            {s.id === "author" && <AuthorCopy />}
          </section>
        );
      })}
    </main>
  );
}
