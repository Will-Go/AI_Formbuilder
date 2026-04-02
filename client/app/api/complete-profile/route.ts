import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/shared/services/supabase/admin";
import { createClient } from "@/shared/services/supabase/server";

type CompleteProfileRequest = {
  password?: string;
};

export async function POST(request: Request) {
  try {
    const client = await createClient();
    const {
      data: { user },
      error: getUserError,
    } = await client.auth.getUser();
    if (getUserError) {
      return NextResponse.json(
        { error: getUserError.message },
        { status: 400 },
      );
    }

    const userId = user?.id || "";

    if (!userId) {
      return NextResponse.json(
        { error: "Failed to complete profile request." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as CompleteProfileRequest;
    const password = body.password;

    if (!password) {
      return NextResponse.json(
        { error: "Invalid complete profile payload." },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to complete profile request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
