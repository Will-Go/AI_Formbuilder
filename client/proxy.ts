import { NextRequest } from "next/server";
import { updateSession } from "@/shared/services/supabase/ssr";

export default async function middleware(req: NextRequest) {
  // Then handle session management
  const response = await updateSession(req);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|api|trpc|_next|_vercel|_next/image|favicon.ico|fonts|$|login|register|auth/callback|error|forgot-password|unauthorized|forms/[^/]+/view-form|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
