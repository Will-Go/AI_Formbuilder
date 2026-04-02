import { Typography, Container, Button } from "@mui/material";
import { Warning } from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import BackButton from "@/shared/components/BackButton";

export default async function ExpiratedPage() {
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
            Your Session Has Expired
          </Typography>

          <Typography
            variant="body2"
            className="mb-6! text-center text-sm lg:text-base"
          >
            Please sign in again to continue accessing the form. Your current
            session has expired for security reasons.
          </Typography>

          <div className="mt-3">
            <Link href={"/"} className="w-full">
              <Button
                variant="contained"
                fullWidth
                className="mt-2"
                startIcon={<Warning />}
              >
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
