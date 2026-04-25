"use client";

import React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
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

interface StagedChangeCardProps {
  change: StagedChange;
  onAccept: () => void;
  onReject: () => void;
}

const TYPE_CONFIG = {
  add: { label: "Add", color: "#22c55e", Icon: AddCircleOutlineIcon },
  update: { label: "Update", color: "#f59e0b", Icon: EditOutlinedIcon },
  delete: { label: "Delete", color: "#ef4444", Icon: DeleteOutlineIcon },
} as const;

function getBorderColor(accepted: boolean | null) {
  if (accepted === true) return "success.main";
  if (accepted === false) return "error.main";
  return "divider";
}

function getBgColor(accepted: boolean | null) {
  if (accepted === true) return "success.50";
  if (accepted === false) return "error.50";
  return "background.default";
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
}: StagedChangeCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const questions = useFormsStore((s) => s.getQuestions());
  const originalQuestion = questions.find((q) => q.id === change.questionId);
  const past = React.useMemo(
    () => (change.past ? tryParseJson(change.past) : originalQuestion),
    [change.past, originalQuestion],
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

    if (change.type === "update") {
      const knownFields = [
        "label",
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
                    fontSize: 12,
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
                  {oldVal}
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
                    fontSize: 12,
                    fontWeight: 600,
                    color: "text.primary",
                    overflow: isExpanded ? "visible" : "hidden",
                    textOverflow: isExpanded ? "clip" : "ellipsis",
                    whiteSpace: isExpanded ? "pre-wrap" : "nowrap",
                    maxWidth: isExpanded ? "none" : "35%",
                  }}
                  title={newVal}
                >
                  {newVal}
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

    return (
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
        {labelToDisplay}
      </Typography>
    );
  };

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: getBorderColor(change.accepted),
        bgcolor: getBgColor(change.accepted),
        px: 1.5,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        transition: "all 0.2s ease",
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
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ width: 20, height: 20, p: 0 }}
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
      {isPending && (
        <Box sx={{ display: "flex", gap: 0.25 }}>
          <Tooltip title="Accept">
            <IconButton
              size="small"
              onClick={onAccept}
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
              onClick={onReject}
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
      )}
    </Box>
  );
}
