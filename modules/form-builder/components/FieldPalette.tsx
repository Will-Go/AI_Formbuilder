"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { QUESTION_TYPE_META } from "@/constants/question-types";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";

export default function FieldPalette({ formId }: { formId: string }) {
  const addQuestion = useFormsStore((s) => s.addQuestion);

  const groups = QUESTION_TYPE_META.reduce<Record<string, typeof QUESTION_TYPE_META>>(
    (acc, m) => {
      const key = m.group;
      acc[key] = [...(acc[key] ?? []), m] as typeof QUESTION_TYPE_META;
      return acc;
    },
    {}
  );

  return (
    <Paper variant="outlined" sx={{ p: 1.5, position: "sticky", top: 96 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, px: 1, pb: 1 }}>
        Fields
      </Typography>
      <Divider />
      <Box sx={{ maxHeight: "calc(100vh - 140px)", overflowY: "auto" }}>
        {Object.entries(groups).map(([group, items], idx) => (
          <Box key={group}>
            {idx !== 0 ? <Divider sx={{ my: 1 }} /> : null}
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
              {group}
            </Typography>
            <List dense disablePadding>
              {items.map((m) => (
                <ListItemButton
                  key={m.type}
                  onClick={() => addQuestion(formId, m.type)}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemText
                    primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                    primary={m.label}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

