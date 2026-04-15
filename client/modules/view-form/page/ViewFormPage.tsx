"use client";

import React from "react";
import { useParams } from "next/navigation";
import { Form, FormStatus } from "@/shared/types/forms";
import Box from "@mui/material/Box";

import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import { AccessControl } from "../components/AccessControl";
import { FormRenderer } from "../components/FormRenderer";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { apiRequest } from "@/shared/utils/apiRequest";

export default function ViewFormPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const { data: form, isLoading: loading } = useAppQuery<Form>({
    queryKey: ["view-form", formId],
    queryFn: () => apiRequest({ method: "get", url: `/form/${formId}` }),
    showTranslatedErrorToast: false,
  });

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!form) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Typography variant="h5">Form not found</Typography>
      </Box>
    );
  }

  if (form.status === FormStatus.DRAFT || form.status === FormStatus.CLOSED) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Typography variant="h5">
          This form is not accepting responses
        </Typography>
      </Box>
    );
  }

  if (form.status === FormStatus.PRIVATE) {
    return <AccessControl />;
  }

  return <FormRenderer form={form} />;
}
