"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import type { Form } from "@/shared/types/forms";

export default function FormHeaderCard({ form }: { form: Form }) {
  const updateFormMeta = useFormsStore((s) => s.updateFormMeta);

  return (
    <Paper variant="outlined" sx={{ p: 3, borderTop: 6, borderTopColor: "primary.main" }}>
      <Stack spacing={2}>
        <TextField
          variant="standard"
          value={form.title}
          onChange={(e) => updateFormMeta(form.id, { title: e.target.value })}
          placeholder="Form title"
          InputProps={{ sx: { fontSize: 32, fontWeight: 700 } }}
        />
        <TextField
          variant="standard"
          value={form.description ?? ""}
          onChange={(e) => updateFormMeta(form.id, { description: e.target.value })}
          placeholder="Form description"
          multiline
          InputProps={{ sx: { fontSize: 14 } }}
        />
      </Stack>
    </Paper>
  );
}

