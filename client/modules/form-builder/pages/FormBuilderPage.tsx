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
import debounce from "lodash/debounce";
import { motion } from "framer-motion";
import { Tooltip } from "@mui/material";
import { QUESTION_TYPE_META } from "@/constants/question-types";
import { useQueryClient } from "@tanstack/react-query";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import type { Form } from "@/shared/types/forms";
import { useDndSensors } from "../dnd/sortable";
import {
  canDropPaletteItem,
  extractPaletteDragType,
  resolveCanvasDropIndex,
} from "../dnd/paletteDragLogic";
import FieldPalette from "../components/FieldPalette";
import Canvas from "../components/Canvas";
import QuestionConfigPanel from "../components/QuestionConfigPanel";
import type { QuestionType } from "@/shared/types/forms";
import { notifyWarning } from "@/shared/utils/toastNotify";

export const FORM_DETAILS_QUERY_KEY = ["form-builder", "form-details"];

export default function FormBuilderPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  const form = useFormsStore((s) => s.form);

  const queryClient = useQueryClient();

  const setIsSaving = useFormsStore((s) => s.setIsSaving);

  const addQuestionMutation = useAppMutation<
    unknown,
    Error,
    { type: QuestionType; index?: number }
  >({
    mutationFn: async ({ type, index }) => {
      return apiRequest({
        method: "post",
        url: `/form/${formId}/questions`,
        data: { type, index },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
    },
  });

  const reorderQuestionsMutation = useAppMutation<unknown, Error, string[]>({
    mutationFn: async (questionIds) => {
      return apiRequest({
        method: "put",
        url: `/form/${formId}/questions/reorder`,
        data: { questionIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
    },
  });

  const updateQuestionMutation = useAppMutation<
    unknown,
    Error,
    { questionId: string; updates: Record<string, unknown> }
  >({
    mutationFn: async ({ questionId, updates }) => {
      return apiRequest({
        method: "put",
        url: `/form/${formId}/questions/${questionId}`,
        data: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
    },
  });

  const deleteQuestionMutation = useAppMutation<unknown, Error, string>({
    mutationFn: async (questionId) => {
      return apiRequest({
        method: "delete",
        url: `/form/${formId}/questions/${questionId}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
    },
  });

  const duplicateQuestionMutation = useAppMutation<unknown, Error, string>({
    mutationFn: async (questionId) => {
      return apiRequest({
        method: "post",
        url: `/form/${formId}/questions/${questionId}/duplicate`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
    },
  });

  const updateFormMetaMutation = useAppMutation<unknown, Error, Partial<Form>>({
    mutationFn: async (updates) => {
      return apiRequest({
        method: "patch",
        url: `/form/${formId}`,
        data: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
    },
  });
  const mutateFormMeta = updateFormMetaMutation.mutate;

  // Buffer to hold form metadata updates before sending them to the server
  const pendingUpdatesRef = React.useRef<Partial<Form>>({});

  // Use a ref to hold the debounced flush function to avoid recreation or linter issues
  const flushUpdatesRef = React.useRef<ReturnType<typeof debounce> | null>(
    null,
  );

  React.useEffect(() => {
    // Create the debounced function inside the effect to satisfy the React linter
    flushUpdatesRef.current = debounce(() => {
      const updates = pendingUpdatesRef.current;

      // If there's nothing to update, do nothing
      if (Object.keys(updates).length === 0) return;

      // Clear the buffer and send the mutation
      pendingUpdatesRef.current = {};
      mutateFormMeta(updates);
    }, 500);

    return () => {
      // Clean up on unmount
      flushUpdatesRef.current?.flush();
      flushUpdatesRef.current?.cancel();
    };
  }, [mutateFormMeta]);

  // The function components will call to update form metadata
  const queueFormMetaUpdate = React.useCallback((updates: Partial<Form>) => {
    // Merge the new updates into the buffer
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates,
    };

    // Trigger the debounced flush
    flushUpdatesRef.current?.();
  }, []);

  const handleAddQuestion = (type: QuestionType, index?: number) => {
    addQuestionMutation.mutate({ type, index });
  };

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestionId((prev) => (prev === questionId ? null : questionId));
  };

  const [selectedQuestionId, setSelectedQuestionId] = React.useState<
    string | null
  >(null);

  const [isPaletteOpen, setIsPaletteOpen] = React.useState(true);
  const togglePalette = () => setIsPaletteOpen((prev) => !prev);
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
        handleAddQuestion(paletteDragType, dropIndex);
        resetPaletteDragState();
        return;
      }

      if (source === "canvas-question") {
        const nextQuestions = move(orderedQuestions, event);
        const hasOrderChanged = nextQuestions.some(
          (question, index) => question.id !== orderedQuestions[index]?.id,
        );

        if (hasOrderChanged) {
          reorderQuestionsMutation.mutate(
            nextQuestions.map((question) => question.id),
          );
        }
      }
      resetPaletteDragState();
    },
    [
      handleAddQuestion,
      dropIndex,
      form,
      orderedQuestions,
      paletteDragType,
      reorderQuestionsMutation,
      resetPaletteDragState,
    ],
  );

  const draggedTypeMeta = React.useMemo(
    () => QUESTION_TYPE_META.find((m) => m.type === paletteDragType) ?? null,
    [paletteDragType],
  );

  const anyPending =
    addQuestionMutation.isPending ||
    reorderQuestionsMutation.isPending ||
    updateQuestionMutation.isPending ||
    deleteQuestionMutation.isPending ||
    duplicateQuestionMutation.isPending ||
    updateFormMetaMutation.isPending;

  React.useEffect(() => {
    setIsSaving(anyPending);
    // Cleanup on unmount
    return () => setIsSaving(false);
  }, [anyPending, setIsSaving]);

  if (!form) return null;

  return (
    <div>
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
              <FieldPalette
                formId={formId}
                activeDragType={paletteDragType}
                onAddQuestion={handleAddQuestion}
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
              form={form}
              formId={formId}
              selectedQuestionId={selectedQuestionId}
              paletteDragType={paletteDragType}
              dropIndex={dropIndex}
              isCanvasOver={isCanvasOver}
              isInvalidDrop={isInvalidDrop}
              onAddQuestion={handleAddQuestion}
              onSelectQuestion={handleSelectQuestion}
              onUpdateQuestion={(questionId, updates) =>
                updateQuestionMutation.mutate({ questionId, updates })
              }
              onDeleteQuestion={(questionId) =>
                deleteQuestionMutation.mutate(questionId)
              }
              onDuplicateQuestion={(questionId) =>
                duplicateQuestionMutation.mutate(questionId)
              }
              onUpdateFormMeta={queueFormMetaUpdate}
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
              form={form}
              selectedQuestionId={selectedQuestionId}
              onUpdateQuestion={(questionId, updates) =>
                updateQuestionMutation.mutate({ questionId, updates })
              }
            />
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
    </div>
  );
}
