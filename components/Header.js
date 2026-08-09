"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ShoppingCart, Heart, UserRound, Search, Truck, ChevronDown,
  PackageCheck, Mail, Menu, X
} from "lucide-react";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { useCurrency, markets } from "./CurrencyContext";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import { useState } from "react";

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
  const { marketCode, market, changeMarket, ratesUpdated } = useCurrency();
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
      <div className="announcement">
        <div><Truck size={16}/> شحن إلى مصر والإمارات وقطر</div>
        <div className="desktop-only">أهلاً بك في زينة النيل — أناقة سودانية بأصالة النيل</div>
        <div className="currency">{market.flag} {market.label}</div>
      </div>

      <div className="contact-strip desktop-only">
        <a href="tel:+201092879740">
          <span>
            <b dir="ltr">+20 109 287 9740 <img src="https://flagcdn.com/w40/eg.png" alt="مصر" className="flag-img" /></b>
            <small>خدمة العملاء — مصر</small>
          </span>
        </a>

        <a href="tel:+971556414279">
          <span>
            <b dir="ltr">+971 55 641 4279 <img src="https://flagcdn.com/w40/ae.png" alt="الإمارات" className="flag-img" /></b>
            <small>خدمة العملاء — الإمارات والخليج</small>
          </span>
        </a>

        <a href="mailto:zeinaalneel@gmail.com">
          <Mail size={21}/>
          <span><b className="email-text">zeinaalneel@gmail.com</b><small>البريد الإلكتروني</small></span>
        </a>

        <div className="market-selector">
          <label>الدولة والعملة</label>
          <select value={marketCode} onChange={(e) => changeMarket(e.target.value)}>
            {Object.entries(markets).map(([code, item]) => (
              <option key={code} value={code}>
                {item.flag} {item.country} — {item.label}
              </option>
            ))}
          </select>
          <small>{ratesUpdated ? `آخر تحديث: ${ratesUpdated}` : "جاري تحديث العملة..."}</small>
        </div>
      </div>

      <header className="main-header">
        <div className="mobile-header-top">
          <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(true)}>
            <Menu size={28} />
          </button>

          <Link href="/" className="logo-panel" aria-label="زينة النيل">
            <img src="/images/logo-full.png" alt="زينة النيل" />
          </Link>

          <div className="header-icons mobile-only-icons">
             <button className="cart-icon" onClick={onCartOpen}>
                <ShoppingCart size={24}/><i>{count}</i>
              </button>
          </div>
        </div>

        <div className="header-main">
          <div className="header-tools">
            <label className="main-search">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
              />
              <button aria-label="بحث"><Search size={24}/></button>
            </label>

            <div className="header-icons desktop-only">
              {user ? (
                <div className="nav-dropdown user-dropdown">
                  <button className="user-btn">
                    <UserRound/>
                    <span>{isAdmin ? "الأدمن" : "حسابي"}</span>
                    <ChevronDown size={12} />
                  </button>
                  <div className="dropdown-menu">
                    {isAdmin && <Link href="/admin">لوحة التحكم</Link>}
                    <Link href="/profile">حسابي</Link>
                    <Link href="/profile">طلباتي</Link>
                    <button onClick={handleLogout} className="logout-btn">تسجيل الخروج</button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="login-link">
                  <UserRound/>
                  <span>دخول</span>
                </Link>
              )}

              <Link href="/wishlist" className="wishlist-icon">
                <Heart/><i>{wishlistCount}</i><span>المفضلة</span>
              </Link>
              <button className="cart-icon" onClick={onCartOpen}>
                <ShoppingCart/><i>{count}</i><span>السلة</span>
              </button>
            </div>
          </div>

          <nav className="desktop-only">
            <Link className={pathname === "/" ? "active" : ""} href="/">الرئيسية</Link>
            <Link className={pathname === "/products" && !category ? "active" : ""} href="/products">جميع المنتجات</Link>

            <div className={`nav-dropdown ${category === "فاشن" ? "active" : ""}`}>
              <Link href={productUrl("فاشن")}>فاشن <ChevronDown size={14}/></Link>
              <div className="dropdown-menu">
                <Link href={productUrl("فاشن")}>كل منتجات الفاشن</Link>
                {fashionSubs.map((item) => (
                  <Link key={item} className={subcategory === item ? "selected" : ""}
                    href={productUrl("فاشن", item)}>{item}</Link>
                ))}
              </div>
            </div>

            <div className={`nav-dropdown ${category === "إكسسوارات وشنط وأحذية" ? "active" : ""}`}>
              <Link href={productUrl("إكسسوارات وشنط وأحذية")}>إكسسوارات وشنط وأحذية <ChevronDown size={14}/></Link>
              <div className="dropdown-menu">
                <Link href={productUrl("إكسسوارات وشنط وأحذية")}>عرض الكل</Link>
                {accessoriesSubs.map((item) => (
                  <Link key={item} className={subcategory === item ? "selected" : ""}
                    href={productUrl("إكسسوارات وشنط وأحذية", item)}>{item}</Link>
                ))}
              </div>
            </div>

            <div className={`nav-dropdown ${category === "العطور والخلطات" ? "active" : ""}`}>
              <Link href={productUrl("العطور والخلطات")}>العطور والخلطات <ChevronDown size={14}/></Link>
              <div className="dropdown-menu">
                <Link href={productUrl("العطور والخلطات")}>عرض الكل</Link>
                {perfumeSubs.map((item) => (
                  <Link key={item} className={subcategory === item ? "selected" : ""}
                    href={productUrl("العطور والخلطات", item)}>{item}</Link>
                ))}
              </div>
            </div>

            <div className={`nav-dropdown ${category === "مستلزمات العروس" ? "active" : ""}`}>
              <Link href={productUrl("مستلزمات العروس")}>مستلزمات العروس <ChevronDown size={14}/></Link>
              <div className="dropdown-menu">
                <Link href={productUrl("مستلزمات العروس")}>عرض الكل</Link>
                {bridalSubs.map((item) => (
                  <Link key={item} className={subcategory === item ? "selected" : ""}
                    href={productUrl("مستلزمات العروس", item)}>{item}</Link>
                ))}
              </div>
            </div>

            <Link href="/products?sort=discount">العروض</Link>
            <Link className={pathname === "/about" ? "active" : ""} href="/about">من نحن</Link>
            <Link className={pathname === "/contact" ? "active" : ""} href="/contact">تواصل معنا</Link>
          </nav>
        </div>
      </header>

      {/* Mobile Side Menu */}
      <div className={`mobile-side-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="menu-overlay" onClick={() => setIsMenuOpen(false)} />
        <div className="menu-content">
          <div className="menu-header">
            <img src="/images/logo-header.png" alt="زينة النيل" />
            <button onClick={() => setIsMenuOpen(false)}><X size={30}/></button>
          </div>

          <div className="menu-market-mini">
            <span>العملة الحالية: {market.flag} {market.label}</span>
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

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
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
