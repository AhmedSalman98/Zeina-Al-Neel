"use client";

import { CartProvider } from "./CartContext";
import { CurrencyProvider } from "./CurrencyContext";
import { WishlistProvider } from "./WishlistContext";
import { AuthProvider } from "./AuthContext";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
