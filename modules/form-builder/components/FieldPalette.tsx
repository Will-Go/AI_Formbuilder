"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EmailIcon from "@mui/icons-material/Email";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import LinearScaleIcon from "@mui/icons-material/LinearScale";
import NumbersIcon from "@mui/icons-material/Numbers";
import PhoneIcon from "@mui/icons-material/Phone";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import ShortTextIcon from "@mui/icons-material/ShortText";
import StarRateIcon from "@mui/icons-material/StarRate";
import SubjectIcon from "@mui/icons-material/Subject";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import { useDraggable } from "@dnd-kit/react";
import type { ElementType } from "react";
import { QUESTION_TYPE_META } from "@/constants/question-types";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import type { QuestionType } from "@/shared/types/forms";

const QUESTION_TYPE_ICONS: Record<QuestionType, ElementType> = {
  short_text: ShortTextIcon,
  long_text: SubjectIcon,
  multiple_choice: RadioButtonCheckedIcon,
  checkbox: CheckBoxIcon,
  dropdown: ArrowDropDownCircleIcon,
  email: EmailIcon,
  phone: PhoneIcon,
  number: NumbersIcon,
  date: CalendarMonthIcon,
  rating: StarRateIcon,
  linear_scale: LinearScaleIcon,
  yes_no: ToggleOnIcon,
  section_divider: HorizontalRuleIcon,
  paragraph: TextFieldsIcon,
};

function PaletteItem({
  formId,
  type,
  label,
  icon,
  activeDragType,
}: {
  formId: string;
  type: QuestionType;
  label: string;
  icon: ElementType;
  activeDragType: QuestionType | null;
}) {
  const addQuestion = useFormsStore((s) => s.addQuestion);
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

export default function FieldPalette({
  formId,
  activeDragType,
}: {
  formId: string;
  activeDragType: QuestionType | null;
}) {
  const groups = QUESTION_TYPE_META.reduce<
    Record<string, typeof QUESTION_TYPE_META>
  >((acc, m) => {
    const key = m.group;
    acc[key] = [...(acc[key] ?? []), m] as typeof QUESTION_TYPE_META;
    return acc;
  }, {});

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, position: "sticky", top: 96 }}
      id="field-palette"
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          pb: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Fields
        </Typography>
      </Box>
      <Divider />
      <Box
        sx={{
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#ccc",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#aaa",
          },
        }}
      >
        {Object.entries(groups).map(([group, items], idx) => (
          <Box key={group}>
            {idx !== 0 ? <Divider sx={{ my: 1 }} /> : null}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 1, py: 0.5 }}
            >
              {group}
            </Typography>
            <List dense disablePadding>
              {items.map((m) => (
                <PaletteItem
                  key={m.type}
                  formId={formId}
                  type={m.type}
                  label={m.label}
                  icon={QUESTION_TYPE_ICONS[m.type]}
                  activeDragType={activeDragType}
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
