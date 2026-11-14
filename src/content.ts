/** Public files, resolved against wherever the site is hosted (e.g. a GitHub Pages sub-path). */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export type SceneTheme = "rain" | "lamp" | "sweets" | "meadow";

/** What is printed on a page of the open 3D book. */
export type Page =
  | { kind: "verse"; heading?: string; lines: string[]; credit?: string; paper?: string }
  | { kind: "prose"; paragraphs: string[]; signature?: string; paper?: string }
  | { kind: "dedication"; heading: string; line: string }
  | { kind: "title"; tagline?: string };

export interface Palette {
  bg: string;
  ink: string;
}

export interface Book {
  id: string;
  titleUr: string;
  titleEn: string;
  titleMeaning: string;
  kind: string;
  kindUr: string;
  publisher: string;
  isbn: string;
  year?: number;
  cover: string;
  back: string;
  /** Cover width / height. */
  aspect: number;
  depth: number;
  binding: "hard" | "soft";
  spine: Palette;
  palette: Palette;
  theme: SceneTheme;
  /** One or two sentences shown beside the open book. */
  blurb: string;
  pages: { left: Page; right: Page };
}

/**
 * Everything here comes from her own introduction (تعارف) and her "کہانی سے تحریر تک کا سفر"
 * page in Aina, Rumi aur Joey. Add nothing that isn't in a source like those.
 */
export const author = {
  nameEn: "Maira Faryal Malik",
  nameUr: "مائرہ فریال ملک",
  role: "Writer · Poet · Islamabad",
  roleUr: "ادیبہ",
  portrait: asset("author/portrait.jpg"),
  intro:
    "An Islamabad-based Urdu writer and poet: ghazals and nazms, short stories, columns and journalism, a novel, and prize-winning books for children.",
  journey: {
    headingUr: "کہانی سے تحریر تک کا سفر",
    headingEn: "From bedtime stories to books",
    quoteUr: "یوں کہانی سننے کا یہ سلسلہ میرے دل میں تحریر کی پہلی چنگاری بن گیا۔",
    quoteEn: "Those nightly stories became the first spark of writing in my heart.",
    story:
      "As a child, Maira heard a story from her father every night. In the summer holidays he set her one story to write each day, read it carefully, corrected it, and sent it to children's magazines and newspapers. Her first book, Aini ke Sawal, won first prize through the National Book Foundation.",
  },
  facts: [
    "MA, Urdu Literature",
    "Teacher and social worker",
    "Associated with Radio Pakistan",
    "Writes regularly for newspapers, magazines and online",
    "Several awards and all-Pakistan prizes",
  ],
  otherBooks: [
    { ur: "عینی کے سوال", en: "Aini ke Sawal", note: "For children · First prize, National Book Foundation" },
    { ur: "اسلام ایک مکمل ضابطۂ حیات", en: "Islam: A Complete Code of Life", note: "On the life of the Prophet ﷺ" },
    { ur: "جگنوؤں سے بھر لو دامن", en: "Jugnuon se Bhar Lo Daaman", note: "Poems and songs" },
    { ur: "انوکھے افسانے", en: "Anokhe Afsane", note: "Short stories" },
    { ur: "گمنام ہیرو", en: "Gumnaam Hero", note: "Biography" },
  ],
  /** `photo` pops up on hover (or tap); the photos are of her, not captioned with claims about the events. */
  roles: [
    { en: "Central President, Women's Wing", org: "Pakistan International Media Council (PIMC)", photo: asset("author/moment-1.jpg") },
    { en: "President", org: "International Writers Forum, Islamabad", photo: asset("author/moment-2.jpg") },
    { en: "General Secretary", org: "Pakistan Writers Society", photo: asset("author/moment-3.jpg") },
    { en: "Social media team member", org: "اپووا" },
  ] as { en: string; org: string; photo?: string }[],
};

export const books: Book[] = [
  {
    id: "shehr-e-wafa",
    titleUr: "اِک شہرِ وفا تھا",
    titleEn: "Ik Shehr-e-Wafa Tha",
    titleMeaning: "There Was a City of Faithfulness",
    kind: "Poetry",
    kindUr: "شاعری",
    publisher: "ASI Publications, Islamabad",
    isbn: "978-627-7596-30-9",
    cover: asset("books/shehr-e-wafa-front.jpg"),
    back: asset("books/shehr-e-wafa-back.jpg"),
    aspect: 900 / 1400,
    depth: 0.2,
    binding: "hard",
    spine: { bg: "#16181a", ink: "#f0d9c4" },
    palette: { bg: "#0c1113", ink: "#ede6da" },
    theme: "rain",
    blurb:
      "Ghazals, nazms and qitas. The poem on its back cover asks one question again and again: how is your city?",
    pages: {
      left: { kind: "verse", lines: ["تمہارا شہر کیسا ہے؟", "دلِ بے مہر کیسا؟"] },
      right: { kind: "title" },
    },
  },
  {
    id: "meri-raat",
    titleUr: "میری رات کا چراغ",
    titleEn: "Meri Raat ka Chiragh",
    titleMeaning: "The Lamp of My Night",
    kind: "Novel",
    kindUr: "ناول",
    publisher: "Misaal Publishers",
    isbn: "978-969-581-838-1",
    cover: asset("books/meri-raat-front.jpg"),
    back: asset("books/meri-raat-back.jpg"),
    aspect: 0.653,
    depth: 0.32,
    binding: "hard",
    spine: { bg: "#e7a04a", ink: "#3a2412" },
    palette: { bg: "#170f0a", ink: "#f2e4cf" },
    theme: "lamp",
    blurb:
      "Mishi, raised on London's freedoms, loves an Arab prince and loses far more than love. A novel of heartbreak, regret and the light that follows.",
    pages: {
      left: { kind: "dedication", heading: "انتساب", line: "پیاری امی جان کے نام!" },
      right: {
        kind: "verse",
        paper: "#efb15d",
        lines: ["جو دل ٹوٹتا ہے", "وہی روشن ہوتا ہے"],
        credit: "یاسر فاروق",
      },
    },
  },
  {
    id: "chori-ka-cake",
    titleUr: "چوری کا کیک",
    titleEn: "Chori ka Cake",
    titleMeaning: "The Stolen Cake",
    kind: "Stories for children",
    kindUr: "بچوں کی کہانیاں",
    publisher: "Bachon ka Kitab Ghar, Lahore",
    isbn: "978-627-515-077-0",
    cover: asset("books/chori-ka-cake-front.jpg"),
    back: asset("books/chori-ka-cake-back.jpg"),
    aspect: 0.662,
    depth: 0.12,
    binding: "soft",
    spine: { bg: "#202326", ink: "#f2c9cf" },
    palette: { bg: "#f6e2da", ink: "#2b1712" },
    theme: "sweets",
    blurb:
      "Twenty-four short stories of butterflies, fairies, jinn and birds, each with a small lesson for little readers.",
    pages: {
      left: { kind: "verse", heading: "چوبیس کہانیاں", lines: ["سفید کوا", "جگنو کی کہانی", "نادان مور", "سبز پری"] },
      right: { kind: "title", tagline: "ننھے منے بچوں کے لیے بچوں جیسی کہانیاں!" },
    },
  },
  {
    id: "aina-rumi-joey",
    titleUr: "عینا، رُومی اور جوئی",
    titleEn: "Aina, Rumi aur Joey",
    titleMeaning: "Aina, Rumi and Joey",
    kind: "A travelogue for children",
    kindUr: "بچوں کے لیے سفر نامہ",
    publisher: "Press for Peace Publications",
    isbn: "978-627-7870-55-3",
    year: 2025,
    cover: asset("books/aina-rumi-joey-front.jpg"),
    back: asset("books/aina-rumi-joey-back.jpg"),
    aspect: 0.64,
    depth: 0.15,
    binding: "hard",
    spine: { bg: "#8fbad6", ink: "#14324a" },
    palette: { bg: "#dceaf2", ink: "#16262e" },
    theme: "meadow",
    blurb:
      "Two children and their animal friends discover that kindness to animals is where kindness begins.",
    pages: {
      left: { kind: "verse", paper: "#fbf5e4", lines: ["جن کے پاس زبان نہیں ہوتی", "وہ بھی محبت بولتے ہیں"] },
      right: { kind: "title", tagline: "بچوں اور جانوروں کی دوستی کی خوبصورت داستان" },
    },
  },
];

export interface Section {
  id: string;
  label: string;
  palette: Palette;
}

export const PAPER: Palette = { bg: "#efe8dc", ink: "#17130f" };

export const sections: Section[] = [
  { id: "hero", label: author.nameEn, palette: PAPER },
  ...books.map((b) => ({ id: b.id, label: b.titleEn, palette: b.palette })),
  { id: "author", label: "The Author", palette: PAPER },
];

/** Distance between rooms in the 3D world. */
export const SPACING = 16;
