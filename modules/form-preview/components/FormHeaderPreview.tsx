"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TextHTMLDisplayer from "@/shared/components/TextHTMLDisplayer";
import type { Form } from "@/shared/types/forms";

interface FormHeaderPreviewProps {
  form: Form;
}

export function FormHeaderPreview({ form }: FormHeaderPreviewProps) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderTop: 6, borderTopColor: "primary.main" }}
    >
      <Box sx={{ mb: 1 }}>
        <TextHTMLDisplayer
          html={form.title || "Untitled form"}
          textClassName="text-3xl "
        />
      </Box>
      {form.description ? (
        <Box sx={{ color: "text.secondary" }}>
          <TextHTMLDisplayer html={form.description} />
        </Box>
      ) : null}
    </Paper>
  );
}
