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
import { useQueryClient, useIsMutating } from "@tanstack/react-query";

export const FORM_DETAILS_QUERY_KEY = ["form-builder", "form-details"];

export default function Page() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const router = useRouter();

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

  const currentView = useMemo(() => {
    const views = {
      builder: <FormBuilderPage key="builder" />,
      responses: <FormResponsesPage key="responses" />,
      settings: <FormSettingsPage key="settings" />,
    };

    return views?.[tab as keyof typeof views] || views.builder;
  }, [tab]);

  const anyMutating = useIsMutating({ mutationKey: ["form-builder"] }) > 0;
  const isSaving = anyMutating;

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
      <BuilderTopBar form={form} isSaving={isSaving} />
      {currentView}
    </Box>
  );
}
