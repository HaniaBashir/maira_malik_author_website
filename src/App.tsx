import { useLayoutEffect } from "react";
import { author, books } from "./content";
import { Experience } from "./scene/Experience";
import { paintNow } from "./state/nav";
import { useNavInput } from "./state/useNavInput";
import { useInterfaceSounds } from "./useInterfaceSounds";
import { Chrome } from "./ui/Chrome";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { FontLab } from "./ui/FontLab";
import { Preloader } from "./ui/Preloader";
import { OpenBook } from "./ui/OpenBook";
import { PhotoPeek } from "./ui/PhotoPeek";
import { Backdrop, Foreground } from "./ui/Rooms";

/** Shown when WebGL is unavailable: flat images in place of the 3D objects. */
function FlatStage() {
  return (
    <div className="track track--flat" aria-hidden>
      <div className="room">
        <img src={author.portrait} alt="" />
      </div>
      {books.map((b) => (
        <div className="room" key={b.id}>
          <img src={b.cover} alt="" />
        </div>
      ))}
      <div className="room" />
    </div>
  );
}

export default function App() {
  useNavInput();
  useInterfaceSounds();
  useLayoutEffect(paintNow, []);
  return (
    <>
      <Backdrop />
      <ErrorBoundary fallback={<FlatStage />}>
        <Experience />
      </ErrorBoundary>
      <Foreground />
      <Chrome />
      <OpenBook />
      <PhotoPeek />
      <Preloader />
      <FontLab />
    </>
  );
}
