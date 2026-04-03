import { NextResponse } from "next/server";
import { createClient } from "@/shared/services/supabase/server";
import { Form, FormStatus } from "@/shared/types/forms";

type FormsListResponse = {
  forms: Form[];
};

type FormMutationResponse = {
  ok: boolean;
  formId?: string;
};

type FormRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  status: FormStatus;
  theme: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function toDashboardForm(row: FormRow, responseCount: number): Form {
  return {
    id: row.id,
    title: row.title,
    authorId: row.owner_id,
    description: row.description ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    theme: row.theme ?? {},
    settings: row.settings ?? {},
    questions: [], // Dashboard doesn't need questions, so empty array
    responseCount,
  };
}

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formsQuery = supabase
      .from("forms")
      .select(
        "id, owner_id, title, description, status, theme, settings, created_at, updated_at",
      )
      .eq("owner_id", user.id);

    if (search) {
      formsQuery.ilike("title", `%${search}%`);
    }

    const { data: forms, error: formsError } = await formsQuery.order(
      "updated_at",
      { ascending: false },
    );

    if (formsError) {
      return NextResponse.json(
        { error: "Failed to fetch forms", details: formsError.message },
        { status: 500 },
      );
    }

    const formRows = (forms ?? []) as FormRow[];
    const formIds = formRows.map((item) => item.id);

    let responseCountByFormId: Record<string, number> = {};
    if (formIds.length > 0) {
      const { data: responses, error: responsesError } = await supabase
        .from("responses")
        .select("form_id")
        .in("form_id", formIds);

      if (responsesError) {
        return NextResponse.json(
          { error: "Failed to fetch form response counts" },
          { status: 500 },
        );
      }

      responseCountByFormId = (responses ?? []).reduce<Record<string, number>>(
        (acc, item) => {
          const formId = String(item.form_id);
          acc[formId] = (acc[formId] ?? 0) + 1;
          return acc;
        },
        {},
      );
    }

    const payload: FormsListResponse = {
      forms: formRows.map((row) =>
        toDashboardForm(row, responseCountByFormId[row.id] ?? 0),
      ),
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseTitle = "Untitled form";
    const { data: ownerTitles, error: ownerTitlesError } = await supabase
      .from("forms")
      .select("title")
      .eq("owner_id", user.id)
      .or(`title.eq.${baseTitle},title.like.${baseTitle} (copy%)`);

    if (ownerTitlesError) {
      return NextResponse.json(
        { error: "Failed to generate form title" },
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
        { error: "Failed to create form", details: createError?.message },
        { status: 500 },
      );
    }

    const response: FormMutationResponse = {
      ok: true,
      formId: createdForm.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
