"use client";

import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "./CartContext";
import Price from "./Price";

export default function CartDrawer({ open, onClose }) {
  const { items, total, increaseItem, decreaseItem, removeItem, getEffectiveStock } = useCart();

  const hasOutOfStock = items.some(item => item.stock === 0);

  return (
    <>
      <button
        className={`cart-backdrop ${open ? "show" : ""}`}
        onClick={onClose}
        aria-label="إغلاق السلة"
      />

      <aside className={`cart-drawer ${open ? "open" : ""}`}>
        <div className="cart-drawer-head">
          <div>
            <h2>سلة المشتريات</h2>
            <p>{items.length} منتج</p>
          </div>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={48}/>
              <p>السلة فارغة حاليًا.</p>
              <button onClick={onClose}>متابعة التسوق</button>
            </div>
          ) : (
            items.map((item) => {
              const effectiveStock = getEffectiveStock(item.id, item.stock);
              const isMaxStock = effectiveStock <= 0;
              const isOutOfStock = item.stock === 0;

              return (
                <article className={`cart-item ${isOutOfStock ? 'item-out-of-stock' : ''}`} key={`${item.id}-${item.color}`}>
                  <img src={item.image} alt={item.name} />
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <small>اللون: {item.color}</small>

                    <div className="cart-stock-status">
                      {isOutOfStock ? (
                        <span className="stock-label error">نفدت الكمية - يرجى الحذف للمتابعة</span>
                      ) : (
                        <span className="stock-label warning">
                          ⚡ متبقي {effectiveStock} قطع فقط
                        </span>
                      )}
                      {isMaxStock && !isOutOfStock && (
                        <span className="stock-limit-reached">الحد الأقصى للكمية المتوفرة</span>
                      )}
                    </div>

                    <Price amount={item.price} className="cart-item-price" />

                    <div className="quantity-control">
                      <button
                        onClick={() => increaseItem(item.id, item.color)}
                        disabled={isMaxStock || isOutOfStock}
                        className={isMaxStock ? 'disabled' : ''}
                      >
                        <Plus size={16}/>
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => decreaseItem(item.id, item.color)}><Minus size={16}/></button>
                    </div>
                  </div>
                  <button
                    className="remove-item"
                    onClick={() => removeItem(item.id, item.color)}
                  >
                    <Trash2 size={18}/>
                  </button>
                </article>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-summary">
            <div><span>الإجمالي</span><Price amount={total} className="cart-total-price" /></div>
            {hasOutOfStock ? (
              <div className="cart-error-message">
                يرجى إزالة المنتجات غير المتوفرة لإتمام الطلب
              </div>
            ) : (
              <Link href="/checkout" className="checkout-link" onClick={onClose}>
                إتمام الطلب
              </Link>
            )}
            <small>سيتم تأكيد تكلفة الشحن حسب الدولة والعنوان.</small>
          </div>
        )}
      </aside>
    </>
  );
}
