"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import type { Form } from "@/shared/types/forms";
import RichTextEditor from "@/shared/components/RichTextEditor";

export default function FormHeaderCard({ form }: { form: Form }) {
  const updateFormMeta = useFormsStore((s) => s.updateFormMeta);

  return (
    <Paper variant="outlined" sx={{ p: 3, borderTop: 6, borderTopColor: "primary.main" }}>
      <Stack spacing={2}>
        <RichTextEditor
          value={form.title}
          onChange={(value) => updateFormMeta(form.id, { title: value })}
          placeholder="Form title"
          allowLists={false}
          fontSize={32}
          fontWeight={700}
        />
        <RichTextEditor
          value={form.description ?? ""}
          onChange={(value) => updateFormMeta(form.id, { description: value })}
          placeholder="Form description"
          allowLists={true}
          fontSize={14}
        />
      </Stack>
    </Paper>
  );
}

