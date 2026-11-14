import { useMemo, useRef } from "react";
import * as THREE from "three";
import { reducedMotion } from "../state/nav";
import { floorPool, softSprite } from "./paperTextures";
import { useRoomFrame } from "./room";

const DROPS = 600;
const FIELD = { w: 20, h: 12, d: 12 };

/** Rain as one draw call: every streak is moved on the GPU from a single time value. */
function Rain() {
  const mat = useRef<THREE.ShaderMaterial>(null!);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(DROPS * 6);
    const offset = new Float32Array(DROPS * 6);
    const end = new Float32Array(DROPS * 2);
    const speed = new Float32Array(DROPS * 2);
    for (let i = 0; i < DROPS; i++) {
      const x = (Math.random() - 0.5) * FIELD.w;
      const y = Math.random() * FIELD.h;
      const z = -Math.random() * FIELD.d + 3;
      const s = 7 + Math.random() * 5;
      for (let k = 0; k < 2; k++) {
        offset.set([x, y, z], (i * 2 + k) * 3);
        end[i * 2 + k] = k;
        speed[i * 2 + k] = s;
      }
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aOffset", new THREE.BufferAttribute(offset, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);
    return g;
  }, []);

  useRoomFrame((_, dt) => {
    if (!reducedMotion) mat.current.uniforms.uTime.value += dt;
  });

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={{ uTime: { value: 0 }, uHeight: { value: FIELD.h } }}
        vertexShader={`
          attribute vec3 aOffset;
          attribute float aEnd;
          attribute float aSpeed;
          uniform float uTime;
          uniform float uHeight;
          varying float vAlpha;
          void main() {
            vec3 p = aOffset;
            p.y = mod(aOffset.y - uTime * aSpeed, uHeight) - 1.6;
            p.y += aEnd * 0.32;
            p.x -= aEnd * 0.04;
            float depth = clamp((p.z + 9.0) / 12.0, 0.0, 1.0);
            vAlpha = aEnd * mix(0.12, 0.4, depth);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          void main() { gl_FragColor = vec4(0.78, 0.85, 0.92, vAlpha); }
        `}
      />
    </lineSegments>
  );
}

/** Out-of-focus street lights and tail lights, as on the cover. */
function CityLights() {
  const geometry = useMemo(() => {
    const colors = ["#ffb35c", "#ffcf8a", "#ff5a3c", "#ffe2b8"];
    const n = 18;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1;
      pos.set([side * (1.8 + Math.random() * 6.5), -0.6 + Math.random() * 3.4, -5 - Math.random() * 10], i * 3);
      c.set(colors[i % colors.length]);
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  const sprite = useMemo(softSprite, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        map={sprite}
        vertexColors
        size={0.8}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false}
      />
    </points>
  );
}

export function RainRoom({ children }: { index: number; children: React.ReactNode }) {
  const floor = useMemo(() => floorPool("rgba(44,58,66,0.95)", "rgba(27,35,40,0.6)"), []);
  return (
    <group>
      <Rain />
      <CityLights />
      {children}
      {/* wet street under the book, dissolving at its edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial map={floor} transparent depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
