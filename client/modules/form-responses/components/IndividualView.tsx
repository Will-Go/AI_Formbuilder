"use client";
import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { apiRequest } from "@/shared/utils/apiRequest";
import type { Form, Question } from "@/shared/types/forms";
import type { Response } from "@/shared/types/responses";
import { formatShortDate } from "@/shared/utils/dateFormatter";
import TextHTMLDisplayer from "@/shared/components/TextHTMLDisplayer";

interface IndividualViewProps {
  form: Form;
  formId: string;
}

export default function IndividualView({ form, formId }: IndividualViewProps) {
  const [page, setPage] = useState(1);
  const limit = 1;

  const { data, isLoading, isError } = useAppQuery<{
    responses: Response[];
    pagination: { total: number; hasNext: boolean };
  }>({
    queryKey: ["responses-individual", formId, page],
    queryFn: () =>
      apiRequest({
        method: "get",
        url: `/form/${formId}/responses?limit=${limit}&page=${page}`,
      }),
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        if (page > 1) setPage((p) => p - 1);
      } else if (e.key === "ArrowRight") {
        if (data?.pagination?.hasNext) setPage((p) => p + 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, data?.pagination?.hasNext]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Typography color="error">Failed to load responses.</Typography>;
  }

  const response = data?.responses?.[0];
  const total = data?.pagination?.total || 0;

  if (!response) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 4, textAlign: "center", borderRadius: 3 }}
      >
        <Typography color="text.secondary">No responses yet.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Response {page} of {total}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            aria-label="Previous response"
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            disabled={page >= total}
            onClick={() => setPage(page + 1)}
            aria-label="Next response"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Submitted at: {formatShortDate(response.submitted_at)}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          ID: {response.id}
        </Typography>
        {response.ip && (
          <Typography variant="caption" color="text.secondary" display="block">
            IP: {response.ip}
          </Typography>
        )}
        {response.device && (
          <Typography variant="caption" color="text.secondary" display="block">
            Device: {response.device}
          </Typography>
        )}
      </Paper>

      <Stack spacing={3}>
        {form.questions
          .filter((q) => q.type !== "section_divider" && q.type !== "paragraph")
          .map((question) => {
            const answer = response.answers.find(
              (a: { question_id: string; value: unknown }) => a.question_id === question.id,
            );
            return (
              <AnswerCard
                key={question.id}
                question={question}
                answerValue={answer?.value}
              />
            );
          })}
      </Stack>
    </Box>
  );
}

function AnswerCard({
  question,
  answerValue,
}: {
  question: Question;
  answerValue: unknown;
}) {
  let displayValue = String(answerValue ?? "");
  if (Array.isArray(answerValue)) {
    displayValue = answerValue.join(", ");
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="body1" sx={{ fontWeight: "medium", mb: 1 }}>
        {question.label}
      </Typography>
      <Box sx={{ p: 2, bgcolor: "background.default", borderRadius: 1 }}>
        {answerValue === undefined ||
        answerValue === null ||
        answerValue === "" ? (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            No answer provided
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {displayValue}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
