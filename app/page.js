"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Truck, ShieldCheck, Gift, CreditCard,
  Headphones, MessageCircle, ArrowUp
} from "lucide-react";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import CartDrawer from "../components/CartDrawer";
import { useCart } from "../components/CartContext";
import { products as staticProducts } from "../data/products";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [search, setSearch] = useState("");
  const { isCartOpen, openCart, closeCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("best_seller"); // "best_seller" | "discounts"

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const response = await fetch("/api/products?limit=20");
        const result = await response.json();

        if (result.success && result.products.length > 0) {
          setProducts(result.products);
        } else {
          setProducts(staticProducts);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts(staticProducts);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filtered = useMemo(() => {
    let list = products.filter(p => p.name.includes(search));

    if (activeFilter === "best_seller") {
      // ترتيب حسب الأكثر مبيعاً (إذا كان الحقل موجود) أو عشوائي للعرض
      list = [...list].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    } else if (activeFilter === "discounts") {
      // فلترة المنتجات التي بها خصم فقط
      list = list.filter(p => p.discount > 0);
    }

    return list.slice(0, 10);
  }, [search, products, activeFilter]);

  return (
    <main id="home">
      <Header
        search={search}
        setSearch={setSearch}
        onCartOpen={openCart}
      />

      <Link href="/products" className="hero">
        <img src="/images/hero-banner.jpg" alt="زينة النيل"/>
        <div className="slider-dots"><i/><i/><i/><i/></div>
      </Link>

      <section className="category-row">
        <Link
          className="category-banner"
          id="tob"
          href="/products?category=فاشن&subcategory=تياب"
        >
          <img src="/images/category-tob.jpg" alt="التوب السوداني"/>
          <div className="category-overlay">
            <h2>التوب السوداني</h2>
            <p>تشكيلة واسعة من أجمل التوب السوداني للمناسبات واليومي والحرير والمطرز</p>
            <span className="shop-now-btn">تسوقي الآن ›</span>
          </div>
        </Link>

        <Link
          className="category-banner"
          id="accessories"
          href="/products?category=إكسسوارات وشنط وأحذية&subcategory=إكسسوارات"
        >
          <img src="/images/category-accessories.jpg" alt="الإكسسوارات السودانية"/>
          <div className="category-overlay">
            <h2>الإكسسوارات السودانية</h2>
            <p>إكسسوارات تراثية فاخرة تعكس جمال الثقافة السودانية والأناقة العصرية</p>
            <span className="shop-now-btn">تسوقي الآن ›</span>
          </div>
        </Link>
      </section>

      <section className="products" id="products">
        <div className="products-heading-row">
          <div className="filter-pills">
            <button
              className={activeFilter === "best_seller" ? "active" : ""}
              onClick={() => setActiveFilter("best_seller")}
            >
              الأكثر مبيعاً
            </button>
            <button
              className={activeFilter === "discounts" ? "active" : ""}
              onClick={() => setActiveFilter("discounts")}
            >
              أقوى الخصومات
            </button>
          </div>
          <Link href="/products" className="view-all-link">عرض الكل <ChevronLeft size={15}/></Link>
        </div>

        <div className="product-slider">
          <button className="side-arrow"><ChevronRight/></button>
          <div className="product-grid">
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
          <button className="side-arrow"><ChevronLeft/></button>
        </div>
      </section>

      <section className="feature-bar">
        <div><Truck/><span><b>شحن سريع وآمن</b><small>إلى مصر وجميع دول الخليج</small></span></div>
        <div><ShieldCheck/><span><b>جودة مضمونة</b><small>منتجات أصلية 100%</small></span></div>
        <div><Gift/><span><b>استبدال واسترجاع</b><small>سهولة الاستبدال خلال 7 أيام</small></span></div>
        <div><CreditCard/><span><b>طرق دفع متعددة</b><small>دفع آمن وموثوق</small></span></div>
        <div><Headphones/><span><b>خدمة عملاء مميزة</b><small>نحن هنا لخدمتكم 24/7</small></span></div>
      </section>

      <a className="whatsapp" href="https://wa.me/201092879740" target="_blank" rel="noreferrer">
        <MessageCircle/>
      </a>
      <a className="back-top" href="#home"><ArrowUp/></a>


      <footer className="site-footer" id="contact">
        <div>
          <h3>زينة النيل</h3>
          <p>أناقة سودانية بروح النيل.. ولمسة عصر تتجدد</p>
        </div>
        <div>
          <h4>تواصل معنا</h4>
          <a href="tel:+201092879740">مصر: <span dir="ltr">+20 109 287 9740</span> <img src="https://flagcdn.com/w40/eg.png" alt="مصر" className="flag-img" /></a>
          <a href="tel:+971556414279">الإمارات: <span dir="ltr">+971 55 641 4279</span> <img src="https://flagcdn.com/w40/ae.png" alt="الإمارات" className="flag-img" /></a>
          <a href="mailto:zeinaalneel@gmail.com">zeinaalneel@gmail.com</a>
        </div>
        <div>
          <h4>روابط مهمة</h4>
          <a href="/about">من نحن</a>
          <a href="/contact">تواصل معنا</a>
          <a href="/products">جميع المنتجات</a>
        </div>
      </footer>

      <CartDrawer
        open={isCartOpen}
        onClose={closeCart}
      />
    </main>
  );
}
