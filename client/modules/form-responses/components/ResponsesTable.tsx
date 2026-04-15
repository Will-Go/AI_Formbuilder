"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { Response } from "@/shared/types/responses";
import { formatShortDate } from "@/shared/utils/dateFormatter";

export default function ResponsesTable({
  responses,
}: {
  responses: Response[];
}) {
  if (responses.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          No responses yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Submitted</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Response ID</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Answers</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {responses.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{formatShortDate(r.submitted_at)}</TableCell>
              <TableCell>{r.id}</TableCell>
              <TableCell>{r.answers.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
