"use client";

import React, { memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";

import type { ChatMessage, StagedChange } from "@/shared/types/aiChat";
import StagedChangeCard from "./StagedChangeCard";

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
  acceptingChangeId?: string | null;
}

const MessageBubble = memo(
  ({
    message,
    onAcceptChange,
    onRejectChange,
    onAcceptAll,
    onRejectAll,
    acceptingChangeId,
  }: MessageBubbleProps) => {
    const isUser = message.role === "user";
    const hasPending = hasPendingChanges(message.stagedChanges);

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
            maxWidth: "85%",
            px: 1.75,
            py: 1.25,
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            bgcolor: isUser ? "primary.main" : "background.paper",
            color: isUser ? "primary.contrastText" : "text.primary",
            border: isUser ? "none" : "1px solid",
            borderColor: "divider",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
          }}
        >
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}
          >
            {message.content}
          </Typography>
        </Box>

        {/* Timestamp */}
        <Typography
          variant="caption"
          sx={{ color: "text.disabled", px: 0.5, fontSize: 10 }}
        >
          {formatTime(message.createdAt)}
        </Typography>

        {/* Staged changes */}
        {message.stagedChanges && message.stagedChanges.length > 0 && (
          <Box
            sx={{
              width: "100%",
              mt: 0.5,
              p: 1.25,
              borderRadius: 2,
              border: "1px solid",
              borderColor: hasPending ? "warning.light" : "divider",
              bgcolor: hasPending ? "warning.50" : "background.default",
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            {/* Staged changes header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  letterSpacing: 0.4,
                }}
              >
                {message.stagedChanges.length} suggested change
                {message.stagedChanges.length !== 1 ? "s" : ""}
              </Typography>
              {hasPending && (
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Button
                    size="small"
                    startIcon={<DoneAllIcon sx={{ fontSize: 12 }} />}
                    onClick={() => onAcceptAll(message.id)}
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
                    startIcon={<CloseIcon sx={{ fontSize: 12 }} />}
                    onClick={() => onRejectAll(message.id)}
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
            {message.stagedChanges.map((change) => (
              <StagedChangeCard
                key={change.id}
                change={change}
                isAccepting={acceptingChangeId === change.id}
                onAccept={() => onAcceptChange(message.id, change.id)}
                onReject={() => onRejectChange(message.id, change.id)}
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
