"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material/";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import React from "react";
import type { Form } from "@/shared/types/forms";
import { formatShortDate } from "@/shared/utils/dateFormatter";
import { stripHtml } from "@/shared/utils/html";

export default function FormCard({
  form,
  responseCount,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  form: Form;
  responseCount: number;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Card
        variant="outlined"
        className="cursor-pointer! hover:shadow-md! hover:border-accent-200! transition-all! duration-300"
        onClick={onOpen}
      >
        <CardContent sx={{ display: "block", padding: 0 }}>
          <Box
            sx={{
              height: 92,
              bgcolor: "primary.main",
              opacity: 0.12,
            }}
          />
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
                {stripHtml(form.title) || "Untitled form"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Updated {formatShortDate(form.updatedAt)} • {responseCount}{" "}
                responses
              </Typography>
            </Box>
            <IconButton
              aria-label="Form actions"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setAnchorEl(e.currentTarget);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onOpen();
          }}
        >
          <EditIcon fontSize="small" />
          <Box sx={{ width: 8 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDuplicate();
          }}
        >
          <ContentCopyIcon fontSize="small" />
          <Box sx={{ width: 8 }} />
          Make a copy
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete();
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" />
          <Box sx={{ width: 8 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}
