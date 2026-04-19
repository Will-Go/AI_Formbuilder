"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useParams, useRouter } from "next/navigation";
import { useFormsStore } from "@/modules/form-dashboard/store/formsStore";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { apiRequest } from "@/shared/utils/apiRequest";
import type { Response } from "@/shared/types/responses";
import CircularProgress from "@mui/material/CircularProgress";
import SummaryView from "../components/SummaryView";
import IndividualView from "../components/IndividualView";
import Paper from "@mui/material/Paper";

export default function FormResponsesPage() {
  const router = useRouter();
  const params = useParams<{ formId: string }>();
  const formId = params.formId;
  const form = useFormsStore((s) => s.form);

  const [tabIndex, setTabIndex] = useState(0);

  const {
    data: responsesData,
    isLoading,
    isError,
  } = useAppQuery<{ responses: Response[]; pagination: { total: number } }>({
    queryKey: ["responses", formId],
    queryFn: () =>
      apiRequest({
        method: "get",
        url: `/form/${formId}/responses`,
        params: {
          limit: 100,
          page: 1,
        },
      }),
  });

  if (!form) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Button variant="contained" onClick={() => router.push("/forms")}>
          Back to dashboard
        </Button>
      </Box>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box
      sx={{ backgroundColor: "background.default", minHeight: "100vh", pb: 6 }}
    >
      <Box sx={{ maxWidth: 1000, mx: "auto", px: { xs: 2, sm: 3 }, pt: 3 }}>
        <Paper
          elevation={0}
          variant="outlined"
          sx={{ borderRadius: 3, overflow: "hidden", mb: 4 }}
        >
          <Box sx={{ px: 4, py: 3, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              {responsesData?.pagination?.total || 0} responses
            </Typography>
          </Box>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab
              label="Summary"
              sx={{ textTransform: "none", fontWeight: "bold", py: 2 }}
            />
            <Tab
              label="Individual"
              sx={{ textTransform: "none", fontWeight: "bold", py: 2 }}
            />
          </Tabs>
        </Paper>

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {isError && (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="error">Failed to load responses.</Typography>
          </Box>
        )}

        {!isLoading && !isError && responsesData && (
          <Box>
            {tabIndex === 0 && <SummaryView key={"summary"} form={form} />}
            {tabIndex === 1 && (
              <IndividualView key={"individual"} form={form} formId={formId} />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
