"use client";
import React from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { useParams, useRouter } from "next/navigation";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import { useResponsesStore } from "../store/responsesStore";
import ResponsesTable from "../components/ResponsesTable";
import { downloadJson } from "@/shared/utils/downloadJson";
import { stripHtml } from "@/shared/utils/html";

export default function FormResponsesPage() {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const form = useFormsStore((s) => s.form);
  const responses = useResponsesStore.getState().listResponsesForForm(formId);
  const exportResponses = useResponsesStore
    .getState()
    .exportResponsesForForm(formId);

  if (!form) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Button variant="contained" onClick={() => router.push("/forms")}>
          Back to dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: "background.default" }}>
      <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          Responses ({responses.length})
        </Typography>
        <ResponsesTable responses={responses} />
      </Box>
    </Box>
  );
}
