import { createClient } from "@/shared/services/supabase/server";
import type {
  Form,
  FormsDaoResult,
  GetFormsOptions,
  PaginationInput,
  RpcFormRow,
  RpcGetFormsResponse,
  RpcOwner,
} from "@/shared/types/forms";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_PAGE_NUMBER = 1;

export function normalizePaginationInput(input: PaginationInput): {
  limit: number;
  pageNumber: number;
} {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const pageNumber = input.pageNumber ?? DEFAULT_PAGE_NUMBER;

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new Error("limit must be an integer between 1 and 100");
  }

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new Error("pageNumber must be an integer greater than 0");
  }

  return { limit, pageNumber };
}

function getAuthorName(owner: RpcOwner): string {
  if (!owner) {
    return "";
  }
  if (owner.name) {
    return owner.name;
  }
  if (owner.email) {
    return owner.email;
  }
  return owner.id ?? "";
}

export function mapRpcFormToForm(row: RpcFormRow): Form {
  return {
    id: row.id,
    title: row.title,
    author_id: row.owner_id,
    author_name: getAuthorName(row.owner),
    description: row.description ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: row.status,
    theme: row.theme ?? {},
    settings: row.settings ?? {},
    questions: [],
    response_count: row.response_count ?? 0,
  };
}

export async function getForms(
  options: GetFormsOptions = {},
): Promise<FormsDaoResult> {
  const { limit, pageNumber } = normalizePaginationInput({
    limit: options.limit,
    pageNumber: options.pageNumber,
  });
  const search = options.search?.trim() || null;
  const ownerId = options.ownerId ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_forms", {
    p_limit: limit,
    p_page_number: pageNumber,
    p_owner_id: ownerId,
    p_search: search,
  });

  if (error) {
    throw new Error(`Failed to fetch forms: ${error.message}`);
  }

  const payload = data as RpcGetFormsResponse | null;
  const formsRows = payload?.forms ?? [];
  const pagination = payload?.pagination;

  if (!pagination) {
    return {
      forms: formsRows.map(mapRpcFormToForm),
      pagination: {
        limit,
        pageNumber,
        totalCount: formsRows.length,
        totalPages: formsRows.length > 0 ? 1 : 0,
        hasNext: false,
        hasPrevious: pageNumber > 1,
      },
    };
  }

  return {
    forms: formsRows.map(mapRpcFormToForm),
    pagination: {
      limit: pagination.limit,
      pageNumber: pagination.page_number,
      totalCount: pagination.total_count,
      totalPages: pagination.total_pages,
      hasNext: pagination.has_next,
      hasPrevious: pagination.has_previous,
    },
  };
}
