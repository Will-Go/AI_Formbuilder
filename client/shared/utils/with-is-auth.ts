import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/services/supabase/server";

type Handler = (
  req: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: any,
) => Promise<NextResponse | Response>;

export function withAuth(handler: Handler): Handler {
  return async (req, context) => {
    // Create Supabase client
    const supabase = await createClient();

    try {
      // Get the authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          {
            error: "unauthorized",
          },
          { status: 401 },
        );
      }

      // If user is authenticated, call the original handler with context
      return handler(req, context);
    } catch (error) {
      console.error("Error checking authentication:", error);
      return NextResponse.json(
        {
          error: "unauthorized",
        },
        { status: 401 },
      );
    }
  };
}
