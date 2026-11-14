import { createContext, useContext } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { motion } from "../state/nav";

export const RoomIndex = createContext(0);

/** True while the camera is in, or sliding into, room `index`. */
export const isNear = (index: number) => Math.abs(motion.progress - index) < 1;

/** useFrame that only runs while its room can be seen, so hidden rooms cost nothing. */
export function useRoomFrame(callback: (state: RootState, delta: number) => void) {
  const index = useContext(RoomIndex);
  useFrame((state, delta) => {
    if (isNear(index)) callback(state, delta);
  });
}
