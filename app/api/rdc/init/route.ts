import { NextResponse } from "next/server";

import { listStatusDict } from "@/lib/rdc-data";
import { serverError } from "@/lib/http";

export async function GET() {
  try {
    const status = await listStatusDict();
    return NextResponse.json({
      dicts: {
        status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return serverError(message);
  }
}
