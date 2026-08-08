"use client";

import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const isFirstLoad = useRef(true);

  // 1. Initial load from LocalStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("zeenatCart") || "[]");
      setItems(Array.isArray(saved) ? saved : []);
    } catch {
      setItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  // 2. Sync with Supabase on User Login/Logout
  useEffect(() => {
    if (!loaded) return;

    if (user) {
      // User just logged in: Load history from Supabase
      async function loadHistory() {
        const { data, error } = await supabase
          .from('profiles')
          .select('cart_data')
          .eq('id', user.id)
          .single();

        if (data?.cart_data) {
          // Merge or Replace? User requested "يرجع لي history"
          // We'll replace local with cloud history upon login
          setItems(data.cart_data);
          localStorage.setItem("zeenatCart", JSON.stringify(data.cart_data));
        }
      }
      loadHistory();
    } else {
      // User logged out: Clear UI
      setItems([]);
      localStorage.removeItem("zeenatCart");
    }
  }, [user, loaded]);

  // 3. Save to LocalStorage and Sync to Cloud on changes
  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem("zeenatCart", JSON.stringify(items));

    // Prevent syncing empty cart immediately on first load if we are waiting for user fetch
    if (user) {
      const syncTimeout = setTimeout(async () => {
        await supabase
          .from('profiles')
          .update({ cart_data: items })
          .eq('id', user.id);
      }, 1000);
      return () => clearTimeout(syncTimeout);
    }
  }, [items, user, loaded]);

  async function releaseExpiredReservation(item) {
    try {
      await supabase.rpc('increment_stock', { p_id: item.id, p_qty: item.quantity });
      setItems(current => current.filter(i => !(i.id === item.id && i.color === item.color)));
    } catch (err) {
      console.error("Error releasing reservation:", err);
    }
  }

  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => {
      const now = Date.now();
      items.forEach(item => {
        if (item.reservedAt) {
          const minutesPassed = (now - item.reservedAt) / (1000 * 60);
          if (minutesPassed >= 30) releaseExpiredReservation(item);
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [items, loaded]);

  async function addItem(product, quantity = 1, color = "أزرق") {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id && item.color === color);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + quantity > product.stock) {
        alert(`عذراً، الكمية المطلوبة غير متوفرة. المتاح: ${product.stock}`);
        return current;
      }
      if (existing) {
        return current.map((item) => item.id === product.id && item.color === color ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...current, { ...product, quantity, color, reservedAt: Date.now() }];
    });
    return true;
  }

  function openCart() { setIsCartOpen(true); }
  function closeCart() { setIsCartOpen(false); }

  function getItemQuantity(id, color) {
    if (color) {
      const item = items.find(i => i.id === id && i.color === color);
      return item ? item.quantity : 0;
    }
    return items.filter(i => i.id === id).reduce((sum, i) => sum + i.quantity, 0);
  }

  function getEffectiveStock(productId, originalStock) {
    const quantityInCart = getItemQuantity(productId);
    return Math.max(0, (Number(originalStock) || 0) - quantityInCart);
  }

  function increaseItem(id, color) {
    setItems((current) =>
      current.map((item) => {
        if (item.id === id && item.color === color) {
          const nextQty = item.quantity + 1;
          if (nextQty <= item.stock) return { ...item, quantity: nextQty };
          else alert("وصلتِ للحد الأقصى");
        }
        return item;
      })
    );
  }

  function decreaseItem(id, color) {
    setItems((current) => current.map((item) => item.id === id && item.color === color ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0));
  }

  function removeItem(id, color) {
    setItems((current) => current.filter((item) => !(item.id === id && item.color === color)));
  }

  function clearCart() { setItems([]); }

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, getItemQuantity, getEffectiveStock, increaseItem, decreaseItem, removeItem, clearCart, isCartOpen, openCart, closeCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
