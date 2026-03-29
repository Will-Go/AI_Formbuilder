"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Form, Question, QuestionType } from "@/shared/types/forms";
import { createBlankForm, createQuestionByType } from "@/constants/defaults";
import { nowIso } from "@/shared/utils/dateFormatter";
import { createId } from "@/shared/utils/id";

type FormsState = {
  forms: Form[];
  selectedQuestionIdByForm: Record<string, string | null>;
  viewMode: "grid" | "list";
  createForm: (
    initial?: Partial<Pick<Form, "title" | "description">>,
  ) => string;
  duplicateForm: (formId: string) => string | null;
  deleteForm: (formId: string) => void;
  updateFormMeta: (
    formId: string,
    patch: Partial<Pick<Form, "title" | "description" | "published" | "theme">>,
  ) => void;
  addQuestion: (formId: string, type: QuestionType) => string | null;
  updateQuestion: (
    formId: string,
    questionId: string,
    updater: (prev: Question) => Question,
  ) => void;
  deleteQuestion: (formId: string, questionId: string) => void;
  duplicateQuestion: (formId: string, questionId: string) => string | null;
  reorderQuestions: (formId: string, activeId: string, overId: string) => void;
  selectQuestion: (formId: string, questionId: string | null) => void;
  getFormById: (formId: string) => Form | undefined;
  setViewMode: (mode: "grid" | "list") => void;
};

function normalizeOrders(questions: Question[]): Question[] {
  return questions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((q, idx) => ({ ...q, order: idx }));
}

function cloneQuestion(q: Question, order: number): Question {
  const cloned = { ...q, id: createId("q"), order };
  if ("options" in cloned) {
    return {
      ...cloned,
      options: cloned.options.map((o) => ({ ...o, id: createId("opt") })),
    };
  }
  return cloned;
}

export const useFormsStore = create<FormsState>()(
  persist(
    (set, get) => ({
      forms: [],
      selectedQuestionIdByForm: {},
      viewMode: "grid", // Default view mode
      createForm: (initial) => {
        const form = createBlankForm();
        const next: Form = {
          ...form,
          title: initial?.title ?? form.title,
          description: initial?.description ?? form.description,
        };
        set((s) => ({ forms: [next, ...s.forms] }));
        return next.id;
      },
      duplicateForm: (formId) => {
        const src = get().forms.find((f) => f.id === formId);
        if (!src) return null;

        // Detect existing copies and compute next number
        const copyRegex = /^(.*) \(copy(?: (\d+))?\)$/;
        const baseTitle = src.title.replace(copyRegex, "$1");
        let maxCopy = 0;

        get().forms.forEach((f) => {
          const match = f.title.match(copyRegex);
          if (match && match[1] === baseTitle) {
            const num = match[2] ? parseInt(match[2], 10) : 1;
            if (num > maxCopy) maxCopy = num;
          }
        });

        const nextCopyNum = maxCopy + 1;
        const newTitle =
          nextCopyNum === 1
            ? `${baseTitle} (copy)`
            : `${baseTitle} (copy ${nextCopyNum})`;

        const now = nowIso();
        const cloned: Form = {
          ...src,
          id: createId("form"),
          title: newTitle,
          createdAt: now,
          updatedAt: now,
          published: false,
          questions: normalizeOrders(
            src.questions.map((q, idx) => cloneQuestion(q, idx)),
          ),
        };
        set((s) => ({ forms: [cloned, ...s.forms] }));
        return cloned.id;
      },
      deleteForm: (formId) => {
        set((s) => {
          const next = s.forms.filter((f) => f.id !== formId);
          const rest = { ...s.selectedQuestionIdByForm };
          delete rest[formId];
          return { forms: next, selectedQuestionIdByForm: rest };
        });
      },
      updateFormMeta: (formId, patch) => {
        set((s) => ({
          forms: s.forms.map((f) =>
            f.id === formId ? { ...f, ...patch, updatedAt: nowIso() } : f,
          ),
        }));
      },
      addQuestion: (formId, type) => {
        const form = get().forms.find((f) => f.id === formId);
        if (!form) return null;
        const nextOrder = form.questions.length;
        const q = createQuestionByType(type, nextOrder);
        set((s) => ({
          forms: s.forms.map((f) =>
            f.id === formId
              ? {
                  ...f,
                  updatedAt: nowIso(),
                  questions: normalizeOrders([...f.questions, q]),
                }
              : f,
          ),
          selectedQuestionIdByForm: {
            ...s.selectedQuestionIdByForm,
            [formId]: q.id,
          },
        }));
        return q.id;
      },
      updateQuestion: (formId, questionId, updater) => {
        set((s) => ({
          forms: s.forms.map((f) => {
            if (f.id !== formId) return f;
            const nextQuestions = f.questions.map((q) =>
              q.id === questionId ? updater(q) : q,
            );
            return { ...f, updatedAt: nowIso(), questions: nextQuestions };
          }),
        }));
      },
      deleteQuestion: (formId, questionId) => {
        set((s) => {
          const nextForms = s.forms.map((f) => {
            if (f.id !== formId) return f;
            const nextQuestions = normalizeOrders(
              f.questions.filter((q) => q.id !== questionId),
            );
            return { ...f, updatedAt: nowIso(), questions: nextQuestions };
          });
          const selected = s.selectedQuestionIdByForm[formId];
          const nextSelected =
            selected === questionId
              ? null
              : (s.selectedQuestionIdByForm[formId] ?? null);
          return {
            forms: nextForms,
            selectedQuestionIdByForm: {
              ...s.selectedQuestionIdByForm,
              [formId]: nextSelected,
            },
          };
        });
      },
      duplicateQuestion: (formId, questionId) => {
        const form = get().forms.find((f) => f.id === formId);
        if (!form) return null;
        const idx = form.questions.findIndex((q) => q.id === questionId);
        if (idx < 0) return null;
        const src = form.questions[idx];
        const cloned = cloneQuestion(src, idx + 1);
        set((s) => ({
          forms: s.forms.map((f) => {
            if (f.id !== formId) return f;
            const nextQuestions = normalizeOrders([
              ...f.questions.slice(0, idx + 1),
              cloned,
              ...f.questions.slice(idx + 1),
            ]);
            return { ...f, updatedAt: nowIso(), questions: nextQuestions };
          }),
          selectedQuestionIdByForm: {
            ...s.selectedQuestionIdByForm,
            [formId]: cloned.id,
          },
        }));
        return cloned.id;
      },
      reorderQuestions: (formId, activeId, overId) => {
        if (activeId === overId) return;
        set((s) => ({
          forms: s.forms.map((f) => {
            if (f.id !== formId) return f;
            const from = f.questions.findIndex((q) => q.id === activeId);
            const to = f.questions.findIndex((q) => q.id === overId);
            if (from < 0 || to < 0) return f;
            const next = f.questions.slice();
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return {
              ...f,
              updatedAt: nowIso(),
              questions: normalizeOrders(next),
            };
          }),
        }));
      },
      selectQuestion: (formId, questionId) => {
        set((s) => ({
          selectedQuestionIdByForm: {
            ...s.selectedQuestionIdByForm,
            [formId]: questionId,
          },
        }));
      },
      getFormById: (formId) => get().forms.find((f) => f.id === formId),
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: "ai_form:forms_store:v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ forms: s.forms, viewMode: s.viewMode }),
      version: 1,
    },
  ),
);
