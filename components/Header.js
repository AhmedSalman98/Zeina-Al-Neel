"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ShoppingCart, Heart, UserRound, Search, Truck, ChevronDown,
  Mail, Menu, X
} from "lucide-react";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { useCurrency, markets } from "./CurrencyContext";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";

const fashionSubs = [
  "دراعات", "طرح", "تياب", "عبايات وملابس محجبات",
  "فساتين", "كاجوال", "منتجات شي إن"
];
const accessoriesSubs = ["إكسسوارات", "شنط", "أحذية"];
const perfumeSubs = [
  "عطور سودانية", "عطور فرنسية", "عطور خليجية",
  "خلطات تفتيح", "خلطات تنعيم", "خلطات مخصوص", "خلطات سولي", "أخرى"
];
const bridalSubs = ["جدل", "تياب عروس", "تجهيزات ليلة الزفاف", "أخرى"];

function HeaderContent({ search = "", setSearch = () => {}, onCartOpen = () => {} }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { count, clearCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { marketCode, market, changeMarket } = useCurrency();
  const { user, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const category = searchParams.get("category");
  const subcategory = searchParams.get("subcategory");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearCart();
    window.location.href = "/";
  };

  const productUrl = (categoryName, subcategoryName) => {
    const params = new URLSearchParams();
    params.set("category", categoryName);
    if (subcategoryName) params.set("subcategory", subcategoryName);
    return `/products?${params.toString()}`;
  };

  return (
    <>
      {/* Top Utility Bar (Shared Style) */}
      <div className="top-nav-compact">
        <div className="top-nav-container">
          <div className="top-info-group desktop-only">
            <a href="tel:+201092879740">
              <img src="https://flagcdn.com/w40/eg.png" alt="مصر" className="mini-flag" />
              <span dir="ltr">+20 109 287 9740</span>
            </a>
            <a href="tel:+971556414279">
              <img src="https://flagcdn.com/w40/ae.png" alt="الإمارات" className="mini-flag" />
              <span dir="ltr">+971 55 641 4279</span>
            </a>
          </div>

          <div className="top-market-group">
            <div className="announcement-text desktop-only">
              <Truck size={14}/> <span>شحن لمصر والخليج</span>
            </div>
            <div className="market-selector-mini">
              {market.flag}
              <select value={marketCode} onChange={(e) => changeMarket(e.target.value)}>
                {Object.entries(markets).map(([code, item]) => (
                  <option key={code} value={code}>{item.country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <header className="main-header">
        {/* Desktop Header Content (Single Horizontal Row) */}
        <div className="desktop-header-content desktop-only">
           <Link href="/" className="logo-link">
              <img src="/images/logo-full.png" alt="زينة النيل" />
           </Link>

           <div className="header-search-box">
             <label className="main-search">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن منتج..."
                />
                <button aria-label="بحث"><Search size={22}/></button>
              </label>
           </div>

           <div className="header-tools-icons">
              {user ? (
                <div className="nav-dropdown user-dropdown">
                  <button className="user-btn">
                    <UserRound size={20}/>
                    <span>{isAdmin ? "الأدمن" : "حسابي"}</span>
                    <ChevronDown size={12} />
                  </button>
                  <div className="dropdown-menu">
                    {isAdmin && <Link href="/admin">لوحة التحكم</Link>}
                    <Link href="/profile">حسابي</Link>
                    <Link href="/profile">طلباتي</Link>
                    <button onClick={handleLogout} className="logout-btn">خروج</button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="login-link">
                  <UserRound size={20}/>
                  <span>دخول</span>
                </Link>
              )}

              <Link href="/wishlist" className="wishlist-icon">
                <Heart size={20}/><i>{wishlistCount}</i>
                <span>المفضلة</span>
              </Link>

              <button className="cart-icon" onClick={onCartOpen}>
                <ShoppingCart size={20}/><i>{count}</i>
                <span>السلة</span>
              </button>
           </div>
        </div>

        {/* Mobile Header Content (Compact Row) */}
        <div className="mobile-header-content mobile-only">
          <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(true)}>
            <Menu size={28} />
          </button>

          <Link href="/" className="logo-link-mobile">
            <img src="/images/logo-full.png" alt="زينة النيل" />
          </Link>

          <button className="cart-icon" onClick={onCartOpen}>
            <ShoppingCart size={24}/><i>{count}</i>
          </button>
        </div>

        {/* Compact Mobile Search Bar (Appears below logo row on mobile) */}
        <div className="mobile-search-bar mobile-only">
           <label className="main-search compact">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
              />
              <button aria-label="بحث"><Search size={18}/></button>
            </label>
        </div>
      </header>

      {/* Desktop Navigation Links (Below the main header row) */}
      <nav className="links-navbar desktop-only">
        <div className="links-container">
          <Link className={pathname === "/" ? "active" : ""} href="/">الرئيسية</Link>
          <Link className={pathname === "/products" && !category ? "active" : ""} href="/products">جميع المنتجات</Link>

          <div className={`nav-dropdown ${category === "فاشن" ? "active" : ""}`}>
            <span>فاشن <ChevronDown size={14}/></span>
            <div className="dropdown-menu">
              <Link href={productUrl("فاشن")}>كل منتجات الفاشن</Link>
              {fashionSubs.map((item) => (
                <Link key={item} className={subcategory === item ? "selected" : ""} href={productUrl("فاشن", item)}>{item}</Link>
              ))}
            </div>
          </div>

          <div className={`nav-dropdown ${category === "إكسسوارات وشنط وأحذية" ? "active" : ""}`}>
            <span>إكسسوارات <ChevronDown size={14}/></span>
            <div className="dropdown-menu">
              <Link href={productUrl("إكسسوارات وشنط وأحذية")}>عرض الكل</Link>
              {accessoriesSubs.map((item) => (
                <Link key={item} className={subcategory === item ? "selected" : ""} href={productUrl("إكسسوارات وشنط وأحذية", item)}>{item}</Link>
              ))}
            </div>
          </div>

          <Link href="/products?sort=discount">العروض</Link>
          <Link className={pathname === "/about" ? "active" : ""} href="/about">من نحن</Link>
          <Link className={pathname === "/contact" ? "active" : ""} href="/contact">تواصل معنا</Link>
        </div>
      </nav>

      {/* Mobile Side Drawer Menu */}
      <div className={`mobile-side-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="menu-overlay" onClick={() => setIsMenuOpen(false)} />
        <div className="menu-content">
          <div className="menu-header">
            <img src="/images/logo-header.png" alt="زينة النيل" />
            <button onClick={() => setIsMenuOpen(false)}><X size={30}/></button>
          </div>
          <nav className="mobile-nav-list">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>الرئيسية</Link>
            <Link href="/products" onClick={() => setIsMenuOpen(false)}>جميع المنتجات</Link>
            <Link href={productUrl("فاشن")} onClick={() => setIsMenuOpen(false)}>فاشن</Link>
            <Link href={productUrl("إكسسوارات وشنط وأحذية")} onClick={() => setIsMenuOpen(false)}>إكسسوارات</Link>
            <Link href={productUrl("العطور والخلطات")} onClick={() => setIsMenuOpen(false)}>عطور وخلطات</Link>
            <Link href={productUrl("مستلزمات العروس")} onClick={() => setIsMenuOpen(false)}>مستلزمات العروس</Link>
            <hr/>
            <Link href="/about" onClick={() => setIsMenuOpen(false)}>من نحن</Link>
            <Link href="/contact" onClick={() => setIsMenuOpen(false)}>تواصل معنا</Link>
            {user ? (
               <Link href="/profile" onClick={() => setIsMenuOpen(false)}>حسابي</Link>
            ) : (
               <Link href="/login" onClick={() => setIsMenuOpen(false)}>تسجيل الدخول</Link>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Always Visible on Mobile) */}
      <nav className="mobile-bottom-nav mobile-only">
        <Link href="/" className={pathname === "/" ? "active" : ""}>
          <UserRound size={22} />
          <span>الرئيسية</span>
        </Link>
        <Link href="/wishlist" className={pathname === "/wishlist" ? "active" : ""}>
          <div className="nav-icon-badge">
            <Heart size={22} />
            {wishlistCount > 0 && <i>{wishlistCount}</i>}
          </div>
          <span>المفضلة</span>
        </Link>
        <button onClick={onCartOpen} className="mobile-nav-cart">
          <div className="nav-icon-badge">
            <ShoppingCart size={22} />
            {count > 0 && <i>{count}</i>}
          </div>
          <span>السلة</span>
        </button>
        <Link href="/profile" className={pathname === "/profile" ? "active" : ""}>
          <UserRound size={22} />
          <span>حسابي</span>
        </Link>
      </nav>
    </>
  );
}

export default function Header(props) {
  return (
    <Suspense fallback={<div className="header-placeholder" />}>
      <HeaderContent {...props} />
    </Suspense>
  );
}
