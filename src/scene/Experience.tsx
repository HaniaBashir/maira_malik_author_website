import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Preload } from "@react-three/drei";
import { books, sections, SPACING, type SceneTheme } from "../content";
import { colors, motion, reducedMotion } from "../state/nav";
import { Book3D } from "./Book3D";
import { HeroRoom } from "./HeroRoom";
import { CANDLE_LIGHT, LampRoom } from "./LampRoom";
import { MeadowRoom } from "./MeadowRoom";
import { PoetRoom } from "./PoetRoom";
import { RainRoom } from "./RainRoom";
import { RoomIndex } from "./room";
import { SweetsRoom } from "./SweetsRoom";

/** Each book's mood, taken from its cover. */
const settings: Record<SceneTheme, React.ComponentType<{ index: number; children: React.ReactNode }>> = {
  rain: RainRoom,
  lamp: LampRoom,
  sweets: SweetsRoom,
  meadow: MeadowRoom,
};

type Vec = [number, number, number];
interface Lighting {
  ambient: string;
  ambientI: number;
  key: string;
  keyI: number;
  keyAt: Vec;
  accent: string;
  accentI: number;
  accentAt: Vec;
  flicker?: number;
}

const PAPER_LIGHT: Lighting = {
  ambient: "#fff3e6", ambientI: 1.1, key: "#ffe6c7", keyI: 2.2, keyAt: [-4, 3, 5],
  accent: "#f2b48c", accentI: 0, accentAt: [3, -1, 3],
};

const LIGHTING: Record<SceneTheme, Lighting> = {
  rain: {
    ambient: "#8fa6b8", ambientI: 0.5, key: "#ffcf9a", keyI: 2.4, keyAt: [3, 4, 4],
    accent: "#ff5a3c", accentI: 8, accentAt: [3, -1.1, -0.5],
  },
  lamp: {
    ambient: "#ffb37a", ambientI: 0.45, key: "#ffcf98", keyI: 1.9, keyAt: [3, 3, 4],
    accent: "#ffac55", accentI: 7, accentAt: CANDLE_LIGHT, flicker: 1,
  },
  sweets: {
    ambient: "#fff4f0", ambientI: 1.2, key: "#fff3e6", keyI: 2.2, keyAt: [-3, 3, 5],
    accent: "#ff9fb8", accentI: 6, accentAt: [3, -1, 3],
  },
  meadow: {
    ambient: "#eef6ff", ambientI: 1.2, key: "#fff6e0", keyI: 2.4, keyAt: [-3, 4, 5],
    accent: "#cfe6ff", accentI: 4, accentAt: [3, 0, 3],
  },
};

const roomLighting = sections.map((s) => {
  const book = books.find((b) => b.id === s.id);
  return book ? LIGHTING[book.theme] : PAPER_LIGHT;
});

/**
 * One fixed set of lights for the whole corridor. Colours, strengths and positions
 * glide between rooms, so the number of lights never changes and nothing recompiles mid-slide.
 */
function LightRig() {
  const ambient = useRef<THREE.AmbientLight>(null!);
  const key = useRef<THREE.DirectionalLight>(null!);
  const accent = useRef<THREE.PointLight>(null!);
  const scene = useThree((s) => s.scene);
  const a = useMemo(() => new THREE.Color(), []);
  const b = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    scene.add(key.current.target);
  }, [scene]);

  useFrame((state) => {
    const p = motion.progress;
    const i = Math.min(Math.floor(p), roomLighting.length - 1);
    const j = Math.min(i + 1, roomLighting.length - 1);
    const t = p - i;
    const from = roomLighting[i];
    const to = roomLighting[j];
    const mix = (x: number, y: number) => x + (y - x) * t;
    const mixVec = (x: Vec, y: Vec, k: number) => mix(x[k], y[k]);
    const roomX = p * SPACING;

    ambient.current.color.copy(a.set(from.ambient)).lerp(b.set(to.ambient), t);
    ambient.current.intensity = mix(from.ambientI, to.ambientI);

    key.current.color.copy(a.set(from.key)).lerp(b.set(to.key), t);
    key.current.intensity = mix(from.keyI, to.keyI);
    key.current.position.set(roomX + mixVec(from.keyAt, to.keyAt, 0), mixVec(from.keyAt, to.keyAt, 1), mixVec(from.keyAt, to.keyAt, 2));
    key.current.target.position.set(roomX, 0, 0);

    const time = state.clock.elapsedTime;
    const flicker = reducedMotion ? 1 : 0.85 + Math.sin(time * 11) * 0.06 + Math.sin(time * 23.7) * 0.07;
    const flickerWeight = mix(from.flicker ?? 0, to.flicker ?? 0);
    accent.current.color.copy(a.set(from.accent)).lerp(b.set(to.accent), t);
    accent.current.intensity = mix(from.accentI, to.accentI) * (1 + (flicker - 1) * flickerWeight);
    accent.current.position.set(
      roomX + mixVec(from.accentAt, to.accentAt, 0),
      mixVec(from.accentAt, to.accentAt, 1),
      mixVec(from.accentAt, to.accentAt, 2),
    );
  });

  return (
    <>
      <ambientLight ref={ambient} />
      <directionalLight ref={key} />
      <pointLight ref={accent} distance={8} decay={2} />
    </>
  );
}

/** Sharpest the open book is drawn: the screen's own density, capped at 2x. */
const OPEN_DPR = Math.min(2, window.devicePixelRatio || 1);

/**
 * The corridor renders at one pixel per CSS pixel to keep slides smooth. Once a book has
 * finished opening the scene is nearly still, so it switches to the screen's real density
 * and the printed pages turn sharp; it drops back as soon as the book starts closing.
 */
function SharpWhenOpen() {
  const setDpr = useThree((s) => s.setDpr);
  const sharp = useRef(false);
  useFrame(() => {
    const want = motion.open > 0.98;
    if (want !== sharp.current) {
      sharp.current = want;
      setDpr(want ? OPEN_DPR : 1);
    }
  });
  return null;
}

/** The camera glides along the corridor of rooms and leans gently with the cursor. */
function CameraRig() {
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new THREE.Fog("#efe8dc", 10, 24), []);
  useEffect(() => {
    scene.fog = fog;
  }, [scene, fog]);

  useFrame(({ camera, pointer }, dt) => {
    // Fog takes the page colour so distant objects dissolve into it.
    fog.color.setRGB(colors.bg[0] / 255, colors.bg[1] / 255, colors.bg[2] / 255, THREE.SRGBColorSpace);
    const free = 1 - motion.open;
    camera.position.x = motion.progress * SPACING + pointer.x * 0.35 * free;
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.2 * free, 3, dt);
    camera.lookAt(motion.progress * SPACING, 0, 0);
  });
  return null;
}

/** A room only draws while the camera is in or entering it. */
function Room({ index, children }: { index: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useFrame(() => {
    ref.current.visible = Math.abs(motion.progress - index) < 0.98;
  });
  return (
    <RoomIndex.Provider value={index}>
      <group ref={ref} position={[index * SPACING, 0, 0]}>
        {children}
      </group>
    </RoomIndex.Provider>
  );
}

export function Experience() {
  return (
    <Canvas
      className="stage"
      // One 3D pixel per CSS pixel while moving: the scene's cost grows with pixel count, and
      // higher ratios halved the frame rate on ordinary laptops. SharpWhenOpen raises it for reading.
      dpr={1}
      camera={{ position: [0, 0, 8], fov: 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
      onCreated={(state) => {
        // Handy for profiling in the browser console during development.
        if (import.meta.env.DEV) (window as unknown as { __r3f: unknown }).__r3f = state;
      }}
    >
      <CameraRig />
      <SharpWhenOpen />
      <LightRig />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 4, 4]} scale={[10, 2, 1]} color="#fff1dc" />
        <Lightformer form="rect" intensity={1} position={[-5, 0, 2]} scale={[2, 6, 1]} color="#ffd2a8" />
      </Environment>
      <Suspense fallback={null}>
        <Room index={0}>
          <HeroRoom />
        </Room>
        {books.map((book, i) => {
          const Setting = settings[book.theme];
          return (
            <Room key={book.id} index={i + 1}>
              <Setting index={i + 1}>
                <Book3D book={book} index={i + 1} />
              </Setting>
            </Room>
          );
        })}
        <Room index={books.length + 1}>
          <PoetRoom />
        </Room>
        {/* Compile every room's shaders and upload its textures behind the loading screen, not mid-slide. */}
        <Preload all />
      </Suspense>
    </Canvas>
  );
}
