"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Fab from "@mui/material/Fab";
import Alert from "@mui/material/Alert";
import EditIcon from "@mui/icons-material/Edit";
import LinearProgress from "@mui/material/LinearProgress";
import Tooltip from "@mui/material/Tooltip";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useResponsesStore } from "@/modules/form-responses/store/responsesStore";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import type { Form, Question } from "@/shared/types/forms";
import { FormStatus } from "@/shared/types/forms";
import { PublishDecisionDialog } from "@/modules/form-builder/components/PublishDecisionDialog";
import { ShareDialog } from "@/modules/form-builder/components/ShareDialog";
import { buildResponseSchema } from "../../form-builder/preview/buildResponseSchema";
import {
  QuestionRenderer,
  FormHeader,
} from "@/shared/components/QuestionRenderer";
import { toAnswers } from "./toAnswers";
import { PreviewTopBar } from "./PreviewTopBar";
import TextHTMLDisplayer from "@/shared/components/TextHTMLDisplayer";


interface PreviewFormContentProps {
  formId: string;
  form: Form;
}

export function PreviewFormContent({ formId, form }: PreviewFormContentProps) {
  const router = useRouter();
  const updateFormMeta = useFormsStore((s) => s.updateFormMeta);
  const submitResponse = useResponsesStore((s) => s.submitResponse);
  const [submitted, setSubmitted] = React.useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = React.useState(0);
  const [publishDecisionDialogOpen, setPublishDecisionDialogOpen] =
    React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);

  const built = buildResponseSchema(form);
  const methods = useForm({
    resolver: zodResolver(built.schema),
    defaultValues: built.defaultValues,
    mode: "onChange",
    shouldFocusError: false,
  });

  const sections = useMemo(() => {
    const ordered = form.questions.slice().sort((a, b) => a.order - b.order);
    const result: { divider?: Question; questions: Question[] }[] = [];

    let currentQuestions: Question[] = [];
    let currentDivider: Question | undefined = undefined;

    ordered.forEach((q) => {
      if (q.type === "section_divider") {
        if (currentQuestions.length > 0 || currentDivider) {
          result.push({ divider: currentDivider, questions: currentQuestions });
        }
        currentDivider = q;
        currentQuestions = [];
      } else {
        currentQuestions.push(q);
      }
    });

    result.push({ divider: currentDivider, questions: currentQuestions });
    return result;
  }, [form.questions]);

  const totalSections = sections.length;
  const currentSection = sections[currentSectionIndex];

  const ordered = form.questions.slice().sort((a, b) => a.order - b.order);

  const handleNext = async () => {
    const currentQuestionIds = currentSection.questions
      .filter((q) => q.type !== "paragraph")
      .map((q) => q.id);

    const isValid = await methods.trigger(currentQuestionIds);
    if (isValid) {
      setCurrentSectionIndex((prev) => Math.min(prev + 1, totalSections - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      for (const questionId of currentQuestionIds) {
        const fieldState = methods.getFieldState(questionId);
        if (fieldState.error) {
          const element = document.getElementById(`question-${questionId}`);
          if (element) {
            element.focus();
            const y =
              element.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: "smooth" });
            break;
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

  const onSubmit = (data: Record<string, unknown>) => {
    if (currentSectionIndex < totalSections - 1) {
      handleNext();
      return;
    }
    const answers = toAnswers(ordered, data);
    submitResponse(formId, answers);
    methods.reset(built.defaultValues);
    setCurrentSectionIndex(0);
    setSubmitted(true);
  };

  const onInvalid = () => {
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

  const progressPercentage =
    totalSections > 1 ? (currentSectionIndex / (totalSections - 1)) * 100 : 100;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      <PreviewTopBar
        formId={formId}
        formStatus={form.status}
        formTitle={form.title}
        onManagePublish={() => setPublishDecisionDialogOpen(true)}
      />
      <PublishDecisionDialog
        open={publishDecisionDialogOpen}
        onClose={() => setPublishDecisionDialogOpen(false)}
        formId={formId}
        formStatus={form.status}
        onStatusChange={(status) => updateFormMeta(formId, { status })}
        onOpenManage={() => {
          setPublishDecisionDialogOpen(false);
          setShareDialogOpen(true);
        }}
        onPublish={() => {
          updateFormMeta(formId, { status: FormStatus.PUBLISHED });
          setPublishDecisionDialogOpen(false);
        }}
      />
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        formId={formId}
        formStatus={form.status}
        onStatusChange={(status) => updateFormMeta(formId, { status })}
        formTitle={form.title}
      />

      <Box sx={{ flexGrow: 1, py: 4, px: 2 }}>
        <Box
          sx={{
            maxWidth: 860,
            mx: "auto",
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {submitted ? (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Response recorded.
              </Alert>
              <Button
                variant="contained"
                onClick={() => router.push(`/forms/${formId}/responses`)}
              >
                View responses
              </Button>
              <Button sx={{ ml: 1 }} onClick={() => setSubmitted(false)}>
                Submit another response
              </Button>
            </Paper>
          ) : (
            <FormProvider {...methods}>
              <form
                onSubmit={methods.handleSubmit(onSubmit, onInvalid)}
                noValidate
              >
                <Stack spacing={2}>
                  {currentSectionIndex === 0 ? (
                    <FormHeader form={form} />
                  ) : currentSection.divider ? (
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
                  ) : null}

                  {currentSection.questions.map((q) => (
                    <QuestionRenderer key={q.id} question={q} />
                  ))}

                  <Box sx={{ mt: "auto", pt: 4 }}>
                    {totalSections > 1 && (
                      <Box sx={{ mb: 3 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progressPercentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            mb: 1,
                          }}
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
                            variant="contained"
                            onClick={handleNext}
                            sx={{ px: 4 }}
                          >
                            Next
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            variant="contained"
                            sx={{ px: 4 }}
                          >
                            Submit
                          </Button>
                        )}
                      </Box>
                      <Button color="primary" onClick={handleClear}>
                        Clear form
                      </Button>
                    </Box>
                  </Box>
                </Stack>
              </form>
            </FormProvider>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          py: 4,
          px: 2,
          textAlign: "center",
          color: "text.secondary",
          mt: "auto",
        }}
      >
        <Typography variant="caption" display="block" sx={{ mb: 2 }}>
          This content is neither created nor endorsed by AI Form.
        </Typography>
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", color: "text.secondary" }}
        >
          AI Form
        </Typography>
      </Box>

      <Tooltip title="Edit this form" placement="left">
        <Fab
          color="primary"
          aria-label="edit"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            bgcolor: "background.paper",
            color: "text.primary",
            "&:hover": { bgcolor: "action.hover" },
          }}
          onClick={() => router.push(`/forms/${formId}/edit`)}
        >
          <EditIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}
