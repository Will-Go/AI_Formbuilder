"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useRouter } from "next/navigation";
import type { FormStatus } from "@/shared/types/forms";
import { CopyFormLink } from "@/shared/components/CopyFormLink";

interface PreviewTopBarProps {
  formId: string;
  formStatus: FormStatus;
  formTitle: string;
  onManagePublish: () => void;
}

export function PreviewTopBar({
  formId,
  formStatus,
  formTitle,
  onManagePublish,
}: PreviewTopBarProps) {
  const router = useRouter();
  const isPublished = formStatus === "published";

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
      <Toolbar
        sx={{
          justifyContent: "space-between",
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Back to builder">
            <IconButton
              onClick={() => router.push(`/forms/${formId}/edit`)}
              edge="start"
            >
              <VisibilityOffIcon style={{ transform: "rotate(180deg)" }} />
            </IconButton>
          </Tooltip>
          <Typography
            variant="h6"
            color="text.primary"
            sx={{ fontWeight: 500 }}
          >
            Preview Mode
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isPublished ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CheckCircleOutlineIcon fontSize="small" color="success" />
              <Typography
                variant="body2"
                color="success"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                Published
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "text.secondary",
              }}
            >
              <VisibilityOffIcon fontSize="small" />
              <Typography
                variant="body2"
                sx={{ display: { xs: "none", sm: "block" } }}
              >
                This form does not accept responses.
              </Typography>
            </Box>
          )}
          <CopyFormLink
            formId={formId}
            formStatus={formStatus}
            formTitle={formTitle}
            isPublished={isPublished}
          />
        </Box>
      </Toolbar>
      {!isPublished && (
        <Box
          sx={{
            bgcolor: "#fff3cd",
            color: "#856404",
            p: 1,
            px: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <VisibilityOffIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              This form does not accept responses.
            </Typography>
          </Box>
          <Button
            size="small"
            sx={{
              color: "inherit",
              textTransform: "none",
              display: { xs: "none", sm: "block" },
            }}
            onClick={onManagePublish}
          >
            Manage publish settings
          </Button>
        </Box>
      )}
    </AppBar>
  );
}