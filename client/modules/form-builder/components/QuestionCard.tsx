"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
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
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import React from "react";
import { QUESTION_TYPE_META } from "@/shared/constants/question-types";
import { createQuestionByType } from "@/shared/constants/defaults";
import type { Question, QuestionType, Form } from "@/shared/types/forms";
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
import { OptionsQuestionSection } from "./OptionsQuestionSection";
import { useAiChatContext } from "../context/AiChatContext";
import {
  buildQuestionDiffFields,
  diffText,
  type DiffToken,
  type QuestionDiffSnapshot,
} from "./questionDiff";
import Button from "@mui/material/Button";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import TextHTMLDisplayer from "@/shared/components/TextHTMLDisplayer";

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

function getTokenSx(kind: DiffToken["kind"]) {
  if (kind === "added") {
    return {
      bgcolor: "success.100",
      color: "success.dark",
    };
  }
  if (kind === "removed") {
    return {
      bgcolor: "error.100",
      color: "error.dark",
      textDecoration: "line-through",
    };
  }
  return {};
}

function renderDiffText(tokens: DiffToken[]) {
  if (tokens.length === 0) {
    return <TextHTMLDisplayer html="Empty" className="text-gray-500!" />;
  }

  return tokens.map((token, idx) => (
    <Box
      component="span"
      key={`${token.kind}-${idx}-${token.value.slice(0, 8)}`}
      sx={{
        ...getTokenSx(token.kind),
        borderRadius: 0.5,
        px: token.kind === "unchanged" ? 0 : 0.25,
        py: token.kind === "unchanged" ? 0 : 0.15,
      }}
      aria-label={`${token.kind} text`}
    >
      <TextHTMLDisplayer html={token.value} />
    </Box>
  ));
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
  aiDiffState?: "add" | "update" | "delete";
  aiMessageId?: string;
  aiChangeId?: string;
  aiPendingPayload?: Partial<Question>;
  readonly?: boolean;
}

export function ReadOnlyQuestionCard(
  props: Omit<QuestionCardProps, "readonly">,
) {
  return <QuestionCard {...props} readonly />;
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
  aiDiffState,
  aiMessageId,
  aiChangeId,
  aiPendingPayload,
  readonly = false,
}: QuestionCardProps) {
  const isReadOnly = isPreview || readonly;
  const queryClient = useQueryClient();
  const setForm = useFormsStore((s) => s.setForm);

  const { handleAcceptChange, handleRejectChange } = useAiChatContext();

  const { mutate: mutateUpdateQuestion } = useAppMutation<
    { ok: boolean; question: Question },
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
    onError: (err, _variables, context) => {
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
      if (isReadOnly) return;
      setPendingUpdates((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    [isReadOnly],
  );

  // Merge pending updates into the question to ensure controlled inputs update instantly
  const displayQuestion = React.useMemo(
    () =>
      ({
        ...question,
        ...aiPendingPayload,
        ...pendingUpdates,
      }) as Question,
    [aiPendingPayload, pendingUpdates, question],
  );

  const isOptionQuestion = isOptionsQuestion(displayQuestion);

  const optionLabel =
    "options" in displayQuestion && Array.isArray(displayQuestion.options)
      ? displayQuestion.options
      : undefined;

  const typeLabel =
    QUESTION_TYPE_META.find((m) => m.type === displayQuestion.type)?.label ??
    displayQuestion.type;
  const isSectionDivider = displayQuestion.type === "section_divider";
  const isRichTextEditable =
    displayQuestion.type === "section_divider" ||
    displayQuestion.type === "paragraph";
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isDiffMode = aiDiffState !== "add";
  const [isDiffOpen, setIsDiffOpen] = React.useState(isDiffMode);

  React.useEffect(() => {
    setIsDiffOpen(isDiffMode);
  }, [isDiffMode]);

  const originalSnapshot = React.useMemo<QuestionDiffSnapshot>(() => {
    if (!aiDiffState) return {};
    if (aiDiffState === "add") {
      return {
        label: "",
        description: "",
        placeholder: "",
        text: "",
      };
    }
    return {
      label: question.label ?? "",
      description: question.description ?? "",
      placeholder:
        "placeholder" in question ? (question.placeholder ?? "") : "",
      text: "text" in question ? (question.text ?? "") : "",
    };
  }, [aiDiffState, question]);

  const modifiedSnapshot = React.useMemo<QuestionDiffSnapshot>(() => {
    if (!aiDiffState) return {};
    if (aiDiffState === "delete") {
      return {
        label: "",
        description: "",
        placeholder: "",
        text: "",
      };
    }
    return {
      label: displayQuestion.label ?? "",
      description: displayQuestion.description ?? "",
      placeholder:
        "placeholder" in displayQuestion
          ? (displayQuestion.placeholder ?? "")
          : "",
      text: "text" in displayQuestion ? (displayQuestion.text ?? "") : "",
    };
  }, [aiDiffState, displayQuestion]);

  const diffFields = React.useMemo(
    () => buildQuestionDiffFields(originalSnapshot, modifiedSnapshot),
    [modifiedSnapshot, originalSnapshot],
  );

  return (
    <Paper
      variant="outlined"
      onClick={isReadOnly ? undefined : onSelect}
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
        ...(aiDiffState === "add" && {
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor: "success.main",
          bgcolor: "success.50",
        }),
        ...(aiDiffState === "update" && {
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor: "warning.main",
          bgcolor: "warning.50",
        }),
        ...(aiDiffState === "delete" && {
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor: "error.main",
          bgcolor: "error.50",
          opacity: isReadOnly ? 0.4 : 0.6,
        }),
        ...(isDragging && {
          opacity: 0.3,
        }),
      }}
      data-shadow={isDragging || undefined}
    >
      {aiDiffState && aiMessageId && aiChangeId && (
        <>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              rowGap: 1,
              bgcolor:
                aiDiffState === "add"
                  ? "success.100"
                  : aiDiffState === "update"
                    ? "warning.100"
                    : "error.100",
              px: 2,
              py: 1,
              mb: 1.25,
              mx: -2.5,
              mt: -2.5,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              transition: "background-color 180ms ease",
            }}
            role="region"
            aria-label="AI diff controls"
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {aiDiffState === "add" ? (
                <PlaylistAddIcon fontSize="small" color="success" />
              ) : aiDiffState === "delete" ? (
                <RemoveCircleOutlineIcon fontSize="small" color="error" />
              ) : (
                <EditIcon fontSize="small" color="warning" />
              )}
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color:
                    aiDiffState === "add"
                      ? "success.dark"
                      : aiDiffState === "update"
                        ? "warning.dark"
                        : "error.dark",
                }}
              >
                AI {aiDiffState} diff preview
              </Typography>
              <Chip
                size="small"
                label={isDesktop ? "Side-by-side" : "Inline"}
                sx={{ fontWeight: 600 }}
                aria-label={`Diff layout ${isDesktop ? "side by side" : "inline"}`}
              />
            </Box>
            {aiDiffState && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {isDiffMode && (
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDiffOpen((prev) => !prev);
                    }}
                    aria-expanded={isDiffOpen}
                    aria-label={
                      isDiffOpen ? "Hide diff details" : "Show diff details"
                    }
                    sx={{ textTransform: "none" }}
                  >
                    {isDiffOpen ? "Hide Diff" : "Show Diff"}
                  </Button>
                )}
                <Button
                  size="small"
                  variant="contained"
                  color={"success"}
                  startIcon={<CheckIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcceptChange(aiMessageId, aiChangeId);
                  }}
                  sx={{ textTransform: "none", boxShadow: "none" }}
                  aria-label="Accept AI change"
                >
                  Accept
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color={"error"}
                  startIcon={<CloseIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRejectChange(aiMessageId, aiChangeId);
                  }}
                  sx={{ textTransform: "none", bgcolor: "background.paper" }}
                  aria-label="Reject AI change"
                >
                  Reject
                </Button>
              </Box>
            )}
          </Box>
          <Collapse
            in={isDiffOpen}
            timeout={220}
            unmountOnExit
            aria-label="Question diff details"
          >
            <Stack
              spacing={1}
              sx={{ mb: 2 }}
              role="region"
              aria-label="Question change details"
            >
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {aiDiffState === "add" && (
                  <Chip
                    size="small"
                    color="success"
                    label="Addition"
                    aria-label="Addition highlight legend"
                  />
                )}
                {aiDiffState === "delete" && (
                  <Chip
                    size="small"
                    color="error"
                    label="Deletion"
                    aria-label="Deletion highlight legend"
                  />
                )}
                {aiDiffState === "update" && (
                  <Chip
                    size="small"
                    color="warning"
                    label="Modification"
                    aria-label="Modification highlight legend"
                  />
                )}
              </Box>
              {diffFields.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No text differences detected.
                </Typography>
              ) : isDesktop ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1.25,
                    alignItems: "start",
                  }}
                >
                  <Box
                    sx={{
                      p: 1.25,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                    }}
                    aria-label="Original question values"
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      Current
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 0.75 }}>
                      {diffFields.map((field) => (
                        <Box key={`original-${field.key}`}>
                          <Typography variant="caption" color="text.secondary">
                            {field.label}
                          </Typography>

                          <TextHTMLDisplayer
                            html={field.original}
                            className="text-gray-500 line-through"
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                  <Box
                    sx={{
                      p: 1.25,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                    }}
                    aria-label="AI proposed question values"
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 700, color: "text.secondary" }}
                    >
                      AI Update
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 0.75 }}>
                      {diffFields.map((field) => (
                        <Box key={`modified-${field.key}`}>
                          <Typography variant="caption" color="text.secondary">
                            {field.label}
                          </Typography>
                          <TextHTMLDisplayer
                            html={field.modified}
                            className="text-green-600"
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {diffFields.map((field) => (
                    <Box
                      key={`inline-${field.key}`}
                      sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1.5,
                        p: 1.25,
                      }}
                      aria-label={`${field.label} inline diff`}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {field.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}
                      >
                        {renderDiffText(
                          diffText(field.original, field.modified),
                        )}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </Collapse>
        </>
      )}
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
            sx={{ cursor: dragHandleRef && !isReadOnly ? "grab" : "default" }}
            disabled={isReadOnly}
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
            disabled={isReadOnly}
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
            readOnly={isReadOnly}
          />
        ) : (
          <TextField
            variant="standard"
            value={displayQuestion.label}
            onChange={(e) => queueQuestionUpdate({ label: e.target.value })}
            placeholder="Question"
            InputProps={{
              sx: { fontSize: 18, fontWeight: 650 },
              readOnly: isReadOnly,
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
            readOnly={isReadOnly}
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
            InputProps={{ sx: { fontSize: 13 }, readOnly: isReadOnly }}
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
            InputProps={{ readOnly: isReadOnly }}
          />
        ) : null}

        {isOptionQuestion && (
          <OptionsQuestionSection
            questionId={displayQuestion.id}
            initialOptions={optionLabel}
            readonly={isReadOnly}
          />
        )}

        {displayQuestion.type === "paragraph" ? (
          <RichTextEditor
            value={displayQuestion.text ?? ""}
            onChange={(value) => queueQuestionUpdate({ text: value })}
            placeholder="Text"
            allowLists={true}
            fontSize={14}
            readOnly={isReadOnly}
          />
        ) : null}

        {displayQuestion.type === "rating" ? (
          <TextField
            size="small"
            variant="outlined"
            type="number"
            inputProps={{ min: 2, max: 10, readOnly: isReadOnly }}
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
              inputProps={{ min: 0, max: 9, readOnly: isReadOnly }}
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
              inputProps={{ min: 1, max: 10, readOnly: isReadOnly }}
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
              InputProps={{ readOnly: isReadOnly }}
            />
            <TextField
              size="small"
              variant="outlined"
              value={displayQuestion.noLabel ?? "No"}
              onChange={(e) => queueQuestionUpdate({ noLabel: e.target.value })}
              label="No label"
              fullWidth
              InputProps={{ readOnly: isReadOnly }}
            />
          </Box>
        ) : null}
      </Stack>

      {!isReadOnly && (
        <>
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
                onClick={() =>
                  duplicateQuestionMutation.mutate(displayQuestion.id)
                }
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isDeletable && (
              <Tooltip title="Delete question" placement="top">
                <IconButton
                  aria-label="Delete"
                  onClick={() =>
                    deleteQuestionMutation.mutate(displayQuestion.id)
                  }
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
                    />
                  }
                  label="Required"
                />
              </>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}
