import { NextRequest, NextResponse } from "next/server";

import { serverError, validationError } from "@/lib/http";
import {
  type EntityCategory,
  searchChemicalEntities,
  validateEntityCategory,
} from "@/lib/rdc-data";
import { parseIntParam } from "@/lib/query";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const categoryParam = url.searchParams.get("entity_category");
    const q = url.searchParams.get("q");

    if (!categoryParam) {
      return validationError("missing query parameter entity_category", ["entity_category"]);
    }
    if (!validateEntityCategory(categoryParam)) {
      return validationError(`entity_category 不支持 ${categoryParam}`, ["entity_category"]);
    }
    if (!q || !q.trim()) {
      return validationError("missing query parameter q", ["q"]);
    }

    const limit = parseIntParam(url.searchParams.get("limit"), 20, { min: 1, max: 100 });
    const items = await searchChemicalEntities({
      entityCategory: categoryParam as EntityCategory,
      q,
      limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return serverError(message);
  }
}

