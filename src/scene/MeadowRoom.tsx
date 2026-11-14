import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { reducedMotion } from "../state/nav";
import { floorPool, softSprite } from "./paperTextures";
import { useRoomFrame } from "./room";

const LEAVES = 34;
const LEAF_COLORS = ["#7fb04a", "#a6c95a", "#f4a6b8", "#f7d36a", "#5e8f3a"];

function leafShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.12);
  s.quadraticCurveTo(0.09, 0, 0, 0.12);
  s.quadraticCurveTo(-0.09, 0, 0, -0.12);
  return s;
}

/** Leaves and petals carried on a light breeze from left to right. */
function Leaves() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const shape = useMemo(leafShape, []);
  const seeds = useMemo(
    () =>
      Array.from({ length: LEAVES }, () => ({
        x: Math.random() * 18 - 9,
        y: Math.random() * 6 - 2.5,
        z: -Math.random() * 5 + 1,
        speed: 0.25 + Math.random() * 0.35,
        flutter: Math.random() * Math.PI * 2,
        scale: 0.8 + Math.random() * 0.8,
      })),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const c = new THREE.Color();
    seeds.forEach((_, i) => mesh.current.setColorAt(i, c.set(LEAF_COLORS[i % LEAF_COLORS.length])));
    mesh.current.instanceColor!.needsUpdate = true;
  }, [seeds]);

  useRoomFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      dummy.position.set(((s.x + t * s.speed + 9) % 18) - 9, s.y + Math.sin(t * 0.8 + s.flutter) * 0.3, s.z);
      dummy.rotation.set(Math.sin(t * 1.3 + s.flutter) * 1.2, t * 0.9 + s.flutter, Math.sin(t + s.flutter));
      dummy.scale.setScalar(s.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, LEAVES]} frustumCulled={false}>
      <shapeGeometry args={[shape, 6]} />
      <meshLambertMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

/** Soft watercolour clouds drifting slowly behind everything. */
function Clouds() {
  const group = useRef<THREE.Group>(null!);
  const sprite = useMemo(softSprite, []);
  const puffs = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        x: i * 7 - 12,
        y: 1.8 + Math.random() * 1.4,
        z: -10 - Math.random() * 3,
        s: 3.5 + Math.random() * 2.5,
      })),
    [],
  );
  useRoomFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    group.current.children.forEach((c, i) => {
      c.position.x = ((puffs[i].x + t * 0.15 + 14) % 28) - 14;
    });
  });
  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <sprite key={i} position={[p.x, p.y, p.z]} scale={[p.s * 1.8, p.s, 1]}>
          <spriteMaterial map={sprite} color="#ffffff" opacity={0.9} transparent depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
}

/** A little bird crossing the sky, as on the cover's top edge. */
function Bird({ start, y, z, speed }: { start: number; y: number; z: number; speed: number }) {
  const ref = useRef<THREE.Group>(null!);
  const left = useRef<THREE.Group>(null!);
  const right = useRef<THREE.Group>(null!);
  useRoomFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    ref.current.position.set(((start + t * speed + 12) % 24) - 12, y + Math.sin(t * 0.8 + start) * 0.2, z);
    // Wings hinge at the body and beat in a shallow V.
    const flap = 0.35 + Math.sin(t * 9 + start) * 0.45;
    left.current.rotation.z = -flap;
    right.current.rotation.z = flap;
  });
  return (
    <group ref={ref} scale={0.6}>
      <group ref={left}>
        <mesh position={[-0.16, 0, 0]}>
          <planeGeometry args={[0.32, 0.05]} />
          <meshBasicMaterial color="#53606a" side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group ref={right}>
        <mesh position={[0.16, 0, 0]}>
          <planeGeometry args={[0.32, 0.05]} />
          <meshBasicMaterial color="#53606a" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export function MeadowRoom({ children }: { index: number; children: React.ReactNode }) {
  const floor = useMemo(() => floorPool("rgba(160,200,110,0.95)", "rgba(156,196,106,0.55)"), []);
  return (
    <group>
      <Clouds />
      <Bird start={0} y={2.4} z={-6} speed={0.7} />
      <Bird start={11} y={2.8} z={-8} speed={0.6} />
      <Leaves />
      {children}
      {/* a soft patch of grass under the book */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial map={floor} transparent depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
