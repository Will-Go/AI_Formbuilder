"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/shared/services/supabase/client";
import { z } from "zod";
import { TextField, Typography, Alert, Button } from "@mui/material";
import Link from "next/link";
import BackButton from "@/shared/components/BackButton";
import Image from "next/image";
import { notifySuccess, notifyError } from "@/shared/utils/toastNotify";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [emailSent, setEmailSent] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      console.log("Password reset request for:", data.email);
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        notifyError("Failed to send password reset email. Please try again.");
        return;
      }

      // Start transition
      setIsTransitioning(true);

      // After a brief delay, switch to success view
      setTimeout(() => {
        setEmailSent(true);
        setIsTransitioning(false);
      }, 300);

      notifySuccess("Password reset email sent! Check your inbox.");

      // Here you would integrate with your email service
      // await sendPasswordResetEmail(data.email);
    } catch {
      notifyError("Failed to send password reset email. Please try again.");
    }
  };

  if (emailSent) {
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
              Check Your Email
            </Typography>

            <Alert severity="success" className="mb-6! text-sm lg:text-base">
              We&apos;ve sent you a password reset link!
            </Alert>

            <Typography
              variant="body1"
              className="text-secondary mb-6! text-sm lg:text-base"
            >
              Please check your email inbox and click the link to reset your
              password. If you don&apos;t see it, check your spam folder.
            </Typography>

            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setEmailSent(false);
                  setIsTransitioning(false);
                }, 300);
              }}
              className="mb-2"
            >
              Send Again
            </Button>

            <div className="mt-2 text-center">
              <Typography
                variant="body2"
                className="text-secondary text-sm lg:text-base"
              >
                Remember your password?{" "}
                <Link href="/login" className="underline">
                  Sign in
                </Link>
              </Typography>
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
            Forgot Password
          </Typography>

          <Typography
            variant="body2"
            className=" mb-6! text-center text-sm lg:text-base"
          >
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4!">
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
                  placeholder="you@example.com"
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isSubmitting}
              className="mt-6"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>

            <div className="mt-4 text-center">
              <Typography
                variant="body2"
                className="text-secondary text-sm lg:text-base"
              >
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
