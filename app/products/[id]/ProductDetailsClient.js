"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, Minus, Plus, ShoppingCart, MessageCircle,
  ShieldCheck, Truck, RefreshCcw, Heart
} from "lucide-react";
import PageShell from "../../../components/PageShell";
import BackButton from "../../../components/BackButton";
import ProductCard from "../../../components/ProductCard";
import { useCart } from "../../../components/CartContext";
import { useWishlist } from "../../../components/WishlistContext";
import { useCurrency } from "../../../components/CurrencyContext";
import Price from "../../../components/Price";
import { supabase } from "../../../lib/supabase";

export default function ProductDetailsClient({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "أزرق");
  const [added, setAdded] = useState(false);
  const { addItem, getItemQuantity, getEffectiveStock } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { formatPrice, marketCode } = useCurrency();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState(product.image);

  // تصحيح أسماء الحقول للتعامل مع بيانات Supabase (snake_case)
  const price = Number(product.price || 0);
  const oldPrice = Number(product.old_price || product.oldPrice || 0);
  const discount = Number(product.discount || 0);
  const stock = Number(product.stock || 0);

  const productImages = product.images && product.images.length > 0 ? product.images : [product.image];

  const displayedStock = getEffectiveStock(product.id, stock);
  const cartQtyForColor = getItemQuantity(product.id, selectedColor);
  const maxAvailableForColor = displayedStock;

  useEffect(() => {
    if (quantity > maxAvailableForColor && maxAvailableForColor > 0) {
      setQuantity(maxAvailableForColor);
    }
  }, [selectedColor, displayedStock]);

  useEffect(() => {
    async function fetchRelated() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category', product.category)
        .neq('id', product.id)
        .limit(5);

      if (data) setRelatedProducts(data);
    }
    fetchRelated();
  }, [product.category, product.id]);

  const isFavorite = isInWishlist(product.id);

  async function addToCart() {
    if (quantity > maxAvailableForColor) {
      alert("الكمية المطلوبة تتجاوز المتاح حالياً مع ما في سلتك");
      return;
    }
    setAdded(true); // تحديث فوري للواجهة
    const success = await addItem(product, quantity, selectedColor);
    if (success) {
      setTimeout(() => setAdded(false), 2200);
    } else {
      setAdded(false);
    }
  }

  const whatsappText = encodeURIComponent(
    `مرحبًا، أود الاستفسار عن المنتج التالي من زينة النيل:\n` +
    `المنتج: ${product.name}\n` +
    `اللون: ${selectedColor}\n` +
    `الكمية: ${quantity}\n` +
    `السعر: ${formatPrice(price)}`
  );

  return (
    <PageShell>

      <section className="product-page">
        <div className="product-page-back">
          <BackButton fallback="/products" />
        </div>
        <div className="breadcrumbs">
          <Link href="/">الرئيسية</Link>
          <ChevronLeft size={15}/>
          <Link href="/products">جميع المنتجات</Link>
          <ChevronLeft size={15}/>
          <strong>{product.name}</strong>
        </div>

        <div className="product-details-grid">
          <div className="product-gallery">
            <div className="main-product-image">
              <img src={activeImage} alt={product.name}/>
              <button
                className={`detail-heart ${isFavorite ? "active" : ""}`}
                onClick={() => toggleWishlist(product)}
              >
                <Heart fill={isFavorite ? "#e11d48" : "none"} color={isFavorite ? "#e11d48" : "currentColor"} />
              </button>
              {discount > 0 && <span className="detail-discount">خصم {discount}%</span>}
            </div>
            <div className="thumbs">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  className={activeImage === img ? "active" : ""}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`}/>
                </button>
              ))}
            </div>
          </div>

          <div className="product-detail-info">
            <span className="product-category">{product.category} / {product.subcategory}</span>
            <h1>{product.name}</h1>

            <div className="detail-price-row">
              <div className="detail-price">
                <strong className="detail-current-price"><Price amount={price} /></strong>
                {oldPrice > price && (
                  <>
                    <del className="detail-old-price"><Price amount={oldPrice} /></del>
                    <span className="detail-save-badge">وفّري <Price amount={oldPrice - price} /></span>
                  </>
                )}
              </div>

              <div className="stock-urgency-wrapper">
                {stock > 0 ? (
                  <span className={`stock-badge ${displayedStock <= 3 ? 'low-stock' : 'in-stock'}`}>
                    {displayedStock === 0
                      ? 'لقد أضفتِ كل الكمية المتاحة إلى سلتك'
                      : displayedStock <= 3
                        ? `متبقي ${displayedStock} قطع فقط - سارع بالطلب! 🔥`
                        : `المتبقي في المخزون: ${displayedStock} قطع`}
                  </span>
                ) : (
                  <span className="stock-badge out-of-stock">غير متوفر حالياً</span>
                )}
              </div>
            </div>

            <p className="detail-description">
              قطعة سودانية أنيقة مصممة بعناية، تجمع بين الطابع التراثي
              واللمسة العصرية. مناسبة للمناسبات والاستخدام اليومي،
              مع خامة مريحة وتفاصيل مميزة.
            </p>

            <div className="detail-option">
              <b>اللون:</b>
              <div className="color-options">
                {(product.colors && product.colors.length > 0 ? product.colors : ["أزرق", "أسود", "أبيض", "نبيتي"]).map((color) => (
                  <button
                    key={color}
                    className={selectedColor === color ? "selected" : ""}
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="detail-option">
              <b>الكمية:</b>
              <div className="detail-quantity">
                <button onClick={() => setQuantity(q => Math.min(maxAvailableForColor, q + 1))} disabled={stock <= 0 || quantity >= maxAvailableForColor}><Plus/></button>
                <span>{stock > 0 ? quantity : 0}</span>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={stock <= 0}><Minus/></button>
              </div>
              {stock > 0 && (quantity >= maxAvailableForColor || maxAvailableForColor === 0) && (
                <small className="max-stock-alert">
                  {maxAvailableForColor === 0 ? "لقد أضفتِ كل الكمية المتاحة إلى سلتك" : "هذا هو أقصى عدد متاح حالياً"}
                </small>
              )}
            </div>

            <div className="detail-actions">
              <button
                className={`detail-add ${added ? 'success' : ''}`}
                onClick={addToCart}
                disabled={stock <= 0 || maxAvailableForColor <= 0 || added}
              >
                <ShoppingCart/>
                {stock <= 0 ? "نفدت الكمية" : maxAvailableForColor <= 0 ? "الحد الأقصى بالسلة" : added ? "تمت الإضافة ✓" : "إضافة إلى السلة"}
              </button>
              <a
                className={`detail-whatsapp ${product.stock <= 0 ? 'disabled' : ''}`}
                href={product.stock > 0 ? `https://wa.me/${marketCode === "EG" ? "201092879740" : "971556414279"}?text=${whatsappText}` : '#'}
                target={product.stock > 0 ? "_blank" : "_self"}
                rel="noreferrer"
              >
                <MessageCircle/>
                الاستفسار عن المنتج
              </a>
            </div>

            {added && <div className="added-message">تمت إضافة المنتج إلى السلة ✓</div>}

            <div className="detail-features">
              <div><Truck/><span><b>شحن متاح</b><small>مصر، الإمارات وقطر</small></span></div>
              <div><ShieldCheck/><span><b>جودة مضمونة</b><small>منتجات مختارة بعناية</small></span></div>
              <div><RefreshCcw/><span><b>استبدال واسترجاع</b><small>وفق سياسة المتجر</small></span></div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="related-products mt-40">
            <div className="section-title">
              <h2>منتجات قد تعجبك</h2>
              <span>اكتشفي المزيد من {product.category}</span>
            </div>
            <div className="product-grid mt-20">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
