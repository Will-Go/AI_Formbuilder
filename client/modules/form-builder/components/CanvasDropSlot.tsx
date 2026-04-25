"use client";

import Box from "@mui/material/Box";
import { useDroppable } from "@dnd-kit/react";
import React from "react";

interface CanvasDropSlotProps {
  index: number;
  active: boolean;
  highlighted: boolean;
}

export default function CanvasDropSlot({
  index,
  active,
  highlighted,
}: CanvasDropSlotProps) {
  const { ref, isDropTarget } = useDroppable({
    id: `canvas-slot:${index}`,
    data: {
      dropType: "canvas-slot",
      index,
    },
  });

  return (
    <Box
      ref={ref}
      aria-hidden
      sx={{
        height: active ? 10 : 0,
        my: active ? 0.5 : 0,
        borderRadius: 999,
        bgcolor: isDropTarget || highlighted ? "primary.main" : "transparent",
        opacity: active ? 1 : 0,
        transition: "all 120ms ease",
        pointerEvents: active ? "auto" : "none",
      }}
    />
  );
}
