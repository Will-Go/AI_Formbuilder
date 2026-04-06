"use client";

import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

import { createQuestionByType } from "@/constants/defaults";
import type { Question, QuestionType, Form } from "@/shared/types/forms";
import FormHeaderCard from "./FormHeaderCard";
import QuestionCard from "./QuestionCard";

function getQuestionContainerSx(question: Question) {
  return {
    py: question.type === "section_divider" ? 1.5 : 0,
    px: question.type === "section_divider" ? 0.5 : 0,
    borderTop: question.type === "section_divider" ? "1px solid" : "none",
    borderBottom: question.type === "section_divider" ? "1px solid" : "none",
    borderColor:
      question.type === "section_divider" ? "divider" : "transparent",
  };
}

function getPreviewContainerSx(question: Question) {
  return {
    py: question.type === "section_divider" ? 1.5 : 0,
    px: question.type === "section_divider" ? 0.5 : 0,
    borderTop: question.type === "section_divider" ? "1px dashed" : "none",
    borderBottom: question.type === "section_divider" ? "1px dashed" : "none",
    borderColor: "primary.light",
  };
}

function SortableQuestionItem({
  question,
  index,
  selected,
  onSelect,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
}: {
  question: Question;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onUpdateQuestion: (
    questionId: string,
    updates: Record<string, unknown>,
  ) => void;
  onDeleteQuestion: (questionId: string) => void;
  onDuplicateQuestion: (questionId: string) => void;
}) {
  const [element, setElement] = React.useState<Element | null>(null);
  const handleRef = React.useRef<HTMLButtonElement | null>(null);
  const { isDragging } = useSortable({
    id: question.id,
    index,
    element,
    handle: handleRef,
    data: {
      source: "canvas-question",
      questionId: question.id,
      index,
    },
  });

  return (
    <Box
      ref={setElement}
      sx={getQuestionContainerSx(question)}
      data-shadow={isDragging || undefined}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{
          opacity: 0,
          scale: 0.95,
          height: 0,
          marginTop: 0,
          marginBottom: 0,
          overflow: "hidden",
        }}
        transition={{ duration: 0.2 }}
      >
        <QuestionCard
          question={question}
          selected={selected}
          onSelect={onSelect}
          onUpdateQuestion={onUpdateQuestion}
          onDeleteQuestion={onDeleteQuestion}
          onDuplicateQuestion={onDuplicateQuestion}
          isDragging={isDragging}
          dragHandleRef={handleRef}
        />
      </motion.div>
    </Box>
  );
}

function CanvasDropSlot({
  index,
  active,
  highlighted,
}: {
  index: number;
  active: boolean;
  highlighted: boolean;
}) {
  const { ref, isDropTarget } = useDroppable({
    id: `canvas-slot:${index}`,

    data: {
      dropType: "canvas-slot",
      index,
    },
  });

  return (
    <Box
      ref={ref}
      aria-hidden
      sx={{
        height: active ? 10 : 0,
        my: active ? 0.5 : 0,
        borderRadius: 999,
        bgcolor: isDropTarget || highlighted ? "primary.main" : "transparent",
        opacity: active ? 1 : 0,
        transition: "all 120ms ease",
        pointerEvents: active ? "auto" : "none",
      }}
    />
  );
}

function CanvasPreviewSlot({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const { ref } = useDroppable({
    id: `preview-slot:${index}`,
    data: {
      dropType: "preview-slot",
      index,
    },
  });

  return <Box ref={ref}>{children}</Box>;
}

interface CanvasProps {
  form: Form;
  formId: string;
  selectedQuestionId: string | null;
  paletteDragType: QuestionType | null;
  dropIndex: number | null;
  isCanvasOver: boolean;
  isInvalidDrop: boolean;
  onAddQuestion: (type: QuestionType) => void;
  onSelectQuestion: (questionId: string) => void;
  onUpdateQuestion: (
    questionId: string,
    updates: Record<string, unknown>,
  ) => void;
  onDeleteQuestion: (questionId: string) => void;
  onDuplicateQuestion: (questionId: string) => void;
  onUpdateFormMeta: (updates: Partial<Form>) => void;
}

export default function Canvas({
  form,
  formId,
  selectedQuestionId,
  paletteDragType,
  dropIndex,
  isCanvasOver,
  isInvalidDrop,
  onAddQuestion,
  onSelectQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onDuplicateQuestion,
  onUpdateFormMeta,
}: CanvasProps) {
  const { ref: setCanvasDropRef } = useDroppable({
    id: `canvas-drop:${formId}`,
    data: {
      dropType: "canvas-container",
    },
  });

  const previewQuestion = React.useMemo(() => {
    if (paletteDragType && dropIndex !== null && !isInvalidDrop) {
      return createQuestionByType(paletteDragType, dropIndex);
    }
    return null;
  }, [paletteDragType, dropIndex, isInvalidDrop]);

  if (!form) return null;

  const ordered = form.questions.slice().sort((a, b) => a.order - b.order);

  return (
    <Box sx={{ position: "relative" }}>
      <Box sx={{ maxWidth: 860, mx: "auto" }}>
        <FormHeaderCard form={form} onUpdateFormMeta={onUpdateFormMeta} />
        <Box sx={{ height: 16 }} />
        <Box
          ref={setCanvasDropRef}
          sx={{
            borderRadius: 2,
            p: 1,
            border: "1px dashed",
            borderColor: isInvalidDrop
              ? "error.main"
              : isCanvasOver
                ? "primary.main"
                : "transparent",
            bgcolor: isCanvasOver ? "primary.50" : "transparent",
            transition: "all 160ms ease",
          }}
          aria-label="Form canvas drop zone"
          aria-live="polite"
          aria-invalid={isInvalidDrop}
        >
          <CanvasDropSlot
            index={0}
            active={paletteDragType !== null}
            highlighted={dropIndex === 0 && !previewQuestion}
          />
          <Stack spacing={2}>
            <AnimatePresence initial={false} mode="popLayout">
              {dropIndex === 0 && previewQuestion ? (
                <motion.div
                  key="preview-0"
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    height: 0,
                    marginTop: 0,
                    marginBottom: 0,
                    overflow: "hidden",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Box sx={getPreviewContainerSx(previewQuestion)}>
                    <CanvasPreviewSlot index={0}>
                      <QuestionCard
                        question={previewQuestion}
                        selected={false}
                        onSelect={() => {}}
                        onUpdateQuestion={() => {}}
                        onDeleteQuestion={() => {}}
                        onDuplicateQuestion={() => {}}
                        isPreview
                      />
                    </CanvasPreviewSlot>
                  </Box>
                </motion.div>
              ) : null}

              {ordered.map((q, idx) => (
                <React.Fragment key={q.id}>
                  <SortableQuestionItem
                    question={q}
                    index={idx}
                    selected={q.id === selectedQuestionId}
                    onSelect={() => onSelectQuestion(q.id)}
                    onUpdateQuestion={onUpdateQuestion}
                    onDeleteQuestion={onDeleteQuestion}
                    onDuplicateQuestion={onDuplicateQuestion}
                  />
                  <CanvasDropSlot
                    index={idx + 1}
                    active={paletteDragType !== null}
                    highlighted={dropIndex === idx + 1 && !previewQuestion}
                  />
                  {dropIndex === idx + 1 && previewQuestion ? (
                    <motion.div
                      key={`preview-${idx + 1}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        height: 0,
                        marginTop: 0,
                        marginBottom: 0,
                        overflow: "hidden",
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <Box sx={getPreviewContainerSx(previewQuestion)}>
                        <CanvasPreviewSlot index={idx + 1}>
                          <QuestionCard
                            question={previewQuestion}
                            selected={false}
                            onSelect={() => {}}
                            onUpdateQuestion={() => {}}
                            onDeleteQuestion={() => {}}
                            onDuplicateQuestion={() => {}}
                            isPreview
                          />
                        </CanvasPreviewSlot>
                      </Box>
                    </motion.div>
                  ) : null}
                </React.Fragment>
              ))}
            </AnimatePresence>
          </Stack>
          {paletteDragType !== null ? (
            <Box
              sx={{
                mt: 1,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: 12,
                color: isInvalidDrop ? "error.main" : "text.secondary",
                bgcolor: isInvalidDrop ? "error.50" : "grey.100",
              }}
            >
              {isInvalidDrop
                ? "Drop outside canvas is not allowed"
                : "Release to add this field to the highlighted position"}
            </Box>
          ) : null}
        </Box>
      </Box>
      <Paper
        variant="outlined"
        sx={{
          position: "sticky",
          top: 140,
          ml: { md: 2 },
          mt: 2,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          alignItems: "center",
          p: 1,
          borderRadius: 100,
          float: "right",
        }}
      >
        <Tooltip title="Add question" placement="left">
          <IconButton
            size="small"
            onClick={() => onAddQuestion("short_text")}
            aria-label="Add question"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
}
