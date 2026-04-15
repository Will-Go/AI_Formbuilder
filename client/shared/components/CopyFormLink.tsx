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
import { useQueryClient } from "@tanstack/react-query";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";
import { Form, FormStatus } from "@/shared/types/forms";

interface CopyFormLinkProps {
  formId: string;
  formStatus: FormStatus;
  formTitle: string;
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
  buttonText = "Copy respondent link",
  snackbarMessage = "Link copied to clipboard",
  variant = "outlined",
  startIcon = <LinkIcon />,
  sx,
}: CopyFormLinkProps) {
  const isPublished = formStatus === FormStatus.PUBLISHED;
  const queryClient = useQueryClient();
  const updateFormMetaMutation = useAppMutation<
    unknown,
    Error,
    Partial<Form>,
    { previousForm?: Form }
  >({
    mutationKey: ["form-builder", "update-form-meta", formId],
    mutationFn: async (updates) => {
      return apiRequest({
        method: "patch",
        url: `/form/${formId}`,
        data: updates,
      });
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({
        queryKey: ["form-builder", "form-details", formId],
      });

      const previousForm = queryClient.getQueryData<Form>([
        "form-builder",
        "form-details",
        formId,
      ]);

      if (previousForm) {
        queryClient.setQueryData<Form>(
          ["form-builder", "form-details", formId],
          {
            ...previousForm,
            ...updates,
          },
        );
      }

      return { previousForm };
    },
    onError: (err, variables, context) => {
      if (context?.previousForm) {
        queryClient.setQueryData(
          ["form-builder", "form-details", formId],
          context.previousForm,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["form-builder", "form-details", formId],
      });
    },
    errorMsg: "Failed to update form",
  });

  const updateFormMeta = (id: string, updates: Partial<Form>) => {
    updateFormMetaMutation.mutate(updates);
  };

  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [publishDecisionDialogOpen, setPublishDecisionDialogOpen] =
    React.useState(false);
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const open = Boolean(anchorEl);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/forms/${formId}/view-form`;
    void navigator.clipboard.writeText(url);
    setSnackbarOpen(true);
    setAnchorEl(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isPublished) {
      setShareDialogOpen(true);
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
