"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useAiChatStore } from "../store/aiChatStore";
import { useFormsStore } from "../../form-dashboard/store/formsStore";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";
import { v4 as uuidv4 } from "uuid";
import type { QuestionType, Question, Form } from "@/shared/types/forms";
import type {
  ChatMessage,
  GetMessagesResponse,
  StagedChange,
} from "@/shared/types/aiChat";
import { useQueryClient } from "@tanstack/react-query";

function getMessagesFromCache(
  data?: GetMessagesResponse | ChatMessage[],
): ChatMessage[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.messages) ? data.messages : [];
}

interface AiChatContextValue {
  handleAcceptChange: (messageId: string, changeId: string) => Promise<void>;
  handleRejectChange: (messageId: string, changeId: string) => void;
  handleAcceptAll: (messageId: string) => Promise<void>;
  handleRejectAll: (messageId: string) => void;
  setMessages: (
    updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[]),
  ) => void;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

export const useAiChatContext = () => {
  const ctx = useContext(AiChatContext);
  if (!ctx) {
    throw new Error("useAiChatContext must be used within AiChatProvider");
  }
  return ctx;
};

interface AiChatProviderProps {
  children: React.ReactNode;
  formId: string;
  onAddQuestion: (
    type: QuestionType,
    index?: number,
    payload?: Partial<Question>,
  ) => Promise<unknown>;
  onUpdateQuestion: (
    questionId: string,
    updates: Partial<Question>,
  ) => Promise<unknown>;
  onDeleteQuestion: (questionId: string) => Promise<unknown>;
  onUpdateForm: (updates: Partial<Form>) => Promise<unknown>;
}

export const AiChatProvider = ({
  children,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onUpdateForm,
}: AiChatProviderProps) => {
  const queryClient = useQueryClient();
  const session = useAiChatStore((s) => s.session);

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      if (!session?.id) return;
      queryClient.setQueryData<GetMessagesResponse>(
        ["ai-chat-messages", session.id],
        (prev) => {
          const currentMessages = getMessagesFromCache(prev);
          const newMessages =
            typeof updater === "function" ? updater(currentMessages) : updater;

          if (!prev || Array.isArray(prev)) {
            return { messages: newMessages };
          }

          return { ...prev, messages: newMessages };
        },
      );
    },
    [queryClient, session],
  );

  const getQuestions = useFormsStore((s) => s.getQuestions);
  const getForm = () => useFormsStore.getState().form;

  const persistStagesMutation = useAppMutation<
    unknown,
    Error,
    { messageId: string; updatedChanges: StagedChange[] }
  >({
    mutationFn: async ({ messageId, updatedChanges }) => {
      if (!session?.id) return;
      return apiRequest({
        method: "patch",
        url: `/ai-chat/sessions/${session.id}/messages/${messageId}/stage`,
        data: { stagedChanges: updatedChanges },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["ai-chat", "sessions", session?.id],
      });
    },
  });

  const applyChange = useCallback(
    async (change: StagedChange) => {
      const payload = JSON.parse(JSON.stringify(change.payload));

      if (change.type === "add") {
        delete payload.id;
        delete payload.questionId;

        if (Array.isArray(payload.options)) {
          payload.options = payload.options.map(
            (opt: { id?: string; [key: string]: unknown }) => ({
              ...opt,
              id: uuidv4(),
            }),
          );
        }

        const type = (payload.type as QuestionType) || change.questionType;
        if (type) {
          return onAddQuestion(
            type,
            payload.order !== undefined ? payload.order : undefined,
            payload,
          );
        }
      } else if (change.type === "update") {
        if (change.questionId) {
          delete payload.id;

          if (Array.isArray(payload.options)) {
            payload.options = payload.options.map(
              (opt: { id?: string; [key: string]: unknown }) => ({
                ...opt,
                id: opt.id === "PLACEHOLDER" || !opt.id ? uuidv4() : opt.id,
              }),
            );
          }

          return onUpdateQuestion(change.questionId, payload);
        }
      } else if (change.type === "delete") {
        if (change.questionId) {
          return onDeleteQuestion(change.questionId);
        }
      } else if (change.type === "update_form") {
        return onUpdateForm(payload);
      }
      return Promise.resolve();
    },
    [onAddQuestion, onUpdateQuestion, onDeleteQuestion, onUpdateForm],
  );

  const getPastValue = useCallback(
    (change: StagedChange): string | undefined => {
      if (change.type === "add") return undefined;

      if (change.type === "update_form") {
        const form = getForm();
        if (!form) return undefined;
        const payload = (change.payload as Record<string, unknown>) || {};
        const fields = Object.keys(payload);
        const pastValues: Record<string, unknown> = {};
        fields.forEach((field) => {
          const val = (form as Record<string, unknown>)?.[field];
          if (val !== undefined) {
            pastValues[field] = val;
          }
        });
        return JSON.stringify(pastValues);
      }

      const questions = getQuestions();
      const originalQuestion = questions.find(
        (q) => q.id === change.questionId,
      );
      if (!originalQuestion) return undefined;

      const payload = (change.payload as Record<string, unknown>) || {};
      const fields = Object.keys(payload);

      const pastValues: Record<string, unknown> = {};
      fields.forEach((field) => {
        const val = (originalQuestion as Record<string, unknown>)?.[field];
        if (val !== undefined) {
          pastValues[field] = val;
        }
      });

      return JSON.stringify(pastValues);
    },
    [getQuestions],
  );

  const updateMessageChanges = useCallback(
    (messageId: string, changeId: string, accepted: boolean, past?: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !m.stagedChanges) return m;
          const updated = m.stagedChanges.map((c) =>
            c.id === changeId ? { ...c, accepted, past } : c,
          );
          persistStagesMutation.mutate({ messageId, updatedChanges: updated });
          return { ...m, stagedChanges: updated };
        }),
      );
    },
    [setMessages, persistStagesMutation],
  );

  const handleAcceptChange = useCallback(
    async (messageId: string, changeId: string) => {
      const cache = queryClient.getQueryData<GetMessagesResponse>([
        "ai-chat-messages",
        session?.id,
      ]);
      const currentMessages = cache?.messages ?? [];
      const msg = currentMessages.find((m) => m.id === messageId);
      const change = msg?.stagedChanges?.find((c) => c.id === changeId);
      if (change) {
        const past = getPastValue(change);
        try {
          await applyChange(change);
          updateMessageChanges(messageId, changeId, true, past);
        } catch (error) {
          console.error("Failed to accept change:", error);
        }
      }
    },
    [getPastValue, applyChange, updateMessageChanges, queryClient, session],
  );

  const handleRejectChange = useCallback(
    (messageId: string, changeId: string) => {
      const cache = queryClient.getQueryData<GetMessagesResponse>([
        "ai-chat-messages",
        session?.id,
      ]);
      const currentMessages = cache?.messages ?? [];
      const msg = currentMessages.find((m) => m.id === messageId);
      const change = msg?.stagedChanges?.find((c) => c.id === changeId);
      const past = change ? getPastValue(change) : undefined;
      updateMessageChanges(messageId, changeId, false, past);
    },
    [getPastValue, updateMessageChanges, queryClient, session],
  );

  const handleAcceptAll = useCallback(
    async (messageId: string) => {
      const cache = queryClient.getQueryData<GetMessagesResponse>([
        "ai-chat-messages",
        session?.id,
      ]);
      const currentMessages = cache?.messages ?? [];
      const msg = currentMessages.find((m) => m.id === messageId);
      if (!msg?.stagedChanges) return;

      const updatedChanges = [...msg.stagedChanges];
      for (let i = 0; i < updatedChanges.length; i++) {
        const change = updatedChanges[i];
        if (change.accepted === null) {
          const past = getPastValue(change);
          try {
            await applyChange(change);
            updatedChanges[i] = { ...change, accepted: true as const, past };
          } catch (error) {
            console.error("Failed to apply staged change:", error);
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, stagedChanges: updatedChanges } : m,
        ),
      );

      persistStagesMutation.mutate({ messageId, updatedChanges });
    },
    [
      getPastValue,
      applyChange,
      setMessages,
      persistStagesMutation,
      queryClient,
      session,
    ],
  );

  const handleRejectAll = useCallback(
    (messageId: string) => {
      const cache = queryClient.getQueryData<GetMessagesResponse>([
        "ai-chat-messages",
        session?.id,
      ]);
      const currentMessages = cache?.messages ?? [];
      const msg = currentMessages.find((m) => m.id === messageId);
      if (!msg?.stagedChanges) return;

      const updated = msg.stagedChanges.map((c) => {
        if (c.accepted === null) {
          const past = getPastValue(c);
          return { ...c, accepted: false as const, past };
        }
        return c;
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, stagedChanges: updated } : m,
        ),
      );
      persistStagesMutation.mutate({ messageId, updatedChanges: updated });
    },
    [getPastValue, setMessages, persistStagesMutation, queryClient, session],
  );

  const contextValue = useMemo(
    () => ({
      handleAcceptChange,
      handleRejectChange,
      handleAcceptAll,
      handleRejectAll,
      setMessages,
    }),
    [
      handleAcceptChange,
      handleRejectChange,
      handleAcceptAll,
      handleRejectAll,
      setMessages,
    ],
  );

  return (
    <AiChatContext.Provider value={contextValue}>
      {children}
    </AiChatContext.Provider>
  );
};
