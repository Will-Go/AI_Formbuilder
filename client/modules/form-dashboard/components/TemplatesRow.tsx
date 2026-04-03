"use client";

import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import React from "react";
import { FORMS_QUERY_KEY } from "@/modules/form-dashboard/pages/FormDashboardPage";
import { apiRequest } from "@/shared/utils/apiRequest";

type Template = {
  id: string;
  title: string;
  color: string;
  onClick: () => void;
};

type FormMutationResponse = {
  ok: boolean;
  formId?: string;
};

export default function TemplatesRow() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createFormMutation = useMutation<FormMutationResponse, unknown, void>({
    mutationFn: async () =>
      apiRequest<FormMutationResponse>({
        method: "post",
        url: "/form",
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      if (response.formId) {
        router.push(`/forms/${response.formId}/edit`);
      }
    },
  });

  const handleCreate = React.useCallback(() => {
    createFormMutation.mutate();
  }, [createFormMutation]);

  const TEMPLATES: readonly Template[] = [
    { id: "blank", title: "Blank", color: "#ffffff", onClick: handleCreate },
    { id: "coming", title: "Coming soon", color: "#ffffff", onClick: () => {} },
    // { id: "contact", title: "Contact info", color: "#e8f0fe" },
    // { id: "rsvp", title: "Event RSVP", color: "#e6f4ea" },
    // { id: "feedback", title: "Feedback", color: "#fce8e6" },
  ] as const;

  return (
    <Box sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Start a new form
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Template gallery
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
        {TEMPLATES.map((t) => (
          <Box key={t.id}>
            <ButtonBase sx={{}} onClick={t.onClick}>
              <Box
                className="hover:bg-accent-50 transition-colors duration-300 border border-primary-200 rounded-md hover:border-accent-200"
                sx={{
                  height: 120,
                  width: 150,
                  bgcolor: t.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {t.id === "blank" ? (
                  <AddIcon sx={{ fontSize: 40, color: "text.secondary" }} />
                ) : (
                  <Box
                    sx={{
                      width: 90,
                      height: 60,
                      bgcolor: "rgba(0,0,0,0.06)",
                      borderRadius: 1,
                    }}
                  />
                )}
              </Box>
            </ButtonBase>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
              {t.title}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
