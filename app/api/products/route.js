import { NextResponse } from "next/server";
import { getProducts } from "../../../lib/products";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");
  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");

  try {
    const products = await getProducts({
      limit: limit ? parseInt(limit) : undefined,
      category,
      subcategory
    });

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Products API error:", error);

    return NextResponse.json(
      {
        success: false,
        products: [],
        message: "حدث خطأ أثناء تحميل المنتجات",
      },
      { status: 500 }
    );
  }
}
