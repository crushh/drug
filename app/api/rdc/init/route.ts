import { NextResponse } from "next/server";

import { listStatusDict } from "@/lib/data-access";

export function GET() {
  return NextResponse.json({
    dicts: {
      status: listStatusDict(),
    },
  });
}
