import { NextResponse } from "next/server";
import { withAuth } from "@/shared/utils/with-is-auth";
import { getResponseSummary } from "@/shared/daos/responsesDao";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export const GET = withAuth(
  async (request: Request, { params }: RouteParams) => {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Form ID is required" },
        { status: 400 },
      );
    }

    try {
      const summary = await getResponseSummary(id);

      return NextResponse.json(summary, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    } catch (error) {
      console.error("Error fetching response summary:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Unexpected server error" },
        { status: 500 },
      );
    }
  },
);
