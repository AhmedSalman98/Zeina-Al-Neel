"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import BackButton from "../../components/BackButton";
import CartDrawer from "../../components/CartDrawer";
import { useCart } from "../../components/CartContext";
import { useCurrency } from "../../components/CurrencyContext";
import { products as staticProducts } from "../../data/products";
import { supabase } from "../../lib/supabase";

function ProductsContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        const result = await response.json();

        if (result.success && result.products.length > 0) {
          setProducts(result.products);
        } else {
          setProducts(staticProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts(staticProducts);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const initialCategory = searchParams.get("category") || "الكل";
  const initialSubcategory = searchParams.get("subcategory") || "الكل";
  const initialSort = searchParams.get("sort") || "default";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(initialSubcategory);
  const [sort, setSort] = useState(initialSort);
  const [maxPrice, setMaxPrice] = useState(3000);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);
  const { isCartOpen, openCart, closeCart } = useCart();
  const { market, convert, rates } = useCurrency();

  const currentRate = rates[market.currency] || 1;
  const displayMaxPrice = Math.round(maxPrice * currentRate);
  const displaySliderLimit = Math.round(3000 * currentRate);

  useEffect(() => {
    const nextCategory = searchParams.get("category") || "الكل";
    const nextSubcategory = searchParams.get("subcategory") || "الكل";
    const nextSort = searchParams.get("sort") || "default";

    setCategory(nextCategory);
    setSubcategory(nextSubcategory);
    setSort(nextSort);
  }, [searchParams]);

  const subcategories = useMemo(() => {
    const source = category === "الكل"
      ? products
      : products.filter((item) => item.category === category);
    return ["الكل", ...new Set(source.map((item) => item.subcategory))];
  }, [category, products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch =
        product.name.includes(search) ||
        product.category.includes(search) ||
        product.subcategory.includes(search);

      const matchesCategory =
        category === "الكل" || product.category === category;

      const matchesSubcategory =
        subcategory === "الكل" || product.subcategory === subcategory;

      const matchesPrice = product.price <= maxPrice;
      const matchesAvailability = !availableOnly || product.stock > 0;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubcategory &&
        matchesPrice &&
        matchesAvailability
      );
    });

    if (sort === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      result = [...result].sort((a, b) => Number(b.isNew) - Number(a.isNew));
    } else if (sort === "discount") {
      result = [...result].sort((a, b) => b.discount - a.discount);
    }

    return result;
  }, [products, search, category, subcategory, sort, maxPrice, availableOnly]);

  function resetFilters() {
    setSearch("");
    setCategory("الكل");
    setSubcategory("الكل");
    setSort("default");
    setMaxPrice(3000);
    setAvailableOnly(false);
  }



  return (
    <main>
      <Header
        search={search}
        setSearch={setSearch}
        onCartOpen={openCart}
      />

      <section className="catalog-page">
        <div className="catalog-top">
          <BackButton fallback="/" />
          <div>
            <span>زينة النيل</span>
            <h1>جميع المنتجات</h1>
            <p>اكتشفي تشكيلتنا من الفاشن والإكسسوارات والعطور ومستلزمات العروس.</p>
          </div>
        </div>

        <div className="catalog-toolbar">
          <label className="catalog-search">
            <Search size={20}/>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحثي باسم المنتج أو القسم..."
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="مسح البحث">
                <X size={18}/>
              </button>
            )}
          </label>

          <button
            className="mobile-filter-button"
            onClick={() => setMobileFilters(true)}
          >
            <SlidersHorizontal size={18}/>
            الفلاتر
          </button>

          <label className="sort-select">
            <span>ترتيب حسب:</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="default">الافتراضي</option>
              <option value="newest">الأحدث</option>
              <option value="price-asc">السعر: الأقل أولًا</option>
              <option value="price-desc">السعر: الأعلى أولًا</option>
              <option value="discount">أعلى خصم</option>
            </select>
          </label>
        </div>

        <div className="catalog-layout">
          <aside className={`filters-sidebar ${mobileFilters ? "mobile-open" : ""}`}>
            <div className="filters-heading">
              <h2>تصفية المنتجات</h2>
              <button className="close-mobile-filter" onClick={() => setMobileFilters(false)}>
                <X/>
              </button>
            </div>

            <div className="filter-group">
              <h3>القسم</h3>
              {["الكل", "فاشن", "إكسسوارات وشنط وأحذية", "العطور والخلطات", "مستلزمات العروس"].map((item) => (
                <label key={item} className="radio-filter">
                  <input
                    type="radio"
                    name="category"
                    checked={category === item}
                    onChange={() => {
                      setCategory(item);
                      setSubcategory("الكل");
                    }}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3>التصنيف الفرعي</h3>
              <select value={subcategory} onChange={(event) => setSubcategory(event.target.value)}>
                {subcategories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <div className="range-heading">
                <h3>أقصى سعر</h3>
                <strong>{displayMaxPrice} {market.symbol}</strong>
              </div>
              <input
                className="price-range"
                type="range"
                min="0"
                max={displaySliderLimit}
                step={market.currency === "EGP" ? 50 : 5}
                value={displayMaxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value) / currentRate)}
              />
              <div className="range-labels">
                <span>0</span>
                <span>{displaySliderLimit} {market.symbol}</span>
              </div>
            </div>

            <div className="filter-group">
              <label className="availability-filter">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(event) => setAvailableOnly(event.target.checked)}
                />
                <span>عرض المنتجات المتوفرة فقط</span>
              </label>
            </div>

            <button className="reset-filters" onClick={resetFilters}>
              إعادة ضبط الفلاتر
            </button>
          </aside>

          {mobileFilters && (
            <button
              className="filters-mobile-backdrop"
              onClick={() => setMobileFilters(false)}
              aria-label="إغلاق الفلاتر"
            />
          )}

          <div className="catalog-results">
            <div className="results-count">
              <strong>{filteredProducts.length}</strong>
              <span>منتج متاح</span>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="catalog-products-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            ) : (
              <div className="no-products">
                <h2>لا توجد منتجات مطابقة</h2>
                <p>جرّبي تغيير البحث أو إعادة ضبط الفلاتر.</p>
                <button onClick={resetFilters}>إعادة ضبط الفلاتر</button>
              </div>
            )}
          </div>
        </div>
      </section>
      <CartDrawer open={isCartOpen} onClose={closeCart} />
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="page-loading">جاري تحميل المنتجات...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
