"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import { BarChart, PieChart } from "@mui/x-charts";
import { useAppQuery } from "@/shared/hooks/useAppQuery";
import { apiRequest } from "@/shared/utils/apiRequest";
import type { Form } from "@/shared/types/forms";
import type {
  ResponseSummaryResult,
  QuestionSummaryData,
} from "@/shared/daos/responsesDao";

interface SummaryViewProps {
  form: Form;
}

export default function SummaryView({ form }: SummaryViewProps) {
  const { data, isLoading, isError } = useAppQuery<ResponseSummaryResult>({
    queryKey: ["form", form.id, "summary"],
    queryFn: () =>
      apiRequest({
        method: "get",
        url: `/form/${form.id}/responses/summary`,
      }),
    showTranslatedErrorToast: true,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 4, textAlign: "center", borderRadius: 3 }}
      >
        <Typography color="error">Failed to load summary data.</Typography>
      </Paper>
    );
  }

  if (
    data.total_responses === 0 ||
    !data.summary ||
    data.summary.length === 0
  ) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 4, textAlign: "center", borderRadius: 3 }}
      >
        <Typography color="text.secondary">
          No responses yet to summarize.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {data.summary.map((questionSummary) => (
        <QuestionSummary key={questionSummary.id} summary={questionSummary} />
      ))}
    </Stack>
  );
}

function QuestionSummary({ summary }: { summary: QuestionSummaryData }) {
  const responseCount = summary.data.reduce(
    (acc, curr) => acc + (curr.count || 0),
    0,
  );

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: "medium", mb: 0.5 }}>
        {summary.label}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {responseCount}{" "}
        {summary.chart_type === "text" ? "words analyzed" : "responses"}
      </Typography>

      <Box sx={{ minHeight: 200 }}>{renderChart(summary)}</Box>
    </Paper>
  );
}

function renderChart(summary: QuestionSummaryData) {
  if (!summary.data || summary.data.length === 0) {
    return <Typography color="text.secondary">No data available.</Typography>;
  }

  if (summary.chart_type === "pie") {
    const data = summary.data.map((item, i) => {
      let labelStr = item.label || String(item.label);
      if (summary.type === "yes_no") {
        labelStr =
          String(item.label).toLowerCase() === "true" ||
          String(item.label).toLowerCase() === "yes"
            ? "Yes"
            : "No";
      }

      return {
        id: i,
        value: item.count,
        label: labelStr,
      };
    });

    return (
      <PieChart
        series={[
          {
            data,
            highlightScope: { fade: "global", highlight: "item" },
            innerRadius: 30,
            paddingAngle: 2,
            cornerRadius: 4,
          },
        ]}
        height={300}
        margin={{ top: 20, bottom: 20, left: 20, right: 150 }}
        slotProps={{
          legend: {
            direction: "column",
            position: { vertical: "middle", horizontal: "right" },
            padding: 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any,
        }}
      />
    );
  }

  if (summary.chart_type === "bar") {
    if (summary.type === "checkbox") {
      const dataset = [...summary.data].sort((a, b) => b.count - a.count);

      return (
        <BarChart
          dataset={dataset}
          yAxis={[{ scaleType: "band", dataKey: "label" }]}
          series={[{ dataKey: "count", label: "Responses", color: "#6366f1" }]}
          layout="horizontal"
          height={300}
          margin={{ left: 150 }}
        />
      );
    }

    // Rating, linear_scale, number
    const sortedData = [...summary.data].sort(
      (a, b) => Number(a.label) - Number(b.label),
    );
    const xAxisData = sortedData.map((item) => String(item.label));
    const seriesData = sortedData.map((item) => item.count);

    return (
      <BarChart
        xAxis={[{ scaleType: "band", data: xAxisData }]}
        series={[{ data: seriesData, color: "#6366f1" }]}
        height={300}
      />
    );
  }

  // Text responses
  return (
    <Box
      sx={{
        maxHeight: 300,
        overflowY: "auto",
        bgcolor: "background.paper",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {summary.data.map((ans, idx) => (
        <Box
          key={idx}
          sx={{
            p: 2,
            borderBottom: idx < summary.data.length - 1 ? 1 : 0,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2">{ans.word || ans.label}</Typography>
          <Typography variant="body2" color="text.secondary">
            Count: {ans.count}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
