import type { QuestionType } from "@/shared/types/forms";

type DragData = {
  source?: string;
  questionType?: QuestionType;
};

export function extractPaletteDragType(data: DragData | undefined): QuestionType | null {
  if (!data || data.source !== "palette" || !data.questionType) return null;
  return data.questionType;
}

export function resolveCanvasDropIndex(
  overId: string | null,
  formId: string,
  orderedQuestionIds: string[],
): number | null {
  if (!overId) return null;
  if (overId === `canvas-drop:${formId}`) return orderedQuestionIds.length;
  if (overId.startsWith("canvas-slot:") || overId.startsWith("preview-slot:")) {
    const maybeIndex = Number(overId.split(":")[1]);
    return Number.isInteger(maybeIndex) ? maybeIndex : null;
  }
  const questionIndex = orderedQuestionIds.indexOf(overId);
  if (questionIndex >= 0) return questionIndex;
  return null;
}

export function canDropPaletteItem(
  overId: string | null,
  formId: string,
  orderedQuestionIds: string[],
): boolean {
  return resolveCanvasDropIndex(overId, formId, orderedQuestionIds) !== null;
}
