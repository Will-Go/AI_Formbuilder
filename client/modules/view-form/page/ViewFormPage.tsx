import React from "react";
import { Form, FormStatus } from "@/shared/types/forms";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import { createClient } from "@/shared/services/supabase/server";

import { AccessControl } from "../components/AccessControl";
import { FormRenderer } from "../components/FormRenderer";

interface ViewFormPageProps {
  initialForm: Form | null;
}

export default async function ViewFormPage({
  initialForm: form,
}: ViewFormPageProps) {
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return <AccessControl formId={form.id} />;
    }

    // Check if the user is in the share list or is the owner
    const isOwner = form.author_id === user.id;
    let hasAccess = isOwner;

    if (!hasAccess && user.email) {
      const { data: sharedUser, error } = await supabase
        .from("form_shared_list")
        .select("id")
        .eq("form_id", form.id)
        .eq("email", user.email)
        .single();

      if (!error && sharedUser) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
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
              <LockOutlinedIcon
                sx={{ fontSize: 64, color: "text.secondary" }}
              />
              <Typography variant="h5" fontWeight="bold">
                Access Denied
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You do not have permission to view this form. Please ask the
                owner to share it with you.
              </Typography>
            </Stack>
          </Paper>
        </Box>
      );
    }
  }

  return <FormRenderer form={form} />;
}
