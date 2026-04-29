"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { FormStatus, type Form, type Question } from "@/shared/types/forms";

type FormsState = {
  selectedQuestionIdByForm: Record<string, string | null>;
  viewMode: "grid" | "list";
  isPaletteOpen: boolean;
  togglePaletteOpen: () => void;
  setViewMode: (mode: "grid" | "list") => void;
  form: Form | undefined;
  setForm: (form: Form) => void;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
  getQuestions: () => Question[];
};

export const useFormsStore = create<FormsState>()(
  persist(
    (set, get) => ({
      selectedQuestionIdByForm: {},
      viewMode: "grid", // Default view mode
      isPaletteOpen: true,
      isSaving: false,
      setViewMode: (mode) => set({ viewMode: mode }),
      togglePaletteOpen: () =>
        set((s) => ({ isPaletteOpen: !s.isPaletteOpen })),
      form: undefined,
      setForm: (form) => {
        set(() => ({
          form,
        }));
      },
      setIsSaving: (isSaving) => set({ isSaving }),
      getQuestions: () => get().form?.questions ?? [],
    }),
    {
      name: "formai:forms_store:v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        form: s.form,
        viewMode: s.viewMode,
        isPaletteOpen: s.isPaletteOpen,
      }),
      version: 2,
      migrate: (persistedState, version) => {
        if (version >= 2) return persistedState as FormsState;
        const state = persistedState as {
          forms?: Array<Form & { published?: boolean }>;
          viewMode?: "grid" | "list";
          isPaletteOpen?: boolean;
        };
        return {
          forms: (state.forms ?? []).map((form) => {
            const { published, ...rest } = form;
            return {
              ...rest,
              status: published ? FormStatus.PUBLISHED : FormStatus.DRAFT,
            };
          }),
          viewMode: state.viewMode ?? "grid",
          isPaletteOpen: state.isPaletteOpen ?? true,
        };
      },
    },
  ),
);
