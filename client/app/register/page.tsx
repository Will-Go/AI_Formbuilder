"use client";

import React, { useState } from "react";
import { Typography, Alert, Button } from "@mui/material";
import BackButton from "@/shared/components/BackButton";
import Image from "next/image";
import RegisterForm from "@/shared/components/RegisterForm";
import { Divider } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import { notifyError } from "@/shared/utils/toastNotify";

export default function Register() {
  const router = useRouter();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleRegistrationSuccess = () => {
    setRegistrationSuccess(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle({ redirectTo: "/auth/callback?next=/forms" });
    } catch (error) {
      notifyError(
        (error as Error).message || "Google sign-in failed. Please try again.",
      );
    }
  };

  if (registrationSuccess) {
    return (
      <main className="relative flex min-h-screen flex-col">
        {/* Back Button */}
        <div className="flex w-full p-2">
          <BackButton size="small" variant="text" />
        </div>
        {/* Content */}
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4 lg:p-8">
          <div
            className="bg-opacity-95 w-full max-w-lg bg-white p-6 shadow-2xl backdrop-blur-sm transition-all duration-500 ease-in-out lg:p-8"
            style={{
              animation: "slideInFromBottom 0.6s ease-out",
            }}
          >
            <div className="mb-4 flex justify-center lg:mb-6">
              <Image
                src="/form_ai_icon.svg"
                alt="Oceana Collective"
                width={120}
                height={120}
                className="lg:hidden"
                style={{ objectFit: "contain" }}
              />
              <Image
                src="/form_ai_icon.svg"
                alt="Oceana Collective"
                width={150}
                height={150}
                className="hidden lg:block"
                style={{ objectFit: "contain" }}
              />
            </div>

            <div className="text-center">
              <Typography
                variant="h4"
                className="text-primary mb-3 text-xl font-light tracking-wide lg:mb-4 lg:text-3xl"
              >
                Registration Successful
              </Typography>

              <Alert
                severity="success"
                className="mb-4 text-sm lg:mb-6 lg:text-base"
              >
                Registration successful!
              </Alert>

              <Typography
                variant="body1"
                className="text-secondary mb-4! text-sm lg:mb-6 lg:text-base"
              >
                Registration successful!
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

        <style jsx>{`
          @keyframes slideInFromBottom {
            0% {
              opacity: 0;
              transform: translateY(30px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
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
            Sign Up
          </Typography>
          <Typography
            variant="body2"
            className=" mb-6! text-center text-sm lg:text-base"
          >
            Create your account to get started.
          </Typography>

          <RegisterForm onRegistrationSuccess={handleRegistrationSuccess} />

          <Divider
            textAlign="center"
            orientation="horizontal"
            variant="fullWidth"
            className="text-xs!"
          >
            Or sign up with
          </Divider>
          <div className="mt-3">
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={handleGoogleSignIn}
              className="mt-2"
              startIcon={<GoogleIcon />}
            >
              Sign up with Google
            </Button>
          </div>

          <div className="mt-2 text-center">
            <Typography variant="body2" className=" text-sm lg:text-base">
              Already have an account?{" "}
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
