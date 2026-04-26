"use client";

import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { useDroppable } from "@dnd-kit/react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { createQuestionByType } from "@/shared/constants/defaults";
import type { Question, QuestionType, Form } from "@/shared/types/forms";
import type {
  ChatMessage,
  GetMessagesResponse,
  StagedChange,
} from "@/shared/types/aiChat";
import QuestionCard from "./QuestionCard";
import { useAiChatStore } from "../store/aiChatStore";
import { useQueryClient } from "@tanstack/react-query";
import CanvasDropSlot from "./CanvasDropSlot";
import CanvasPreviewSlot from "./CanvasPreviewSlot";
import SortableQuestionItem from "./SortableQuestionItem";

function getPreviewContainerSx(question: Question) {
  return {
    py: question.type === "section_divider" ? 1.5 : 0,
    px: question.type === "section_divider" ? 0.5 : 0,
    borderTop: question.type === "section_divider" ? "1px dashed" : "none",
    borderBottom: question.type === "section_divider" ? "1px dashed" : "none",
    borderColor: "primary.light",
  };
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
  const queryClient = useQueryClient();
  const session = useAiChatStore((s) => s.session);
  const _messagesQuery = useAppQuery<GetMessagesResponse>({
    queryKey: ["ai-chat-messages", session?.id],
    queryFn: () =>
      (queryClient.getQueryData([
        "ai-chat-messages",
        session?.id,
      ]) as GetMessagesResponse) || [],
    enabled: !!session?.id,
  });

  const messages = React.useMemo(
    () => _messagesQuery?.data?.messages ?? [],
    [_messagesQuery?.data?.messages],
  );
  const pendingChanges = React.useMemo(() => {
    return messages.flatMap((m: ChatMessage) =>
      (m.stagedChanges || [])
        .filter((c: StagedChange) => c.accepted === null)
        .map((c: StagedChange) => ({ ...c, messageId: m.id })),
    );
  }, [messages]);

  if (!form) return null;

  // Generate fake question payloads for pending additions
  const pendingAdds = pendingChanges.filter((c) => c.type === "add");
  const pendingUpdates = pendingChanges.filter((c) => c.type === "update");
  const pendingDeletes = pendingChanges.filter((c) => c.type === "delete");
  console.log("pendingAdds", pendingAdds);
  const { questions } = form;

  const addQuestions = pendingAdds.map((c, i) => {
    const payload = c.payload as Partial<Question> & { type?: QuestionType };
    const maxOrder =
      questions.length > 0 ? questions[questions.length - 1].order : 0;
    const base = createQuestionByType(
      payload.type || "short_text",
      maxOrder + i + 1,
    );
    return {
      ...base,
      ...payload,
      id: c.id,
    } as Question;
  });

  const allQuestions = [...questions, ...addQuestions].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <Box sx={{ position: "relative" }}>
      <Box sx={{ maxWidth: 860, mx: "auto" }}>
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
            <AnimatePresence>
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
                        formId={formId}
                        selected={false}
                        onSelect={() => {}}
                        isPreview
                      />
                    </CanvasPreviewSlot>
                  </Box>
                </motion.div>
              ) : null}

              {allQuestions.map((q, idx) => {
                const pendingAdd = pendingAdds.find((c) => c.id === q.id);
                const pendingUpdate = pendingUpdates.find(
                  (c) => c.questionId === q.id,
                );
                const pendingDelete = pendingDeletes.find(
                  (c) => c.questionId === q.id,
                );

                let aiDiffState: "add" | "update" | "delete" | undefined;
                let aiMessageId: string | undefined;
                let aiChangeId: string | undefined;
                let aiPendingPayload: Partial<Question> | undefined;

                if (pendingAdd) {
                  aiDiffState = "add";
                  aiMessageId = pendingAdd.messageId;
                  aiChangeId = pendingAdd.id;
                  aiPendingPayload = pendingAdd.payload as Partial<Question>;
                } else if (pendingUpdate) {
                  aiDiffState = "update";
                  aiMessageId = pendingUpdate.messageId;
                  aiChangeId = pendingUpdate.id;
                  aiPendingPayload = pendingUpdate.payload as Partial<Question>;
                } else if (pendingDelete) {
                  aiDiffState = "delete";
                  aiMessageId = pendingDelete.messageId;
                  aiChangeId = pendingDelete.id;
                }

                return (
                  <React.Fragment key={`${q.id}-${aiDiffState || "normal"}`}>
                    <SortableQuestionItem
                      question={q}
                      formId={formId}
                      index={idx}
                      selected={q.id === selectedQuestionId}
                      onSelect={() => onSelectQuestion(q.id)}
                      isDeletable={
                        (idx > 0 && !pendingAdd) || aiDiffState !== undefined
                      }
                      aiDiffState={aiDiffState}
                      aiMessageId={aiMessageId}
                      aiChangeId={aiChangeId}
                      aiPendingPayload={aiPendingPayload}
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
                              formId={formId}
                              selected={false}
                              onSelect={() => {}}
                              isPreview
                            />
                          </CanvasPreviewSlot>
                        </Box>
                      </motion.div>
                    ) : null}
                  </React.Fragment>
                );
              })}
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
          display: "flex",
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
