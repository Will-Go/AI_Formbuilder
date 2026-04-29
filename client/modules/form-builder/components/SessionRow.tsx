"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import { alpha } from "@mui/material/styles";
import dayjs from "dayjs";

import Dialog from "@/shared/components/Dialog";
import { timeAgo, formatDatetime } from "@/shared/utils/dateFormatter";
import type { ChatSession } from "@/shared/types/aiChat";

const isRecent = (isoDate: string): boolean => {
  const date = dayjs(isoDate);
  const diffInDays = dayjs().diff(date, "day");
  return diffInDays < 7;
};

type SessionRowProps = {
  session: ChatSession;
  isActive: boolean;
  isDeleting: boolean;
  isSelecting: boolean;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
};

export default function SessionRow({
  session,
  isActive,
  isDeleting,
  isSelecting,
  onSelectSession,
  onDeleteSession,
}: SessionRowProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDeleteSession(session.id);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: isActive ? (theme) => alpha(theme.palette.primary.main, 0.04) : "transparent",
          border: "1px solid",
          borderColor: isActive ? "primary.main" : "divider",
          borderRadius: 2,
          overflow: "hidden",
          transition: "all 0.2s",
          "&:hover": {
            borderColor: isActive ? "primary.main" : "text.disabled",
            bgcolor: isActive ? (theme) => alpha(theme.palette.primary.main, 0.08) : "action.hover",
          },
        }}
      >
        <ListItemButton
          selected={isActive}
          onClick={() => {
            if (!isActive && !isSelecting) {
              onSelectSession(session.id);
            }
          }}
          sx={{
            minWidth: 0,
            py: 1.25,
            px: 2,
            "&.Mui-selected": {
              bgcolor: "transparent",
              "&:hover": { bgcolor: "transparent" },
            },
          }}
        >
          <ListItemText
            primary={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                  mb: 0.5,
                }}
              >
                {isActive && <CheckIcon color="primary" sx={{ fontSize: 18 }} />}
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "primary.main" : "text.primary",
                  }}
                >
                  {session.name}
                </Typography>
              </Box>
            }
            secondary={
              <Typography variant="caption" color="text.secondary">
                {isRecent(session.lastUsedAt)
                  ? timeAgo(session.lastUsedAt)
                  : formatDatetime(session.lastUsedAt)}
              </Typography>
            }
            sx={{ my: 0 }}
          />
        </ListItemButton>
        <Tooltip title="Delete session">
          <span>
            <IconButton
              aria-label={`Delete ${session.name}`}
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting}
              size="small"
              sx={{
                mr: 1,
                color: "text.secondary",
                "&:hover": { color: "error.main", bgcolor: "error.50" },
              }}
            >
              {isDeleting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DeleteIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        header="Delete Session"
        maxWidth="xs"
        fullWidth
      >
        <Typography variant="body1" sx={{ mb: 3 }}>
          Are you sure you want to delete this session? This action cannot be undone.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </Box>
      </Dialog>
    </>
  );
}
