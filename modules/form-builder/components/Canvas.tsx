"use client";

import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { useDroppable } from "@dnd-kit/react";
import { closestCenter } from "@dnd-kit/collision";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import type { QuestionType } from "@/shared/types/forms";
import FormHeaderCard from "./FormHeaderCard";
import QuestionCard from "./QuestionCard";

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
    collisionDetector: closestCenter,
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

export default function Canvas({
  formId,
  selectedQuestionId,
  paletteDragType,
  dropIndex,
  isCanvasOver,
  isInvalidDrop,
}: {
  formId: string;
  selectedQuestionId: string | null;
  paletteDragType: QuestionType | null;
  dropIndex: number | null;
  isCanvasOver: boolean;
  isInvalidDrop: boolean;
}) {
  const form = useFormsStore((s) => s.getFormById(formId));
  const addQuestion = useFormsStore((s) => s.addQuestion);
  const selectQuestion = useFormsStore((s) => s.selectQuestion);
  const { ref: setCanvasDropRef } = useDroppable({
    id: `canvas-drop:${formId}`,
    collisionDetector: closestCenter,
    data: {
      dropType: "canvas-container",
    },
  });

  if (!form) return null;

  const ordered = form.questions.slice().sort((a, b) => a.order - b.order);

  return (
    <Box sx={{ position: "relative" }}>
      <Box sx={{ maxWidth: 860, mx: "auto" }}>
        <FormHeaderCard form={form} />
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
            highlighted={dropIndex === 0}
          />
          <Stack spacing={2}>
            <AnimatePresence initial={false} mode="popLayout">
              {ordered.map((q, idx) => (
                <React.Fragment key={q.id}>
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
                      index={idx}
                      formId={formId}
                      question={q}
                      selected={q.id === selectedQuestionId}
                      onSelect={() => selectQuestion(formId, q.id)}
                    />
                  </motion.div>
                  <CanvasDropSlot
                    index={idx + 1}
                    active={paletteDragType !== null}
                    highlighted={dropIndex === idx + 1}
                  />
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
            onClick={() => addQuestion(formId, "short_text")}
            aria-label="Add question"
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
}
