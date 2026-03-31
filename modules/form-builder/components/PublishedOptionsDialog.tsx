"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import Switch from "@mui/material/Switch";
import EditIcon from "@mui/icons-material/Edit";
import Dialog from "@/shared/components/Dialog";
import { CopyFormLink } from "@/shared/components/CopyFormLink";

import { FormStatus } from "@/shared/types/forms";

interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
  formId: string;
  formStatus: FormStatus;
  formTitle: string;
  onStatusChange: (status: FormStatus) => void;
}

interface PublishedOptionsDialogProps extends BaseDialogProps {
  onOpenManage: () => void;
}

export function PublishedOptionsDialog({
  open,
  onClose,
  formId,
  formStatus,
  formTitle,
  onStatusChange,
  onOpenManage,
}: PublishedOptionsDialogProps) {
  const [accepting, setAccepting] = useState(formStatus !== FormStatus.CLOSED);

  React.useEffect(() => {
    if (open) {
      setAccepting(formStatus !== FormStatus.CLOSED);
    }
  }, [open, formStatus]);

  const handleSave = () => {
    if (!accepting) {
      onStatusChange(FormStatus.CLOSED);
    } else if (formStatus === FormStatus.CLOSED) {
      // Re-publish as public by default if it was closed
      onStatusChange(FormStatus.PUBLISHED);
    }
    onClose();
  };

  const isPrivate = formStatus === FormStatus.PRIVATE;

  return (
    <Dialog
      open={open}
      setOpen={(isOpen) => !isOpen && onClose()}
      header={
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Published options
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
          <EditIcon sx={{ color: "text.secondary", mt: 0.5 }} />
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Accepting responses
              </Typography>
              <Switch
                checked={accepting}
                onChange={(e) => setAccepting(e.target.checked)}
                color="primary"
              />
            </Box>
            {/* TODO: this feature will be implemented in the future */}
            {/* <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: "pointer" }}
              >
                Set closing date or response limit
              </Typography>
              <Box
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  px: 1,
                  borderRadius: 2,
                  fontSize: "0.75rem",
                  py: 0.25,
                }}
              >
                New
              </Box>
            </Box> */}
          </Box>
        </Box>
        <Divider />
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
          sx={{
            pt: 2,
            pb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <CopyFormLink
            formId={formId}
            formStatus={formStatus}
            formTitle={formTitle}
            variant="outlined"
            sx={{
              textTransform: "none",
              borderRadius: 2,
              color: "primary.main",
            }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={onClose}
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                textTransform: "none",
                bgcolor: "primary.dark",
                borderRadius: 2,
              }}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
