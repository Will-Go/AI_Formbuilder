"use client";

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import Dialog from "@/shared/components/Dialog";
import { FormStatus } from "@/shared/types/forms";

interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
  formId: string;
  formStatus: FormStatus;
  onStatusChange: (status: FormStatus) => void;
}

interface PublishDecisionDialogProps extends BaseDialogProps {
  onOpenManage: () => void;
  onPublish: () => void;
}

export function PublishDecisionDialog({
  open,
  onClose,
  formStatus,
  onOpenManage,
  onPublish,
}: PublishDecisionDialogProps) {
  const isPrivate = formStatus === FormStatus.PRIVATE;

  return (
    <Dialog
      open={open}
      setOpen={(isOpen) => !isOpen && onClose()}
      header={
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Publish Form
        </Typography>
      }
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            py: 3,
            px: 1,
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <PersonAddAltIcon sx={{ color: "text.secondary", mt: 0.5 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Respondents
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: isPrivate ? "grey.200" : "success.50",
                    p: 0.5,
                    borderRadius: "50%",
                    display: "flex",
                  }}
                >
                  {isPrivate ? (
                    <LockIcon
                      fontSize="small"
                      sx={{ color: "text.secondary" }}
                    />
                  ) : (
                    <PublicIcon
                      fontSize="small"
                      sx={{ color: "success.main" }}
                    />
                  )}
                </Box>
                <Typography variant="body1">
                  {isPrivate ? "Restricted" : "Anyone with the link"}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={onOpenManage}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                Manage
              </Button>
            </Box>
          </Box>
        </Box>
        <Divider />
        <Box
          sx={{ py: 3, px: 1, display: "flex", alignItems: "center", gap: 2 }}
        >
          <NotificationsNoneIcon sx={{ color: "text.secondary" }} />
          <Typography variant="body2" color="text.secondary">
            No one will be notified when this form is published
          </Typography>
        </Box>
        <Divider />
        <Box
          sx={{
            pt: 2,
            pb: 1,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            onClick={onClose}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={onPublish}
            sx={{
              textTransform: "none",
              bgcolor: "primary.dark",
              borderRadius: 2,
            }}
          >
            Publish
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
