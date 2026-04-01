"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import { Form, FormStatus } from "@/shared/types/forms";
import Box from "@mui/material/Box";

import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import { AccessControl } from "../components/AccessControl";
import { FormRenderer } from "../components/FormRenderer";

export default function ViewFormPage() {
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const getFormById = useFormsStore((s) => s.getFormById);

  const [form, setForm] = React.useState<Form | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchedForm = getFormById(formId) || null;
    setForm(fetchedForm);
    setLoading(false);
  }, [formId, getFormById]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!form) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Typography variant="h5">Form not found</Typography>
      </Box>
    );
  }

  if (form.status === FormStatus.DRAFT || form.status === FormStatus.CLOSED) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Typography variant="h5">
          This form is not accepting responses
        </Typography>
      </Box>
    );
  }

  if (form.status === FormStatus.PRIVATE) {
    return <AccessControl />;
  }

  return <FormRenderer form={form} />;
}
