"use client";

import Link from "next/link";
import { Heart, ChevronLeft } from "lucide-react";
import { useWishlist } from "../../components/WishlistContext";
import ProductCard from "../../components/ProductCard";
import Header from "../../components/Header";
import CartDrawer from "../../components/CartDrawer";
import { useState } from "react";

export default function WishlistPage() {
  const { items } = useWishlist();
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <main>
      <Header
        search={search}
        setSearch={setSearch}
        onCartOpen={() => setCartOpen(true)}
      />

      <section className="catalog-page">
        <div className="catalog-top">
          <Link href="/products" className="back-button">
            <ChevronLeft size={18}/>
            متابعة التسوق
          </Link>
          <div>
            <span>زينة النيل</span>
            <h1>المفضلة</h1>
            <p>المنتجات التي قمتِ بإضافتها لقائمة أمنياتك.</p>
          </div>
        </div>

        <div className="catalog-results">
          {items.length === 0 ? (
            <div className="no-products">
              <Heart size={64} color="#ddd" />
              <h2>قائمة المفضلة فارغة</h2>
              <p>لم تقومي بإضافة أي منتجات للمفضلة بعد.</p>
              <Link href="/products">تصفّح المنتجات</Link>
            </div>
          ) : (
            <div className="catalog-products-grid">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  );
}
