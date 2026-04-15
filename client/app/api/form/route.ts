import { NextResponse } from "next/server";
import { getForms, createForm } from "@/shared/daos/formsDao";
import { createClient } from "@/shared/services/supabase/server";
import {
  FormStatus,
  type CreateFormResponse,
  type FormErrorResponse,
  type FormsListResponse,
} from "@/shared/types/forms";
import { toPositiveInteger } from "@/shared/utils/number";
import { withAuth } from "@/shared/utils/with-is-auth";

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

export const POST = withAuth(async (request: Request) => {
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

    let baseTitle = "Untitled form";

    // Check if there is a sourceFormId or title in the body
    try {
      const body = await request.json();
      if (body?.title) {
        baseTitle = body.title;
      } else if (body?.sourceFormId) {
        // Feature parity: previously it just ignored it and used "Untitled form"
        // But we'll query the title if it exists to be helpful, or just use Untitled form.
        // I will query the title of the source form to make duplicateFormMutation work nicely.
        const { data: sourceForm } = await supabase
          .from("forms")
          .select("title")
          .eq("id", body.sourceFormId)
          .single();

        if (sourceForm?.title) {
          baseTitle = sourceForm.title;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors, just use default "Untitled form"
    }

    const createdForm = await createForm({
      ownerId: user.id,
      title: baseTitle,
      description: "",
      status: FormStatus.DRAFT,
      theme: {},
      settings: {},
    });

    const response: CreateFormResponse = {
      ok: true,
      formId: createdForm.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    console.error("Error", message);
    return NextResponse.json({ error: message } satisfies FormErrorResponse, {
      status: 500,
    });
  }
});
