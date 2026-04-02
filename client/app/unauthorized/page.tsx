import { Typography, Container, Button } from "@mui/material";
import { Lock } from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import BackButton from "@/shared/components/BackButton";

export default function Unauthorized() {
  return (
    <div
      className="relative h-screen bg-cover bg-center bg-no-repeat py-40!"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
      }}
    >
      <div className="absolute inset-0 bg-black/50"></div>
      <Container maxWidth="md" className="relative z-10">
        <BackButton variant="text" color="info" />
        <div className="text-center">
          {/* Logo */}
          <div className="mb-12">
            <Image
              src="/logo/Icon-clean.png"
              alt="Oceana Collective Logo"
              width={120}
              height={120}
              className="mx-auto opacity-60"
              draggable={false}
            />
          </div>

          {/* Main Message */}
          <Typography
            variant="h3"
            className="text-neutral! mb-4! text-3xl font-extralight tracking-tight md:text-4xl"
          >
            Access Denied
          </Typography>

          <Typography
            variant="body1"
            className="text-neutral! mx-auto! mb-12! max-w-lg text-lg leading-relaxed font-light opacity-90"
          >
            You don&apos;t have permission to access this page. Please contact
            the administrator if you believe this is an error.
          </Typography>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <Link href={"/"} className="w-full sm:w-auto">
              <Button
                variant="contained"
                size="medium"
                startIcon={<Lock />}
                className="bg-primary! hover:bg-primary/90 px-8 py-3 font-light tracking-wide transition-all duration-300"
              >
                Go to Home
              </Button>
            </Link>
          </div>

          {/* Decorative Element */}
          <div className="mt-16">
            <div className="via-primary/30 mx-auto h-px w-24 bg-gradient-to-r from-transparent to-transparent"></div>
          </div>
        </div>
      </Container>
    </div>
  );
}
