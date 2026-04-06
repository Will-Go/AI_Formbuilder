"use client";
import React, { useState, useMemo } from "react";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  FormStatus,
  type CreateFormResponse,
  type Form,
  type FormsListResponse,
} from "@/shared/types/forms";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { useFormsStore } from "../store/formsStore";
import { apiRequest } from "@/shared/utils/apiRequest";
import FormGrid from "../components/FormGrid";
import FormList from "../components/FormList";
import DashboardTopBar from "../components/DashboardTopBar";
import TemplatesRow from "../components/TemplatesRow";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

export const FORMS_QUERY_KEY = ["dashboard", "forms"];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unexpected error";
}

export default function FormDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // Use zustand store for view mode
  const viewMode = useFormsStore((state) => state.viewMode);
  const setViewMode = useFormsStore((state) => state.setViewMode);

  const {
    data: resForms,
    isError,
    error,
    isLoading,
    reset,
  } = useAppQuery<FormsListResponse, unknown, Form[]>({
    queryKey: [...FORMS_QUERY_KEY, search, viewMode],
    queryFn: async () =>
      apiRequest<FormsListResponse>({
        method: "get",
        url: "/form",
        params: {
          search,
        },
      }),
    select: (response) => response.forms,
    staleTime: 30000,
    errorMsg: "Failed to load forms",
  });

  const forms = useMemo(() => resForms ?? [], [resForms]);

  const duplicateFormMutation = useAppMutation<
    Form,
    unknown,
    string,
    { previousForms: Form[] }
  >({
    mutationFn: async (formId) =>
      apiRequest<Form>({
        method: "post",
        url: `/form/${formId}/copy`,
      }),
    onMutate: async (formId) => {
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: FORMS_QUERY_KEY });
      const previousForms =
        queryClient.getQueryData<Form[]>(FORMS_QUERY_KEY) ?? [];
      const source = previousForms.find((item) => item.id === formId);
      const now = new Date().toISOString();

      if (source) {
        const optimisticCopy: Form = {
          ...source,
          id: `temp-copy-${Date.now()}`,
          title: `${source.title} (copy)`,
          created_at: now,
          updated_at: now,
          status: FormStatus.DRAFT,
          response_count: 0,
        };
        queryClient.setQueryData<Form[]>(FORMS_QUERY_KEY, [
          optimisticCopy,
          ...previousForms,
        ]);
      }

      return { previousForms };
    },
    onError: (error, _variables, context) => {
      if (context?.previousForms) {
        queryClient.setQueryData<Form[]>(
          FORMS_QUERY_KEY,
          context.previousForms,
        );
      }
      setActionError(getErrorMessage(error));
    },
    onSuccess: (response) => {
      if (response.id) {
        router.push(`/forms/${response.id}/edit`);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
    },
    successMsg: (data: unknown) =>
      `Form "${(data as Form).title}" copied successfully`,
  });

  const { mutateAsync: deleteFormMutation } = useAppMutation<
    CreateFormResponse,
    unknown,
    string,
    { previousForms: Form[] }
  >({
    mutationFn: async (formId) =>
      apiRequest<CreateFormResponse>({
        method: "delete",
        url: `/form/${formId}`,
      }),
    onMutate: async (formId) => {
      setActionError(null);
      await queryClient.cancelQueries({ queryKey: FORMS_QUERY_KEY });
      const previousForms =
        queryClient.getQueryData<Form[]>(FORMS_QUERY_KEY) ?? [];
      queryClient.setQueryData<Form[]>(
        FORMS_QUERY_KEY,
        previousForms.filter((item) => item.id !== formId),
      );
      return { previousForms };
    },
    onError: (error, _variables, context) => {
      if (context?.previousForms) {
        queryClient.setQueryData<Form[]>(
          FORMS_QUERY_KEY,
          context.previousForms,
        );
      }
      setActionError(getErrorMessage(error));
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
    },
    successMsg: "Form deleted successfully",
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return forms;
    }

    return forms.filter((form) =>
      (form.title || "").toLowerCase().includes(query),
    );
  }, [forms, search]);

  const handleToggleViewMode = () => {
    const nextViewMode = viewMode === "grid" ? "list" : "grid";
    setViewMode(nextViewMode);
  };

  const commonProps = {
    forms: filtered,
    onOpen: (formId: string) => router.push(`/forms/${formId}?tab=builder`),
    onDuplicate: (formId: string) => {
      duplicateFormMutation.mutate(formId);
    },
    onDelete: async (formId: string) => {
      await deleteFormMutation(formId);
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.paper" }}>
      <DashboardTopBar search={search} onSearchChange={setSearch} />
      <Box sx={{ bgcolor: "background.default" }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <TemplatesRow />
        </Container>
      </Box>
      <Box sx={{ bgcolor: "background.paper" }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {actionError}
            </Alert>
          )}
          {isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {getErrorMessage(error)}
            </Alert>
          )}
          <Stack
            spacing={2}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              Recent forms{" "}
              <IconButton onClick={() => reset()}>
                <RestartAltIcon
                  className={isLoading ? "disabled animate-spin" : ""}
                />
              </IconButton>
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                size="small"
                aria-label="Toggle view mode"
                onClick={handleToggleViewMode}
              >
                {viewMode === "grid" ? <ViewListIcon /> : <ViewModuleIcon />}
              </IconButton>
            </Stack>
          </Stack>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : viewMode === "grid" ? (
            <FormGrid {...commonProps} />
          ) : (
            <FormList {...commonProps} />
          )}
        </Container>
      </Box>
    </Box>
  );
}
