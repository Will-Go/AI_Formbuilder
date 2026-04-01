import type { IsoDateString } from "./forms";

export type AnswerValue = string | string[] | number | boolean | null;

export type Answer = {
  questionId: string;
  value: AnswerValue;
};

export type Response = {
  id: string;
  formId: string;
  submittedAt: IsoDateString;
  answers: Answer[];
};

