import { NextResponse } from "next/server";
import { createClient } from "@/shared/services/supabase/server";
import { FormDetailsSchema } from "@/shared/schemas/formDetails";
import { withAuth } from "@/shared/utils/with-is-auth";

import { z } from "zod";
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export const GET = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { error: "Form ID is required" },
          { status: 400 },
        );
      }

      const supabase = await createClient();

      // Call the database function to get the structured form details
      const { data, error } = await supabase.rpc("get_form_details", {
        p_form_id: id,
      });

      if (error) {
        console.error("Error fetching form details:", error);
        // Supabase standard error handling for custom exceptions in functions
        if (error.message.includes("not found")) {
          return NextResponse.json(
            { error: "Form not found" },
            { status: 404 },
          );
        }
        return NextResponse.json(
          { error: "Failed to fetch form details" },
          { status: 500 },
        );
      }

      if (!data) {
        return NextResponse.json({ error: "Form not found" }, { status: 404 });
      }

      // Validate the response data using the Zod schema
      try {
        const validatedData = FormDetailsSchema.parse(data);
        return NextResponse.json(validatedData);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: "Invalid form data structure",
              details: validationError.issues,
            },
            { status: 500 },
          );
        }
        return NextResponse.json(
          { error: "Validation failed" },
          { status: 500 },
        );
      }
    } catch (error) {
      console.error("Unexpected error fetching form details:", error);
      return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 },
      );
    }
  },
);

export const DELETE = withAuth(
  async (request: Request, { params }: RouteParams) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { id } = await params;

      if (!id) {
        return NextResponse.json(
          { error: "Form ID is required" },
          { status: 400 },
        );
      }

      const { data: deletedRows, error: deleteError } = await supabase
        .from("forms")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id)
        .select("id");

      if (deleteError) {
        return NextResponse.json(
          { error: "Failed to delete form", details: deleteError.message },
          { status: 500 },
        );
      }

      if (!deletedRows || deletedRows.length === 0) {
        return NextResponse.json({ error: "Form not found" }, { status: 404 });
      }

      const response = { ok: true };
      return NextResponse.json(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  },
);
