import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import type { Book } from "../content";
import { bookAnchor } from "../state/anchor";
import { sfx } from "../sound";
import { closeBook, getNav, motion, openBook } from "../state/nav";
import { pageEdges, printedPage, spine } from "./paperTextures";
import { useFontsReady } from "./useFontsReady";

const W = 1.4;

const damp = THREE.MathUtils.damp;

/** A printed page that glows a little on its own, so it stays legible in the dark rooms. */
const printed = (map: THREE.Texture) =>
  new THREE.MeshLambertMaterial({ map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: 0.45 });
const lerp = THREE.MathUtils.lerp;

/**
 * A hardback that opens the way an Urdu book does: spine on the right,
 * the front cover swinging over to the right to reveal the first page.
 */
export function Book3D({ book, index }: { book: Book; index: number }) {
  const root = useRef<THREE.Group>(null!);
  const hinge = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const { viewport, pointer, camera, size, gl } = useThree();
  const fonts = useFontsReady();
  const H = W / book.aspect;
  const D = book.depth;
  const T = book.binding === "hard" ? 0.022 : 0.008; // board thickness
  const probe = useMemo(() => new THREE.Vector3(), []);

  const [front, back] = useTexture([book.cover, book.back]);
  front.colorSpace = back.colorSpace = THREE.SRGBColorSpace;
  front.anisotropy = back.anisotropy = 4;

  const mats = useMemo(() => {
    const board = new THREE.MeshLambertMaterial({ color: book.spine.bg });
    const edges = new THREE.MeshLambertMaterial({ map: pageEdges() });
    const blank = new THREE.MeshLambertMaterial({ color: "#efe7da" });
    return {
      cover: [
        board, board, board, board,
        new THREE.MeshStandardMaterial({ map: front, roughness: 0.45, envMapIntensity: 0.6 }),
        printed(printedPage(book.pages.right, book)),
      ],
      backBoard: [
        board, board, board, board, board,
        new THREE.MeshStandardMaterial({ map: back, roughness: 0.45, envMapIntensity: 0.6 }),
      ],
      pages: [
        edges, edges, edges, edges,
        printed(printedPage(book.pages.left, book)),
        blank,
      ],
      spine: [
        new THREE.MeshLambertMaterial({ map: spine(book) }),
        board, board, board, board, board,
      ],
    };
    // Paper is matte, so only the covers get the costlier glossy material; when the book is
    // open and filling the screen, this keeps it cheap to draw.
    // Redraw canvas pages once the Nastaliq font has arrived.
  }, [book, front, back, fonts]);

  // Send every texture to the GPU now, so the first time this room slides in there is no upload stall.
  useEffect(() => {
    const all = [...mats.cover, ...mats.backBoard, ...mats.pages, ...mats.spine];
    new Set(all.map((m) => (m as THREE.MeshLambertMaterial).map).filter(Boolean)).forEach((tex) => gl.initTexture(tex!));
  }, [mats, gl]);

  useFrame((state, dt) => {
    const isActive = getNav().index === index;
    if (Math.abs(motion.progress - index) >= 1) return;
    const wide = viewport.aspect > 1.05;
    const t = state.clock.elapsedTime;
    const o = isActive ? motion.open : 0;

    // On phones the closed book is smaller and sits higher, clear of the title block below it.
    const narrow = viewport.aspect < 0.8;
    const closedScale = narrow ? Math.min(1, (viewport.height * 0.32) / H) : 1;
    const closedY = narrow ? viewport.height * 0.13 : 0.1;

    // The open spread is 2W wide. On wide screens it sits right of centre, leaving room
    // for a short note on the left; on phones it sits high, with the note underneath.
    const fitW = (viewport.width * (wide ? 0.56 : 0.8)) / (2 * W);
    const fitH = (viewport.height * (wide ? 0.56 : 0.3)) / H;
    const scale = lerp(closedScale, Math.min(fitW, fitH), o) * (hovered && !o ? 1.04 : 1);
    const centreX = wide ? viewport.width * 0.13 : 0;
    const centreY = wide ? viewport.height * 0.05 : viewport.height * 0.18;

    const g = root.current;
    g.position.x = lerp(0, centreX - (W / 2) * scale, o);
    g.position.y = lerp(closedY + Math.sin(t * 0.9) * 0.07, centreY, o);
    g.position.z = lerp(0, 0.3, o);
    g.scale.setScalar(damp(g.scale.x, scale, 6, dt));

    const follow = isActive ? 1 - o : 0;
    const ry = lerp(-0.42, 0, o) + pointer.x * 0.3 * follow + (hovered ? 0.12 : 0) * follow;
    const rx = -pointer.y * 0.14 * follow + Math.sin(t * 0.7) * 0.03 * (1 - o);
    g.rotation.y = damp(g.rotation.y, ry, 4, dt);
    g.rotation.x = damp(g.rotation.x, rx, 4, dt);
    g.rotation.z = lerp(0.04, 0, o);

    hinge.current.rotation.y = o * Math.PI * 0.97;

    // Tell the HTML where the bottom-centre of the open spread is on screen.
    if (o > 0.001 && bookAnchor.el) {
      probe.set(W / 2, -H / 2, D / 2);
      g.localToWorld(probe).project(camera);
      bookAnchor.el.style.setProperty("--ax", `${((probe.x + 1) / 2) * size.width}px`);
      bookAnchor.el.style.setProperty("--ay", `${((1 - probe.y) / 2) * size.height}px`);
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (getNav().openBook === book.id) closeBook();
    else openBook(book.id);
  };

  const hover = (on: boolean) => () => {
    if (on && !getNav().openBook) sfx.hover();
    setHovered(on);
    document.body.style.cursor = on ? "pointer" : "";
  };

  return (
    <group ref={root} onClick={onClick} onPointerOver={hover(true)} onPointerOut={hover(false)}>
      {/* back board */}
      <mesh position={[0, 0, -D / 2 + T / 2]} material={mats.backBoard}>
        <boxGeometry args={[W, H, T]} />
      </mesh>
      {/* page block */}
      <mesh position={[-0.015, 0, 0]} material={mats.pages}>
        <boxGeometry args={[W - 0.05, H - 0.06, D - 2 * T]} />
      </mesh>
      {/* spine on the right, as Urdu books are bound */}
      <mesh position={[W / 2, 0, 0]} material={mats.spine}>
        <boxGeometry args={[T, H, D]} />
      </mesh>
      {/* front board, hinged at the spine */}
      <group ref={hinge} position={[W / 2, 0, D / 2 - T / 2]}>
        <mesh position={[-W / 2, 0, 0]} material={mats.cover}>
          <boxGeometry args={[W, H, T]} />
        </mesh>
      </group>
    </group>
  );
}
