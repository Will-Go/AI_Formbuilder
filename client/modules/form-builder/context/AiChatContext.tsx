"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useAiChatStore } from "../store/aiChatStore";
import { useFormsStore } from "../../form-dashboard/store/formsStore";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";
import { v4 as uuidv4 } from "uuid";
import type { QuestionType, Question, Form } from "@/shared/types/forms";
import type {
  ApplyAllStagedChangesResponse,
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
  acceptingAllMessageId: string | null;
  rejectingAllMessageId: string | null;
  acceptingChangeIds: string[];
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
  const [acceptingAllMessageId, setAcceptingAllMessageId] = React.useState<
    string | null
  >(null);
  const [rejectingAllMessageId, setRejectingAllMessageId] = React.useState<
    string | null
  >(null);
  const [acceptingChangeIds, setAcceptingChangeIds] = React.useState<string[]>(
    [],
  );

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      if (!session?.id) return;
      queryClient.setQueryData<GetMessagesResponse>(
        ["ai-chat-messages", session.id],
        (prev) => {
          const currentMessages = getMessagesFromCache(prev);
          const newMessages =
            typeof updater === "function" ? updater(currentMessages) : updater;

          const seen = new Set<string>();
          const deduplicatedMessages: ChatMessage[] = [];
          for (let i = newMessages.length - 1; i >= 0; i--) {
            const m = newMessages[i];
            if (!seen.has(m.id)) {
              seen.add(m.id);
              deduplicatedMessages.unshift(m);
            }
          }

          if (!prev || Array.isArray(prev)) {
            return { messages: deduplicatedMessages, hasMore: false };
          }

          return { ...prev, messages: deduplicatedMessages };
        },
      );
    },
    [queryClient, session],
  );

  const getQuestions = useFormsStore((s) => s.getQuestions);
  const setFormStore = useFormsStore((s) => s.setForm);
  const getForm = () => useFormsStore.getState().form;

  const applyAllMutation = useAppMutation<
    ApplyAllStagedChangesResponse,
    Error,
    { messageId: string; action: "accept" | "reject" }
  >({
    mutationFn: async ({ messageId, action }) => {
      if (!session?.id) throw new Error("Session is missing");
      return apiRequest({
        method: "post",
        url: `/ai-chat/sessions/${session.id}/messages/${messageId}/apply-all`,
        data: { action },
      });
    },
  });

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
                id:
                  opt.id?.startsWith("PLACEHOLDER") || !opt.id
                    ? uuidv4()
                    : opt.id,
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
        setAcceptingChangeIds((prev) => [...prev, changeId]);
        const past = getPastValue(change);
        try {
          await applyChange(change);
          updateMessageChanges(messageId, changeId, true, past);
        } catch (error) {
          console.error("Failed to accept change:", error);
        } finally {
          setAcceptingChangeIds((prev) => prev.filter((id) => id !== changeId));
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
      setAcceptingAllMessageId(messageId);
      try {
        const res = await applyAllMutation.mutateAsync({
          messageId,
          action: "accept",
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, stagedChanges: res.stagedChanges } : m,
          ),
        );
        setFormStore(res.form);
        queryClient.setQueryData(
          ["form-builder", "form-details", res.form.id],
          res.form,
        );
        queryClient.invalidateQueries({
          queryKey: ["form-builder", "form-details", res.form.id],
        });
      } catch (error) {
        console.error("Failed to apply all staged changes:", error);
      } finally {
        setAcceptingAllMessageId(null);
      }
    },
    [applyAllMutation, setMessages, setFormStore, queryClient],
  );

  const handleRejectAll = useCallback(
    async (messageId: string) => {
      setRejectingAllMessageId(messageId);
      try {
        const res = await applyAllMutation.mutateAsync({
          messageId,
          action: "reject",
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, stagedChanges: res.stagedChanges } : m,
          ),
        );
      } catch (error) {
        console.error("Failed to reject all staged changes:", error);
      } finally {
        setRejectingAllMessageId(null);
      }
    },
    [applyAllMutation, setMessages],
  );

  const contextValue = useMemo(
    () => ({
      handleAcceptChange,
      handleRejectChange,
      handleAcceptAll,
      handleRejectAll,
      setMessages,
      acceptingAllMessageId,
      rejectingAllMessageId,
      acceptingChangeIds,
    }),
    [
      handleAcceptChange,
      handleRejectChange,
      handleAcceptAll,
      handleRejectAll,
      setMessages,
      acceptingAllMessageId,
      rejectingAllMessageId,
      acceptingChangeIds,
    ],
  );

  return (
    <AiChatContext.Provider value={contextValue}>
      {children}
    </AiChatContext.Provider>
  );
};
