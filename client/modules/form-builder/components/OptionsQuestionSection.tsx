"use client";

import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { Option, Question, Form } from "@/shared/types/forms";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { FORM_DETAILS_QUERY_KEY } from "../pages/FormBuilderPage";
import { optimisticUpdateQuestion } from "../utils/formOptimisticUpdates";

export interface OptionsQuestionSectionProps {
  questionId: string;
  initialOptions?: Option[];
  isPreview?: boolean;
}

export function OptionsQuestionSection({
  questionId,
  initialOptions = [],
  isPreview,
}: OptionsQuestionSectionProps) {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const queryClient = useQueryClient();

  const [displayOptions, setDisplayOptions] =
    useState<Option[]>(initialOptions);
  const [pendingOptions, setPendingOptions] = useState<Option[] | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Sync displayOptions if initialOptions changes from the server
  useEffect(() => {
    setDisplayOptions(initialOptions);
  }, [initialOptions]);

  const debouncedOptions = useDebouncedValue(pendingOptions, 500);

  const { mutate: mutateUpdateOptions } = useAppMutation<
    { ok: boolean; question: Question },
    Error,
    { options: Option[] },
    { previousForm?: Form }
  >({
    mutationKey: ["form-builder", "update-options", formId, questionId],
    mutationFn: async ({ options }) => {
      return apiRequest({
        method: "patch",
        url: `/form/${formId}/questions/${questionId}`,
        data: { options },
      });
    },
    onMutate: async ({ options }) => {
      await queryClient.cancelQueries({
        queryKey: [...FORM_DETAILS_QUERY_KEY, formId],
      });
      const previousForm = queryClient.getQueryData<Form>([
        ...FORM_DETAILS_QUERY_KEY,
        formId,
      ]);
      if (previousForm) {
        const nextForm = optimisticUpdateQuestion(previousForm, questionId, {
          options,
        });
        queryClient.setQueryData<Form>(
          [...FORM_DETAILS_QUERY_KEY, formId],
          nextForm,
        );
      }
      return { previousForm };
    },
    onError: () => {
      setIsRollingBack(true);
      // Revert the local display options back to what was initially provided
      setDisplayOptions(initialOptions);
      queryClient
        .invalidateQueries({ queryKey: [...FORM_DETAILS_QUERY_KEY, formId] })
        .finally(() => {
          setIsRollingBack(false);
        });
    },
    onSuccess: () => {
      setPendingOptions(null);
    },
    errorMsg: "Failed to update options",
  });

  useEffect(() => {
    if (debouncedOptions === null) return;
    if (isPreview) return;

    // Ensure all options have strictly sequential order values before sending to the backend
    // This prevents PostgreSQL unique constraint violations on options_question_id_order_key
    const orderedOptions = debouncedOptions.map((o, index) => ({
      ...o,
      order: index,
    }));

    mutateUpdateOptions({ options: orderedOptions });
    // Note: Do not synchronously clear pendingOptions here to avoid cascading renders
  }, [debouncedOptions, mutateUpdateOptions, isPreview]);

  // We can safely clear pendingOptions when the mutation successfully resolves
  // to return control to the parent's initialOptions

  const handleAddOption = () => {
    if (isPreview) return;
    const nextOpt: Option = {
      id: uuidv4(),
      label: `Option ${displayOptions.length + 1}`,
      value: `option_${displayOptions.length + 1}`,
      order: displayOptions.length,
    };
    const newOptions = [...displayOptions, nextOpt];
    setDisplayOptions(newOptions);
    setPendingOptions(newOptions);
  };

  const handleUpdateOption = (optId: string, label: string) => {
    if (isPreview) return;
    const newOptions = displayOptions.map((o) =>
      o.id === optId ? { ...o, label } : o,
    );
    setDisplayOptions(newOptions);
    setPendingOptions(newOptions);
  };

  const handleDeleteOption = (optId: string) => {
    if (isPreview) return;
    const newOptions = displayOptions
      .filter((o) => o.id !== optId)
      .map((o, index) => ({ ...o, order: index })); // Reorder remaining options
    setDisplayOptions(newOptions);
    setPendingOptions(newOptions);
  };

  return (
    <Box sx={{ mt: 1, position: "relative" }}>
      {isRollingBack && (
        <Box
          sx={{
            position: "absolute",
            top: -8,
            left: -8,
            right: -8,
            bottom: -8,
            bgcolor: "rgba(255, 255, 255, 0.6)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 1,
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
      <Stack spacing={1}>
        {displayOptions.map((o, idx) => (
          <Box
            key={o.id}
            sx={{ display: "flex", gap: 1, alignItems: "center" }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ width: 24 }}
            >
              {idx + 1}.
            </Typography>
            <TextField
              size="small"
              variant="outlined"
              value={o.label}
              onChange={(e) => handleUpdateOption(o.id, e.target.value)}
              fullWidth
              InputProps={{ readOnly: isPreview || isRollingBack }}
            />

            <Tooltip title="Delete option" placement="top">
              <IconButton
                aria-label="Delete option"
                onClick={() => handleDeleteOption(o.id)}
                disabled={isPreview || isRollingBack}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
        <Box>
          <Button
            variant="text"
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={handleAddOption}
            disabled={isPreview || isRollingBack}
          >
            <Typography
              component="span"
              variant="body2"
              color="primary.main"
              sx={{ ml: 0.5 }}
            >
              Add option
            </Typography>
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
