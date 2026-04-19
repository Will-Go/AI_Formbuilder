import { createClient } from "@/shared/services/supabase/server";
import { PaginationInput } from "@/shared/types/forms";
import { normalizePaginationInput } from "./formsDao";

export interface SubmitResponseInput {
  formId: string;
  respondentId?: string;
  ip?: string;
  device?: string;
  metadata?: Record<string, unknown>;
  answers: {
    question_id: string;
    value: unknown;
  }[];
}

export interface GetResponsesOptions extends PaginationInput {
  formId: string;
  respondentId?: string;
}

export interface ResponsesDaoResult {
  responses: {
    response_id: string;
    form_id: string;
    respondent_id: string | null;
    submitted_at: string;
    ip: string | null;
    device: string | null;
    metadata: Record<string, unknown>;
    answers: {
      question_id: string;
      question_text: string;
      answer_value: unknown;
    }[];
  }[];
  pagination: {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
}

export interface SummaryDataPoint {
  label?: string;
  word?: string;
  count: number;
  [key: string]: string | number | undefined;
}

export interface QuestionSummaryData {
  id: string;
  label: string;
  description: string | null;
  required: boolean;
  order: number;
  chart_type: "pie" | "bar" | "text";
  type: string;
  data: SummaryDataPoint[];
}

export interface ResponseSummaryResult {
  summary: QuestionSummaryData[];
  total_responses: number;
}

/**
 * Submits a new form response via a single RPC transaction.
 * @param input The submission payload including answers.
 * @returns The newly created response ID.
 */
export async function submitResponse(
  input: SubmitResponseInput,
): Promise<string> {
  const supabase = await createClient();

  const payload = {
    form_id: input.formId,
    respondent_id: input.respondentId || null,
    ip: input.ip || null,
    device: input.device || null,
    metadata: input.metadata || {},
    answers: input.answers,
  };

  const { data, error } = await supabase.rpc("submit_response", {
    p_payload: payload,
  });

  if (error) {
    throw new Error(`Failed to submit response: ${error.message}`);
  }

  return data as string;
}

/**
 * Retrieves form responses aggregated with answers via a single RPC call.
 * @param options Pagination and filtering options.
 * @returns A list of responses and pagination metadata.
 */
export async function getResponses(
  options: GetResponsesOptions,
): Promise<ResponsesDaoResult> {
  const { limit, pageNumber } = normalizePaginationInput({
    limit: options.limit,
    pageNumber: options.pageNumber,
  });

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_responses", {
    p_form_id: options.formId,
    p_respondent_id: options.respondentId || null,
    p_limit: limit,
    p_page: pageNumber,
  });

  if (error) {
    throw new Error(`Failed to fetch responses: ${error.message}`);
  }

  return data as ResponsesDaoResult;
}

/**
 * Retrieves aggregated response summary data for a form.
 * @param formId The ID of the form.
 * @returns Aggregated summary data for charts.
 */
export async function getResponseSummary(
  formId: string,
): Promise<ResponseSummaryResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_response_summary", {
    p_form_id: formId,
  });

  if (error) {
    throw new Error(`Failed to fetch response summary: ${error.message}`);
  }

  return data as ResponseSummaryResult;
}

/**
 * Retrieves a single form response by ID.
 * @param formId The ID of the form.
 * @param responseId The ID of the response.
 */
export async function getResponse(formId: string, responseId: string) {
  const supabase = await createClient();

  const { data: response, error: responseError } = await supabase
    .from("responses")
    .select(
      `
      id,
      submitted_at,
      answers (
        id,
        question_id,
        value_json
      )
    `,
    )
    .eq("id", responseId)
    .eq("form_id", formId)
    .single();

  if (responseError || !response) {
    throw new Error("Response not found");
  }

  return {
    id: response.id,
    form_id: formId,
    submitted_at: response.submitted_at,
    answers: response.answers.map(
      (a: { question_id: string; value_json: unknown }) => ({
        question_id: a.question_id,
        value: a.value_json,
      }),
    ),
  };
}

/**
 * Deletes a form response by its ID.
 * @param formId The ID of the form.
 * @param responseId The ID of the response to delete.
 */
export async function deleteResponse(
  formId: string,
  responseId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("responses")
    .delete()
    .eq("id", responseId)
    .eq("form_id", formId);

  if (error) {
    throw new Error(`Failed to delete response: ${error.message}`);
  }
}
