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

export default function BuilderTopBar({
  form,
  isSaving = false,
  onUpdateFormMeta,
}: {
  form: Form;
  isSaving?: boolean;
  onUpdateFormMeta: (updates: Partial<Form>) => void;
}) {
  const { queryParams } = useQueryParams(["tab"]);
  const tab = queryParams?.tab || "builder";

  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;

  //TODO: update this and set a template for the moment:
  const updateFormMeta = (meta: Partial<Form>) => {
    onUpdateFormMeta(meta);
  };

  const [title, setTitle] = React.useState(() => stripHtml(form.title));

  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [publishedOptionsDialogOpen, setPublishedOptionsDialogOpen] =
    useState(false);

  React.useEffect(() => {
    setTitle(stripHtml(form.title));
  }, [form.title]);

  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== stripHtml(form.title)) {
      updateFormMeta({ title: trimmed });
    } else {
      setTitle(stripHtml(form.title));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        backdropFilter: "blur(10px)",
        height: 112,
        maxHeight: 112,
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton aria-label="Back" onClick={() => router.push("/forms")}>
          <ArrowBackIcon />
        </IconButton>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}
        >
          <Image
            src={"/form_ai_icon.svg"}
            alt="Form Icon"
            width={24}
            height={24}
          />
          <InputBase
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Untitled form"
            sx={{
              fontSize: "1.125rem",
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
              },
            }}
          />
          {form.status === FormStatus.PUBLISHED && (
            <Chip
              label="Public"
              size="small"
              color="success"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
          {form.status === FormStatus.PRIVATE && (
            <Chip
              label="Private"
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
          {form.status === FormStatus.CLOSED && (
            <Chip
              label="Closed"
              size="small"
              color="error"
              variant="outlined"
              sx={{ ml: 1 }}
            />
          )}
          {/* Saving Status Indicator */}
          <Box
            sx={{
              display: "flex",
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
        <Box sx={{ flex: 1 }} />
        <Link href={`/forms/${formId}/preview`} target="_blank">
          <IconButton aria-label="Preview">
            <PreviewIcon />
          </IconButton>
        </Link>
        <CopyFormLink
          formId={formId}
          formStatus={form.status}
          formTitle={title}
          isPublished={form.status === FormStatus.PUBLISHED}
          startIcon={<ShareIcon />}
          buttonText="Share"
          variant="text"
        />

        <Button
          startIcon={
            form.status === FormStatus.PUBLISHED ? <TuneIcon /> : <SendIcon />
          }
          variant={
            form.status === FormStatus.PUBLISHED ? "outlined" : "contained"
          }
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
          {form.status === FormStatus.PUBLISHED ||
          form.status === FormStatus.PRIVATE
            ? "Published"
            : "Publish"}
        </Button>

        <UserProfile />
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
            label="Responses"
            onClick={() => router.push(`/forms/${formId}?tab=responses`)}
          />
          <Tab
            value="settings"
            label="Settings"
            onClick={() => router.push(`/forms/${formId}?tab=settings`)}
          />
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
