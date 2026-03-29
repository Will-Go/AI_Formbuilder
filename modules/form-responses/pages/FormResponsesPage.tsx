"use client";
import React from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useParams, useRouter } from "next/navigation";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import { useResponsesStore } from "../store/responsesStore";
import ResponsesTable from "../components/ResponsesTable";
import { downloadJson } from "@/shared/utils/downloadJson";

export default function FormResponsesPage() {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const form = useFormsStore.getState().getFormById(formId);
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
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            aria-label="Back"
            onClick={() => router.push(`/forms/${formId}/edit`)}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>
            {form.title || "Untitled form"}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={() => router.push(`/forms/${formId}/preview`)}
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() =>
              downloadJson(`${formId}-responses.json`, exportResponses)
            }
          >
            Export JSON
          </Button>
        </Toolbar>
        <Box sx={{ px: { xs: 1.5, sm: 3 } }}>
          <Tabs value={1} aria-label="Builder tabs">
            <Tab
              label="Questions"
              onClick={() => router.push(`/forms/${formId}/edit`)}
            />
            <Tab label="Responses" />
            <Tab label="Settings" />
          </Tabs>
        </Box>
      </AppBar>

      <Box sx={{ maxWidth: 960, mx: "auto", px: { xs: 2, sm: 3 }, py: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          Responses ({responses.length})
        </Typography>
        <ResponsesTable responses={responses} />
      </Box>
    </Box>
  );
}
