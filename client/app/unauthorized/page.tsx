import { Typography, Container, Button } from "@mui/material";
import { Lock } from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import BackButton from "@/shared/components/BackButton";

export default function Unauthorized() {
  return (
    <main className="flex min-h-screen flex-col lg:flex-row bg-white">
      <div className="flex w-full flex-col items-center justify-center p-4">
        <div className="w-full">
          <BackButton size="small" variant="text" />
        </div>
        <div className="w-full max-w-md p-4 lg:p-8">
          <div className="mb-4 flex justify-center">
            <Image
              src="/form_ai_icon.svg"
              alt="FormIA"
              width={150}
              height={150}
              className="lg:hidden"
              style={{ objectFit: "contain" }}
            />
            <Image
              src="/form_ai_icon.svg"
              alt="FormIA"
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
            Access Denied
          </Typography>

          <Typography
            variant="body2"
            className="mb-6! text-center text-sm lg:text-base"
          >
            You don&apos;t have permission to access this page. Please contact
            the administrator if you believe this is an error.
          </Typography>

          <div className="mt-3">
            <Link href={"/"} className="w-full">
              <Button
                variant="contained"
                fullWidth
                className="mt-2"
                startIcon={<Lock />}
              >
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
