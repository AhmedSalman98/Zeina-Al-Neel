import { products as staticProducts } from "../../../data/products";
import ProductDetailsClient from "./ProductDetailsClient";
import { notFound } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default async function ProductDetailsPage({ params }) {
  // محاولة الجلب من Supabase أولاً
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !product) {
    // العودة للملف الثابت كنسخة احتياطية
    const staticProduct = staticProducts.find((item) => String(item.id) === String(params.id));
    if (!staticProduct) notFound();
    return <ProductDetailsClient product={staticProduct} />;
  }

  return <ProductDetailsClient product={product} />;
}
