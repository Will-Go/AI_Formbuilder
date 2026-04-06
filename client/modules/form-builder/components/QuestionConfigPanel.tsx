"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { Form } from "@/shared/types/forms";

export default function QuestionConfigPanel({
  form,
  selectedQuestionId,
  onUpdateQuestion,
}: {
  form: Form;
  selectedQuestionId: string | null;
  onUpdateQuestion: (
    questionId: string,
    updates: Record<string, unknown>,
  ) => void;
}) {
  const question =
    form?.questions.find((q) => q.id === selectedQuestionId) ?? null;

  return (
    <Paper variant="outlined" sx={{ p: 2, position: "sticky", top: 96 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
        Settings
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {!question ? (
        <Typography variant="body2" color="text.secondary">
          Select a question to edit its settings.
        </Typography>
      ) : (
        <Stack spacing={2}>
          <TextField
            size="small"
            label="Label"
            value={question.label}
            onChange={(e) =>
              onUpdateQuestion(question.id, { label: e.target.value })
            }
          />
          <TextField
            size="small"
            label="Description"
            value={question.description ?? ""}
            onChange={(e) =>
              onUpdateQuestion(question.id, { description: e.target.value })
            }
            multiline
          />
          {"placeholder" in question ? (
            <TextField
              size="small"
              label="Placeholder"
              value={question.placeholder ?? ""}
              onChange={(e) =>
                onUpdateQuestion(question.id, { placeholder: e.target.value })
              }
            />
          ) : null}
          <Box>
            <Typography variant="caption" color="text.secondary">
              Type: {question.type}
            </Typography>
          </Box>
        </Stack>
      )}
    </Paper>
  );
}
