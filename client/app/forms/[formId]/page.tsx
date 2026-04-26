"use client";
import React, { useMemo, useEffect, useCallback } from "react";
import BuilderTopBar from "@/modules/form-builder/components/BuilderTopBar";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import useQueryParams from "@/shared/hooks/useQueryParams";
import FormBuilderPage from "@/modules/form-builder/pages/FormBuilderPage";
import FormResponsesPage from "@/modules/form-responses/pages/FormResponsesPage";
import FormSettingsPage from "@/modules/form-settings/pages/FormSettingsPage";
import { useParams, useRouter } from "next/navigation";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";
import type { Form } from "@/shared/types/forms";
import { useQueryClient, useIsMutating } from "@tanstack/react-query";
import { subscribeToFormResponses } from "@/shared/services/supabase/client";
import { useAiChatStore } from "@/modules/form-builder/store/aiChatStore";
import { AiChatProvider } from "@/modules/form-builder/context/AiChatContext";
import { v4 as uuidv4 } from "uuid";
import {
  optimisticAddQuestion,
  optimisticDeleteQuestion,
  optimisticUpdateQuestion,
  optimisticReorderQuestions,
} from "@/modules/form-builder/utils/formOptimisticUpdates";
import type { Question, QuestionType } from "@/shared/types/forms";
import { notifyError } from "@/shared/utils/toastNotify";
import type { ChatMessage, GetMessagesResponse, StagedChange } from "@/shared/types/aiChat";

export const FORM_DETAILS_QUERY_KEY = ["form-builder", "form-details"];

export default function Page() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useAiChatStore((s) => s.session);

  const {
    queryParams: { tab },
  } = useQueryParams(["tab"]);

  const {
    data: form,
    isPending,
    isError,
    error,
  } = useAppQuery<Form, unknown, Form>({
    queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
    queryFn: async () =>
      apiRequest<Form>({
        method: "get",
        url: `/form/${formId}`,
      }),
    enabled: !!formId,
    errorMsg: "Failed to load form details",
  });

  const _messagesQuery = useAppQuery<GetMessagesResponse>({
    queryKey: ["ai-chat-messages", session?.id],
    queryFn: () =>
      apiRequest<GetMessagesResponse>({
        method: "get",
        url: `/ai-chat/sessions/${session?.id}/messages`,
      }),
    enabled: !!session?.id,
  });

  const messages = useMemo(
    () => _messagesQuery?.data?.messages ?? [],
    [_messagesQuery?.data?.messages],
  );

  const pendingFormChange = useMemo(() => {
    const changes = messages.flatMap((m: ChatMessage) =>
      (m.stagedChanges || [])
        .filter(
          (c: StagedChange) => c.accepted === null && c.type === "update_form",
        )
        .map((c: StagedChange) => ({ ...c, messageId: m.id })),
    );
    return (changes[0] as (StagedChange & { messageId: string }) | undefined) || null;
  }, [messages]);

  const setForm = useFormsStore((s) => s.setForm);

  useEffect(() => {
    if (form) {
      setForm(form);
    }
  }, [form, setForm]);

  useEffect(() => {
    if (!formId) return;

    // Listen for new responses and update the form details cache
    const subscription = subscribeToFormResponses(formId, () => {
      queryClient.setQueryData<Form>(
        [...FORM_DETAILS_QUERY_KEY, formId],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            response_count: (oldData.response_count || 0) + 1,
          };
        },
      );

      // Optionally invalidate responses summary/list queries
      queryClient.invalidateQueries({
        queryKey: ["responses", formId],
      });
      queryClient.invalidateQueries({
        queryKey: ["form", formId, "summary"],
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [formId, queryClient]);

  const anyMutating = useIsMutating({ mutationKey: ["form-builder"] }) > 0;
  const isSaving = anyMutating;

  const { mutateAsync: addQuestionMutate } = useAppMutation<
    { ok: boolean; question: Question },
    Error,
    {
      type: QuestionType;
      index?: number;
      id: string;
      payload?: Partial<Question>;
    },
    { previousForm?: Form }
  >({
    mutationFn: async ({ type, index, id, payload }) => {
      return apiRequest({
        method: "post",
        url: `/form/${formId}/questions`,
        data: { type, index, id, ...payload },
      });
    },
    onMutate: async (variables) => {
      const currentForm = useFormsStore.getState().form;
      if (!currentForm) return { previousForm: undefined };
      const nextForm = optimisticAddQuestion(
        currentForm,
        variables.type,
        variables.id,
        variables.index,
        variables.payload,
      );
      setForm(nextForm);
      queryClient.setQueryData([...FORM_DETAILS_QUERY_KEY, formId], nextForm);
      return { previousForm: currentForm };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousForm) {
        setForm(context.previousForm);
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          context.previousForm,
        );
      }
    },
    onSuccess: (res, variables) => {
      if (res.ok && res.question) {
        queryClient.setQueryData<Form>(
          [...FORM_DETAILS_QUERY_KEY, formId],
          (old) => {
            if (!old) return old;
            return optimisticUpdateQuestion(old, variables.id, res.question);
          },
        );
      }
    },
    errorMsg: "Failed to add question",
  });

  const { mutateAsync: reorderQuestionsMutate } = useAppMutation<
    unknown,
    Error,
    string[],
    { previousForm?: Form }
  >({
    mutationFn: async (questionIds: string[]) => {
      return apiRequest({
        method: "put",
        url: `/form/${formId}/questions`,
        data: { questionIds },
      });
    },
    onMutate: async (questionIds: string[]) => {
      const currentForm = useFormsStore.getState().form;
      if (!currentForm) return { previousForm: undefined };
      const nextForm = optimisticReorderQuestions(currentForm, questionIds);
      setForm(nextForm);
      queryClient.setQueryData([...FORM_DETAILS_QUERY_KEY, formId], nextForm);
      return { previousForm: currentForm };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousForm) {
        setForm(context.previousForm);
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          context.previousForm,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
    },
    errorMsg: "Failed to reorder questions",
  });

  const updateQuestionMutation = useAppMutation<
    { ok: boolean; question: Question },
    Error,
    { questionId: string; updates: Partial<Question> },
    { previousForm?: Form }
  >({
    mutationFn: async ({ questionId, updates }) => {
      return apiRequest({
        method: "patch",
        url: `/form/${formId}/questions/${questionId}`,
        data: updates,
      });
    },
    onMutate: async ({ questionId, updates }) => {
      const currentForm = useFormsStore.getState().form;
      if (!currentForm) return { previousForm: undefined };
      const nextForm = optimisticUpdateQuestion(
        currentForm,
        questionId,
        updates,
      );
      setForm(nextForm);
      queryClient.setQueryData([...FORM_DETAILS_QUERY_KEY, formId], nextForm);
      return { previousForm: currentForm };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousForm) {
        setForm(context.previousForm);
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          context.previousForm,
        );
      }
    },
    errorMsg: "Failed to update question",
  });

  const deleteQuestionMutation = useAppMutation<
    unknown,
    Error,
    string,
    { previousForm?: Form }
  >({
    mutationFn: async (questionId: string) => {
      return apiRequest({
        method: "delete",
        url: `/form/${formId}/questions/${questionId}`,
      });
    },
    onMutate: async (questionId: string) => {
      const currentForm = useFormsStore.getState().form;
      if (!currentForm) return { previousForm: undefined };
      const nextForm = optimisticDeleteQuestion(currentForm, questionId);
      setForm(nextForm);
      queryClient.setQueryData([...FORM_DETAILS_QUERY_KEY, formId], nextForm);
      return { previousForm: currentForm };
    },
    onError: (err: Error, _questionId: string, context) => {
      notifyError(`Failed to delete question: ${err.message}`);
      if (context?.previousForm) {
        setForm(context.previousForm);
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          context.previousForm,
        );
      }
    },
    errorMsg: "Failed to delete question",
  });

  const updateFormMutation = useAppMutation<
    { ok: boolean; form: Form },
    Error,
    Partial<Form>,
    { previousForm?: Form }
  >({
    mutationFn: async (updates: Partial<Form>) => {
      return apiRequest({
        method: "patch",
        url: `/form/${formId}`,
        data: updates,
      });
    },
    onMutate: async (updates: Partial<Form>) => {
      const currentForm = useFormsStore.getState().form;
      if (!currentForm) return { previousForm: undefined };
      const nextForm = { ...currentForm, ...updates };
      setForm(nextForm);
      queryClient.setQueryData([...FORM_DETAILS_QUERY_KEY, formId], nextForm);
      return { previousForm: currentForm };
    },
    onError: (_error: Error, _variables: Partial<Form>, context) => {
      if (context?.previousForm) {
        setForm(context.previousForm);
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          context.previousForm,
        );
      }
    },
    errorMsg: "Failed to update form details",
  });

  const handleAddQuestion = useCallback(
    (type: QuestionType, index?: number, payload?: Partial<Question>) => {
      return addQuestionMutate({ type, index, id: uuidv4(), payload });
    },
    [addQuestionMutate],
  );

  const handleUpdateQuestion = useCallback(
    (questionId: string, updates: Partial<Question>) => {
      return updateQuestionMutation.mutateAsync({ questionId, updates });
    },
    [updateQuestionMutation],
  );

  const handleDeleteQuestion = useCallback(
    (questionId: string) => {
      return deleteQuestionMutation.mutateAsync(questionId);
    },
    [deleteQuestionMutation],
  );

  const handleUpdateForm = useCallback(
    (updates: Partial<Form>) => {
      return updateFormMutation.mutateAsync(updates);
    },
    [updateFormMutation],
  );

  const handleReorderQuestions = useCallback(
    (questionIds: string[]) => {
      return reorderQuestionsMutate(questionIds);
    },
    [reorderQuestionsMutate],
  );

  const currentView = useMemo(() => {
    const views = {
      builder: (
        <FormBuilderPage
          key="builder"
          onAddQuestion={handleAddQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onReorderQuestions={handleReorderQuestions}
          isSaving={isSaving}
        />
      ),
      responses: <FormResponsesPage key="responses" />,
      settings: <FormSettingsPage key="settings" />,
    };

    return views?.[tab as keyof typeof views] || views.builder;
  }, [
    tab,
    handleAddQuestion,
    handleUpdateQuestion,
    handleDeleteQuestion,
    handleReorderQuestions,
    isSaving,
  ]);

  if (isPending) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !form) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {isError ? "Error loading form" : "Form not found"}
          </Typography>
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            {error instanceof Error
              ? error.message
              : "An unknown error occurred"}
          </Typography>
          <Button variant="contained" onClick={() => router.push("/forms")}>
            Back to dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      <AiChatProvider
        formId={formId}
        onAddQuestion={handleAddQuestion}
        onUpdateQuestion={handleUpdateQuestion}
        onDeleteQuestion={handleDeleteQuestion}
        onUpdateForm={handleUpdateForm}
      >
        <BuilderTopBar
          form={form}
          isSaving={isSaving}
          aiDiffState={
            pendingFormChange?.type === "update_form" ? "update" : undefined
          }
          aiMessageId={pendingFormChange?.messageId}
          aiChangeId={pendingFormChange?.id}
          aiPendingPayload={pendingFormChange?.payload as Partial<Form>}
        />
        {currentView}
      </AiChatProvider>
    </Box>
  );
}
