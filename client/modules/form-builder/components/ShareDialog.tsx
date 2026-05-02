"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import { Alert } from "@mui/material";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import Dialog from "@/shared/components/Dialog";
import { FormStatus } from "@/shared/types/forms";
import { useAuth } from "@/shared/context/AuthContext";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";
import { useQueryClient } from "@tanstack/react-query";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import CircularProgress from "@mui/material/CircularProgress";
import { CopyFormLink } from "@/shared/components/CopyFormLink";

interface BaseDialogProps {
  open: boolean;
  onClose: () => void;
  formId: string;
  formStatus: FormStatus;
  onStatusChange: (status: FormStatus) => void;
}

interface ShareDialogProps extends BaseDialogProps {
  formTitle: string;
}

export function ShareDialog({
  open,
  onClose,
  formId,
  formTitle,
  formStatus,
  onStatusChange,
}: ShareDialogProps) {
  const { user } = useAuth();

  const [tempStatus, setTempStatus] = useState<FormStatus>(
    formStatus === FormStatus.DRAFT || formStatus === FormStatus.CLOSED
      ? FormStatus.PUBLISHED
      : formStatus,
  );

  React.useEffect(() => {
    if (open) {
      setTempStatus(
        formStatus === FormStatus.DRAFT || formStatus === FormStatus.CLOSED
          ? FormStatus.PUBLISHED
          : formStatus,
      );
    }
  }, [open, formStatus]);

  const queryClient = useQueryClient();
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");

  const { data: sharedListResponse, isLoading } = useAppQuery<{
    sharedList: Array<{ id: string; email: string; created_at: string }>;
  }>({
    queryKey: ["form-share-list", formId],
    queryFn: () => apiRequest({ method: "get", url: `/form/${formId}/share` }),
    enabled: open,
    showTranslatedErrorToast: false,
  });

  const sharedUsers = sharedListResponse?.sharedList || [];

  const addShareMutation = useAppMutation<
    { sharedUser: { id: string; email: string; created_at: string } },
    Error,
    { email: string }
  >({
    mutationFn: (data) =>
      apiRequest({ method: "post", url: `/form/${formId}/share`, data }),
    onSuccess: () => {
      setEmailInput("");
      setEmailError("");
      queryClient.invalidateQueries({ queryKey: ["form-share-list", formId] });
    },
    showErrorToast: true,
  });

  const removeShareMutation = useAppMutation<unknown, Error, { email: string }>(
    {
      mutationFn: (data) =>
        apiRequest({
          method: "delete",
          url: `/form/${formId}/share/${encodeURIComponent(data.email)}`,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["form-share-list", formId],
        });
      },
    },
  );

  const validateEmail = (email: string) => {
    if (!email) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Invalid email address";
    if (sharedUsers.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      return "Email is already in the shared list";
    if (email.toLowerCase() === user?.email?.toLowerCase())
      return "You are already the owner";
    return "";
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmailInput(val);
    setEmailError(validateEmail(val));
  };

  const handleAddEmail = () => {
    const err = validateEmail(emailInput);
    if (err) {
      setEmailError(err);
      return;
    }
    if (emailInput) {
      addShareMutation.mutate({ email: emailInput });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleDone = () => {
    onStatusChange(tempStatus);
    onClose();
  };
  const emailUser = user?.email || "";
  const nameUser = emailUser.split("@")[0] || "";
  const initialUser = nameUser?.[0] || "";

  return (
    <Dialog
      open={open}
      setOpen={(isOpen) => !isOpen && onClose()}
      header={
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Share &quot;{formTitle || "Untitled Form"}&quot;
        </Typography>
      }
      maxWidth="sm"
      fullWidth
    >
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1, pb: 2 }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Add people via email"
            size="small"
            value={emailInput}
            onChange={handleEmailInputChange}
            onKeyDown={handleKeyDown}
            error={!!emailError}
            helperText={emailError}
          />
          <Button
            variant="contained"
            disabled={!emailInput || !!emailError || addShareMutation.isPending}
            onClick={handleAddEmail}
            sx={{ height: 40 }}
          >
            {addShareMutation.isPending ? (
              <CircularProgress size={24} />
            ) : (
              "Add"
            )}
          </Button>
        </Box>

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            People with access
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
                {initialUser}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {nameUser} (you)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {emailUser}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Owner
              </Typography>
            </Box>

            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              sharedUsers.map((u) => {
                const uName = u.email.split("@")[0];
                return (
                  <Box
                    key={u.id}
                    sx={{ display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <Avatar
                      sx={{ bgcolor: "secondary.main", width: 40, height: 40 }}
                    >
                      {uName?.[0]?.toUpperCase() || "?"}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {uName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        removeShareMutation.mutate({ email: u.email })
                      }
                      disabled={removeShareMutation.isPending}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })
            )}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            General access
          </Typography>
          {/* TODO: comment out for the moment future feature  */}
          {/* <Box
            sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}
          >
            <Box
              sx={{
                bgcolor: "grey.200",
                p: 1,
                borderRadius: "50%",
                display: "flex",
                mt: 0.5,
              }}
            >
              <LockIcon fontSize="small" sx={{ color: "text.secondary" }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Editor view
                </Typography>
                <Select
                  value="restringido"
                  size="small"
                  variant="standard"
                  disableUnderline
                  sx={{ fontWeight: 500, fontSize: "0.875rem" }}
                >
                  <MenuItem value="restringido">Restricted</MenuItem>
                </Select>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Only users with access can open the link
              </Typography>
            </Box>
          </Box> */}

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box
              sx={{
                bgcolor:
                  tempStatus === FormStatus.PRIVATE ? "grey.200" : "success.50",
                p: 1,
                borderRadius: "50%",
                display: "flex",
                mt: 0.5,
              }}
            >
              {tempStatus === FormStatus.PRIVATE ? (
                <LockIcon fontSize="small" sx={{ color: "text.secondary" }} />
              ) : (
                <PublicIcon fontSize="small" sx={{ color: "success.main" }} />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Respondent view
                </Typography>
                <Select
                  value={
                    tempStatus === FormStatus.PRIVATE
                      ? "restringido"
                      : "publico"
                  }
                  onChange={(e) =>
                    setTempStatus(
                      e.target.value === "restringido"
                        ? FormStatus.PRIVATE
                        : FormStatus.PUBLISHED,
                    )
                  }
                  size="small"
                  variant="standard"
                  disableUnderline
                  sx={{ fontWeight: 500, fontSize: "0.875rem" }}
                >
                  <MenuItem value="restringido">Restricted</MenuItem>
                  <MenuItem value="publico">Anyone with the link</MenuItem>
                </Select>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {tempStatus === FormStatus.PRIVATE
                  ? "Only added people can respond"
                  : "Any Internet user with the link can respond"}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ alignSelf: "center" }}
            >
              Respondent
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" icon={<NotificationsNoneIcon color="primary" />}>
          <Typography variant="body2" sx={{ color: "primary.dark" }}>
            Publish the form to accept responses
          </Typography>
        </Alert>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            mt: 1,
          }}
        >
          <CopyFormLink
            formId={formId}
            formStatus={formStatus}
            formTitle={formTitle}
          />
          <Button
            variant="contained"
            onClick={handleDone}
            sx={{ textTransform: "none", borderRadius: 4, px: 3 }}
          >
            Done
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
