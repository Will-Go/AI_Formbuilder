"use client";

import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";

export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );
}

