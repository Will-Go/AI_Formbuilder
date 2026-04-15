"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Divider from "@mui/material/Divider";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import GoogleIcon from "@mui/icons-material/Google";
import { useAuth } from "@/shared/context/AuthContext";
import { notifyError, notifySuccess } from "@/shared/utils/toastNotify";
import { useRouter as useRouterNext } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface AccessControlProps {
  formId: string;
}

export function AccessControl({ formId }: AccessControlProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithEmailAndPass, signInWithGoogle } = useAuth();
  const router = useRouterNext();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await signInWithEmailAndPass(data.email, data.password);
      notifySuccess("Login successful!");
      router.refresh();
    } catch (error) {
      notifyError(
        (error as Error).message || "Login failed. Please try again.",
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        variant="outlined"
        sx={{ p: 4, width: "100%", maxWidth: 400, borderRadius: 3 }}
      >
        <Typography
          variant="h5"
          sx={{ mb: 1, fontWeight: "bold", textAlign: "center" }}
        >
          Private Form
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 4, textAlign: "center" }}
        >
          Please sign in to verify your access to this form.
        </Typography>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email Address"
                type="email"
                variant="outlined"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
          />

          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{ py: 1.5, mt: 1 }}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Or sign in with
            </Typography>
          </Divider>

          <Button
            type="button"
            variant="outlined"
            fullWidth
            disabled={isSubmitting}
            onClick={() =>
              signInWithGoogle({
                redirectTo: `/auth/callback?next=/forms/${formId}/view-form`,
              })
            }
            startIcon={<GoogleIcon />}
            sx={{ py: 1.5 }}
          >
            Sign in with Google
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
