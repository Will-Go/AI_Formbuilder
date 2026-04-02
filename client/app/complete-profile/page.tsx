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
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import BackButton from "@/shared/components/BackButton";
import Image from "next/image";
import PasswordValidationChecklist from "@/shared/components/PasswordValidationChecklist";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { PasswordPolicySchema } from "@/shared/schemas/passwordPolicy";
import { useRouter } from "next/navigation";
import { useAppMutation } from "@/shared/hooks/useAppMutation";
import { apiRequest } from "@/shared/utils/apiRequest";

const completeProfileSchema = z
  .object({
    password: PasswordPolicySchema.shape.password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;

export default function CompleteProfile() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const completeProfileMutation = useAppMutation<
    { ok: boolean },
    Error,
    { password: string }
  >({
    mutationFn: async (payload) =>
      apiRequest({
        method: "post",
        url: "/complete-profile",
        data: payload,
      }),
    successMsg: "Your password has been set successfully!",
    errorMsg: "Failed to complete profile. Please try again.",
    showTranslatedErrorToast: false,
    onSuccess: () => {
      router.push("/login?fromCompleteProfile=true");
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: CompleteProfileFormData) => {
    setError(null);
    if (!passwordValid) {
      setError("Password does not meet all requirements.");
      return;
    }

    try {
      await completeProfileMutation.mutateAsync({
        password: data.password,
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "string") {
        setError(err);
      } else {
        setError("An unknown error occurred during profile completion.");
      }
    }
  };

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
            Complete Your Profile
          </Typography>

          <Typography
            variant="body2"
            className=" mb-6! text-center text-sm lg:text-base"
          >
            Set a password to complete your profile.
          </Typography>

          {error && (
            <Alert severity="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {/* New Password */}
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

            {/* Password Validation Checklist */}
            <PasswordValidationChecklist
              password={watch("password", "")}
              onValidationChange={setPasswordValid}
            />

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
              disabled={
                completeProfileMutation.isPending ||
                isSubmitting ||
                !passwordValid
              }
              className="mt-6!"
            >
              {completeProfileMutation.isPending ? (
                <CircularProgress size={24} />
              ) : (
                "Set Password"
              )}
            </Button>

            {/* Back to Login Link */}
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
