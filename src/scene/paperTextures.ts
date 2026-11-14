import * as THREE from "three";
import type { Book, Page } from "../content";
import { author } from "../content";

const PAPER = "#f3ece0";
const INK = "#1d1712";
const ACCENT = "#b4452f";
const URDU = '"Noto Nastaliq Urdu", serif';
const PW = 900;
const PH = 1400;

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function paper(ctx: CanvasRenderingContext2D, w: number, h: number, color = PAPER) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  // Faint grain so the page catches light like real paper.
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(90,60,30,0.14)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function finish(c: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Pages are mostly seen face-on, so heavy angled filtering only costs frame time.
  tex.anisotropy = 2;
  return tex;
}

/** Break right-to-left text into lines that fit `width`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function rule(ctx: CanvasRenderingContext2D, y: number) {
  ctx.fillStyle = ACCENT;
  ctx.fillRect(PW / 2 - 50, y, 100, 2);
}

/**
 * Large, short verse: read at a glance on a small 3D page. Type is as big as the
 * longest line allows within the page margins.
 */
function drawVerse(ctx: CanvasRenderingContext2D, page: Extract<Page, { kind: "verse" }>) {
  ctx.textAlign = "center";
  const base = page.lines.length <= 2 ? 96 : page.lines.length <= 4 ? 78 : 58;
  const widest = Math.max(...page.lines.map((l) => measure(ctx, `${base}px ${URDU}`, l)));
  const size = Math.floor(Math.min(base, (base * (PW - 160)) / Math.max(1, widest)));
  const lh = size * 2.1;
  const headingH = page.heading ? 250 : 0;
  const creditH = page.credit ? 150 : 0;
  let top = (PH - (page.lines.length - 1) * lh - headingH - creditH) / 2 + headingH + size * 0.4;
  if (page.heading) {
    ctx.fillStyle = INK;
    ctx.font = `600 66px ${URDU}`;
    ctx.fillText(page.heading, PW / 2, top - headingH + 10);
    rule(ctx, top - headingH + 60);
  }
  ctx.fillStyle = INK;
  ctx.font = `${size}px ${URDU}`;
  page.lines.forEach((line, i) => ctx.fillText(line, PW / 2, top + i * lh));
  if (page.credit) {
    top += (page.lines.length - 1) * lh + 150;
    ctx.fillStyle = ACCENT;
    ctx.font = `600 46px ${URDU}`;
    ctx.fillText(`— ${page.credit}`, PW / 2, top);
  }
}

function drawProse(ctx: CanvasRenderingContext2D, page: Extract<Page, { kind: "prose" }>) {
  const margin = 90;
  // Short passages get larger type so the page does not look empty.
  const short = page.paragraphs.join(" ").length < 450;
  const size = short ? 40 : 34;
  const lh = short ? 88 : 74;
  ctx.font = `${size}px ${URDU}`;
  ctx.textAlign = "right";
  ctx.fillStyle = INK;
  const lines = page.paragraphs.flatMap((p, i) => [...(i ? [""] : []), ...wrap(ctx, p, PW - margin * 2)]);
  const height = lines.length * lh + (page.signature ? 110 : 0);
  let y = Math.max(140, (PH - height) / 2 + 40);
  for (const line of lines) {
    if (line) ctx.fillText(line, PW - margin, y);
    y += line ? lh : lh * 0.45;
  }
  if (page.signature) {
    ctx.textAlign = "left";
    ctx.fillStyle = ACCENT;
    ctx.font = `600 40px ${URDU}`;
    ctx.fillText(page.signature, margin, y + 60);
  }
}

function drawDedication(ctx: CanvasRenderingContext2D, page: Extract<Page, { kind: "dedication" }>) {
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  ctx.font = `600 84px ${URDU}`;
  ctx.fillText(page.heading, PW / 2, 620);
  ctx.fillStyle = ACCENT;
  ctx.font = `68px ${URDU}`;
  ctx.fillText(page.line, PW / 2, 820);
}

function drawTitle(ctx: CanvasRenderingContext2D, page: Extract<Page, { kind: "title" }>, book: Book) {
  ctx.textAlign = "center";
  ctx.fillStyle = INK;
  const fit = Math.min(104, (104 * 720) / Math.max(1, measure(ctx, `600 104px ${URDU}`, book.titleUr)));
  ctx.font = `600 ${fit}px ${URDU}`;
  ctx.fillText(book.titleUr, PW / 2, 600);
  rule(ctx, 690);
  ctx.font = `56px ${URDU}`;
  ctx.fillText(author.nameUr, PW / 2, 830);
  if (page.tagline) {
    ctx.fillStyle = "rgba(29,23,18,0.65)";
    ctx.font = `44px ${URDU}`;
    wrap(ctx, page.tagline, 700).forEach((l, i) => ctx.fillText(l, PW / 2, 330 + i * 92));
  }
  ctx.direction = "ltr";
  ctx.font = 'italic 46px "Cormorant Garamond", serif';
  ctx.fillStyle = "rgba(29,23,18,0.6)";
  ctx.fillText(book.titleEn, PW / 2, 1240);
}

function measure(ctx: CanvasRenderingContext2D, font: string, text: string) {
  ctx.font = font;
  return ctx.measureText(text).width;
}

/** One printed page of the open book. */
export function printedPage(page: Page, book: Book) {
  const [c, ctx] = canvas(PW, PH);
  paper(ctx, PW, PH, page.kind === "prose" || page.kind === "verse" ? page.paper : undefined);
  ctx.direction = "rtl";
  if (page.kind === "verse") drawVerse(ctx, page);
  else if (page.kind === "prose") drawProse(ctx, page);
  else if (page.kind === "dedication") drawDedication(ctx, page);
  else drawTitle(ctx, page, book);
  return finish(c);
}

/** The stacked edges of the page block. */
export function pageEdges() {
  const [c, ctx] = canvas(64, 512);
  ctx.fillStyle = "#e9dfcd";
  ctx.fillRect(0, 0, 64, 512);
  for (let x = 0; x < 64; x += 2) {
    ctx.fillStyle = `rgba(120,95,60,${0.08 + Math.random() * 0.12})`;
    ctx.fillRect(x, 0, 1, 512);
  }
  const tex = finish(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Spine with the title running top to bottom. */
export function spine(book: Book) {
  const [c, ctx] = canvas(128, 1400);
  ctx.fillStyle = book.spine.bg;
  ctx.fillRect(0, 0, 128, 1400);
  ctx.save();
  ctx.translate(64, 700);
  ctx.rotate(Math.PI / 2);
  ctx.textAlign = "center";
  ctx.direction = "rtl";
  ctx.fillStyle = book.spine.ink;
  ctx.font = `600 ${book.depth < 0.14 ? 40 : 52}px ${URDU}`;
  ctx.fillText(`${book.titleUr}   ·   ${author.nameUr}`, 0, 22);
  ctx.restore();
  return finish(c);
}

/** Soft round sprite used for out-of-focus lights, glows and clouds. */
export function softSprite() {
  const [c, ctx] = canvas(128, 128);
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return finish(c);
}

/**
 * A pool of colour fading to clear, painted once: the floor under each book.
 * Unlit and pre-blended, so it costs almost nothing to draw however much of the screen it covers.
 */
export function floorPool(centre: string, edge: string) {
  const [c, ctx] = canvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, centre);
  g.addColorStop(0.45, edge);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return finish(c);
}
