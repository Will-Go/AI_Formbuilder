"use client";

import Box from "@mui/material/Box";
import { useSortable } from "@dnd-kit/react/sortable";
import React from "react";
import type { Question } from "@/shared/types/forms";
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

interface SortableQuestionItemProps {
  question: Question;
  formId: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
  isDeletable?: boolean;
  aiDiffState?: "add" | "update" | "delete";
  aiMessageId?: string;
  aiChangeId?: string;
  aiPendingPayload?: Partial<Question>;
  isAiApplying?: boolean;
}

export default function SortableQuestionItem({
  question,
  formId,
  index,
  selected,
  onSelect,
  isDeletable = true,
  aiDiffState,
  aiMessageId,
  aiChangeId,
  aiPendingPayload,
  isAiApplying,
}: SortableQuestionItemProps) {
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
      id={`question-${question.id}`}
      sx={getQuestionContainerSx(question)}
      data-shadow={isDragging || undefined}
    >
      <QuestionCard
        question={question}
        formId={formId}
        selected={selected}
        onSelect={onSelect}
        isDragging={isDragging}
        dragHandleRef={handleRef}
        isDeletable={isDeletable}
        aiDiffState={aiDiffState}
        aiMessageId={aiMessageId}
        aiChangeId={aiChangeId}
        readonly={aiDiffState === "add"}
        aiPendingPayload={aiPendingPayload}
        isAiApplying={isAiApplying}
      />
    </Box>
  );
}
