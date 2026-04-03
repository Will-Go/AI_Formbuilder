"use client";

import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DescriptionIcon from "@mui/icons-material/Description";
// import PeopleIcon from "@mui/icons-material/People";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import type { Form } from "@/shared/types/forms";
import { stripHtml } from "@/shared/utils/html";

dayjs.extend(isToday);

interface FormListItemProps {
  form: Form;
  onOpen: (formId: string) => void;
  onMenuOpen: (
    event: React.MouseEvent<HTMLButtonElement>,
    formId: string,
  ) => void;
  responseCount?: number;
}

export default function FormListItem({
  form,
  onOpen,
  onMenuOpen,
  responseCount = 0,
}: FormListItemProps) {
  const updatedAt = dayjs(form.updatedAt);
  const dateStr = updatedAt.isToday()
    ? updatedAt.format("HH:mm")
    : updatedAt.format("D MMM YYYY");

  return (
    <Box
      onClick={() => onOpen(form.id)}
      sx={{
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 0.5,
        cursor: "pointer",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
      className="hover:bg-accent-50"
    >
      <DescriptionIcon color="primary" sx={{ mr: 2, fontSize: 20 }} />
      <Box sx={{ flex: 3, minWidth: 0, display: "flex", alignItems: "center" }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, mr: 1, fontSize: "0.8125rem" }}
          noWrap
        >
          {stripHtml(form.title) || "Untitled form"}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, textAlign: "left" }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: "0.8125rem" }}
        >
          {form.authorId}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, textAlign: "left" }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: "0.8125rem" }}
        >
          {form.responseCount ?? 0} responses
        </Typography>
      </Box>
      <Box sx={{ flex: 1, textAlign: "left" }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: "0.8125rem" }}
        >
          {dateStr}
        </Typography>
      </Box>
      <IconButton
        className="more-btn"
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onMenuOpen(e, form.id);
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
