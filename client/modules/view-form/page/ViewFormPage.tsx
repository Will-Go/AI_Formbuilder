import React from "react";
import { Form, FormStatus } from "@/shared/types/forms";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";

import { AccessControl } from "../components/AccessControl";
import { FormRenderer } from "../components/FormRenderer";

interface ViewFormPageProps {
  initialForm: Form | null;
}

export default function ViewFormPage({ initialForm: form }: ViewFormPageProps) {
  console.log("form", form);
  if (!form) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          pt: "15vh",
          bgcolor: "background.default",
        }}
      >
        <Paper
          elevation={0}
          variant="outlined"
          sx={{ p: 6, textAlign: "center", maxWidth: 400, borderRadius: 3 }}
        >
          <Stack alignItems="center" spacing={2}>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: "text.secondary" }} />
            <Typography variant="h5" fontWeight="bold">
              Form not found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The form you&apos;re looking for doesn&apos;t exist or has been
              deleted.
            </Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  if (form.status === FormStatus.DRAFT || form.status === FormStatus.CLOSED) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          pt: "15vh",
          bgcolor: "background.default",
        }}
      >
        <Paper
          elevation={0}
          variant="outlined"
          sx={{ p: 6, textAlign: "center", maxWidth: 400, borderRadius: 3 }}
        >
          <Stack alignItems="center" spacing={2}>
            <LockOutlinedIcon sx={{ fontSize: 64, color: "text.secondary" }} />
            <Typography variant="h5" fontWeight="bold">
              Form closed
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This form is currently not accepting responses. Please contact the
              owner if you think this is a mistake.
            </Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  if (form.status === FormStatus.PRIVATE) {
    return <AccessControl />;
  }

  return <FormRenderer form={form} />;
}
