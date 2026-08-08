"use client";

import Header from "./Header";
import CartDrawer from "./CartDrawer";
import { useCart } from "./CartContext";

export default function PageShell({
  children,
  search = "",
  setSearch = () => {}
}) {
  const { isCartOpen, openCart, closeCart } = useCart();

  return (
    <main>
      <Header
        search={search}
        setSearch={setSearch}
        onCartOpen={openCart}
      />
      {children}
      <CartDrawer
        open={isCartOpen}
        onClose={closeCart}
      />
    </main>
  );
}
