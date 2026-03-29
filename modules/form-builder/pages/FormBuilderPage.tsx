"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import BuilderTopBar from "../components/BuilderTopBar";
import FieldPalette from "../components/FieldPalette";
import Canvas from "../components/Canvas";
import QuestionConfigPanel from "../components/QuestionConfigPanel";

export default function FormBuilderPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const router = useRouter();

  const form = useFormsStore((s) => s.getFormById(formId));
  const selectedQuestionId = useFormsStore(
    (s) => s.selectedQuestionIdByForm[formId] ?? null,
  );

  if (!form) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Form not found
          </Typography>
          <Button variant="contained" onClick={() => router.push("/forms")}>
            Back to dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh" }} className="bg-accent-50">
      <BuilderTopBar form={form} />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "260px 1fr 340px" },
          gap: 2,
          px: { xs: 1.5, sm: 3 },
          py: 2,
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "sticky",
            top: 120,
            alignSelf: "start",
          }}
        >
          <FieldPalette formId={formId} />
        </Box>
        <Canvas formId={formId} selectedQuestionId={selectedQuestionId} />
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "sticky",
            top: 120,
            alignSelf: "start",
          }}
        >
          <QuestionConfigPanel
            formId={formId}
            selectedQuestionId={selectedQuestionId}
          />
        </Box>
      </Box>
    </Box>
  );
}
