"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { CircularProgress } from "@mui/material";
import { PreviewFormContent } from "@/modules/form-preview/components/PreviewFormContent";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { apiRequest } from "@/shared/utils/apiRequest";
import type { Form } from "@/shared/types/forms";

export default function FormPreviewPage() {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const { data: form, isPending } = useAppQuery<Form>({
    queryKey: ["form-builder", "form-details", formId],
    queryFn: () => apiRequest({ method: "get", url: `/form/${formId}` }),
    showTranslatedErrorToast: false,
  });

  if (isPending) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!form) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Button variant="contained" onClick={() => router.push("/forms")}>
          Back to dashboard
        </Button>
      </Box>
    );
  }

  return <PreviewFormContent formId={formId} form={form} />;
}
