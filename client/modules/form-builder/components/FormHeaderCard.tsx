"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { Form } from "@/shared/types/forms";
import RichTextEditor from "@/shared/components/RichTextEditor";

export default function FormHeaderCard({
  form,
  onUpdateFormMeta,
}: {
  form: Form;
  onUpdateFormMeta: (updates: Partial<Form>) => void;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderTop: 6, borderTopColor: "primary.main" }}
    >
      <Stack spacing={2}>
        <RichTextEditor
          value={form.title}
          onChange={(value) => onUpdateFormMeta({ title: value })}
          placeholder="Form title"
          allowLists={false}
          fontSize={32}
          fontWeight={700}
        />
        <RichTextEditor
          value={form.description ?? ""}
          onChange={(value) => onUpdateFormMeta({ description: value })}
          placeholder="Form description"
          allowLists={true}
          fontSize={14}
        />
      </Stack>
    </Paper>
  );
}

