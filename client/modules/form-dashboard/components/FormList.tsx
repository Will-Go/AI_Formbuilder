"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Form } from "@/shared/types/forms";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React from "react";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FormListItem from "./FormListItem";

dayjs.extend(isToday);

interface FormListProps {
  forms: Form[];
  onOpen: (formId: string) => void;
  onDuplicate: (formId: string) => void;
  onDelete: (formId: string) => void;
}

export default function FormList({
  forms,
  onOpen,
  onDuplicate,
  onDelete,
}: FormListProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedFormId, setSelectedFormId] = React.useState<string | null>(
    null,
  );
  const open = Boolean(anchorEl);

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    formId: string,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedFormId(formId);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setSelectedFormId(null);
  };

  if (forms.length === 0) {
    return (
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No forms yet. Create one from the template gallery above.
        </Typography>
      </Box>
    );
  }

  const todayForms = forms.filter((f) => dayjs(f.updatedAt).isToday());
  const previousForms = forms.filter((f) => !dayjs(f.updatedAt).isToday());

  return (
    <Box sx={{ px: { xs: 0, sm: 0 }, pb: 6 }}>
      {todayForms.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, px: 2 }}>
            Today
          </Typography>
          {todayForms.map((f) => (
            <FormListItem
              key={f.id}
              form={f}
              onOpen={onOpen}
              onMenuOpen={handleClick}
            />
          ))}
        </Box>
      )}

      {previousForms.length > 0 && (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, px: 2 }}>
            Earlier
          </Typography>
          {previousForms.map((f) => (
            <FormListItem
              key={f.id}
              form={f}
              onOpen={onOpen}
              onMenuOpen={handleClick}
            />
          ))}
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onOpen(selectedFormId!);
          }}
        >
          <EditIcon fontSize="small" />
          <Box sx={{ width: 8 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDuplicate(selectedFormId!);
          }}
        >
          <ContentCopyIcon fontSize="small" />
          <Box sx={{ width: 8 }} />
          Make a copy
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(selectedFormId!);
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" />
          <Box sx={{ width: 8 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
