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
import PhoneIcon from "@mui/icons-material/Phone";
import NumbersIcon from "@mui/icons-material/Numbers";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
interface ChartOption {
  type: string;
  label: string;
  primary: boolean;
}
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
  charts?: ChartOption[];
};

export const QUESTION_TYPE_META: readonly QuestionTypeMeta[] = [
  {
    type: "short_text",
    label: "Short answer",
    group: "Text",
    icon: ShortTextIcon,
    charts: [
      { type: "word_cloud", label: "Word Cloud", primary: true },
      { type: "bar", label: "Bar (top N answers)", primary: false },
    ],
  },
  {
    type: "long_text",
    label: "Paragraph",
    group: "Text",
    icon: SubjectIcon,
    charts: [
      { type: "word_cloud", label: "Word Cloud", primary: true },
      { type: "metric_card", label: "Response count card", primary: false },
    ],
  },
  {
    type: "multiple_choice",
    label: "Multiple choice",
    group: "Selection",
    icon: RadioButtonCheckedIcon,
    charts: [
      { type: "donut", label: "Pie / Donut", primary: true },
      { type: "bar_horizontal", label: "Horizontal Bar", primary: false },
    ],
  },
  {
    type: "checkbox",
    label: "Checkboxes",
    group: "Selection",
    icon: CheckBoxIcon,
    charts: [
      { type: "bar_horizontal", label: "Horizontal Bar", primary: true },
      { type: "bar_stacked", label: "Stacked Bar", primary: false },
    ],
  },
  {
    type: "dropdown",
    label: "Dropdown",
    group: "Selection",
    icon: ArrowDropDownCircleIcon,
    charts: [
      { type: "donut", label: "Pie / Donut", primary: true },
      { type: "bar_horizontal", label: "Horizontal Bar", primary: false },
    ],
  },
  {
    type: "email",
    label: "Email",
    group: "Structured",
    icon: EmailIcon,
    charts: [
      { type: "bar", label: "Domain Bar", primary: true },
      { type: "metric_card", label: "Response count card", primary: false },
    ],
  },
  {
    type: "phone",
    label: "Phone",
    group: "Structured",
    icon: PhoneIcon,
    charts: [
      { type: "bar", label: "Country Code Bar", primary: true },
      { type: "metric_card", label: "Response count card", primary: false },
    ],
  },
  {
    type: "number",
    label: "Number",
    group: "Structured",
    icon: NumbersIcon,
    charts: [
      { type: "histogram", label: "Histogram", primary: true },
      { type: "box_plot", label: "Box Plot", primary: false },
      { type: "metric_card", label: "Avg / Min / Max cards", primary: false },
    ],
  },
  {
    type: "date",
    label: "Date",
    group: "Structured",
    icon: CalendarMonthIcon,
    charts: [
      { type: "line", label: "Line (responses over time)", primary: true },
      { type: "bar", label: "Bar (by month/week)", primary: false },
    ],
  },
  {
    type: "rating",
    label: "Rating",
    group: "Advanced",
    icon: StarRateIcon,
    charts: [
      { type: "bar", label: "Bar (1–5 distribution)", primary: true },
      { type: "gauge", label: "Gauge / Avg score card", primary: false },
    ],
  },
  {
    type: "linear_scale",
    label: "Linear scale",
    group: "Advanced",
    icon: LinearScaleIcon,
    charts: [
      { type: "histogram", label: "Histogram", primary: true },
      { type: "line", label: "Line (avg over time)", primary: false },
      { type: "box_plot", label: "Box Plot", primary: false },
    ],
  },
  {
    type: "yes_no",
    label: "Yes / No",
    group: "Advanced",
    icon: ToggleOnIcon,
    charts: [
      { type: "donut", label: "Donut", primary: true },
      { type: "progress_bar", label: "Stacked progress bar", primary: false },
    ],
  },
  {
    type: "section_divider",
    label: "Section divider",
    group: "Layout",
    icon: HorizontalRuleIcon,
    charts: [],
  },
  {
    type: "paragraph",
    label: "Text",
    group: "Layout",
    icon: TextFieldsIcon,
    charts: [],
  },
] as const;
