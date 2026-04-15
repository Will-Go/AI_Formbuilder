"use client";

import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useDraggable } from "@dnd-kit/react";
import type { ElementType } from "react";
import type { QuestionType } from "@/shared/types/forms";

interface PaletteItemProps {
  type: QuestionType;
  label: string;
  icon: ElementType;
  activeDragType: QuestionType | null;
  onAddQuestion: (type: QuestionType) => void;
}

export function PaletteItem({
  type,
  label,
  icon,
  activeDragType,
  onAddQuestion,
}: PaletteItemProps) {
  const TypeIcon = icon;
  const { ref, isDragging } = useDraggable({
    id: `palette-item:${type}`,
    data: {
      source: "palette",
      questionType: type,
      label,
    },
  });

  return (
    <ListItemButton
      ref={ref}
      onClick={() => onAddQuestion(type)}
      aria-label={`Drag ${label} to canvas or press Enter to add`}
      sx={{
        borderRadius: 1,
        opacity: isDragging ? 0.45 : 1,
        border: activeDragType === type ? "1px solid" : "1px solid transparent",
        borderColor: activeDragType === type ? "primary.main" : "transparent",
        bgcolor: activeDragType === type ? "primary.50" : "transparent",
      }}
    >
      <DragIndicatorIcon
        sx={{
          color: "text.disabled",
          fontSize: 16,
          mr: 1,
          cursor: "grab",
        }}
      />
      <ListItemText
        primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
        primary={label}
      />
      <ListItemIcon sx={{ minWidth: 24, justifyContent: "flex-end" }}>
        <TypeIcon fontSize="small" sx={{ color: "text.secondary" }} />
      </ListItemIcon>
    </ListItemButton>
  );
}
