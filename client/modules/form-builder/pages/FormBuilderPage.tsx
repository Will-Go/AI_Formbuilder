"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  DragDropProvider,
  DragOverlay,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import { useParams } from "next/navigation";
import React from "react";
import { motion } from "framer-motion";
import { Tooltip } from "@mui/material";
import { QUESTION_TYPE_META } from "@/shared/constants/question-types";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import type { Question, QuestionType } from "@/shared/types/forms";
import { useDndSensors } from "../dnd/sortable";
import {
  canDropPaletteItem,
  extractPaletteDragType,
  resolveCanvasDropIndex,
} from "../dnd/paletteDragLogic";
import FieldPalette from "../components/FieldPalette";
import Canvas from "../components/Canvas";
import { notifyWarning } from "@/shared/utils/toastNotify";
import AiChatSidebar from "../components/AiChatSidebar";

export const FORM_DETAILS_QUERY_KEY = ["form-builder", "form-details"];

interface FormBuilderPageProps {
  onAddQuestion: (
    type: QuestionType,
    index?: number,
    payload?: Partial<Question>,
  ) => Promise<unknown>;
  onUpdateQuestion: (
    questionId: string,
    updates: Partial<Question>,
  ) => Promise<unknown>;
  onDeleteQuestion: (questionId: string) => Promise<unknown>;
  onReorderQuestions: (questionIds: string[]) => void;
  isSaving: boolean;
}

export default function FormBuilderPage({
  onAddQuestion,
  onReorderQuestions,
}: FormBuilderPageProps) {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const form = useFormsStore((s) => s.form);

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestionId((prev) => (prev === questionId ? null : questionId));
  };

  const [selectedQuestionId, setSelectedQuestionId] = React.useState<
    string | null
  >(null);

  const isPaletteOpen = useFormsStore((s) => s.isPaletteOpen);
  const togglePaletteOpen = useFormsStore((s) => s.togglePaletteOpen);

  const sensors = useDndSensors();
  const [paletteDragType, setPaletteDragType] =
    React.useState<QuestionType | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const [isCanvasOver, setIsCanvasOver] = React.useState(false);
  const [isInvalidDrop, setIsInvalidDrop] = React.useState(false);

  const orderedQuestions = React.useMemo(
    () =>
      form?.questions
        ? [...form.questions].sort((a, b) => a.order - b.order)
        : [],
    [form],
  );

  const resetPaletteDragState = React.useCallback(() => {
    setPaletteDragType(null);
    setDropIndex(null);
    setIsCanvasOver(false);
    setIsInvalidDrop(false);
  }, []);

  const orderedQuestionIds = React.useMemo(
    () => orderedQuestions.map((q) => q.id),
    [orderedQuestions],
  );

  const handleDragStart: DragStartEvent = React.useCallback((event) => {
    const sourceData = event.operation.source?.data;

    if (sourceData?.source === "palette") {
      const type = extractPaletteDragType(sourceData);
      if (type) {
        setPaletteDragType(type);
        setDropIndex(null);
        setIsCanvasOver(false);
        setIsInvalidDrop(false);
      }
    }
  }, []);

  const handleDragOver: DragOverEvent = React.useCallback(
    (event) => {
      if (paletteDragType) {
        const overId = event.operation.target
          ? String(event.operation.target.id)
          : null;
        const nextDropIndex = resolveCanvasDropIndex(
          overId,
          formId,
          orderedQuestionIds,
        );
        const isValidCanvasHover = canDropPaletteItem(
          overId,
          formId,
          orderedQuestionIds,
        );
        setDropIndex(nextDropIndex);
        setIsCanvasOver(isValidCanvasHover);
        setIsInvalidDrop(overId !== null && !isValidCanvasHover);
      }
    },
    [formId, orderedQuestionIds, paletteDragType],
  );

  const handleDragEnd: DragEndEvent = React.useCallback(
    (event) => {
      const source = event.operation.source?.data?.source;
      if (source === "palette" && paletteDragType) {
        if (!form || dropIndex === null) {
          notifyWarning("Drop the field onto the canvas to add it.");
          resetPaletteDragState();
          return;
        }
        onAddQuestion(paletteDragType, dropIndex);
        resetPaletteDragState();
        return;
      }

      if (source === "canvas-question") {
        const nextQuestions = move(orderedQuestions, event);
        const hasOrderChanged = nextQuestions.some(
          (question, index) => question.id !== orderedQuestions[index]?.id,
        );

        if (hasOrderChanged) {
          onReorderQuestions(nextQuestions.map((question) => question.id));
        }
      }
      resetPaletteDragState();
    },
    [
      onAddQuestion,
      dropIndex,
      form,
      orderedQuestions,
      paletteDragType,
      onReorderQuestions,
      resetPaletteDragState,
    ],
  );

  const draggedTypeMeta = React.useMemo(
    () => QUESTION_TYPE_META.find((m) => m.type === paletteDragType) ?? null,
    [paletteDragType],
  );

  if (!form) return null;

  return (
    <DragDropProvider
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* 3-column layout: [FieldPalette] | [Canvas] | [AiChatSidebar] */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          px: { xs: 1.5, sm: 3 },
          py: 2,
          alignItems: "flex-start",
          position: "relative",
        }}
      >
        {/* ── Left: Field Palette ── */}
        <Box
          component={motion.div}
          initial={false}
          animate={{
            width: isPaletteOpen ? 260 : 0,
            marginRight: isPaletteOpen ? 0 : -16,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          sx={{
            display: { xs: "none", md: "block" },
            position: "sticky",
            top: "112px",
            alignSelf: "start",
            flexShrink: 0,
            overflow: "visible",
            zIndex: 10,
          }}
        >
          <Box
            component={motion.div}
            initial={false}
            animate={{
              opacity: isPaletteOpen ? 1 : 0,
              transitionEnd: { display: isPaletteOpen ? "block" : "none" },
            }}
            transition={{ duration: 0.2 }}
            sx={{ width: 260, overflow: "hidden" }}
            aria-hidden={!isPaletteOpen}
          >
            <FieldPalette
              activeDragType={paletteDragType}
              onAddQuestion={onAddQuestion}
            />
          </Box>
          <Box
            sx={{
              position: "absolute",
              top: 16,
              right: -16,
              zIndex: 20,
              display: { xs: "none", md: "flex" },
            }}
          >
            <Tooltip
              placement="right"
              title={
                isPaletteOpen ? "Hide field palette" : "Show field palette"
              }
            >
              <IconButton
                onClick={togglePaletteOpen}
                size="small"
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                  "&:hover": { bgcolor: "grey.50" },
                  border: "1px solid",
                  borderColor: "divider",
                  width: 32,
                  height: 32,
                }}
                aria-label={
                  isPaletteOpen ? "Hide field palette" : "Show field palette"
                }
                aria-expanded={isPaletteOpen}
                aria-controls="field-palette"
              >
                {isPaletteOpen ? (
                  <ChevronLeftIcon fontSize="small" />
                ) : (
                  <ChevronRightIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ── Center: Canvas ── */}
        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            width: { xs: "100%", md: "auto" },
          }}
        >
          <Canvas
            form={form}
            formId={formId}
            selectedQuestionId={selectedQuestionId}
            paletteDragType={paletteDragType}
            dropIndex={dropIndex}
            isCanvasOver={isCanvasOver}
            isInvalidDrop={isInvalidDrop}
            onAddQuestion={onAddQuestion}
            onSelectQuestion={handleSelectQuestion}
          />
        </Box>

        {/* ── Right: AI Chat Sidebar ── */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            flexShrink: 0,
            position: "sticky",
            top: "112px",
            alignSelf: "start",
            height: "calc(100vh - 128px)",
          }}
        >
          {form && <AiChatSidebar form={form} formId={formId} />}
        </Box>
      </Box>

      <DragOverlay
        dropAnimation={{
          duration: 250,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {draggedTypeMeta ? (
          <Paper
            variant="outlined"
            sx={{
              px: 1.25,
              py: 0.75,
              borderRadius: 1,
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
              bgcolor: "background.paper",
            }}
            aria-hidden
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {draggedTypeMeta.label}
            </Typography>
          </Paper>
        ) : null}
      </DragOverlay>
    </DragDropProvider>
  );
}
