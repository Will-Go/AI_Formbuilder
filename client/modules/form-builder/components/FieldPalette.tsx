"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { QUESTION_TYPE_META } from "@/shared/constants/question-types";
import type { QuestionType } from "@/shared/types/forms";
import { PaletteItem } from "./PaletteItem";

export default function FieldPalette({
  activeDragType,
  onAddQuestion,
}: {
  activeDragType: QuestionType | null;
  onAddQuestion: (type: QuestionType) => void;
}) {
  const groups = QUESTION_TYPE_META.reduce<
    Record<string, typeof QUESTION_TYPE_META>
  >((acc, m) => {
    const key = m.group;
    acc[key] = [...(acc[key] ?? []), m] as typeof QUESTION_TYPE_META;
    return acc;
  }, {});

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, position: "sticky", top: 96 }}
      id="field-palette"
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          pb: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          Fields
        </Typography>
      </Box>
      <Divider />
      <Box
        sx={{
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#ccc",
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#aaa",
          },
        }}
      >
        {Object.entries(groups).map(([group, items], idx) => (
          <Box key={group}>
            {idx !== 0 ? <Divider sx={{ my: 1 }} /> : null}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 1, py: 0.5 }}
            >
              {group}
            </Typography>
            <List dense disablePadding>
              {items.map((m) => (
                <PaletteItem
                  key={m.type}
                  type={m.type}
                  label={m.label}
                  icon={m.icon}
                  activeDragType={activeDragType}
                  onAddQuestion={onAddQuestion}
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
