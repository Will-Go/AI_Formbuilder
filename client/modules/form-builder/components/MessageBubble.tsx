"use client";

import React, { memo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import dayjs from "dayjs";
import { cn } from "@/shared/utils/cn";

import type { ChatMessage, StagedChange } from "@/shared/types/aiChat";
import StagedChangeCard from "./StagedChangeCard";
import TypingText from "./TypingText";

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return dayjs(iso).format("h:mm A");
}

function hasPendingChanges(changes?: StagedChange[]) {
  return changes?.some((c) => c.accepted === null) ?? false;
}

// ── component ────────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  onAcceptChange: (msgId: string, changeId: string) => void;
  onRejectChange: (msgId: string, changeId: string) => void;
  onAcceptAll: (msgId: string) => void;
  onRejectAll: (msgId: string) => void;
  acceptingChangeIds?: string[];
  isAcceptingAll?: boolean;
  isRejectingAll?: boolean;
  shouldTypingAnimate?: boolean;
}

const MessageBubble = memo(
  ({
    shouldTypingAnimate = false,
    message,
    onAcceptChange,
    onRejectChange,
    onAcceptAll,
    onRejectAll,
    acceptingChangeIds = [],
    isAcceptingAll,
    isRejectingAll,
  }: MessageBubbleProps) => {
    const isUser = message.role === "user";
    const hasPending = hasPendingChanges(message.stagedChanges);
    const [isTypingComplete, setIsTypingComplete] = useState(false);

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          gap: 0.5,
        }}
      >
        {/* Bubble */}
        <Box
          sx={{
            maxWidth: isUser ? "85%" : "100%",
            px: isUser ? 1.75 : 0,
            py: isUser ? 1.25 : 0.5,
            borderRadius: isUser ? 2 : 0,
            bgcolor: isUser ? "primary.main" : "transparent",
            color: isUser ? "common.white" : "text.primary",
            border: "none",
            boxShadow: "none",
          }}
        >
          {!isUser && !isTypingComplete && shouldTypingAnimate ? (
            <TypingText
              text={message.content}
              speed={8}
              onComplete={() => setIsTypingComplete(true)}
            />
          ) : (
            <Typography
              variant={"body2"}
              sx={{
                whiteSpace: "pre-wrap",
                lineHeight: 1.55,
                fontFamily: isUser ? "inherit" : "monospace",
                fontSize: isUser ? 14 : 12,
              }}
            >
              {message.content}
            </Typography>
          )}
        </Box>

        {/* Timestamp */}
        {isUser && (
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", px: 0.5, fontSize: 10 }}
          >
            {formatTime(message.createdAt)}
          </Typography>
        )}

        {/* Staged changes */}
        {message.stagedChanges && message.stagedChanges.length > 0 && (
          <Box
            sx={{
              width: "100%",
              mt: 1,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "rgba(0,0,0,0.15)",
              bgcolor: "#f8faff",
              color: "grey.900",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Staged changes header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 1.5,
                bgcolor: "rgba(0,0,0,0.03)",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: "grey.600",
                  letterSpacing: 0.2,
                }}
              >
                {message.stagedChanges.length} suggested change
                {message.stagedChanges.length !== 1 ? "s" : ""}
              </Typography>
              {hasPending && (
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Button
                    size="small"
                    startIcon={
                      isAcceptingAll ? (
                        <CircularProgress size={12} color="inherit" />
                      ) : (
                        <DoneAllIcon sx={{ fontSize: 12 }} />
                      )
                    }
                    onClick={() => onAcceptAll(message.id)}
                    disabled={isAcceptingAll || isRejectingAll}
                    sx={{
                      py: 0.25,
                      px: 1,
                      fontSize: 11,
                      minWidth: 0,
                      color: "success.main",
                      borderColor: "success.main",
                      "&:hover": { bgcolor: "success.50" },
                    }}
                    variant="outlined"
                  >
                    All
                  </Button>
                  <Button
                    size="small"
                    startIcon={
                      isRejectingAll ? (
                        <CircularProgress size={12} color="inherit" />
                      ) : (
                        <CloseIcon sx={{ fontSize: 12 }} />
                      )
                    }
                    onClick={() => onRejectAll(message.id)}
                    disabled={isAcceptingAll || isRejectingAll}
                    sx={{
                      py: 0.25,
                      px: 1,
                      fontSize: 11,
                      minWidth: 0,
                      color: "error.main",
                      borderColor: "error.main",
                      "&:hover": { bgcolor: "error.50" },
                    }}
                    variant="outlined"
                  >
                    None
                  </Button>
                </Box>
              )}
            </Box>

            {/* Per-change cards */}
            {message.stagedChanges?.map((change, index) => (
              <StagedChangeCard
                key={change.id}
                change={change}
                isAccepting={acceptingChangeIds.includes(change.id)}
                onAccept={() => onAcceptChange(message.id, change.id)}
                onReject={() => onRejectChange(message.id, change.id)}
                className={cn(
                  "border-black/15 border-t",
                  index === (message.stagedChanges?.length ?? 0) - 1
                    ? "border-b rounded-b-xl!"
                    : "",
                )}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  },
);

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
