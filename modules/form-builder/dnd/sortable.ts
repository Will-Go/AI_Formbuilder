"use client";

import { KeyboardSensor, PointerSensor } from "@dnd-kit/react";

export function useDndSensors() {
  return [PointerSensor.configure({}), KeyboardSensor.configure({})];
}
