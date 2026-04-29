"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import Divider from "@mui/material/Divider";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import ChatInput from "@/shared/components/ChatInput";
import { stripHtml } from "@/shared/utils/html";
import { apiRequest } from "@/shared/utils/apiRequest";
import { createClient } from "@/shared/services/supabase/client";
import { useAiChatStore } from "../store/aiChatStore";
import type { Form } from "@/shared/types/forms";
import type {
  ChatMessage,
  GetOrCreateSessionResponse,
  GetMessagesResponse,
  SendMessageResponse,
} from "@/shared/types/aiChat";

import AiLoadingBubble from "./AiLoadingBubble";
import MessageBubble from "./MessageBubble";
import { useAiChatContext } from "../context/AiChatContext";

const DEFAULT_SIDEBAR_WIDTH = 340;
const MIN_SIDEBAR_WIDTH = 280;

const getMaxSidebarWidth = (): number => {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;
  return Math.floor(window.innerWidth / 2);
};

const clampSidebarWidth = (width: number): number => {
  const maxWidth = getMaxSidebarWidth();
  return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), maxWidth);
};

// ── main component ────────────────────────────────────────────────────────────

interface AiChatSidebarProps {
  form: Form;
  formId: string;
}

export default function AiChatSidebar({ form, formId }: AiChatSidebarProps) {
  const isOpen = useAiChatStore((s) => s.isOpen);
  const setIsOpen = useAiChatStore((s) => s.setIsOpen);
  const session = useAiChatStore((s) => s.session);
  const setSession = useAiChatStore((s) => s.setSession);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [acceptingChangeId, setAcceptingChangeId] = useState<string | null>(
    null,
  );
  const [sidebarWidth, setSidebarWidth] = React.useState(
    DEFAULT_SIDEBAR_WIDTH,
  );
  const [isResizing, setIsResizing] = React.useState(false);
  const [isResizeHandleHovered, setIsResizeHandleHovered] =
    React.useState(false);

  const [inputValue, setInputValue] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sidebarWidthMotion = useMotionValue(DEFAULT_SIDEBAR_WIDTH);
  const animatedSidebarWidth = useSpring(sidebarWidthMotion, {
    stiffness: 420,
    damping: 42,
    mass: 0.8,
  });
  const resizeStartRef = React.useRef({
    pointerX: 0,
    width: DEFAULT_SIDEBAR_WIDTH,
  });

  const {
    handleAcceptChange,
    handleRejectChange,
    handleAcceptAll,
    handleRejectAll,
    setMessages,
  } = useAiChatContext();

  // ── fetch session ──────────────────────────────────────────────────────────
  const _sessionQuery = useAppQuery<GetOrCreateSessionResponse>({
    queryKey: ["ai-chat-session", formId],
    queryFn: () =>
      apiRequest({
        method: "get",
        url: "/ai-chat/sessions",
        params: { formId },
      }),
    enabled: !!formId,
    onSuccess: (data) => setSession(data.session),
    showErrorToast: true,
  });

  // ── fetch messages once session is known ───────────────────────────────────
  const _messagesQuery = useAppQuery<GetMessagesResponse>({
    queryKey: ["ai-chat-messages", session?.id],
    queryFn: () =>
      apiRequest({
        method: "get",
        url: `/ai-chat/sessions/${session!.id}/messages`,
      }),
    enabled: !!session?.id,
    showErrorToast: true,
    staleTime: 1000 * 60, // 1 minute
  });

  const messages = React.useMemo(
    () => _messagesQuery.data?.messages ?? [],
    [_messagesQuery.data?.messages],
  );

  // ── realtime subscription ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (!session?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat_${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_chat_messages",
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          setIsAiLoading(false);
          // Whenever a new message arrives for this session, refetch messages perfectly
          _messagesQuery.refetch();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id, _messagesQuery]);

  // ── mutations ──────────────────────────────────────────────────────────────

  const sendMessageMutation = useAppMutation<
    SendMessageResponse,
    Error,
    string
  >({
    mutationFn: async (text) => {
      return apiRequest<SendMessageResponse>({
        method: "post",
        url: "/ai-chat/send",
        data: {
          formId,
          message: text,
          formContext: JSON.stringify(form),
        },
      });
    },
    onMutate: async (text) => {
      if (!session) return;
      const optimisticUser: ChatMessage = {
        id: uuidv4(),
        sessionId: session.id,
        role: "user",
        content: text,
        createdAt: dayjs().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUser]);
      setInputValue("");
      return { optimisticId: optimisticUser.id };
    },
    onSuccess: (res, _variables, context) => {
      const optimisticId = (context as { optimisticId: string }).optimisticId;
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticId),
        res.userMessage,
      ]);
      _messagesQuery.refetch();
    },
    onError: (_err, text, context) => {
      console.log("error when sending message`", _err);
      const optimisticId = (context as { optimisticId: string })?.optimisticId;
      if (optimisticId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? { ...m, content: `${m.content} (failed to send)` }
              : m,
          ),
        );
      }
    },
  });

  const handleAcceptChangeWithLoading = React.useCallback(
    async (messageId: string, changeId: string) => {
      setAcceptingChangeId(changeId);
      try {
        await handleAcceptChange(messageId, changeId);
      } finally {
        setAcceptingChangeId((current) =>
          current === changeId ? null : current,
        );
      }
    },
    [handleAcceptChange],
  );

  const handleSend = () => {
    const text = stripHtml(inputValue).trim();
    if (!text || sendMessageMutation.isPending || !session) return;
    setIsAiLoading(true);
    sendMessageMutation.mutate(text);
  };

  const handleResizePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      if (!isOpen) return;

      event.preventDefault();
      resizeStartRef.current = {
        pointerX: event.clientX,
        width: sidebarWidth,
      };
      setIsResizeHandleHovered(false);
      setIsResizing(true);
    },
    [isOpen, sidebarWidth],
  );

  const handleResizeHandlePointerEnter = React.useCallback((): void => {
    if (isResizing) return;
    setIsResizeHandleHovered(true);
  }, [isResizing]);

  const handleResizeHandlePointerLeave = React.useCallback((): void => {
    setIsResizeHandleHovered(false);
  }, []);

  React.useEffect(() => {
    sidebarWidthMotion.set(isOpen ? sidebarWidth : 0);
  }, [isOpen, sidebarWidth, sidebarWidthMotion]);

  React.useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent): void => {
      const dragDistance = resizeStartRef.current.pointerX - event.clientX;
      setSidebarWidth(
        clampSidebarWidth(resizeStartRef.current.width + dragDistance),
      );
    };

    const handlePointerEnd = (): void => {
      setIsResizing(false);
      setIsResizeHandleHovered(false);
    };

    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
    window.addEventListener("blur", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
      window.removeEventListener("blur", handlePointerEnd);
      document.body.style.cursor = originalCursor;
      document.body.style.userSelect = originalUserSelect;
    };
  }, [isResizing]);

  React.useEffect(() => {
    const handleWindowResize = (): void => {
      setSidebarWidth((currentWidth) => clampSidebarWidth(currentWidth));
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  // ── auto-scroll on new messages ────────────────────────────────────────────
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sendMessageMutation.isPending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !sendMessageMutation.isPending) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLoading = _sessionQuery.isLoading || _messagesQuery.isLoading;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Collapse toggle tab — always visible */}
      {!isOpen && (
        <Tooltip title="Open AI Assistant" placement="left">
          <Box
            sx={{
              position: "fixed",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 100,
            }}
          >
            <IconButton
              onClick={() => setIsOpen(true)}
              id="ai-chat-sidebar-open-btn"
              aria-label="Open AI Assistant"
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                borderRadius: "8px 0 0 8px",
                boxShadow: "-2px 0 12px rgba(0,0,0,0.15)",
                width: 36,
                height: 56,
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              <AutoAwesomeIcon fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>
      )}

      {/* Sidebar panel */}
      <Box
        component={motion.div}
        initial={false}
        animate={{ opacity: isOpen ? 1 : 0 }}
        style={{ width: animatedSidebarWidth }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
        sx={{
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          height: "100%",
        }}
      >
        <Box
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize AI Assistant"
          aria-valuemin={MIN_SIDEBAR_WIDTH}
          aria-valuemax={getMaxSidebarWidth()}
          aria-valuenow={sidebarWidth}
          tabIndex={-1}
          onPointerDown={handleResizePointerDown}
          onPointerEnter={handleResizeHandlePointerEnter}
          onPointerLeave={handleResizeHandlePointerLeave}
          sx={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 10,
            zIndex: 2,
            cursor: "ew-resize",
            touchAction: "none",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: 2,
              bgcolor:
                isResizing || isResizeHandleHovered
                  ? "primary.main"
                  : "transparent",
              boxShadow:
                isResizing || isResizeHandleHovered
                  ? "0 0 0 1px rgba(99,102,241,0.18)"
                  : "none",
              transition: "background-color 0.15s ease, box-shadow 0.15s ease",
            },
          }}
        />
        {/* Inner wrapper prevents content paint during collapse */}
        <Box
          sx={{
            width: sidebarWidth,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* ── Header ── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              px: 2,
              py: 1.25,
              borderBottom: "1px solid",
              borderColor: "divider",
              flexShrink: 0,
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 18, mr: 1 }} />
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                flex: 1,
                letterSpacing: 0.3,
              }}
            >
              Form AI
            </Typography>
            <Tooltip title="Collapse sidebar">
              <IconButton
                size="small"
                onClick={() => setIsOpen(false)}
                id="ai-chat-sidebar-close-btn"
                aria-label="Collapse AI Assistant"
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset conversation">
              <IconButton
                size="small"
                onClick={() => {
                  _messagesQuery.reset();
                  setMessages([]);
                }}
                id="ai-chat-reset-btn"
                aria-label="Reset conversation"
                sx={{ ml: 0.5 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* ── Message list ── */}
          <Box
            ref={scrollRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              px: 1.5,
              py: 1.5,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              // Custom scrollbar
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "divider",
                borderRadius: 4,
                "&:hover": { bgcolor: "text.disabled" },
              },
            }}
          >
            {/* Loading skeletons */}
            {isLoading && (
              <>
                <Skeleton
                  variant="rounded"
                  width="70%"
                  height={48}
                  sx={{ borderRadius: 2 }}
                />
                <Skeleton
                  variant="rounded"
                  width="85%"
                  height={64}
                  sx={{ borderRadius: 2, alignSelf: "flex-end" }}
                />
                <Skeleton
                  variant="rounded"
                  width="60%"
                  height={48}
                  sx={{ borderRadius: 2 }}
                />
              </>
            )}

            {/* Empty state */}
            {!isLoading && messages.length === 0 && (
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  py: 4,
                  color: "text.disabled",
                }}
              >
                <AutoAwesomeIcon sx={{ fontSize: 36, opacity: 0.4 }} />
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", maxWidth: 220 }}
                >
                  Ask me to add, modify, or reorganize your form questions.
                </Typography>
              </Box>
            )}

            {/* Messages */}
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageBubble
                    message={msg}
                    onAcceptChange={handleAcceptChangeWithLoading}
                    onRejectChange={handleRejectChange}
                    onAcceptAll={handleAcceptAll}
                    onRejectAll={handleRejectAll}
                    acceptingChangeId={acceptingChangeId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* AI loading indicator */}
            {isAiLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <AiLoadingBubble />
              </motion.div>
            )}
          </Box>

          {/* ── Input area ── */}
          <Divider />
          <Box
            sx={{
              px: 1.5,
              py: 1.25,
              flexShrink: 0,
              display: "flex",
              alignItems: "flex-end",
              gap: 1,
              bgcolor: "background.paper",
            }}
          >
            <Box
              sx={{
                flex: 1,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                px: 1.5,
                py: 0.75,
                bgcolor: "grey.50",
                "&:focus-within": {
                  borderColor: "primary.main",
                  boxShadow: "0 0 0 2px rgba(99,102,241,0.15)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onKeyDown={handleKeyDown}
                placeholder={isAiLoading ? "" : "Ask AI to modify your form..."}
                disabled={
                  sendMessageMutation.isPending ||
                  !session ||
                  !inputValue.trim() ||
                  isAiLoading
                }
              />
            </Box>
            <Tooltip title="Send (Enter)">
              <span>
                <IconButton
                  id="ai-chat-send-btn"
                  aria-label="Send message to AI"
                  onClick={handleSend}
                  disabled={
                    !stripHtml(inputValue).trim() ||
                    sendMessageMutation.isPending ||
                    !session
                  }
                  sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    "&:hover": { bgcolor: "primary.dark" },
                    "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
                    transition: "all 0.2s ease",
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </>
  );
}
