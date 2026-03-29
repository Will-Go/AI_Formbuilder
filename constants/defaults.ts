import type {
  CheckboxQuestion,
  DropdownQuestion,
  Form,
  LinearScaleQuestion,
  LongTextQuestion,
  MultipleChoiceQuestion,
  NumberQuestion,
  Question,
  RatingQuestion,
  ShortTextQuestion,
  YesNoQuestion,
} from "@/shared/types/forms";
import { createId } from "@/shared/utils/id";
import { nowIso } from "@/shared/utils/dateFormatter";

export function createBlankForm(): Form {
  const now = nowIso();
  const formId = createId("form");
  return {
    id: formId,
    title: "Untitled form",
    description: "",
    createdAt: now,
    updatedAt: now,
    published: false,
    questions: [createDefaultQuestion(0)],
  };
}

export function createDefaultQuestion(order: number): Question {
  const q: ShortTextQuestion = {
    id: createId("q"),
    type: "short_text",
    label: "Untitled question",
    description: "",
    required: false,
    order,
    placeholder: "",
  };
  return q;
}

export function createQuestionByType(
  type: Question["type"],
  order: number,
): Question {
  const base = {
    id: createId("q"),
    label: "Untitled question",
    description: "",
    required: false,
    order,
  } as const;

  if (type === "short_text") {
    const q: ShortTextQuestion = { ...base, type, placeholder: "" };
    return q;
  }
  if (type === "long_text") {
    const q: LongTextQuestion = { ...base, type, placeholder: "" };
    return q;
  }
  if (type === "multiple_choice") {
    const q: MultipleChoiceQuestion = {
      ...base,
      type,
      options: [
        { id: createId("opt"), label: "Option 1" },
        { id: createId("opt"), label: "Option 2" },
      ],
    };
    return q;
  }
  if (type === "checkbox") {
    const q: CheckboxQuestion = {
      ...base,
      type,
      options: [
        { id: createId("opt"), label: "Option 1" },
        { id: createId("opt"), label: "Option 2" },
      ],
    };
    return q;
  }
  if (type === "dropdown") {
    const q: DropdownQuestion = {
      ...base,
      type,
      options: [
        { id: createId("opt"), label: "Option 1" },
        { id: createId("opt"), label: "Option 2" },
      ],
    };
    return q;
  }
  if (type === "email") return { ...base, type, placeholder: "" };
  if (type === "phone") return { ...base, type, placeholder: "" };
  if (type === "number") {
    const q: NumberQuestion = {
      ...base,
      type,
      placeholder: "",
      validation: {},
    };
    return q;
  }
  if (type === "date") return { ...base, type };
  if (type === "rating") {
    const q: RatingQuestion = { ...base, type, max: 5 };
    return q;
  }
  if (type === "linear_scale") {
    const q: LinearScaleQuestion = { ...base, type, min: 1, max: 5 };
    return q;
  }
  if (type === "yes_no") {
    const q: YesNoQuestion = { ...base, type, yesLabel: "Yes", noLabel: "No" };
    return q;
  }
  if (type === "section_divider")
    return { ...base, type, required: false, label: "Section title" };
  return {
    ...base,
    type: "paragraph",
    required: false,
    label: "Text",
    text: "",
  };
}
