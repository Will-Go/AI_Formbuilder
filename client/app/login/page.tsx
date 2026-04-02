"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Divider,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import GoogleIcon from "@mui/icons-material/Google";
import Link from "next/link";
import { useRouter as useRouterNext } from "@bprogress/next";
import { useSearchParams } from "next/navigation";
import { Button } from "@mui/material";
import BackButton from "@/shared/components/BackButton";
import Image from "next/image";
import { useLocalStorageString } from "@/shared/hooks/localStorage";
import { useAuth } from "@/shared/context/AuthContext";
import { notifyError, notifySuccess } from "@/shared/utils/toastNotify";
import { PasswordPolicySchema } from "@/shared/schemas/passwordPolicy";
import { useTranslations } from "next-intl";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: PasswordPolicySchema?.shape.password,
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations("auth.login");
  const { signInWithEmailAndPass, signInWithGoogle } = useAuth();
  const router = useRouterNext();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const fromCompleteProfile = searchParams.get("fromCompleteProfile");

  // localStorage hook for storing email
  const {
    value: storedEmail,
    setValue: setStoredEmail,
    removeValue: removeStoredEmail,
    loading: isLoadingEmail,
  } = useLocalStorageString("rememberedEmail", "");

  // Initialize rememberMe based on whether there's a stored email
  const [rememberMe, setRememberMe] = useState(Boolean(storedEmail));

  const {
    control,
    handleSubmit,
    setValue: setFormValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: storedEmail || "",
      password: "",
    },
  });

  // Update form when localStorage loads
  useEffect(() => {
    if (!isLoadingEmail) {
      const hasStoredEmail = Boolean(storedEmail);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRememberMe(hasStoredEmail);
      if (hasStoredEmail) {
        setFormValue("email", storedEmail!);
      }
    }
  }, [storedEmail, setFormValue, isLoadingEmail]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Handle remember me functionality
      if (rememberMe) {
        setStoredEmail(data.email);
      } else {
        removeStoredEmail();
      }

      await signInWithEmailAndPass(data.email, data.password);

      const nextUrl = redirectUrl || "/forms";
      if (redirectUrl) {
        router.replace(nextUrl);
      } else {
        router.replace(nextUrl);
      }
      notifySuccess("Login successful! Welcome back.");
      // Handle login logic here
    } catch (error) {
      notifyError(
        (error as Error).message || "Login failed. Please try again.",
      );
    }
  };

  const handleRememberMeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const checked = event.target.checked;
    setRememberMe(checked);

    // If unchecking, remove stored email immediately
    if (!checked) {
      removeStoredEmail();
    }
  };

  return (
    <main className="flex min-h-screen flex-col lg:flex-row bg-white">
      <div className="flex w-full flex-col items-center justify-center  p-4 ">
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
            Sign In
          </Typography>
          <Typography
            variant="body2"
            className=" mb-6! text-center text-sm lg:text-base"
          >
            Enter your credentials to access your account.
          </Typography>

          {fromCompleteProfile && (
            <Alert severity="success" className="mb-4">
              {t("fromCompleteProfile")}
            </Alert>
          )}

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
            <div className="flex items-center justify-between">
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                  />
                }
                label={
                  <span className="ml-2 text-sm lg:text-base">Remember me</span>
                }
              />
              <Link
                href="/forgot-password"
                className="text-xs underline lg:text-sm"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isSubmitting}
              className="mt-2"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
            {/* Divider */}
            <Divider
              textAlign="center"
              orientation="horizontal"
              variant="fullWidth"
              className="text-xs!"
            >
              Or sign in with
            </Divider>
            <div className="mt-3">
              <Button
                type="button"
                variant="outlined"
                fullWidth
                disabled={isSubmitting}
                onClick={() =>
                  signInWithGoogle({
                    redirectTo: `/auth/callback?next=${redirectUrl || "/forms"}`,
                  })
                }
                className="mt-2"
                startIcon={<GoogleIcon />}
              >
                Sign in with Google
              </Button>
            </div>

            <div className="mt-2 text-center">
              <Typography variant="body2" className=" text-sm lg:text-base">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="underline">
                  Sign up
                </Link>
              </Typography>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
