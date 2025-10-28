import { NextRequest, NextResponse } from "next/server";

import { searchDrugs } from "@/lib/data-access";
import { validationError } from "@/lib/http";
import { parseIntParam } from "@/lib/query";

export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  if (!q || !q.trim()) {
    return validationError("缺少查询参数 q", ["q"]);
  }
  const limit = parseIntParam(url.searchParams.get("limit"), 20, { min: 1, max: 100 });
  const items = searchDrugs({ q, limit });
  return NextResponse.json({ items });
}
