import { v4 as uuidv4 } from "uuid";
import type { Form, Question, QuestionType } from "../../../shared/types/forms";

function sortQuestions(questions: Question[]): Question[] {
  return [...questions].sort((a, b) => a.order - b.order);
}

function isOptionBasedType(type: QuestionType): boolean {
  return (
    type === "multiple_choice" || type === "checkbox" || type === "dropdown"
  );
}

export function optimisticAddQuestion(
  form: Form,
  type: QuestionType,
  id: string,
  index?: number,
  payload?: Partial<Question>,
): Form {
  const sorted = sortQuestions(form.questions);
  const insertionIndex =
    index === undefined || index < 0 || index > sorted.length
      ? sorted.length
      : index;

  const baseQuestion = {
    id,
    type,
    label: payload?.label ?? "",
    description: payload?.description ?? "",
    required: payload?.required ?? false,
    order: insertionIndex + 1,
    ...payload,
  } as Question;

  const question = isOptionBasedType(type)
    ? ({
        ...baseQuestion,
        options: [
          {
            id: uuidv4(),
            value: "Option 1",
            label: "Option 1",
            order: 0,
          },
        ],
      } as Question)
    : baseQuestion;

  const nextQuestions = [...sorted];
  nextQuestions.splice(insertionIndex, 0, question);

  return {
    ...form,
    questions: nextQuestions.map((item, order) => ({
      ...item,
      order: order + 1,
    })) as Question[],
  };
}

export function optimisticReorderQuestions(
  form: Form,
  questionIds: string[],
): Form {
  const byId = new Map(
    form.questions.map((question) => [question.id, question]),
  );
  const ordered = questionIds
    .map((id) => byId.get(id))
    .filter((question): question is Question => Boolean(question));

  if (ordered.length !== form.questions.length) {
    return form;
  }

  return {
    ...form,
    questions: ordered.map((question, index) => ({
      ...question,
      order: index + 1,
    })),
  };
}

export function optimisticUpdateQuestion(
  form: Form,
  questionId: string,
  updates: Record<string, unknown>,
): Form {
  return {
    ...form,
    questions: form.questions.map((question) => {
      if (question.id !== questionId) {
        return question;
      }
      return {
        ...question,
        ...updates,
      } as Question;
    }),
  };
}

export function optimisticDeleteQuestion(form: Form, questionId: string): Form {
  const remaining = form.questions.filter(
    (question) => question.id !== questionId,
  );
  return {
    ...form,
    questions: remaining.map((question, index) => ({
      ...question,
      order: index + 1,
    })),
  };
}

export function optimisticDuplicateQuestion(
  form: Form,
  questionId: string,
  tempId?: string,
): Form {
  const sorted = sortQuestions(form.questions);
  const sourceIndex = sorted.findIndex(
    (question) => question.id === questionId,
  );

  if (sourceIndex === -1) {
    return form;
  }

  const source = sorted[sourceIndex];
  const duplicate = {
    ...source,
    id: tempId ?? `temp-question-${Date.now()}`,
  } as Question;

  const next = [...sorted];
  next.splice(sourceIndex + 1, 0, duplicate);

  return {
    ...form,
    questions: next.map((question, index) => ({
      ...question,
      order: index + 1,
    })),
  };
}

export function optimisticUpdateFormMeta(
  form: Form,
  updates: Partial<Form>,
): Form {
  return {
    ...form,
    ...updates,
  };
}
