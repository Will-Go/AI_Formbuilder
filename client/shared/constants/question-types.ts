import type { QuestionType } from "@/shared/types/forms";
import type { ElementType } from "react";
import ArrowDropDownCircleIcon from "@mui/icons-material/ArrowDropDownCircle";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import EmailIcon from "@mui/icons-material/Email";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import LinearScaleIcon from "@mui/icons-material/LinearScale";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import ShortTextIcon from "@mui/icons-material/ShortText";
import StarRateIcon from "@mui/icons-material/StarRate";
import SubjectIcon from "@mui/icons-material/Subject";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";

export type QuestionTypeGroup =
  | "Text"
  | "Selection"
  | "Structured"
  | "Advanced"
  | "Layout";

export type QuestionTypeMeta = {
  type: QuestionType;
  label: string;
  group: QuestionTypeGroup;
  icon: ElementType;
};

export const QUESTION_TYPE_META: readonly QuestionTypeMeta[] = [
  {
    type: "short_text",
    label: "Short answer",
    group: "Text",
    icon: ShortTextIcon,
  },
  { type: "long_text", label: "Paragraph", group: "Text", icon: SubjectIcon },
  {
    type: "multiple_choice",
    label: "Multiple choice",
    group: "Selection",
    icon: RadioButtonCheckedIcon,
  },
  {
    type: "checkbox",
    label: "Checkboxes",
    group: "Selection",
    icon: CheckBoxIcon,
  },
  // {
  //   type: "dropdown",
  //   label: "Dropdown",
  //   group: "Selection",
  //   icon: ArrowDropDownCircleIcon,
  // },
  { type: "email", label: "Email", group: "Structured", icon: EmailIcon },
  // { type: "phone", label: "Phone", group: "Structured", icon: PhoneIcon },
  // { type: "number", label: "Number", group: "Structured", icon: NumbersIcon },
  // { type: "date", label: "Date", group: "Structured", icon: CalendarMonthIcon },
  { type: "rating", label: "Rating", group: "Advanced", icon: StarRateIcon },
  {
    type: "linear_scale",
    label: "Linear scale",
    group: "Advanced",
    icon: LinearScaleIcon,
  },
  { type: "yes_no", label: "Yes / No", group: "Advanced", icon: ToggleOnIcon },
  {
    type: "section_divider",
    label: "Section divider",
    group: "Layout",
    icon: HorizontalRuleIcon,
  },
  { type: "paragraph", label: "Text", group: "Layout", icon: TextFieldsIcon },
] as const;
