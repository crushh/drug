import { NextRequest, NextResponse } from "next/server";

import { notFound, validationError } from "@/lib/http";
import { parseBooleanParam } from "@/lib/query";
import {
  type EntityCategory,
  getChemicalDetail,
  validateEntityCategory,
} from "@/lib/rdc-data";

export async function GET(
  request: NextRequest,
  context: { params: { entity_category: string; entity_id: string } }
) {
  const { entity_category: categoryParam, entity_id: entityId } = context.params;
  if (!categoryParam) {
    return validationError("Missing path parameter entity_category", ["entity_category"]);
  }
  if (!entityId) {
    return validationError("Missing path parameter entity_id", ["entity_id"]);
  }

  if (!validateEntityCategory(categoryParam)) {
    return validationError(`entity_category does not support ${categoryParam}`, ["entity_category"]);
  }

  const includeActivity = parseBooleanParam(
    new URL(request.url).searchParams.get("include_activity"),
    true
  );

  try {
    const detail = await getChemicalDetail(categoryParam as EntityCategory, entityId, {
      includeActivity,
    });

    if (!detail) {
      return notFound(`Chemical entity ${entityId} was not found`);
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Failed to get chemical entity details:", error);
    return NextResponse.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "Failed to get chemical entity details",
          details: [],
        },
      },
      { status: 500 }
    );
  }
}
