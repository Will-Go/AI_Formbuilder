"use client";

import React, { useMemo } from "react";
import { Form, Question } from "@/shared/types/forms";
import {
  Container,
  Stack,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildResponseSchema } from "@/modules/form-builder/preview/buildResponseSchema";
import {
  QuestionRenderer,
  FormHeader,
} from "@/shared/components/QuestionRenderer";
import { SuccessResponseView } from "@/shared/components/SuccessResponseView";
import TextHTMLDisplayer from "@/shared/components/TextHTMLDisplayer";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";
import { toAnswers } from "@/modules/form-preview/components/toAnswers";

export function FormRenderer({ form }: { form: Form }) {
  const [submitted, setSubmitted] = React.useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = React.useState(0);

  const built = buildResponseSchema(form);
  const methods = useForm({
    resolver: zodResolver(built.schema),
    defaultValues: built.defaultValues,
    mode: "onChange",
    shouldFocusError: false, // We handle focusing and scrolling manually
  });

  const submitResponseMutation = useAppMutation<
    { ok: boolean; responseId: string },
    Error,
    { answers: { question_id: string; value: unknown }[] }
  >({
    mutationFn: async (data) => {
      return apiRequest({
        method: "post",
        url: `/form/${form.id}/responses`,
        data,
      });
    },
    successMsg: "Response submitted successfully!",
    errorMsg: "Failed to submit response",
  });

  // Group questions by section dividers
  const sections = useMemo(() => {
    const ordered = form.questions.slice().sort((a, b) => a.order - b.order);
    const result: { divider?: Question; questions: Question[] }[] = [];

    let currentQuestions: Question[] = [];
    let currentDivider: Question | undefined = undefined;

    ordered.forEach((q) => {
      if (q.type === "section_divider") {
        // If there are questions or it's the very first element
        if (currentQuestions.length > 0 || currentDivider) {
          result.push({ divider: currentDivider, questions: currentQuestions });
        } else if (
          result.length === 0 &&
          currentQuestions.length === 0 &&
          !currentDivider
        ) {
          // It's the first element and it's a divider. Edge case, but handled.
          // We will push the empty first section so the form header shows up alone, or just set it as the first divider.
        }
        currentDivider = q;
        currentQuestions = [];
      } else {
        currentQuestions.push(q);
      }
    });

    // Push the last section
    result.push({ divider: currentDivider, questions: currentQuestions });

    return result;
  }, [form.questions]);

  const totalSections = sections.length;
  const currentSection = sections[currentSectionIndex];

  const handleNext = async () => {
    // We need to validate only the fields in the current section
    const currentQuestionIds = currentSection.questions
      .filter((q) => q.type !== "paragraph") // Paragraphs don't have values to validate
      .map((q) => q.id);

    const isValid = await methods.trigger(currentQuestionIds);
    if (isValid) {
      setCurrentSectionIndex((prev) => Math.min(prev + 1, totalSections - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Find the first question with an error and scroll to it
      for (const questionId of currentQuestionIds) {
        const fieldState = methods.getFieldState(questionId);
        if (fieldState.error) {
          const element = document.getElementById(`question-${questionId}`);
          if (element) {
            // Focus for accessibility
            element.focus();

            // Calculate position with a small offset for fixed headers if any
            const y =
              element.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: "smooth" });
            break; // Stop at the first error
          }
        }
      }
    }
  };

  const handleBack = () => {
    setCurrentSectionIndex((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClear = () => {
    methods.reset(built.defaultValues);
    setCurrentSectionIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    if (currentSectionIndex < totalSections - 1) {
      // If user presses enter on a non-final step, just go to next step
      handleNext();
      return;
    }

    const ordered = form.questions.slice().sort((a, b) => a.order - b.order);
    const answers = toAnswers(ordered, data);

    try {
      await submitResponseMutation.mutateAsync({ answers });
      methods.reset(built.defaultValues);
      setCurrentSectionIndex(0);
      setSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  const onInvalid = () => {
    // Find the first question with an error in the current section
    const currentQuestionIds = currentSection.questions
      .filter((q) => q.type !== "paragraph")
      .map((q) => q.id);

    for (const questionId of currentQuestionIds) {
      const fieldState = methods.getFieldState(questionId);
      if (fieldState.error) {
        const element = document.getElementById(`question-${questionId}`);
        if (element) {
          element.focus();
          const y = element.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: "smooth" });
          break;
        }
      }
    }
  };

  if (submitted) {
    return (
      <Box
        className="bg-accent-50"
        sx={{ minHeight: "100vh", py: { xs: 4, sm: 8 } }}
      >
        <Container maxWidth="md">
          <SuccessResponseView
            formTitle={form.title || "Untitled form"}
            onSubmitAnother={() => {
              methods.reset(built.defaultValues);
              setCurrentSectionIndex(0);
              setSubmitted(false);
            }}
          />
        </Container>
      </Box>
    );
  }

  const progressPercentage =
    totalSections > 1 ? (currentSectionIndex / (totalSections - 1)) * 100 : 100;

  return (
    <FormProvider {...methods}>
      <Box
        className="bg-accent-50"
        sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <Container
          maxWidth="md"
          component="form"
          onSubmit={methods.handleSubmit(onSubmit, onInvalid)}
          sx={{
            py: { xs: 3, sm: 6 },
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack spacing={2} sx={{ flexGrow: 1 }}>
            {currentSectionIndex === 0 && <FormHeader form={form} />}
            {currentSection.divider && (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  borderTop: 6,
                  borderTopColor: "primary.main",
                  borderRadius: 2,
                }}
              >
                <TextHTMLDisplayer
                  html={currentSection.divider.label}
                  textClassName="text-3xl"
                />
                {currentSection.divider.description && (
                  <Box sx={{ mt: 1, color: "text.secondary" }}>
                    <TextHTMLDisplayer
                      html={currentSection.divider.description}
                    />
                  </Box>
                )}
              </Paper>
            )}

            {currentSection.questions.map((question) => (
              <QuestionRenderer key={question.id} question={question} />
            ))}

            <Box sx={{ mt: "auto", pt: 4 }}>
              {totalSections > 1 && (
                <Box sx={{ mb: 3 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Page {currentSectionIndex + 1} of {totalSections}
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", gap: 2 }}>
                  {currentSectionIndex > 0 && (
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      sx={{ px: 3 }}
                    >
                      Back
                    </Button>
                  )}
                  {currentSectionIndex < totalSections - 1 ? (
                    <Button
                      key="next"
                      variant="contained"
                      onClick={handleNext}
                      sx={{ px: 4 }}
                      disabled={submitResponseMutation.isPending}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      key="submit"
                      type="submit"
                      variant="contained"
                      sx={{ px: 4 }}
                      disabled={submitResponseMutation.isPending}
                    >
                      {submitResponseMutation.isPending ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Submit"
                      )}
                    </Button>
                  )}
                </Box>
                <Button color="primary" onClick={handleClear}>
                  Clear form
                </Button>
              </Box>
            </Box>
          </Stack>
        </Container>

        <Box
          sx={{
            py: 4,
            px: 2,
            textAlign: "center",
            color: "text.secondary",
            mt: "auto",
          }}
        >
          <Typography variant="caption" display="block" sx={{ mb: 1 }}>
            This content is neither created nor endorsed by FormIA.
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "text.secondary", opacity: 0.8 }}
          >
            FormIA
          </Typography>
        </Box>
      </Box>
    </FormProvider>
  );
}
