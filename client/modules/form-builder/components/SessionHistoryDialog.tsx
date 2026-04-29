"use client";

import React, { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import dayjs from "dayjs";

import Dialog from "@/shared/components/Dialog";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { apiRequest } from "@/shared/utils/apiRequest";
import { useAiChatStore } from "../store/aiChatStore";
import type {
  ChatSession,
  GetOrCreateSessionResponse,
  CreateSessionResponse,
  SelectSessionResponse,
  DeleteSessionResponse,
} from "@/shared/types/aiChat";
import SessionRow from "./SessionRow";

type SessionHistoryDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  formId: string;
  activeSessionId?: string;
};

const ITEMS_PER_PAGE = 5;

export default function SessionHistoryDialog({
  open,
  setOpen,
  formId,
  activeSessionId,
}: SessionHistoryDialogProps) {
  const setSession = useAiChatStore((s) => s.setSession);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const sessionQuery = useAppQuery<GetOrCreateSessionResponse>({
    queryKey: ["ai-chat-sessions", formId, debouncedSearchQuery],
    queryFn: () =>
      apiRequest({
        method: "get",
        url: "/ai-chat/sessions",
        params: { formId, search: debouncedSearchQuery || undefined },
      }),
    enabled: open && !!formId,
    showErrorToast: true,
  });

  const createSessionMutation = useAppMutation<CreateSessionResponse>({
    mutationFn: () =>
      apiRequest<CreateSessionResponse>({
        method: "post",
        url: "/ai-chat/sessions",
        data: { formId },
      }),
    onSuccess: (res) => {
      setSession(res.session);
      sessionQuery.invalidate();
      setOpen(false);
    },
  });

  const selectSessionMutation = useAppMutation<
    SelectSessionResponse,
    Error,
    string
  >({
    mutationFn: (sessionId) =>
      apiRequest<SelectSessionResponse>({
        method: "patch",
        url: `/ai-chat/sessions/${sessionId}`,
        data: { action: "select" },
      }),
    onSuccess: (res) => {
      setSession(res.session);
      sessionQuery.invalidate();
      setOpen(false);
    },
  });

  const deleteSessionMutation = useAppMutation<
    DeleteSessionResponse,
    Error,
    string
  >({
    mutationFn: (sessionId) =>
      apiRequest<DeleteSessionResponse>({
        method: "delete",
        url: `/ai-chat/sessions/${sessionId}`,
      }),
    onMutate: (sessionId) => {
      setDeletingSessionId(sessionId);
    },
    onSuccess: (res) => {
      if (res.session.id !== activeSessionId) {
        setSession(res.session);
      }
      sessionQuery.invalidate();
    },
    onSettled: () => {
      setDeletingSessionId(null);
    },
  });

  const { data, isLoading, reset } = sessionQuery;
  const sessions = useMemo(() => data?.sessions ?? [], [data?.sessions]);

  // Reset states when dialog opens
  React.useEffect(() => {
    if (open) {
      setSearchQuery("");
      setVisibleCount(ITEMS_PER_PAGE);
    }
  }, [open]);

  const groupedSessions = useMemo(() => {
    const groups: Record<string, ChatSession[]> = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    const now = dayjs();

    sessions.slice(0, visibleCount).forEach((session) => {
      const date = dayjs(session.lastUsedAt);
      if (date.isSame(now, "day")) {
        groups["Today"].push(session);
      } else if (date.isSame(now.subtract(1, "day"), "day")) {
        groups["Yesterday"].push(session);
      } else if (date.isAfter(now.subtract(7, "day"))) {
        groups["Previous 7 Days"].push(session);
      } else {
        groups["Older"].push(session);
      }
    });

    return groups;
  }, [sessions, visibleCount]);

  const hasMore = visibleCount < sessions.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  return (
    <Dialog
      open={open}
      setOpen={setOpen}
      header={
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.125rem" }}>
            Session History
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Refresh sessions">
              <IconButton onClick={() => reset()} size="small" sx={{ color: "text.secondary" }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              size="small"
              startIcon={createSessionMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" }
              }}
            >
              New Chat
            </Button>
          </Box>
        </Box>
      }
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
        {/* Search Bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            px: 2,
            py: 0.5,
            transition: "all 0.2s",
            "&:focus-within": {
              borderColor: "primary.main",
              boxShadow: (theme) => `0 0 0 1px ${theme.palette.primary.main}`,
            },
          }}
        >
          <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ flex: 1, fontSize: "0.875rem" }}
          />
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Skeleton variant="rounded" height={64} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={64} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rounded" height={64} sx={{ borderRadius: 2 }} />
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No sessions found.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 2 }}>
            {Object.entries(groupedSessions).map(([group, groupSessions]) => {
              if (groupSessions.length === 0) return null;

              return (
                <Box key={group} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      px: 0.5,
                    }}
                  >
                    {group}
                  </Typography>
                  <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {groupSessions.map((session) => (
                      <SessionRow
                        key={session.id}
                        session={session}
                        isActive={session.id === activeSessionId}
                        isDeleting={deletingSessionId === session.id}
                        isSelecting={selectSessionMutation.isPending}
                        onSelectSession={(id) => selectSessionMutation.mutate(id)}
                        onDeleteSession={(id) => deleteSessionMutation.mutate(id)}
                      />
                    ))}
                  </List>
                </Box>
              );
            })}

            {hasMore && (
              <Button
                variant="text"
                color="inherit"
                onClick={handleLoadMore}
                endIcon={<ExpandMoreIcon />}
                sx={{
                  alignSelf: "center",
                  textTransform: "none",
                  fontWeight: 600,
                  color: "text.secondary",
                  borderRadius: 6,
                  px: 3,
                  py: 1,
                  "&:hover": { color: "text.primary", bgcolor: "action.hover" },
                }}
              >
                See more
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
