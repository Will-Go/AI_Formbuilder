"use client";

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

export function AccessControl() {
  const [email, setEmail] = React.useState("");

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleContinue = () => {
    // TODO: Implement actual authentication logic here
    console.log("Continue with email:", email);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
      }}
    >
      <Paper sx={{ p: 4, width: "100%", maxWidth: 400 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Access Required
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          This form is private. Please enter your email to continue.
        </Typography>
        <TextField
          fullWidth
          label="Email Address"
          variant="outlined"
          value={email}
          onChange={handleEmailChange}
          sx={{ mb: 2 }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={handleContinue}
          disabled={!email}
        >
          Continue
        </Button>
      </Paper>
    </Box>
  );
}
