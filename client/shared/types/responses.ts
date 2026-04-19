import type { IsoDateString } from "./forms";

export type AnswerValue = string | string[] | number | boolean | null;

export type Answer = {
  question_id: string;
  value: AnswerValue;
};

export type Response = {
  id: string;
  form_id: string;
  submitted_at: IsoDateString;
  ip?: string | null;
  device?: string | null;
  metadata?: Record<string, unknown>;
  answers: Answer[];
};
