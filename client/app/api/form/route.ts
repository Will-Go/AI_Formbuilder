import { NextResponse } from "next/server";
import { getForms } from "@/daos/formsDao";
import { createClient } from "@/shared/services/supabase/server";
import {
  FormStatus,
  type CreateFormResponse,
  type FormErrorResponse,
  type FormsListResponse,
} from "@/shared/types/forms";
import { toPositiveInteger } from "@/shared/utils/number";
import { withAuth } from "@/shared/utils/with-is-auth";

function buildCopyTitle(sourceTitle: string, existingTitles: string[]): string {
  const copyRegex = /^(.*) \(copy(?: (\d+))?\)$/;
  const baseTitle = sourceTitle.replace(copyRegex, "$1");
  let maxCopy = 0;

  for (const title of existingTitles) {
    const match = title.match(copyRegex);
    if (match && match[1] === baseTitle) {
      const value = match[2] ? parseInt(match[2], 10) : 1;
      if (value > maxCopy) {
        maxCopy = value;
      }
    }
  }

  const nextCopy = maxCopy + 1;
  if (nextCopy === 1) {
    return `${baseTitle} (copy)`;
  }

  return `${baseTitle} (copy ${nextCopy})`;
}

export const GET = withAuth(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams?.get("search")?.trim();
    const rawLimit = searchParams?.get("limit") ?? "20";
    const rawPageNumber = searchParams?.get("page_number") ?? "1";
    const parsedLimit = toPositiveInteger(rawLimit);
    const parsedPageNumber = toPositiveInteger(rawPageNumber);

    if (
      (rawLimit !== null && parsedLimit === null) ||
      (rawPageNumber !== null && parsedPageNumber === null)
    ) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" } satisfies FormErrorResponse,
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" } satisfies FormErrorResponse,
        { status: 401 },
      );
    }

    const result = await getForms({
      ownerId: user.id,
      search,
      limit: parsedLimit ?? undefined,
      pageNumber: parsedPageNumber ?? undefined,
    });

    const payload: FormsListResponse = {
      forms: result.forms,
      pagination: result.pagination,
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message } satisfies FormErrorResponse, {
      status: 500,
    });
  }
});

export const POST = withAuth(async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" } satisfies FormErrorResponse,
        { status: 401 },
      );
    }

    const baseTitle = "Untitled form";
    const { data: ownerTitles, error: ownerTitlesError } = await supabase
      .from("forms")
      .select("title")
      .eq("owner_id", user.id)
      .or(`title.eq.${baseTitle},title.like.${baseTitle} (copy%)`);

    if (ownerTitlesError) {
      return NextResponse.json(
        { error: "Failed to generate form title" } satisfies FormErrorResponse,
        { status: 500 },
      );
    }

    const existingTitles = (ownerTitles ?? []).map((item) => item.title);
    const title = existingTitles.includes(baseTitle)
      ? buildCopyTitle(baseTitle, existingTitles)
      : baseTitle;

    const { data: createdForm, error: createError } = await supabase
      .from("forms")
      .insert({
        owner_id: user.id,
        title,
        description: "",
        status: FormStatus.DRAFT,
        theme: {},
        settings: {},
      })
      .select("id")
      .single();

    if (createError || !createdForm) {
      return NextResponse.json(
        {
          error: "Failed to create form",
          details: createError?.message,
        } satisfies FormErrorResponse,
        { status: 500 },
      );
    }

    const response: CreateFormResponse = {
      ok: true,
      formId: createdForm.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message } satisfies FormErrorResponse, {
      status: 500,
    });
  }
});
