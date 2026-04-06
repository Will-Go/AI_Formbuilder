"use client";
import React, { useMemo, useEffect } from "react";
import BuilderTopBar from "@/modules/form-builder/components/BuilderTopBar";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import useQueryParams from "@/shared/hooks/useQueryParams";
import FormBuilderPage from "@/modules/form-builder/pages/FormBuilderPage";
import FormResponsesPage from "@/modules/form-responses/pages/FormResponsesPage";
import FormSettingsPage from "@/modules/form-settings/pages/FormSettingsPage";
import { useParams, useRouter } from "next/navigation";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { apiRequest } from "@/shared/utils/apiRequest";
import type { Form } from "@/shared/types/forms";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";

export const FORM_DETAILS_QUERY_KEY = ["form-builder", "form-details"];

export default function Page() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const setForm = useFormsStore((s) => s.setForm);

  useEffect(() => {
    if (form) {
      setForm(form);
    }
  }, [form, setForm]);

  const { mutate: updateFormMeta, isPending: isFormMetaPending } =
    useAppMutation<unknown, Error, Partial<Form>>({
      mutationFn: async (updates) => {
        return apiRequest({
          method: "patch",
          url: `/form/${formId}`,
          data: updates,
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
        });
      },
    });

  const [pendingFormUpdates, setPendingFormUpdates] =
    React.useState<Partial<Form> | null>(null);
  const debouncedFormUpdates = useDebouncedValue(pendingFormUpdates, 400);

  const queueFormMetaUpdate = React.useCallback((updates: Partial<Form>) => {
    setPendingFormUpdates((prev) => ({
      ...(prev ?? {}),
      ...updates,
    }));
  }, []);

  React.useEffect(() => {
    if (!debouncedFormUpdates) return;
    setPendingFormUpdates(null);
    updateFormMeta(debouncedFormUpdates);
  }, [debouncedFormUpdates, updateFormMeta]);

  const currentView = useMemo(() => {
    const views = {
      builder: <FormBuilderPage key="builder" />,
      responses: <FormResponsesPage key="responses" />,
      settings: <FormSettingsPage key="settings" />,
    };

    return views?.[tab as keyof typeof views] || views.builder;
  }, [tab]);

  const isSavingStore = useFormsStore((s) => s.isSaving);
  const isSaving = isSavingStore || isFormMetaPending;

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
      <BuilderTopBar
        form={form}
        isSaving={isSaving}
        onUpdateFormMeta={queueFormMetaUpdate}
      />
      {currentView}
    </Box>
  );
}
