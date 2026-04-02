"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  Button,
} from "@mui/material";
import Link from "next/link";
import BackButton from "@/shared/components/BackButton";
import Image from "next/image";
import PasswordValidationChecklist from "@/shared/components/PasswordValidationChecklist";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { PasswordPolicySchema } from "@/shared/schemas/passwordPolicy";
import { supabase } from "@/shared/services/supabase/client";
import { notifyError, notifySuccess } from "@/shared/utils/toastNotify";
import { useRouter } from "next/navigation";

// Create reset password schema
const resetPasswordSchema = z
  .object({
    password: PasswordPolicySchema.shape.password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      console.log("Password reset data:", data);

      // Start transition
      setIsTransitioning(true);

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (error) {
        throw error;
      }
      // After a brief delay, switch to success view
      setTimeout(() => {
        setResetSuccess(true);
        setIsTransitioning(false);
      }, 300);
      notifySuccess("Your password has been reset successfully!");
    } catch (error) {
      console.log("Password reset error:", error);
      if (
        error instanceof Error &&
        error.message ===
          "New password should be different from the old password."
      ) {
        notifyError("New password must be different from your current password.");
      } else {
        notifyError("Failed to update password. Please try again.");
      }
      setIsTransitioning(false);
    }
  };

  if (resetSuccess) {
    return (
      <main className="flex min-h-screen flex-col lg:flex-row">
        <div className="flex w-full flex-col items-center justify-center bg-white p-4 ">
          <div className="w-full">
            <BackButton size="small" variant="text" />
          </div>
          <div className="w-full max-w-md p-4 lg:p-8">
            <div className="mb-4 flex justify-center">
              <Image
                src="/form_ai_icon.svg"
                alt="Oceana Collective"
                width={150}
                height={150}
                className="lg:hidden"
                style={{ objectFit: "contain" }}
              />
              <Image
                src="/form_ai_icon.svg"
                alt="Oceana Collective"
                width={200}
                height={200}
                className="hidden lg:block"
                style={{ objectFit: "contain" }}
              />
            </div>

            <div className="text-center">
              <Typography
                variant="h4"
                className="text-primary mb-2! text-center text-2xl font-light tracking-wide lg:text-3xl"
              >
                Password Reset Complete
              </Typography>

              <Alert
                severity="success"
                className="mb-6! text-sm lg:text-base"
              >
                Your password has been updated successfully!
              </Alert>

              <Typography
                variant="body1"
                className="text-secondary mb-6! text-sm lg:text-base"
              >
                You can now sign in with your new password.
              </Typography>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => router.push("/login")}
                className="mb-4"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <div className="flex w-full flex-col items-center justify-center bg-white p-4 ">
        <div className="w-full">
          <BackButton size="small" variant="text" />
        </div>
        <div className="w-full max-w-md p-4 lg:p-8">
          <div className="mb-4 flex justify-center">
            <Image
              src="/form_ai_icon.svg"
              alt="Oceana Collective"
              width={150}
              height={150}
              className="lg:hidden"
              style={{ objectFit: "contain" }}
            />
            <Image
              src="/form_ai_icon.svg"
              alt="Oceana Collective"
              width={200}
              height={200}
              className="hidden lg:block"
              style={{ objectFit: "contain" }}
            />
          </div>

          <Typography
            variant="h4"
            className="text-primary mb-2! text-center text-2xl font-light tracking-wide lg:text-3xl"
          >
            Reset Your Password
          </Typography>

          <Typography
            variant="body2"
            className=" mb-6! text-center text-sm lg:text-base"
          >
            Enter your new password below. Make sure it meets the requirements.
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {/* New Password */}
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="New Password"
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

            {/* Password Validation Checklist */}
            <PasswordValidationChecklist password={watch("password", "")} />

            {/* Confirm Password */}
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  variant="outlined"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
              className="mt-6!"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>

            {/* Back to Login Link */}
            <div className="mt-4 text-center">
              <Typography variant="body2" className="text-secondary text-sm lg:text-base">
                Remember your password?{" "}
                <Link href="/login" className="underline">
                  Sign in
                </Link>
              </Typography>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
