import { NextRequest, NextResponse } from "next/server";

import { listDrugs } from "@/lib/rdc-data";
import { validationError, serverError } from "@/lib/http";
import { parseIntParam } from "@/lib/query";

const ALLOWED_SORT = new Set(["created_at:desc", "drug_name:asc", "drug_name:desc", "created_at:asc"]);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseIntParam(url.searchParams.get("page"), 1, { min: 1 });
    const pageSize = parseIntParam(url.searchParams.get("page_size"), 20, { min: 1, max: 100 });
    const query = url.searchParams.get("q") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const sortRaw = url.searchParams.get("sort") ?? undefined;

    if (sortRaw && !ALLOWED_SORT.has(sortRaw)) {
      return validationError("sort allows created_at or drug_name with asc/desc direction", ["sort"]);
    }

    const data = await listDrugs({
      page,
      pageSize,
      q: query,
      status,
      sort: sortRaw,
    });

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return serverError(message);
  }
}
