"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import Price from "./Price";

export default function ProductCard({ product }) {
  const { addItem, getEffectiveStock } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isFavorite = isInWishlist(product.id);
  const [isAdded, setIsAdded] = useState(false);

  // تصحيح القيم للتعامل مع بيانات Supabase
  const price = Number(product.price || 0);
  const oldPrice = Number(product.old_price || product.oldPrice || 0);
  const stock = Number(product.stock || 0);
  const discount = Number(product.discount || 0);

  // نحسب المخزون المعروض بناءً على المخزون الأصلي مطروحاً منه ما تم حجزه في السلة
  const displayedStock = getEffectiveStock(product.id, stock);

  const isOutOfStock = displayedStock <= 0;
  const isMaxInCart = displayedStock <= 0;

  async function handleAdd() {
    if (isMaxInCart) return;
    setIsAdded(true); // تحديث فوري للحالة البصرية للزر
    const success = await addItem(product);
    if (success) {
      setTimeout(() => setIsAdded(false), 2000);
    } else {
      setIsAdded(false);
    }
  }

  const stockBadge = useMemo(() => {
    const s = displayedStock;
    if (s === 0) {
      return <span className="card-stock-badge out">نفدت الكمية ❌</span>;
    }
    if (s === 1) {
      return <span className="card-stock-badge urgency-1">🔥 متبقي قطعة واحدة فقط!</span>;
    }
    if (s <= 3) {
      return <span className="card-stock-badge urgency-2">⚡ متبقي {s} قطع فقط!</span>;
    }
    if (s <= 5) {
      return <span className="card-stock-badge low">متبقي كمية محدودة ({s} قطع)</span>;
    }
    return <span className="card-stock-badge in">متوفر بالمخزن</span>;
  }, [displayedStock]);

  return (
    <article className="product-card">
      <div className="product-image-wrapper">
        <Link href={`/products/${product.id}`} className="product-image">
          <img src={product.image} alt={product.name} loading="lazy" />
          {product.is_new && <span className="new-badge">جديد</span>}
        </Link>

        <div className="product-overlay">
          {stock > 0 ? (
            <>
              <button
                className="quick-add-btn"
                onClick={handleAdd}
                title="إضافة سريعة للسلة"
              >
                <ShoppingCart size={20} />
              </button>
              <Link href={`/products/${product.id}`} className="quick-view-btn" title="عرض التفاصيل">
                <Eye size={20} />
              </Link>
            </>
          ) : (
            <div className="out-of-stock-overlay">نفدت الكمية</div>
          )}
        </div>

        <button
          className={`heart-btn ${isFavorite ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
        >
          <Heart size={18} fill={isFavorite ? "#e11d48" : "none"} color={isFavorite ? "#e11d48" : "currentColor"} />
        </button>
      </div>

      <div className="product-body">
        <Link href={`/products/${product.id}`} className="product-category-link">
          {product.category}
        </Link>
        <Link href={`/products/${product.id}`} className="product-title-link">
          <h3>{product.name}</h3>
        </Link>

        {stockBadge}

        <div className="product-price-bar">
          <div className="price-main">
            <Price amount={price} className="product-current-price" />
          </div>
          {oldPrice > price && (
            <div className="price-old">
              <del><Price amount={oldPrice} /></del>
            </div>
          )}
          {discount > 0 && (
            <div className="price-discount">
              <span>{discount}%-</span>
            </div>
          )}
        </div>

        <button
          className={`add-to-cart-btn ${isAdded ? 'success' : ''}`}
          onClick={handleAdd}
          disabled={isOutOfStock || isMaxInCart || isAdded}
        >
          <ShoppingCart size={18}/>
          {isOutOfStock ? "نفدت من المخزن" : isMaxInCart ? "الحد الأقصى بالسلة" : isAdded ? "تمت الإضافة ✓" : "إضافة للسلة"}
        </button>
      </div>
    </article>
  );
}
