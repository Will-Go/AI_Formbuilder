"use client";

import { Container, IconButton, Typography, Stack, Box } from "@mui/material";
import React from "react";
import { useRouter } from "next/navigation";
import DashboardTopBar from "../components/DashboardTopBar";
import TemplatesRow from "../components/TemplatesRow";
import FormGrid from "../components/FormGrid";
import FormList from "../components/FormList";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { useFormsStore } from "../store/formsStore";
import { useResponsesStore } from "@/modules/form-responses/store/responsesStore";

export default function FormDashboardPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");

  const forms = useFormsStore((s) => s.forms);
  const createForm = useFormsStore((s) => s.createForm);
  const duplicateForm = useFormsStore((s) => s.duplicateForm);
  const deleteForm = useFormsStore((s) => s.deleteForm);
  const viewMode = useFormsStore((s) => s.viewMode);
  const setViewMode = useFormsStore((s) => s.setViewMode);
  const responses = useResponsesStore((s) => s.responses);
  const deleteResponsesForForm = useResponsesStore(
    (s) => s.deleteResponsesForForm,
  );

  const responseCountByFormId = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of responses) map[r.formId] = (map[r.formId] ?? 0) + 1;
    return map;
  }, [responses]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter((f) => (f.title || "").toLowerCase().includes(q));
  }, [forms, search]);

  const commonProps = {
    forms: filtered,
    responseCountByFormId,
    onOpen: (formId: string) => router.push(`/forms/${formId}/edit`),
    onDuplicate: (formId: string) => {
      const nextId = duplicateForm(formId);
      if (nextId) router.push(`/forms/${nextId}/edit`);
    },
    onDelete: (formId: string) => {
      deleteForm(formId);
      deleteResponsesForForm(formId);
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.paper" }}>
      <DashboardTopBar search={search} onSearchChange={setSearch} />
      <Box sx={{ bgcolor: "background.default" }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <TemplatesRow
            onCreateBlank={() => {
              const formId = createForm();
              router.push(`/forms/${formId}/edit`);
            }}
          />{" "}
        </Container>
      </Box>
      <Box sx={{ bgcolor: "background.paper" }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Stack
            spacing={2}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Recent forms
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                size="small"
                aria-label="Toggle view mode"
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
              >
                {viewMode === "grid" ? <ViewListIcon /> : <ViewModuleIcon />}
              </IconButton>
            </Stack>
          </Stack>
          {viewMode === "grid" ? (
            <FormGrid {...commonProps} />
          ) : (
            <FormList {...commonProps} />
          )}
        </Container>
      </Box>
    </Box>
  );
}
