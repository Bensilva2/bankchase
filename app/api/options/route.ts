import { NextRequest, NextResponse } from "next/server";
import { getDefaultOptions, getOptionsByCategory } from "@/lib/options-loader";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const options = getDefaultOptions();

    if (category) {
      const categoryOptions = getOptionsByCategory(options, category);
      return NextResponse.json({
        success: true,
        data: categoryOptions,
        category,
      });
    }

    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("[v0] Error in options API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load options",
      },
      { status: 500 }
    );
  }
}
