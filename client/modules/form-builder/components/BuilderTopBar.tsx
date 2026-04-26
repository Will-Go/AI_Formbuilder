"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PreviewIcon from "@mui/icons-material/Visibility";
import ShareIcon from "@mui/icons-material/Link";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import type { Form } from "@/shared/types/forms";
import InputBase from "@mui/material/InputBase";
import React, { useState } from "react";
import Link from "next/link";
import { FormStatus } from "@/shared/types/forms";
import { PublishDecisionDialog } from "./PublishDecisionDialog";
import { ShareDialog } from "./ShareDialog";
import { PublishedOptionsDialog } from "./PublishedOptionsDialog";
import { CopyFormLink } from "@/shared/components/CopyFormLink";
import { UserProfile } from "@/shared/components/UserProfile";

import SendIcon from "@mui/icons-material/Send";
import TuneIcon from "@mui/icons-material/Tune";

import Chip from "@mui/material/Chip";

import CloudDoneIcon from "@mui/icons-material/CloudDone";
import SyncIcon from "@mui/icons-material/Sync";
import { stripHtml } from "@/shared/utils/html";
import useQueryParams from "@/shared/hooks/useQueryParams";
import { useQueryClient } from "@tanstack/react-query";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";
import { FORM_DETAILS_QUERY_KEY } from "../pages/FormBuilderPage";
import { FORMS_QUERY_KEY } from "@/modules/form-dashboard/pages/FormDashboardPage";
import { Tooltip } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { useAiChatContext } from "../context/AiChatContext";

interface BuilderTopBarProps {
  form: Form;
  isSaving?: boolean;
  aiDiffState?: "add" | "update" | "delete";
  aiMessageId?: string;
  aiChangeId?: string;
  aiPendingPayload?: Partial<Form>;
}

export default function BuilderTopBar({
  form,
  isSaving = false,
  aiDiffState,
  aiMessageId,
  aiChangeId,
  aiPendingPayload,
}: BuilderTopBarProps) {
  const { queryParams } = useQueryParams(["tab"]);
  const tab = queryParams?.tab || "builder";

  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const queryClient = useQueryClient();

  const updateFormMetaMutation = useAppMutation<
    unknown,
    Error,
    Partial<Form>,
    { previousForm?: Form }
  >({
    mutationKey: ["form-builder", "update-form-meta", formId],
    mutationFn: async (updates: Partial<Form>) => {
      return apiRequest({
        method: "patch",
        url: `/form/${formId}`,
        data: updates,
      });
    },
    onMutate: async (updates: Partial<Form>) => {
      await queryClient.cancelQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });

      const previousForm = queryClient.getQueryData<Form>([
        ...FORM_DETAILS_QUERY_KEY,
        formId,
      ]);

      if (previousForm) {
        queryClient.setQueryData<Form>([...FORM_DETAILS_QUERY_KEY, formId], {
          ...previousForm,
          ...updates,
        });
      }

      return { previousForm };
    },
    onError: (_err: Error, _variables: Partial<Form>, context) => {
      if (context?.previousForm) {
        queryClient.setQueryData(
          [...FORM_DETAILS_QUERY_KEY, formId],
          context.previousForm,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
      queryClient.invalidateQueries({
        queryKey: [...FORMS_QUERY_KEY],
      });
    },
    errorMsg: "Failed to update form",
  });

  const updateFormMeta = (meta: Partial<Form>) => {
    updateFormMetaMutation.mutate(meta);
  };

  const [title, setTitle] = React.useState(() => stripHtml(form.title));
  const [description, setDescription] = React.useState(() =>
    stripHtml(form.description ?? ""),
  );

  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [publishedOptionsDialogOpen, setPublishedOptionsDialogOpen] =
    useState(false);

  React.useEffect(() => {
    setTitle(stripHtml(form.title));
    setDescription(stripHtml(form.description ?? ""));
  }, [form.title, form.description]);

  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== stripHtml(form.title)) {
      updateFormMeta({ title: trimmed });
    } else {
      setTitle(stripHtml(form.title));
    }
  };

  const handleDescriptionBlur = () => {
    const trimmed = description.trim();
    if (trimmed !== stripHtml(form.description ?? "")) {
      updateFormMeta({ description: trimmed });
    } else {
      setDescription(stripHtml(form.description ?? ""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  const { handleAcceptChange, handleRejectChange } = useAiChatContext();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        backdropFilter: "blur(10px)",
        height: "auto",
        minHeight: 112,
      }}
    >
      {aiDiffState && aiMessageId && aiChangeId && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor:
              aiDiffState === "update"
                ? "warning.100"
                : aiDiffState === "add"
                  ? "success.100"
                  : "error.100",
            px: 3,
            py: 1,
            borderBottom: "1px solid",
            borderColor:
              aiDiffState === "update"
                ? "warning.200"
                : aiDiffState === "add"
                  ? "success.200"
                  : "error.200",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {aiDiffState === "add" ? (
              <PlaylistAddIcon fontSize="small" color="success" />
            ) : aiDiffState === "delete" ? (
              <RemoveCircleOutlineIcon fontSize="small" color="error" />
            ) : (
              <EditIcon fontSize="small" color="warning" />
            )}
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color:
                  aiDiffState === "update"
                    ? "warning.dark"
                    : aiDiffState === "add"
                      ? "success.dark"
                      : "error.dark",
              }}
            >
              AI proposed form updates
            </Typography>
            {aiPendingPayload?.title && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                &bull; Proposed Title: &quot;{aiPendingPayload.title}&quot;
              </Typography>
            )}
            {aiPendingPayload?.description && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                &bull; Proposed Description: &quot;
                {aiPendingPayload.description}
                &quot;
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={() => handleAcceptChange(aiMessageId, aiChangeId)}
              sx={{ textTransform: "none", boxShadow: "none" }}
            >
              Accept
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<CloseIcon />}
              onClick={() => handleRejectChange(aiMessageId, aiChangeId)}
              sx={{ textTransform: "none", bgcolor: "background.paper" }}
            >
              Reject
            </Button>
          </Box>
        </Box>
      )}
      <Toolbar id="builder-form-header" sx={{ gap: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 2 } }}>
        <IconButton
          aria-label="Back"
          onClick={() => router.push("/forms")}
          sx={{ display: "inline-flex" }}
          size="small"
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1 },
            minWidth: 0,
            flex: { xs: 1, sm: "auto" },
          }}
        >
          <Box sx={{ display: { xs: "none", sm: "flex" } }}>
            <Image
              src={"/form_ai_icon.svg"}
              alt="Form Icon"
              width={24}
              height={24}
            />
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <InputBase
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Untitled form"
              sx={{
                fontSize: { xs: "1rem", sm: "1.125rem" },
                fontWeight: 500,
                padding: "2px 4px",
                borderRadius: 1,
                transition: "background-color 0.2s",
                "&:hover": {
                  bgcolor: "rgba(0,0,0,0.04)",
                },
                "&:focus-within": {
                  bgcolor: "background.paper",
                  boxShadow: "0 0 0 2px rgba(103, 58, 183, 0.2)",
                },
                "& .MuiInputBase-input": {
                  padding: 0,
                  textOverflow: "ellipsis",
                },
                maxWidth: { xs: 120, sm: 200, md: "none" },
              }}
            />
            <InputBase
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              onKeyDown={handleKeyDown}
              placeholder="Form description"
              sx={{
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                color: "text.secondary",
                padding: "2px 4px",
                borderRadius: 1,
                transition: "background-color 0.2s",
                "&:hover": {
                  bgcolor: "rgba(0,0,0,0.04)",
                },
                "&:focus-within": {
                  bgcolor: "background.paper",
                  boxShadow: "0 0 0 2px rgba(103, 58, 183, 0.2)",
                },
                "& .MuiInputBase-input": {
                  padding: 0,
                  textOverflow: "ellipsis",
                },
                maxWidth: { xs: 120, sm: 200, md: "none" },
              }}
            />
          </Box>
          {form.status === FormStatus.PUBLISHED && (
            <Chip
              label="Public"
              size="small"
              color="success"
              variant="outlined"
              sx={{ ml: { xs: 0, sm: 1 }, display: { xs: "none", md: "flex" } }}
            />
          )}
          {form.status === FormStatus.PRIVATE && (
            <Chip
              label="Private"
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ ml: { xs: 0, sm: 1 }, display: { xs: "none", md: "flex" } }}
            />
          )}
          {form.status === FormStatus.CLOSED && (
            <Chip
              label="Closed"
              size="small"
              color="error"
              variant="outlined"
              sx={{ ml: { xs: 0, sm: 1 }, display: { xs: "none", md: "flex" } }}
            />
          )}
          {/* Saving Status Indicator */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 0.5,
              ml: 2,
              color: "text.secondary",
            }}
          >
            {isSaving ? (
              <>
                <SyncIcon className="animate-spin!" sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}>
                  Saving...
                </Typography>
              </>
            ) : (
              <>
                <CloudDoneIcon sx={{ fontSize: 16 }} />
                <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}>
                  Saved to cloud
                </Typography>
              </>
            )}
          </Box>
        </Box>
        <Box sx={{ flex: { xs: 0, sm: 1 } }} />
        <Box
          sx={{ display: "flex", alignItems: "center", gap: { xs: 0, sm: 1 } }}
        >
          <Link href={`/forms/${formId}/preview`} target="_blank">
            <Tooltip title="Preview">
              <IconButton aria-label="Preview" size="small">
                <PreviewIcon />
              </IconButton>
            </Tooltip>
          </Link>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <CopyFormLink
              isCopy={false}
              formId={formId}
              formStatus={form.status}
              formTitle={title}
              startIcon={<ShareIcon />}
              buttonText="Share"
              variant="text"
            />
          </Box>

          <Button
            startIcon={
              form.status === FormStatus.PUBLISHED ? <TuneIcon /> : <SendIcon />
            }
            variant={
              form.status === FormStatus.PUBLISHED ? "outlined" : "contained"
            }
            size="small"
            sx={{
              ml: { xs: 0.5, sm: 0 },
              minWidth: { xs: "auto", sm: 100 },
              px: { xs: 1, sm: 2 },
              "& .MuiButton-startIcon": {
                mr: { xs: 0, sm: 1 },
                ml: { xs: 0, sm: -0.5 },
              },
            }}
            onClick={() => {
              if (
                form.status === FormStatus.PUBLISHED ||
                form.status === FormStatus.PRIVATE
              ) {
                setPublishedOptionsDialogOpen(true);
              } else {
                setPublishDialogOpen(true);
              }
            }}
          >
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              {form.status === FormStatus.PUBLISHED ||
              form.status === FormStatus.PRIVATE
                ? "Published"
                : "Publish"}
            </Box>
          </Button>

          <UserProfile />
        </Box>
      </Toolbar>
      <Box sx={{ px: { xs: 1.5, sm: 3 } }}>
        <Tabs value={tab} aria-label="Builder tabs">
          <Tab
            value="builder"
            label="Questions"
            onClick={() => router.push(`/forms/${formId}?tab=builder`)}
          />
          <Tab
            value="responses"
            label={
              <span>
                Responses{" "}
                {form?.response_count && (
                  <Chip
                    label={form?.response_count}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </span>
            }
            onClick={() => router.push(`/forms/${formId}?tab=responses`)}
          />
          {/* NOTE: this setting page is not created */}
          {/* <Tab
            value="settings"
            label="Settings"
            onClick={() => router.push(`/forms/${formId}?tab=settings`)}
          /> */}
        </Tabs>
      </Box>

      {/* Dialogs */}
      <PublishDecisionDialog
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        formId={formId}
        formStatus={form.status}
        onStatusChange={(status) => updateFormMeta({ status })}
        onOpenManage={() => {
          setPublishDialogOpen(false);
          setShareDialogOpen(true);
        }}
        onPublish={() => {
          updateFormMeta({ status: FormStatus.PUBLISHED });
          setPublishDialogOpen(false);
        }}
      />

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        formId={formId}
        formTitle={title}
        formStatus={form.status}
        onStatusChange={(status) => {
          updateFormMeta({ status });
          if (
            status === FormStatus.PUBLISHED ||
            status === FormStatus.PRIVATE
          ) {
            // Already active/published
          }
        }}
      />

      <PublishedOptionsDialog
        open={publishedOptionsDialogOpen}
        onClose={() => setPublishedOptionsDialogOpen(false)}
        formId={formId}
        formTitle={title}
        formStatus={form.status}
        onStatusChange={(status) => updateFormMeta({ status })}
        onOpenManage={() => {
          setPublishedOptionsDialogOpen(false);
          setShareDialogOpen(true);
        }}
      />
    </AppBar>
  );
}
