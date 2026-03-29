"use client";

import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import FormHeaderCard from "./FormHeaderCard";
import QuestionCard from "./QuestionCard";
import { useDndSensors } from "../dnd/sortable";

export default function Canvas({
  formId,
  selectedQuestionId,
}: {
  formId: string;
  selectedQuestionId: string | null;
}) {
  const form = useFormsStore((s) => s.getFormById(formId));
  const addQuestion = useFormsStore((s) => s.addQuestion);
  const selectQuestion = useFormsStore((s) => s.selectQuestion);
  const reorderQuestions = useFormsStore((s) => s.reorderQuestions);
  const sensors = useDndSensors();

  if (!form) return null;

  const ordered = form.questions.slice().sort((a, b) => a.order - b.order);

  return (
    <Box sx={{ position: "relative" }}>
      <Box sx={{ maxWidth: 860, mx: "auto" }}>
        <FormHeaderCard form={form} />
        <Box sx={{ height: 16 }} />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(evt) => {
            const activeId = String(evt.active.id);
            const overId = evt.over ? String(evt.over.id) : null;
            if (!overId) return;
            reorderQuestions(formId, activeId, overId);
          }}
        >
          <SortableContext
            items={ordered.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={2}>
              <AnimatePresence initial={false} mode="popLayout">
                {ordered.map((q) => (
                  <motion.div
                    key={q.id}
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
                      formId={formId}
                      question={q}
                      selected={q.id === selectedQuestionId}
                      onSelect={() => selectQuestion(formId, q.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </Stack>
          </SortableContext>
        </DndContext>
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
