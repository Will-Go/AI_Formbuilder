"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Form } from "@/shared/types/forms";
import FormCard from "./FormCard";

interface FormGridProps {
  forms: Form[];
  onOpen: (formId: string) => void;
  onDuplicate: (formId: string) => void;
  onDelete: (formId: string) => void;
}

export default function FormGrid({
  forms,
  onOpen,
  onDuplicate,
  onDelete,
}: FormGridProps) {
  if (forms.length === 0) {
    return (
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No forms yet. Create one from the template gallery above.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 0, pb: 6 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 2,
        }}
      >
        {forms.map((f) => (
          <FormCard
            key={f.id}
            form={f}
            responseCount={f.responseCount ?? 0}
            onOpen={() => onOpen(f.id)}
            onDuplicate={() => onDuplicate(f.id)}
            onDelete={() => onDelete(f.id)}
          />
        ))}
      </Box>
    </Box>
  );
}
