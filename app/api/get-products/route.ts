import { NextResponse } from "next/server";
import { fetchProducts } from "@/lib/googleSheets";

export async function GET(request: Request) {
  try {
    // get from Google Sheets
    const products = await fetchProducts();

    // Validate
    if (!products) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("Order submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit order" },
      { status: 500 },
    );
  }
}
