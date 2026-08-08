import { supabase } from "./supabase";

export async function getProducts(options = {}) {
  const { limit, category, subcategory } = options;

  let query = supabase.from("products").select("*");

  if (category && category !== "الكل") {
    query = query.eq("category", category);
  }

  if (subcategory && subcategory !== "الكل") {
    query = query.eq("subcategory", subcategory);
  }

  if (limit) {
    query = query.limit(limit);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Error loading products:", error);
    throw new Error(error.message);
  }

  return (data || []).map((product) => ({
    id: product.id,
    name: product.name,
    image: product.image,
    price: Number(product.price),
    oldPrice: Number(product.old_price),
    discount: product.discount || 0,
    stock: product.stock || 0,
    images: product.images || [],
    isNew: product.is_new,
    category: product.category,
    subcategory: product.subcategory,
    salesCount: product.sales_count || 0,
  }));
}
