import { useEffect, useState } from "react";

/** Canvas text needs the web fonts loaded before it is drawn. */
export function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all([
      document.fonts.load('48px "Noto Nastaliq Urdu"', "شہر"),
      document.fonts.load('600 48px "Noto Nastaliq Urdu"', "شہر"),
      document.fonts.load('italic 38px "Cormorant Garamond"'),
    ])
      .catch(() => undefined)
      .then(() => setReady(true));
  }, []);
  return ready;
}
