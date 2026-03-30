"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddIcon from "@mui/icons-material/Add";
import { useSortable } from "@dnd-kit/react/sortable";
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
import Typography from "@mui/material/Typography";
import React from "react";
import { QUESTION_TYPE_META } from "@/constants/question-types";
import { createQuestionByType } from "@/constants/defaults";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import type { Option, Question, QuestionType } from "@/shared/types/forms";
import { createId } from "@/shared/utils/id";
import RichTextEditor from "@/shared/components/RichTextEditor";

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
  formId: string;
  question: Question;
  selected: boolean;
  onSelect: () => void;
  index: number;
  isPreview?: boolean;
}
export default function QuestionCard({
  index,
  formId,
  question,
  selected,
  onSelect,
  isPreview,
}: QuestionCardProps) {
  const {
    ref: setRef,
    handleRef,
    isDragging,
  } = useSortable({
    id: question.id,
    index,
    disabled: isPreview,
    data: {
      source: "canvas-question",
      questionId: question.id,
      index,
    },
  });
  const updateQuestion = useFormsStore((s) => s.updateQuestion);
  const deleteQuestion = useFormsStore((s) => s.deleteQuestion);
  const duplicateQuestion = useFormsStore((s) => s.duplicateQuestion);

  const optionLabel =
    "options" in question && Array.isArray(question.options)
      ? question.options
      : null;

  const typeLabel =
    QUESTION_TYPE_META.find((m) => m.type === question.type)?.label ??
    question.type;

  const addOption = () => {
    if (!("options" in question)) return;
    updateQuestion(formId, question.id, (prev) => {
      if (!("options" in prev)) return prev;
      const nextOpt: Option = {
        id: createId("opt"),
        label: `Option ${prev.options.length + 1}`,
      };
      return { ...prev, options: [...prev.options, nextOpt] };
    });
  };

  const updateOption = (optId: string, label: string) => {
    if (!("options" in question)) return;
    updateQuestion(formId, question.id, (prev) => {
      if (!("options" in prev)) return prev;
      return {
        ...prev,
        options: prev.options.map((o) =>
          o.id === optId ? { ...o, label } : o,
        ),
      };
    });
  };

  const deleteOption = (optId: string) => {
    if (!("options" in question)) return;
    updateQuestion(formId, question.id, (prev) => {
      if (!("options" in prev)) return prev;
      return {
        ...prev,
        options: prev.options.filter((o) => o.id !== optId),
      };
    });
  };

  return (
    <Paper
      ref={isPreview ? undefined : setRef}
      variant="outlined"
      onClick={isPreview ? undefined : onSelect}
      sx={{
        p: 2.5,
        position: "relative",
        borderLeft: selected ? 5 : 1,
        borderLeftColor: selected ? "primary.main" : "divider",
        ...(isPreview && {
          borderStyle: "dashed",
          borderWidth: 2,
          borderColor: "primary.main",
          opacity: 0.6,
          pointerEvents: "none",
        }),
      }}
      data-shadow={isDragging || undefined}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton
          ref={isPreview ? undefined : handleRef}
          aria-label="Drag"
          size="small"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          sx={{ cursor: "grab" }}
        >
          <DragIndicatorIcon sx={{ color: "text.disabled" }} fontSize="small" />
        </IconButton>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          {typeLabel}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <FormControl size="small">
          <Select
            value={question.type}
            onChange={(e) => {
              const nextType = e.target.value as QuestionType;
              const next = createQuestionByType(nextType, question.order);
              updateQuestion(formId, question.id, (prev) =>
                preserveCommonFields(prev, next),
              );
            }}
            sx={{ minWidth: 180 }}
          >
            {QUESTION_TYPE_META.map((m) => (
              <MenuItem key={m.type} value={m.type}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Stack spacing={1.5}>
        {question.type === "section_divider" ||
        question.type === "paragraph" ? (
          <RichTextEditor
            value={question.label}
            onChange={(value) =>
              updateQuestion(formId, question.id, (prev) => ({
                ...prev,
                label: value,
              }))
            }
            placeholder="Question"
            allowLists={false}
            fontSize={18}
            fontWeight={650}
          />
        ) : (
          <TextField
            variant="standard"
            value={question.label}
            onChange={(e) =>
              updateQuestion(formId, question.id, (prev) => ({
                ...prev,
                label: e.target.value,
              }))
            }
            placeholder="Question"
            InputProps={{ sx: { fontSize: 18, fontWeight: 650 } }}
          />
        )}
        {question.type === "section_divider" ||
        question.type === "paragraph" ? (
          <RichTextEditor
            value={question.description ?? ""}
            onChange={(value) =>
              updateQuestion(formId, question.id, (prev) => ({
                ...prev,
                description: value,
              }))
            }
            placeholder="Description (optional)"
            allowLists={true}
            fontSize={13}
          />
        ) : (
          <TextField
            variant="standard"
            value={question.description ?? ""}
            onChange={(e) =>
              updateQuestion(formId, question.id, (prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Description (optional)"
            multiline
            InputProps={{ sx: { fontSize: 13 } }}
          />
        )}

        {"placeholder" in question ? (
          <TextField
            variant="outlined"
            size="small"
            value={question.placeholder ?? ""}
            onChange={(e) =>
              updateQuestion(formId, question.id, (prev) => {
                if (!("placeholder" in prev)) return prev;
                return { ...prev, placeholder: e.target.value };
              })
            }
            placeholder="Placeholder"
          />
        ) : null}

        {optionLabel ? (
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
                  />
                  <IconButton
                    aria-label="Delete option"
                    onClick={() => deleteOption(o.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Box>
                <IconButton aria-label="Add option" onClick={addOption}>
                  <AddIcon fontSize="small" />
                </IconButton>
                <Typography
                  component="span"
                  variant="body2"
                  color="primary.main"
                  sx={{ ml: 0.5 }}
                >
                  Add option
                </Typography>
              </Box>
            </Stack>
          </Box>
        ) : null}

        {question.type === "paragraph" ? (
          <RichTextEditor
            value={question.text ?? ""}
            onChange={(value) =>
              updateQuestion(formId, question.id, (prev) => {
                if (prev.type !== "paragraph") return prev;
                return { ...prev, text: value };
              })
            }
            placeholder="Text"
            allowLists={true}
            fontSize={14}
          />
        ) : null}

        {question.type === "rating" ? (
          <TextField
            size="small"
            variant="outlined"
            type="number"
            inputProps={{ min: 2, max: 10 }}
            value={question.max}
            onChange={(e) => {
              const max = Number(e.target.value);
              updateQuestion(formId, question.id, (prev) => {
                if (prev.type !== "rating") return prev;
                return {
                  ...prev,
                  max: Number.isFinite(max)
                    ? Math.max(2, Math.min(10, max))
                    : prev.max,
                };
              });
            }}
            label="Max rating"
          />
        ) : null}

        {question.type === "linear_scale" ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              variant="outlined"
              type="number"
              value={question.min}
              inputProps={{ min: 0, max: 9 }}
              onChange={(e) => {
                const min = Number(e.target.value);
                updateQuestion(formId, question.id, (prev) => {
                  if (prev.type !== "linear_scale") return prev;
                  if (!Number.isFinite(min)) return prev;
                  return { ...prev, min: Math.max(0, Math.min(9, min)) };
                });
              }}
              label="Min"
              fullWidth
            />
            <TextField
              size="small"
              variant="outlined"
              type="number"
              value={question.max}
              inputProps={{ min: 1, max: 10 }}
              onChange={(e) => {
                const max = Number(e.target.value);
                updateQuestion(formId, question.id, (prev) => {
                  if (prev.type !== "linear_scale") return prev;
                  if (!Number.isFinite(max)) return prev;
                  return {
                    ...prev,
                    max: Math.max(prev.min + 1, Math.min(10, max)),
                  };
                });
              }}
              label="Max"
              fullWidth
            />
          </Box>
        ) : null}

        {question.type === "yes_no" ? (
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              size="small"
              variant="outlined"
              value={question.yesLabel ?? "Yes"}
              onChange={(e) =>
                updateQuestion(formId, question.id, (prev) => {
                  if (prev.type !== "yes_no") return prev;
                  return { ...prev, yesLabel: e.target.value };
                })
              }
              label="Yes label"
              fullWidth
            />
            <TextField
              size="small"
              variant="outlined"
              value={question.noLabel ?? "No"}
              onChange={(e) =>
                updateQuestion(formId, question.id, (prev) => {
                  if (prev.type !== "yes_no") return prev;
                  return { ...prev, noLabel: e.target.value };
                })
              }
              label="No label"
              fullWidth
            />
          </Box>
        ) : null}
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
        <IconButton
          aria-label="Duplicate"
          onClick={() => duplicateQuestion(formId, question.id)}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
        <IconButton
          aria-label="Delete"
          onClick={() => deleteQuestion(formId, question.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <FormControlLabel
          control={
            <Switch
              checked={question.required}
              onChange={(e) =>
                updateQuestion(formId, question.id, (prev) => ({
                  ...prev,
                  required: e.target.checked,
                }))
              }
            />
          }
          label="Required"
        />
      </Box>
    </Paper>
  );
}
