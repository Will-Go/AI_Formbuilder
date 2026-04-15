"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import React from "react";
import { QUESTION_TYPE_META } from "@/constants/question-types";
import { createQuestionByType } from "@/constants/defaults";
import type {
  Option,
  Question,
  QuestionType,
  Form,
} from "@/shared/types/forms";
import { createId } from "@/shared/utils/id";
import RichTextEditor from "@/shared/components/RichTextEditor";
import { useQueryClient } from "@tanstack/react-query";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";
import { notifyError } from "@/shared/utils/toastNotify";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { FORM_DETAILS_QUERY_KEY } from "../pages/FormBuilderPage";
import {
  optimisticDeleteQuestion,
  optimisticDuplicateQuestion,
  optimisticUpdateQuestion,
} from "../utils/formOptimisticUpdates";
import { isOptionsQuestion, hasRequiredQuestion } from "../utils/questionUtils";
import { Button } from "@mui/material";

function preserveCommonFields(prev: Question, next: Question): Question {
  return {
    ...next,
    id: prev.id,
    label: prev.label,
    description: prev.description,
    required: prev.required,
    order: prev.order,
    logic: prev.logic,
  };
}

interface QuestionCardProps {
  question: Question;
  formId: string;
  selected: boolean;
  onSelect: () => void;
  isPreview?: boolean;
  isDragging?: boolean;
  dragHandleRef?: React.Ref<HTMLButtonElement>;
  isDeletable?: boolean;
}

export default function QuestionCard({
  question,
  formId,
  selected,
  onSelect,
  isPreview,
  isDragging,
  dragHandleRef,
  isDeletable = true,
}: QuestionCardProps) {
  const queryClient = useQueryClient();
  const setForm = useFormsStore((s) => s.setForm);

  const { mutate: mutateUpdateQuestion } = useAppMutation<
    unknown,
    Error,
    { questionId: string; updates: Record<string, unknown> },
    { previousForm?: Form }
  >({
    mutationKey: ["form-builder", "update-question", formId, question.id],
    mutationFn: async ({ questionId, updates }) => {
      return apiRequest({
        method: "patch",
        url: `/form/${formId}/questions/${questionId}`,
        data: updates,
      });
    },
    onMutate: async ({ questionId, updates }) => {
      await queryClient.cancelQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });

      const previousForm = queryClient.getQueryData<Form>([
        ...FORM_DETAILS_QUERY_KEY,
        formId,
      ]);

      if (previousForm) {
        const nextForm = optimisticUpdateQuestion(
          previousForm,
          questionId,
          updates,
        );
        queryClient.setQueryData<Form>(
          [...FORM_DETAILS_QUERY_KEY, formId],
          nextForm,
        );
      }

      return { previousForm };
    },
    onError: (err, { questionId }, context) => {
      if (context?.previousForm) {
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          context.previousForm,
        );
      }
    },
    errorMsg: "Failed to update question",
  });

  const deleteQuestionMutation = useAppMutation<
    unknown,
    Error,
    string,
    { previousForm?: Form }
  >({
    mutationKey: ["form-builder", "delete-question", formId, question.id],
    mutationFn: async (questionId) => {
      return apiRequest({
        method: "delete",
        url: `/form/${formId}/questions/${questionId}`,
      });
    },
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
      const previousForm = queryClient.getQueryData<Form>([
        ...FORM_DETAILS_QUERY_KEY,
        formId,
      ]);
      if (previousForm) {
        const nextForm = optimisticDeleteQuestion(previousForm, questionId);
        setForm(nextForm);
        queryClient.setQueryData([...FORM_DETAILS_QUERY_KEY, formId], nextForm);
      }
      return { previousForm };
    },
    onError: (err, questionId, context) => {
      notifyError(`Failed to delete question: ${err.message}`);
      if (context?.previousForm) {
        setForm(context.previousForm);
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          context.previousForm,
        );
      }
    },
    errorMsg: "Failed to delete question",
  });

  const duplicateQuestionMutation = useAppMutation<
    Form,
    Error,
    string,
    { previousForm?: Form }
  >({
    mutationKey: ["form-builder", "duplicate-question", formId, question.id],
    mutationFn: async (questionId) => {
      return apiRequest({
        method: "post",
        url: `/form/${formId}/questions/${questionId}/duplicate`,
      });
    },
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
      const previousForm = queryClient.getQueryData<Form>([
        ...FORM_DETAILS_QUERY_KEY,
        formId,
      ]);
      if (previousForm) {
        const nextForm = optimisticDuplicateQuestion(previousForm, questionId);
        setForm(nextForm);
        queryClient.setQueryData([...FORM_DETAILS_QUERY_KEY, formId], nextForm);
      }
      return { previousForm };
    },
    onError: (err, questionId, context) => {
      notifyError(`Failed to duplicate question: ${err.message}`);
      if (context?.previousForm) {
        setForm(context.previousForm);
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          context.previousForm,
        );
      }
    },
    onSuccess: (updatedForm) => {
      if (updatedForm) {
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          updatedForm,
        );
      }
    },
    errorMsg: "Failed to duplicate question",
  });

  const [pendingUpdates, setPendingUpdates] = React.useState<
    Record<string, unknown>
  >({});
  const debouncedUpdates = useDebouncedValue(pendingUpdates, 500);

  React.useEffect(() => {
    if (Object.keys(debouncedUpdates).length === 0) return;
    if (isPreview) return;

    mutateUpdateQuestion({
      questionId: question.id,
      updates: debouncedUpdates,
    });
    setPendingUpdates({});
  }, [debouncedUpdates, mutateUpdateQuestion, question.id, isPreview]);

  const queueQuestionUpdate = React.useCallback(
    (updates: Record<string, unknown>) => {
      if (isPreview) return;
      setPendingUpdates((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    [isPreview],
  );

  // Merge pending updates into the question to ensure controlled inputs update instantly
  const displayQuestion = { ...question, ...pendingUpdates } as Question;

  const isOptionQuestion = isOptionsQuestion(displayQuestion);

  const optionLabel =
    "options" in displayQuestion && Array.isArray(displayQuestion.options)
      ? displayQuestion.options
      : null;

  const typeLabel =
    QUESTION_TYPE_META.find((m) => m.type === displayQuestion.type)?.label ??
    displayQuestion.type;
  const isSectionDivider = displayQuestion.type === "section_divider";
  const isRichTextEditable =
    displayQuestion.type === "section_divider" ||
    displayQuestion.type === "paragraph";

  const addOptionMutation = useAppMutation<
    { ok: boolean; question: Question },
    Error,
    { questionId: string },
    { previousForm?: Form }
  >({
    mutationKey: ["form-builder", "add-option", formId, question.id],
    mutationFn: async ({ questionId }) => {
      if (!("options" in displayQuestion)) {
        throw new Error("Question does not support options");
      }

      const nextOpt: Option = {
        id: createId("opt"),
        label: `Option ${displayQuestion.options.length + 1}`,
        value: `option_${displayQuestion.options.length + 1}`,
        order: displayQuestion.options.length,
      };

      return apiRequest({
        method: "patch",
        url: `/form/${formId}/questions/${questionId}`,
        data: { options: [...displayQuestion.options, nextOpt] },
      });
    },
    onMutate: async ({ questionId }) => {
      await queryClient.cancelQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });

      const previousForm = queryClient.getQueryData<Form>([
        ...FORM_DETAILS_QUERY_KEY,
        formId,
      ]);

      if (previousForm && "options" in displayQuestion) {
        const nextOpt: Option = {
          id: createId("opt"),
          label: `Option ${displayQuestion.options.length + 1}`,
          value: `option_${displayQuestion.options.length + 1}`,
          order: displayQuestion.options.length,
        };

        const nextForm = optimisticUpdateQuestion(previousForm, questionId, {
          options: [...displayQuestion.options, nextOpt],
        });
        queryClient.setQueryData<Form>(
          [...FORM_DETAILS_QUERY_KEY, formId],
          nextForm,
        );
      }

      return { previousForm };
    },
    onError: (err, { questionId }, context) => {
      notifyError(`Failed to add option: ${err.message}`);
      if (context?.previousForm) {
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          context.previousForm,
        );
      }
    },
    onSuccess: (res, { questionId }) => {
      if (res.ok && res.question) {
        queryClient.setQueryData<Form>(
          [...FORM_DETAILS_QUERY_KEY, formId],
          (old) => {
            if (!old) return old;
            return optimisticUpdateQuestion(old, questionId, res.question);
          },
        );
      }
    },
    errorMsg: "Failed to add option",
  });

  const addOption = () => {
    if (!("options" in displayQuestion) || isPreview) return;
    addOptionMutation.mutate({ questionId: question.id });
  };

  const updateOption = (optId: string, label: string) => {
    if (!("options" in displayQuestion) || isPreview) return;
    queueQuestionUpdate({
      options: displayQuestion.options.map((o) =>
        o.id === optId ? { ...o, label } : o,
      ),
    });
  };

  const deleteOption = (optId: string) => {
    if (!("options" in displayQuestion) || isPreview) return;
    mutateUpdateQuestion({
      questionId: question.id,
      updates: {
        options: displayQuestion.options.filter((o) => o.id !== optId),
      },
    });
  };

  return (
    <Paper
      variant="outlined"
      onClick={isPreview ? undefined : onSelect}
      sx={{
        p: isSectionDivider ? 3 : 2.5,
        position: "relative",
        borderLeft: isSectionDivider ? 6 : selected ? 5 : 1,
        borderLeftColor: isSectionDivider
          ? selected
            ? "primary.dark"
            : "primary.main"
          : selected
            ? "primary.main"
            : "divider",
        borderColor: isSectionDivider ? "primary.light" : "divider",
        bgcolor: isSectionDivider ? "primary.50" : "background.paper",
        borderRadius: isSectionDivider ? 2.5 : 2,
        boxShadow: isSectionDivider
          ? "inset 0 0 0 1px rgba(25, 118, 210, 0.08)"
          : "none",
        "&:focus-within": {
          borderLeftWidth: isSectionDivider ? 6 : 5,
          borderLeftColor: isSectionDivider ? "primary.dark" : "primary.main",
        },
        ...(isPreview && {
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor: "primary.main",
          opacity: 0.6,
          pointerEvents: "none",
        }),
        ...(isDragging && {
          opacity: 0.3,
        }),
      }}
      data-shadow={isDragging || undefined}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: isSectionDivider ? 2.5 : 2,
        }}
      >
        <Tooltip title="Drag to reorder" placement="top">
          <IconButton
            ref={dragHandleRef}
            aria-label="Drag"
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            sx={{ cursor: dragHandleRef ? "grab" : "default" }}
          >
            <DragIndicatorIcon
              sx={{ color: "text.disabled" }}
              fontSize="small"
            />
          </IconButton>
        </Tooltip>
        <Typography
          variant="caption"
          color={isSectionDivider ? "primary.main" : "text.secondary"}
          sx={{
            fontWeight: isSectionDivider ? 800 : 700,
            textTransform: isSectionDivider ? "uppercase" : "none",
            letterSpacing: isSectionDivider ? 0.8 : 0,
            px: isSectionDivider ? 1 : 0,
            py: isSectionDivider ? 0.35 : 0,
            borderRadius: isSectionDivider ? 1 : 0,
            bgcolor: isSectionDivider
              ? "rgba(25, 118, 210, 0.08)"
              : "transparent",
          }}
        >
          {typeLabel}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <FormControl size="small">
          <Select
            value={displayQuestion.type}
            onChange={(e) => {
              if (isPreview) return;
              const nextType = e.target.value as QuestionType;
              const next = createQuestionByType(
                nextType,
                displayQuestion.order,
              );
              mutateUpdateQuestion({
                questionId: displayQuestion.id,
                updates: preserveCommonFields(displayQuestion, next),
              });
            }}
            sx={{ minWidth: 180 }}
            disabled={isPreview}
            renderValue={(selected) => {
              const meta = QUESTION_TYPE_META.find((m) => m.type === selected);
              const Icon = meta?.icon;
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {Icon && (
                    <Icon fontSize="small" sx={{ color: "text.secondary" }} />
                  )}
                  <Typography variant="body2">{meta?.label}</Typography>
                </Box>
              );
            }}
          >
            {QUESTION_TYPE_META.map((m) => {
              const Icon = m.icon;
              return (
                <MenuItem key={m.type} value={m.type}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      width: "100%",
                    }}
                  >
                    {Icon && (
                      <Icon fontSize="small" sx={{ color: "text.secondary" }} />
                    )}
                    <Typography variant="body2">{m.label}</Typography>
                  </Box>
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      <Stack spacing={isSectionDivider ? 2 : 1.5}>
        {isRichTextEditable ? (
          <RichTextEditor
            value={displayQuestion.label}
            onChange={(value) => queueQuestionUpdate({ label: value })}
            placeholder={isSectionDivider ? "Section title" : "Question"}
            allowLists={false}
            fontSize={isSectionDivider ? 22 : 18}
            fontWeight={isSectionDivider ? 700 : 650}
          />
        ) : (
          <TextField
            variant="standard"
            value={displayQuestion.label}
            onChange={(e) => queueQuestionUpdate({ label: e.target.value })}
            placeholder="Question"
            InputProps={{
              sx: { fontSize: 18, fontWeight: 650 },
              readOnly: isPreview,
            }}
          />
        )}
        {isRichTextEditable ? (
          <RichTextEditor
            value={displayQuestion.description ?? ""}
            onChange={(value) => queueQuestionUpdate({ description: value })}
            placeholder={
              isSectionDivider
                ? "Section description (optional)"
                : "Description (optional)"
            }
            allowLists={true}
            fontSize={13}
          />
        ) : (
          <TextField
            variant="standard"
            value={displayQuestion.description ?? ""}
            onChange={(e) =>
              queueQuestionUpdate({ description: e.target.value })
            }
            placeholder="Description (optional)"
            multiline
            InputProps={{ sx: { fontSize: 13 }, readOnly: isPreview }}
          />
        )}

        {"placeholder" in displayQuestion ? (
          <TextField
            variant="outlined"
            size="small"
            value={displayQuestion.placeholder ?? ""}
            onChange={(e) =>
              queueQuestionUpdate({ placeholder: e.target.value })
            }
            placeholder="Placeholder"
            InputProps={{ readOnly: isPreview }}
          />
        ) : null}

        {isOptionQuestion && optionLabel ? (
          <Box sx={{ mt: 1 }}>
            <Stack spacing={1}>
              {optionLabel.map((o, idx) => (
                <Box
                  key={o.id}
                  sx={{ display: "flex", gap: 1, alignItems: "center" }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ width: 24 }}
                  >
                    {idx + 1}.
                  </Typography>
                  <TextField
                    size="small"
                    variant="outlined"
                    value={o.label}
                    onChange={(e) => updateOption(o.id, e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: isPreview }}
                  />

                  <Tooltip title="Delete option" placement="top">
                    <IconButton
                      aria-label="Delete option"
                      onClick={() => deleteOption(o.id)}
                      disabled={isPreview}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
              <Box>
                <Button
                  variant="text"
                  size="small"
                  startIcon={<AddIcon fontSize="small" />}
                  onClick={addOption}
                  disabled={isPreview}
                >
                  <Typography
                    component="span"
                    variant="body2"
                    color="primary.main"
                    sx={{ ml: 0.5 }}
                  >
                    Add option
                  </Typography>
                </Button>
              </Box>
            </Stack>
          </Box>
        ) : null}

        {displayQuestion.type === "paragraph" ? (
          <RichTextEditor
            value={displayQuestion.text ?? ""}
            onChange={(value) => queueQuestionUpdate({ text: value })}
            placeholder="Text"
            allowLists={true}
            fontSize={14}
          />
        ) : null}

        {displayQuestion.type === "rating" ? (
          <TextField
            size="small"
            variant="outlined"
            type="number"
            inputProps={{ min: 2, max: 10, readOnly: isPreview }}
            value={displayQuestion.max}
            onChange={(e) => {
              const max = Number(e.target.value);
              queueQuestionUpdate({
                max: Number.isFinite(max)
                  ? Math.max(2, Math.min(10, max))
                  : displayQuestion.max,
              });
            }}
            label="Max rating"
          />
        ) : null}

        {displayQuestion.type === "linear_scale" ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              variant="outlined"
              type="number"
              value={displayQuestion.min}
              inputProps={{ min: 0, max: 9, readOnly: isPreview }}
              onChange={(e) => {
                const min = Number(e.target.value);
                if (Number.isFinite(min)) {
                  queueQuestionUpdate({
                    min: Math.max(0, Math.min(9, min)),
                  });
                }
              }}
              label="Min"
              fullWidth
            />
            <TextField
              size="small"
              variant="outlined"
              type="number"
              value={displayQuestion.max}
              inputProps={{ min: 1, max: 10, readOnly: isPreview }}
              onChange={(e) => {
                const max = Number(e.target.value);
                if (Number.isFinite(max)) {
                  queueQuestionUpdate({
                    max: Math.max(displayQuestion.min + 1, Math.min(10, max)),
                  });
                }
              }}
              label="Max"
              fullWidth
            />
          </Box>
        ) : null}

        {displayQuestion.type === "yes_no" ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              variant="outlined"
              value={displayQuestion.yesLabel ?? "Yes"}
              onChange={(e) =>
                queueQuestionUpdate({ yesLabel: e.target.value })
              }
              label="Yes label"
              fullWidth
              InputProps={{ readOnly: isPreview }}
            />
            <TextField
              size="small"
              variant="outlined"
              value={displayQuestion.noLabel ?? "No"}
              onChange={(e) => queueQuestionUpdate({ noLabel: e.target.value })}
              label="No label"
              fullWidth
              InputProps={{ readOnly: isPreview }}
            />
          </Box>
        ) : null}
      </Stack>

      <Divider
        sx={{
          my: 2,
          borderColor: isSectionDivider ? "primary.light" : "divider",
        }}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
          bgcolor: isSectionDivider
            ? "rgba(25, 118, 210, 0.04)"
            : "transparent",
          borderRadius: 1.5,
          px: isSectionDivider ? 1 : 0,
          py: isSectionDivider ? 0.5 : 0,
        }}
      >
        <Tooltip title="Duplicate question" placement="top">
          <IconButton
            aria-label="Duplicate"
            onClick={() => duplicateQuestionMutation.mutate(displayQuestion.id)}
            disabled={isPreview}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {isDeletable && (
          <Tooltip title="Delete question" placement="top">
            <IconButton
              aria-label="Delete"
              onClick={() => deleteQuestionMutation.mutate(displayQuestion.id)}
              disabled={isPreview}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {hasRequiredQuestion(displayQuestion) && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={displayQuestion.required}
                  onChange={(e) =>
                    mutateUpdateQuestion({
                      questionId: displayQuestion.id,
                      updates: { required: e.target.checked },
                    })
                  }
                  disabled={isPreview}
                />
              }
              label="Required"
            />
          </>
        )}
      </Box>
    </Paper>
  );
}
