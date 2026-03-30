"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PreviewIcon from "@mui/icons-material/Visibility";
import ShareIcon from "@mui/icons-material/Link";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import type { Form } from "@/shared/types/forms";
import InputBase from "@mui/material/InputBase";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import React from "react";
import Link from "next/link";

import { stripHtml } from "@/shared/utils/html";

export default function BuilderTopBar({ form }: { form: Form }) {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const updateFormMeta = useFormsStore((s) => s.updateFormMeta);

  const [title, setTitle] = React.useState(() => stripHtml(form.title));

  React.useEffect(() => {
    setTitle(stripHtml(form.title));
  }, [form.title]);

  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== stripHtml(form.title)) {
      updateFormMeta(formId, { title: trimmed });
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
        </Box>
        <Box sx={{ flex: 1 }} />
        <Link href={`/forms/${formId}/preview`} target="_blank">
          <IconButton aria-label="Preview">
            <PreviewIcon />
          </IconButton>
        </Link>
        <Button
          variant="outlined"
          startIcon={<ShareIcon />}
          onClick={() => {
            const url = `${window.location.origin}/forms/${formId}/preview`;
            void navigator.clipboard.writeText(url);
          }}
          sx={{ display: { xs: "none", sm: "inline-flex" } }}
        >
          Share
        </Button>
        <Button
          variant="contained"
          onClick={() => router.push(`/forms/${formId}/preview`)}
          sx={{ bgcolor: "primary.main" }}
        >
          Publish
        </Button>
        <IconButton aria-label="More">
          <MoreVertIcon />
        </IconButton>
      </Toolbar>
      <Box sx={{ px: { xs: 1.5, sm: 3 } }}>
        <Tabs value={0} aria-label="Builder tabs">
          <Tab label="Questions" />
          <Tab
            label="Responses"
            onClick={() => router.push(`/forms/${formId}/responses`)}
          />
          <Tab label="Settings" />
        </Tabs>
      </Box>
    </AppBar>
  );
}
