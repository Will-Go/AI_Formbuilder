export type IsoDateString = string;

export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "checkbox"
  | "dropdown"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "rating"
  | "linear_scale"
  | "yes_no"
  | "section_divider"
  | "paragraph";

export type ConditionalOperator = "equals" | "not_equals";

export type ConditionalValue = string | number | boolean;

export type ConditionalLogic = {
  dependsOnQuestionId: string;
  operator: ConditionalOperator;
  value: ConditionalValue;
};

export type ThemeConfig = {
  primaryColor?: string;
};

export enum FormStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  PRIVATE = "private",
  CLOSED = "closed",
}

export type Option = {
  id: string;
  label: string;
};

export type TextValidationRules = {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

export type NumberValidationRules = {
  min?: number;
  max?: number;
};

export type CommonQuestionFields = {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  order: number;
  logic?: ConditionalLogic;
};

export type WithPlaceholder = {
  placeholder?: string;
};

export type ShortTextQuestion = CommonQuestionFields &
  WithPlaceholder & {
    type: "short_text";
    defaultValue?: string;
    validation?: TextValidationRules;
  };

export type LongTextQuestion = CommonQuestionFields &
  WithPlaceholder & {
    type: "long_text";
    defaultValue?: string;
    validation?: TextValidationRules;
  };

export type MultipleChoiceQuestion = CommonQuestionFields & {
  type: "multiple_choice";
  options: Option[];
  defaultValue?: string;
};

export type CheckboxQuestion = CommonQuestionFields & {
  type: "checkbox";
  options: Option[];
  defaultValue?: string[];
};

export type DropdownQuestion = CommonQuestionFields & {
  type: "dropdown";
  options: Option[];
  defaultValue?: string;
};

export type EmailQuestion = CommonQuestionFields &
  WithPlaceholder & {
    type: "email";
    defaultValue?: string;
  };

export type PhoneQuestion = CommonQuestionFields &
  WithPlaceholder & {
    type: "phone";
    defaultValue?: string;
    validation?: TextValidationRules;
  };

export type NumberQuestion = CommonQuestionFields &
  WithPlaceholder & {
    type: "number";
    defaultValue?: number;
    validation?: NumberValidationRules;
  };

export type DateQuestion = CommonQuestionFields & {
  type: "date";
  defaultValue?: string;
};

export type RatingQuestion = CommonQuestionFields & {
  type: "rating";
  max: number;
  defaultValue?: number;
};

export type LinearScaleQuestion = CommonQuestionFields & {
  type: "linear_scale";
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  defaultValue?: number;
};

export type YesNoQuestion = CommonQuestionFields & {
  type: "yes_no";
  yesLabel?: string;
  noLabel?: string;
  defaultValue?: boolean;
};

export type SectionDividerQuestion = CommonQuestionFields & {
  type: "section_divider";
};

export type ParagraphQuestion = CommonQuestionFields & {
  type: "paragraph";
  text?: string;
};

export type Question =
  | ShortTextQuestion
  | LongTextQuestion
  | MultipleChoiceQuestion
  | CheckboxQuestion
  | DropdownQuestion
  | EmailQuestion
  | PhoneQuestion
  | NumberQuestion
  | DateQuestion
  | RatingQuestion
  | LinearScaleQuestion
  | YesNoQuestion
  | SectionDividerQuestion
  | ParagraphQuestion;

export type Form = {
  id: string;
  title: string;
  authorId: string;
  description?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  status: FormStatus;
  theme?: ThemeConfig;
  questions: Question[];
  responseCount?: number;
};
