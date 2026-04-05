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
  value: string;
  order: number;
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
  author_id: string;
  author_name: string;
  description?: string;
  created_at: IsoDateString;
  updated_at: IsoDateString;
  status: FormStatus;
  theme?: ThemeConfig;
  settings?: Record<string, unknown>;
  questions: Question[];
  response_count?: number;
};

export type PaginationInput = {
  limit?: number | null;
  pageNumber?: number | null;
};

export type FormQueryFilters = {
  ownerId?: string | null;
  search?: string | null;
};

export type GetFormsOptions = PaginationInput & FormQueryFilters;

export type FormsPagination = {
  limit: number;
  pageNumber: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type FormsDaoResult = {
  forms: Form[];
  pagination: FormsPagination;
};

export type RpcOwner = {
  id: string | null;
  email: string | null;
  name: string | null;
} | null;

export type RpcFormRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  theme: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  response_count: number | null;
  owner: RpcOwner;
};

export type RpcPagination = {
  limit: number;
  page_number: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type RpcGetFormsResponse = {
  forms: RpcFormRow[];
  pagination: RpcPagination;
};

export type CreateFormInput = {
  ownerId: string;
  title: string;
  description?: string;
  status?: FormStatus;
  theme?: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

export type CreateFormResponse = {
  ok: boolean;
  formId?: string;
};

export type FormErrorResponse = {
  error: string;
  details?: string;
};

export type FormsListResponse = {
  forms: Form[];
  pagination: FormsPagination;
};
