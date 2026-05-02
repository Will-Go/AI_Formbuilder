"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import type { StagedChange } from "@/shared/types/aiChat";
import type { Option } from "@/shared/types/forms";
import { useFormsStore } from "../../form-dashboard/store/formsStore";
import { stripHtml } from "@/shared/utils/html";
import { cn } from "@/shared/utils/cn";

interface StagedChangeCardProps {
  change: StagedChange;
  onAccept: () => void;
  onReject: () => void;
  isAccepting?: boolean;
  className?: string;
}

const TYPE_CONFIG = {
  add: { label: "Add", color: "#22c55e", Icon: AddCircleOutlineIcon },
  update: { label: "Update", color: "#f59e0b", Icon: EditOutlinedIcon },
  delete: { label: "Delete", color: "#ef4444", Icon: DeleteOutlineIcon },
  update_form: { label: "Form", color: "#6366f1", Icon: EditOutlinedIcon },
} as const;

function getBorderColor(accepted: boolean | null) {
  if (accepted === true) return "success.main";
  if (accepted === false) return "error.main";
  return "divider";
}

function getBgColor(accepted: boolean | null) {
  if (accepted === true) return "success.50";
  if (accepted === false) return "error.50";
  return "background.paper";
}

const tryParseJson = (str: string) => {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
};

export default function StagedChangeCard({
  change,
  onAccept,
  onReject,
  isAccepting = false,
  className,
}: StagedChangeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const form = useFormsStore((s) => s.form);
  const questions = useFormsStore((s) => s.getQuestions());
  const originalQuestion = questions.find((q) => q.id === change.questionId);
  const [past] = useState(
    change.past
      ? tryParseJson(change.past)
      : change.type === "update_form"
        ? form
        : originalQuestion,
  );

  const cfg = TYPE_CONFIG[change.type];

  const isPending = change.accepted === null;
  const isAccepted = change.accepted === true;
  const isRejected = change.accepted === false;

  // Helper to format values for display
  const formatValue = (val: unknown, field: string) => {
    if (val === undefined || val === null) return "–";
    if (field === "required") return val ? "Required" : "Optional";

    if (field === "options") {
      const options = typeof val === "string" ? tryParseJson(val) : val;
      if (Array.isArray(options)) {
        return options.map((o: Option) => o.label || o.value).join(", ");
      }
    }

    return String(val);
  };

  // Dynamic label rendering based on change type
  const renderLabel = () => {
    const payload = (change.payload as Record<string, unknown>) || {};

    if (change.type === "update" || change.type === "update_form") {
      const knownFields = [
        "label",
        "title",
        "description",
        "placeholder",
        "required",
        "options",
      ] as const;
      const updatedFields = knownFields.filter((f) => payload[f] !== undefined);
      const fieldsToRender =
        updatedFields.length > 0 ? updatedFields : Object.keys(payload);

      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            width: "100%",
            mt: 0.5,
          }}
        >
          {fieldsToRender.map((field) => {
            const fieldKey = field.toString();
            //FOR QUESTIONS THAT HAVE OPTIONS
            if (fieldKey === "options" && isExpanded) {
              const oldVal = (past as Record<string, unknown>)?.options || past;
              const newVal = payload.options;

              const oldOptions = Array.isArray(oldVal)
                ? (oldVal as Option[])
                : [];
              const newOptions = Array.isArray(newVal)
                ? (newVal as Option[])
                : [];

              return (
                <Box
                  key={fieldKey}
                  sx={{
                    mt: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: "text.disabled",
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        OLD OPTIONS
                      </Typography>
                      <Box
                        component="ul"
                        sx={{ m: 0, p: 0, listStyle: "none" }}
                      >
                        {oldOptions.map((opt: Option, i: number) => (
                          <Typography
                            key={opt.id + i}
                            component="li"
                            variant="body2"
                            sx={{
                              fontSize: 11,
                              color: "text.secondary",
                              textDecoration: "line-through",
                            }}
                          >
                            • {opt.label}
                          </Typography>
                        ))}
                        {oldOptions.length === 0 && (
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: 11,
                              color: "text.disabled",
                              fontStyle: "italic",
                            }}
                          >
                            No options
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 700,
                          color: "primary.main",
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        NEW OPTIONS
                      </Typography>
                      <Box
                        component="ul"
                        sx={{ m: 0, p: 0, listStyle: "none" }}
                      >
                        {newOptions.map((opt: Option, i: number) => (
                          <Typography
                            key={opt.id + i}
                            component="li"
                            variant="body2"
                            sx={{ fontSize: 11, fontWeight: 600 }}
                          >
                            • {opt.label}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            }

            const oldRaw =
              past && typeof past === "object"
                ? (past as Record<string, unknown>)[fieldKey]
                : fieldKey === updatedFields[0]
                  ? past
                  : (originalQuestion as Record<string, unknown>)?.[fieldKey];

            const oldVal = formatValue(oldRaw, fieldKey);
            const newVal = formatValue(payload[fieldKey], fieldKey);

            return (
              <Box
                key={fieldKey}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  minWidth: 0,
                  width: "100%",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.disabled",
                    minWidth: 50,
                    flexShrink: 0,
                    textTransform: "capitalize",
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {fieldKey}:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 10,
                    fontWeight: 400,
                    color: "text.secondary",
                    textDecoration: "line-through",
                    overflow: isExpanded ? "visible" : "hidden",
                    textOverflow: isExpanded ? "clip" : "ellipsis",
                    whiteSpace: isExpanded ? "pre-wrap" : "nowrap",
                    maxWidth: isExpanded ? "none" : "35%",
                  }}
                  title={oldVal}
                >
                  {stripHtml(oldVal)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontSize: 10, color: "text.disabled", flexShrink: 0 }}
                >
                  →
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: "text.primary",
                    overflow: isExpanded ? "visible" : "hidden",
                    textOverflow: isExpanded ? "clip" : "ellipsis",
                    whiteSpace: isExpanded ? "pre-wrap" : "nowrap",
                    maxWidth: isExpanded ? "none" : "35%",
                  }}
                  title={newVal}
                >
                  {stripHtml(newVal)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      );
    }

    // For 'add' and 'delete', show the label
    const labelToDisplay = String(
      change.past || payload.label || originalQuestion?.label || "–",
    );
    const isDelete = change.type === "delete";
    const addOptions =
      change.type === "add" && Array.isArray(payload.options)
        ? (payload.options as Option[])
        : [];

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Typography
          variant="body2"
          sx={{
            fontSize: 12,
            fontWeight: isDelete ? 500 : 600,
            color: isDelete ? "text.secondary" : "text.primary",
            textDecoration: isDelete ? "line-through" : "none",
            overflow: isExpanded ? "visible" : "hidden",
            textOverflow: isExpanded ? "clip" : "ellipsis",
            whiteSpace: isExpanded ? "pre-wrap" : "nowrap",
          }}
          title={labelToDisplay}
        >
          {stripHtml(labelToDisplay)}
        </Typography>
        {isExpanded && addOptions.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                display: "block",
                mb: 0.5,
              }}
            >
              OPTIONS
            </Typography>
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none" }}>
              {addOptions.map((opt: Option, i: number) => (
                <Typography
                  key={(opt.id ?? "opt") + i}
                  component="li"
                  variant="body2"
                  sx={{ fontSize: 11, fontWeight: 600 }}
                >
                  • {opt.label || opt.value}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  const handleScrollToQuestion = () => {
    const targetId =
      change.type === "update_form"
        ? "builder-form-header"
        : `question-${change.questionId || change.id}`;
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <Box
      onClick={handleScrollToQuestion}
      className={cn("transition-colors", className)}
      sx={{
        borderRadius: 0,
        borderLeft: "4px solid",
        borderColor:
          isAccepted || isRejected
            ? getBorderColor(change.accepted)
            : "transparent",
        bgcolor: getBgColor(change.accepted),
        px: 2,
        py: 1.5,
        display: "flex",
        alignItems: "start",
        gap: 1,
        transition: "all 0.2s ease",
        cursor: "pointer",
        "&:hover": {
          bgcolor: "rgba(0,0,0,0.02)",
        },
      }}
    >
      {/* Type icon */}
      <Tooltip title={cfg.label} placement="top">
        <cfg.Icon
          sx={{ fontSize: 16, color: cfg.color, flexShrink: 0 }}
          aria-hidden="false"
          aria-label={`${cfg.label} icon`}
        />
      </Tooltip>

      {/* Type chip + label */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.25,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Chip
              label={cfg.label}
              size="small"
              sx={{
                height: 18,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: cfg.color,
                color: "#fff",
                borderRadius: 0.75,
              }}
            />
            {change.questionType && (
              <Chip
                label={change.questionType.replace("_", " ")}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: 10, borderRadius: 0.75 }}
              />
            )}
          </Box>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            sx={{ width: 20, height: 20, p: 0, color: "text.secondary" }}
          >
            {isExpanded ? (
              <ExpandLessIcon sx={{ fontSize: 16 }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        </Box>
        {renderLabel()}
      </Box>

      {/* Status badge or action buttons */}
      {isAccepted && (
        <Typography
          variant="caption"
          sx={{ color: "success.main", fontWeight: 600 }}
        >
          Accepted
        </Typography>
      )}
      {isRejected && (
        <Typography
          variant="caption"
          sx={{ color: "error.main", fontWeight: 600 }}
        >
          Rejected
        </Typography>
      )}
      {isAccepting ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            color: "text.secondary",
            flexShrink: 0,
          }}
        >
          <CircularProgress size={14} thickness={5} />
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            Applying
          </Typography>
        </Box>
      ) : isPending ? (
        <Box sx={{ display: "flex", gap: 0.25 }}>
          <Tooltip title="Accept">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onAccept();
              }}
              sx={{
                bgcolor: "success.main",
                color: "#fff",
                width: 24,
                height: 24,
                "&:hover": { bgcolor: "success.dark" },
              }}
              aria-label={`Accept ${change.type} change`}
            >
              <CheckIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              sx={{
                bgcolor: "error.main",
                color: "#fff",
                width: 24,
                height: 24,
                "&:hover": { bgcolor: "error.dark" },
              }}
              aria-label={`Reject ${change.type} change`}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ) : null}
    </Box>
  );
}
