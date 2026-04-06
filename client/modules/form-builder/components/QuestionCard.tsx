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
  question: Question;
  selected: boolean;
  onSelect: () => void;
  onUpdateQuestion: (
    questionId: string,
    updates: Record<string, unknown>,
  ) => void;
  onDeleteQuestion: (questionId: string) => void;
  onDuplicateQuestion: (questionId: string) => void;
  isPreview?: boolean;
  isDragging?: boolean;
  dragHandleRef?: React.Ref<HTMLButtonElement>;
}

export default function QuestionCard({
  question,
  selected,
  onSelect,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  isPreview,
  isDragging,
  dragHandleRef,
}: QuestionCardProps) {
  const optionLabel =
    "options" in question && Array.isArray(question.options)
      ? question.options
      : null;

  const typeLabel =
    QUESTION_TYPE_META.find((m) => m.type === question.type)?.label ??
    question.type;
  const isSectionDivider = question.type === "section_divider";
  const isRichTextEditable =
    question.type === "section_divider" || question.type === "paragraph";

  const addOption = () => {
    if (!("options" in question)) return;
    const nextOpt: Option = {
      id: createId("opt"),
      label: `Option ${question.options.length + 1}`,
      value: `option_${question.options.length + 1}`,
      order: question.options.length,
    };
    onUpdateQuestion(question.id, {
      options: [...question.options, nextOpt],
    });
  };

  const updateOption = (optId: string, label: string) => {
    if (!("options" in question)) return;
    onUpdateQuestion(question.id, {
      options: question.options.map((o) =>
        o.id === optId ? { ...o, label } : o,
      ),
    });
  };

  const deleteOption = (optId: string) => {
    if (!("options" in question)) return;
    onUpdateQuestion(question.id, {
      options: question.options.filter((o) => o.id !== optId),
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
            value={question.type}
            onChange={(e) => {
              const nextType = e.target.value as QuestionType;
              const next = createQuestionByType(nextType, question.order);
              onUpdateQuestion(
                question.id,
                preserveCommonFields(question, next),
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

      <Stack spacing={isSectionDivider ? 2 : 1.5}>
        {isRichTextEditable ? (
          <RichTextEditor
            value={question.label}
            onChange={(value) =>
              onUpdateQuestion(question.id, { label: value })
            }
            placeholder={isSectionDivider ? "Section title" : "Question"}
            allowLists={false}
            fontSize={isSectionDivider ? 22 : 18}
            fontWeight={isSectionDivider ? 700 : 650}
          />
        ) : (
          <TextField
            variant="standard"
            value={question.label}
            onChange={(e) =>
              onUpdateQuestion(question.id, { label: e.target.value })
            }
            placeholder="Question"
            InputProps={{ sx: { fontSize: 18, fontWeight: 650 } }}
          />
        )}
        {isRichTextEditable ? (
          <RichTextEditor
            value={question.description ?? ""}
            onChange={(value) =>
              onUpdateQuestion(question.id, { description: value })
            }
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
            value={question.description ?? ""}
            onChange={(e) =>
              onUpdateQuestion(question.id, { description: e.target.value })
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
              onUpdateQuestion(question.id, { placeholder: e.target.value })
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
                  <Tooltip title="Delete option" placement="top">
                    <IconButton
                      aria-label="Delete option"
                      onClick={() => deleteOption(o.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
              <Box>
                <Tooltip title="Add option" placement="top">
                  <IconButton aria-label="Add option" onClick={addOption}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
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
            onChange={(value) => onUpdateQuestion(question.id, { text: value })}
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
              onUpdateQuestion(question.id, {
                max: Number.isFinite(max)
                  ? Math.max(2, Math.min(10, max))
                  : question.max,
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
                if (Number.isFinite(min)) {
                  onUpdateQuestion(question.id, {
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
              value={question.max}
              inputProps={{ min: 1, max: 10 }}
              onChange={(e) => {
                const max = Number(e.target.value);
                if (Number.isFinite(max)) {
                  onUpdateQuestion(question.id, {
                    max: Math.max(question.min + 1, Math.min(10, max)),
                  });
                }
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
                onUpdateQuestion(question.id, { yesLabel: e.target.value })
              }
              label="Yes label"
              fullWidth
            />
            <TextField
              size="small"
              variant="outlined"
              value={question.noLabel ?? "No"}
              onChange={(e) =>
                onUpdateQuestion(question.id, { noLabel: e.target.value })
              }
              label="No label"
              fullWidth
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
            onClick={() => onDuplicateQuestion(question.id)}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete question" placement="top">
          <IconButton
            aria-label="Delete"
            onClick={() => onDeleteQuestion(question.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <FormControlLabel
          control={
            <Switch
              checked={question.required}
              onChange={(e) =>
                onUpdateQuestion(question.id, { required: e.target.checked })
              }
            />
          }
          label="Required"
        />
      </Box>
    </Paper>
  );
}
