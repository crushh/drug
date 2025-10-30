import { NextRequest, NextResponse } from "next/server";

import { searchDrugs } from "@/lib/rdc-data";
import { validationError, serverError } from "@/lib/http";
import { parseIntParam } from "@/lib/query";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    if (!q || !q.trim()) {
      return validationError("missing query parameter q", ["q"]);
    }
    const limit = parseIntParam(url.searchParams.get("limit"), 20, { min: 1, max: 100 });
    const items = await searchDrugs({ q, limit });
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return serverError(message);
  }
}
