"use client";

import React from "react";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import LinkIcon from "@mui/icons-material/Link";
import { createPortal } from "react-dom";
import Menu from "@mui/material/Menu";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { PublishDecisionDialog } from "@/modules/form-builder/components/PublishDecisionDialog";
import { ShareDialog } from "@/modules/form-builder/components/ShareDialog";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import { FormStatus } from "@/shared/types/forms";

interface CopyFormLinkProps {
  formId: string;
  formStatus: FormStatus;
  formTitle: string;
  isPublished?: boolean;
  buttonText?: string;
  snackbarMessage?: string;
  variant?: "text" | "outlined" | "contained";
  startIcon?: React.ReactNode;
  sx?: React.ComponentProps<typeof Button>["sx"];
}

export function CopyFormLink({
  formId,
  formStatus,
  formTitle,
  isPublished = true,
  buttonText = "Copy respondent link",
  snackbarMessage = "Link copied to clipboard",
  variant = "outlined",
  startIcon = <LinkIcon />,
  sx,
}: CopyFormLinkProps) {
  const updateFormMeta = useFormsStore((s) => s.updateFormMeta);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [publishDecisionDialogOpen, setPublishDecisionDialogOpen] =
    React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const open = Boolean(anchorEl);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/forms/${formId}/viewForm`;
    void navigator.clipboard.writeText(url);
    setSnackbarOpen(true);
    setAnchorEl(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isPublished) {
      handleCopyLink();
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePublish = () => {
    setPublishDecisionDialogOpen(true);
    handleClose();
  };

  return (
    <>
      <Button
        variant={variant}
        startIcon={startIcon}
        onClick={handleClick}
        sx={sx}
      >
        {buttonText}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Form not published
          </Typography>
          <Typography variant="body2" sx={{ my: 1 }}>
            Right now, no one can respond. Do you want to copy the link to the
            unpublished form?
          </Typography>
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}
          >
            <Button onClick={handlePublish}>Publish</Button>
            <Button variant="contained" onClick={handleCopyLink}>
              Copy
            </Button>
          </Box>
        </Box>
      </Menu>
      <PublishDecisionDialog
        open={publishDecisionDialogOpen}
        onClose={() => setPublishDecisionDialogOpen(false)}
        formId={formId}
        formStatus={formStatus}
        onStatusChange={(status) => updateFormMeta(formId, { status })}
        onOpenManage={() => {
          setPublishDecisionDialogOpen(false);
          setShareDialogOpen(true);
        }}
        onPublish={() => {
          updateFormMeta(formId, { status: FormStatus.PUBLISHED });
          setPublishDecisionDialogOpen(false);
        }}
      />
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        formId={formId}
        formStatus={formStatus}
        onStatusChange={(status) => updateFormMeta(formId, { status })}
        formTitle={formTitle}
      />
      {createPortal(
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          open={snackbarOpen}
          autoHideDuration={2000}
          onClose={() => setSnackbarOpen(false)}
          message={snackbarMessage}
        />,
        document.body,
      )}
    </>
  );
}
