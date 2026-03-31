"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { motion } from "framer-motion";
import { Tooltip } from "@mui/material";
import { QUESTION_TYPE_META } from "@/constants/question-types";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import { useDndSensors } from "../dnd/sortable";
import {
  canDropPaletteItem,
  extractPaletteDragType,
  resolveCanvasDropIndex,
} from "../dnd/paletteDragLogic";
import BuilderTopBar from "../components/BuilderTopBar";
import FieldPalette from "../components/FieldPalette";
import Canvas from "../components/Canvas";
import QuestionConfigPanel from "../components/QuestionConfigPanel";
import type { QuestionType } from "@/shared/types/forms";
import { notifyWarning } from "@/shared/utils/toastNotify";

export default function FormBuilderPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const router = useRouter();

  const form = useFormsStore((s) => s.getFormById(formId));
  const addQuestion = useFormsStore((s) => s.addQuestion);
  const reorderQuestions = useFormsStore((s) => s.reorderQuestions);
  const selectedQuestionId = useFormsStore(
    (s) => s.selectedQuestionIdByForm[formId] ?? null,
  );
  const isPaletteOpen = useFormsStore((s) => s.isPaletteOpen);
  const togglePalette = useFormsStore((s) => s.togglePalette);
  const sensors = useDndSensors();
  const [paletteDragType, setPaletteDragType] =
    React.useState<QuestionType | null>(null);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);
  const [isCanvasOver, setIsCanvasOver] = React.useState(false);
  const [isInvalidDrop, setIsInvalidDrop] = React.useState(false);

  const orderedQuestions = React.useMemo(
    () =>
      form ? form.questions.slice().sort((a, b) => a.order - b.order) : [],
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
    const type = extractPaletteDragType(event.operation.source?.data);
    if (type) {
      setPaletteDragType(type);
      setDropIndex(null);
      setIsCanvasOver(false);
      setIsInvalidDrop(false);
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
        const createdQuestionId = addQuestion(
          formId,
          paletteDragType,
          dropIndex,
        );
        if (!createdQuestionId) {
          notifyWarning("Unable to add this field right now.");
        }
        resetPaletteDragState();
        return;
      }

      if (source === "canvas-question") {
        const ids = orderedQuestions.map((q) => q.id);
        const next = move(ids, event);
        if (next) {
          reorderQuestions(formId, next);
        }
      }
      resetPaletteDragState();
    },
    [
      addQuestion,
      dropIndex,
      form,
      formId,
      orderedQuestions,
      paletteDragType,
      reorderQuestions,
      resetPaletteDragState,
    ],
  );

  const draggedTypeMeta = React.useMemo(
    () => QUESTION_TYPE_META.find((m) => m.type === paletteDragType) ?? null,
    [paletteDragType],
  );

  if (!form) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Form not found
          </Typography>
          <Button variant="contained" onClick={() => router.push("/forms")}>
            Back to dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default" }}>
      <BuilderTopBar form={form} />
      <DragDropProvider
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
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
              top: 120,
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
              sx={{
                width: 260,
                overflow: "hidden",
              }}
              aria-hidden={!isPaletteOpen}
            >
              <FieldPalette formId={formId} activeDragType={paletteDragType} />
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
                  onClick={togglePalette}
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
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Canvas
              formId={formId}
              selectedQuestionId={selectedQuestionId}
              paletteDragType={paletteDragType}
              dropIndex={dropIndex}
              isCanvasOver={isCanvasOver}
              isInvalidDrop={isInvalidDrop}
            />
          </Box>
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              position: "sticky",
              top: 120,
              alignSelf: "start",
              width: 340,
              flexShrink: 0,
            }}
          >
            <QuestionConfigPanel
              formId={formId}
              selectedQuestionId={selectedQuestionId}
            />
          </Box>
        </Box>
        <DragOverlay>
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
    </Box>
  );
}
