import { NextRequest, NextResponse } from "next/server";

import { listByStatus } from "@/lib/data-access";
import { validationError } from "@/lib/http";
import { parseIntParam } from "@/lib/query";

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  if (!status || !status.trim()) {
    return validationError("缺少查询参数 status", ["status"]);
  }
  const limit = parseIntParam(url.searchParams.get("limit"), 50, { min: 1, max: 200 });
  const items = listByStatus({ status, limit });
  return NextResponse.json({ items });
}
