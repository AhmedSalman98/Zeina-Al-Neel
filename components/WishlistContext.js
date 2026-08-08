"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // 1. Initial load from LocalStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("zeenatWishlist") || "[]");
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
      async function loadHistory() {
        const { data } = await supabase
          .from('profiles')
          .select('wishlist_data')
          .eq('id', user.id)
          .single();

        if (data?.wishlist_data) {
          setItems(data.wishlist_data);
          localStorage.setItem("zeenatWishlist", JSON.stringify(data.wishlist_data));
        }
      }
      loadHistory();
    } else {
      setItems([]);
      localStorage.removeItem("zeenatWishlist");
    }
  }, [user, loaded]);

  // 3. Save to LocalStorage and Sync to Cloud on changes
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("zeenatWishlist", JSON.stringify(items));

    if (user) {
      const syncTimeout = setTimeout(async () => {
        await supabase
          .from('profiles')
          .update({ wishlist_data: items })
          .eq('id', user.id);
      }, 1000);
      return () => clearTimeout(syncTimeout);
    }
  }, [items, user, loaded]);

  function toggleWishlist(product) {
    setItems((current) => {
      const isExist = current.find((item) => item.id === product.id);
      if (isExist) {
        return current.filter((item) => item.id !== product.id);
      }
      return [...current, product];
    });
  }

  function isInWishlist(productId) {
    return !!items.find((item) => item.id === productId);
  }

  const count = items.length;

  const value = useMemo(() => ({
    items,
    count,
    toggleWishlist,
    isInWishlist
  }), [items, count]);

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error("useWishlist must be used inside WishlistProvider");
  return value;
}
