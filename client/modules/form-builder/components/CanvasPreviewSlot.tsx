"use client";

import Box from "@mui/material/Box";
import { useDroppable } from "@dnd-kit/react";
import React from "react";

interface CanvasPreviewSlotProps {
  index: number;
  children: React.ReactNode;
}

export default function CanvasPreviewSlot({
  index,
  children,
}: CanvasPreviewSlotProps) {
  const { ref } = useDroppable({
    id: `preview-slot:${index}`,
    data: {
      dropType: "preview-slot",
      index,
    },
  });

  return <Box ref={ref}>{children}</Box>;
}
