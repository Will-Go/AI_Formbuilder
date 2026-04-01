"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
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
import type { ElementType } from "react";
import { QUESTION_TYPE_META } from "@/constants/question-types";
import type { QuestionType } from "@/shared/types/forms";
import { PaletteItem } from "./PaletteItem";

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
