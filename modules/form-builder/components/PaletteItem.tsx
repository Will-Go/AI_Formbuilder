"use client";

import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useDraggable } from "@dnd-kit/react";
import type { ElementType } from "react";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import type { QuestionType } from "@/shared/types/forms";

interface PaletteItemProps {
  formId: string;
  type: QuestionType;
  label: string;
  icon: ElementType;
  activeDragType: QuestionType | null;
}

export function PaletteItem({
  formId,
  type,
  label,
  icon,
  activeDragType,
}: PaletteItemProps) {
  const addQuestion = useFormsStore((s) => s.addQuestion);
  const TypeIcon = icon;
  const { ref, isDragging,} = useDraggable({
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
      onClick={() => addQuestion(formId, type)}
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
