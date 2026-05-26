import { NextRequest, NextResponse } from "next/server";

import { notFound, validationError } from "@/lib/http";
import {
  type EntityCategory,
  getChemicalRdcList,
  validateEntityCategory,
} from "@/lib/rdc-data";

export async function GET(
  _request: NextRequest,
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

  try {
    const detail = await getChemicalRdcList(categoryParam as EntityCategory, entityId);

    if (!detail) {
      return notFound(`Chemical entity ${entityId} was not found`);
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("Failed to get the RDC list for the chemical entity:", error);
    return NextResponse.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "Failed to get the RDC list for the chemical entity",
          details: [],
        },
      },
      { status: 500 }
    );
  }
}
