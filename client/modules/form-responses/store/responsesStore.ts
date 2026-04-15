"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Answer, Response } from "@/shared/types/responses";
import { nowIso } from "@/shared/utils/dateFormatter";
import { v4 as uuidv4 } from "uuid";

type ResponsesState = {
  responses: Response[];
  submitResponse: (formId: string, answers: Answer[]) => string;
  deleteResponsesForForm: (formId: string) => void;
  listResponsesForForm: (formId: string) => Response[];
  exportResponsesForForm: (formId: string) => Response[];
};

export const useResponsesStore = create<ResponsesState>()(
  persist(
    (set, get) => ({
      responses: [],
      submitResponse: (formId, answers) => {
        const res: Response = {
          id: uuidv4(),
          form_id: formId,
          submitted_at: nowIso(),
          answers,
        };
        set((s) => ({ responses: [res, ...s.responses] }));
        return res.id;
      },
      deleteResponsesForForm: (formId) => {
        set((s) => ({
          responses: s.responses.filter((r) => r.form_id !== formId),
        }));
      },
      listResponsesForForm: (formId) =>
        get()
          .responses.filter((r) => r.form_id === formId)
          .slice()
          .sort(
            (a, b) =>
              new Date(b.submitted_at).getTime() -
              new Date(a.submitted_at).getTime(),
          ),
      exportResponsesForForm: (formId) =>
        get().responses.filter((r) => r.form_id === formId),
    }),
    {
      name: "ai_form:responses_store:v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ responses: s.responses }),
      version: 1,
    },
  ),
);
