# Maira Faryal Malik — Urdu author portfolio

A sideways walk through rooms: the author's portrait, one room per book (a 3D book you can open to read a sample), and a closing room about her. Each room has its own link, e.g. `/#meri-raat`. Built with Vite, React, three.js (react-three-fiber + drei) and GSAP.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ — deploy to Vercel, Netlify or any static host
```

Navigation: mouse wheel / trackpad, arrow keys, Home / End, swipe on touch, or the dots. Esc closes an open book.

## Deploying

Every push to `main` builds the site and publishes it to GitHub Pages (`.github/workflows/deploy.yml`).
Asset paths are relative (`base: "./"` in `vite.config.ts`), so it works at the repository's Pages sub-path.

## Adding a book

1. Put a flat front cover and back cover in `public/books/` (portrait images, ideally 900×1400 or larger).
   `scripts/prep_assets.py` can straighten a phone photo: pass the four cover corners (top-left, top-right, bottom-right, bottom-left):
   ```bash
   python scripts/prep_assets.py photo.jpg public/books/new-front.jpg 106,36 857,42 862,1248 104,1250
   ```
2. Add an entry to `books` in `src/content.ts`: titles, overview, a sample (verse or prose) with translation, publisher, ISBN, the cover's proportions (`aspect`), thickness (`depth`), room colours (`palette`) and what is printed on the two open pages (`pages`).
3. Pick a 3D setting with `theme`: `"rain"` (night street), `"lamp"` (candlelit dusk), `"sweets"` (sprinkles and strawberries) or `"meadow"` (sky, leaves and birds). A new mood is a new component in `src/scene/`, registered in `Experience.tsx`.

A new room and its dot appear automatically.

## Layout of the code

| Path | What it does |
| --- | --- |
| `src/content.ts` | All text, books and room order |
| `src/state/nav.ts` | Current room, open book, and the tweened values both the DOM and 3D read |
| `src/state/useNavInput.ts` | Wheel, keys and swipe |
| `src/scene/` | The 3D canvas: camera and shared light rig, one component per room setting, the book itself |
| `src/ui/` | Preloader, giant background type, room copy, dots, and the note and shop button around the open book |

## Keeping it smooth

- The 3D layer renders at one pixel per CSS pixel (`dpr={1}` in `Experience.tsx`); higher ratios halved the frame rate on ordinary laptops.
- Rooms use the shared `LightRig` instead of their own lights, so moving between rooms never recompiles shaders.
- Per-frame animation goes through `useRoomFrame`, which skips rooms that are off screen.
- Floors are pre-painted gradients (`floorPool`), not lit surfaces; paper uses the cheap matte material.

## Still to replace

- `public/author/portrait.jpg` is cropped from the back cover and is low resolution — swap in a proper photo.
- Covers are straightened phone photos; the publishers' original artwork will look sharper.
- The English overviews and translations in `src/content.ts` were written from the book jackets as a starting point and should be checked by the author.
- "Shop now" under the open book is disabled until ordering is set up.
