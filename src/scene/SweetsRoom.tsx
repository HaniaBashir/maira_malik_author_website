import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { reducedMotion } from "../state/nav";
import { floorPool } from "./paperTextures";
import { useRoomFrame } from "./room";

const SPRINKLES = 56;
const COLORS = ["#ef7fa3", "#5a3022", "#8fd3c1", "#f6c84c", "#ffffff", "#e0394b"];

/** Rainbow sprinkles tumbling slowly, kept clear of the book and of the text. */
function Sprinkles() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const seeds = useMemo(
    () =>
      Array.from({ length: SPRINKLES }, () => {
        const side = Math.random() < 0.5 ? -1 : 1;
        // On the left, sprinkles stay above the title and publisher text in the bottom corner.
        const y = side < 0 ? 0.4 + Math.random() * 2.6 : (Math.random() - 0.5) * 6;
        return {
          x: side * (2 + Math.random() * 5.5),
          y,
          z: -Math.random() * 5 + 0.3,
          rx: Math.random() * Math.PI,
          ry: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 1.2,
          bob: Math.random() * Math.PI * 2,
        };
      }),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const c = new THREE.Color();
    seeds.forEach((_, i) => mesh.current.setColorAt(i, c.set(COLORS[i % COLORS.length])));
    mesh.current.instanceColor!.needsUpdate = true;
  }, [seeds]);

  useRoomFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      dummy.position.set(s.x, s.y + Math.sin(t * 0.5 + s.bob) * 0.25, s.z);
      dummy.rotation.set(s.rx + t * s.spin, s.ry + t * s.spin * 0.7, 0);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SPRINKLES]} frustumCulled={false}>
      <capsuleGeometry args={[0.035, 0.14, 3, 6]} />
      <meshLambertMaterial />
    </instancedMesh>
  );
}

export function SweetsRoom({ children }: { index: number; children: React.ReactNode }) {
  const shadow = useMemo(() => floorPool("rgba(92,40,34,0.42)", "rgba(92,40,34,0.16)"), []);
  const narrow = useThree((st) => st.viewport.aspect < 0.8);
  return (
    <group>
      <Sprinkles />
      {children}
      {/* a soft shadow that sets the book down on the counter (higher on phones, where the book sits higher) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.05, narrow ? -0.32 : -1.22, 0]} scale={narrow ? 0.75 : 1}>
        <planeGeometry args={[3.4, 2.4]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
