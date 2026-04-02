import { NextRequest } from "next/server";
import { updateSession } from "@/shared/services/supabase/ssr";

export default async function middleware(req: NextRequest) {
  // Then handle session management
  const response = await updateSession(req);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|api|trpc|_next|_vercel|_next/image|favicon.ico|fonts|$|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
