import { NextRequest, NextResponse } from "next/server";

import { listByStatus } from "@/lib/rdc-data";
import { validationError, serverError } from "@/lib/http";
import { parseIntParam } from "@/lib/query";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    if (!status || !status.trim()) {
      return validationError("missing query parameter status", ["status"]);
    }
    const limit = parseIntParam(url.searchParams.get("limit"), 50, { min: 1, max: 200 });
    const items = await listByStatus({ status, limit });
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return serverError(message);
  }
}
