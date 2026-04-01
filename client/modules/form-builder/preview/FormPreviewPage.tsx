"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import { PreviewFormContent } from "@/modules/form-preview/components/PreviewFormContent";


export default function FormPreviewPage() {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const form = useFormsStore((s) => s.getFormById(formId));

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
