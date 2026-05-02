"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { motion } from "framer-motion";
import Link from "next/link";

interface SuccessResponseViewProps {
  formTitle: string;
  onViewResponses?: () => void;
  onSubmitAnother: () => void;
}

export function SuccessResponseView({
  formTitle,
  onViewResponses,
  onSubmitAnother,
}: SuccessResponseViewProps) {
  return (
    <Box
      key="submitted-view"
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      sx={{ width: "100%" }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: 6,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          borderRadius: 3,
          borderTop: 8,
          borderTopColor: "success.main",
        }}
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: "success.main" }} />
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Response recorded
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Thank you for filling out <strong>{formTitle}</strong>. Your response
            has been successfully submitted.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mt: 2, width: { xs: "100%", sm: "auto" } }}
        >
          {onViewResponses && (
            <Button
              variant="contained"
              size="large"
              onClick={onViewResponses}
              sx={{ px: 4 }}
            >
              View responses
            </Button>
          )}
          <Button
            variant={onViewResponses ? "outlined" : "contained"}
            size="large"
            onClick={onSubmitAnother}
            sx={{ px: 4 }}
          >
            Submit another
          </Button>
        </Stack>

        <Box
          sx={{
            mt: 4,
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Thank you!
          </Typography>
          <Typography
            component={Link}
            href="/login"
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              textDecoration: "none",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Try formIA
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
