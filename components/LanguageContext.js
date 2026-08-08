"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";

const LanguageContext = createContext(null);

export const translations = {
  ar: {
    langName: "العربية",
    dir: "rtl",
    home: "الرئيسية",
    allProducts: "جميع المنتجات",
    fashion: "فاشن",
    accessories: "إكسسوارات وشنط وأحذية",
    perfumes: "العطور والخلطات",
    bridal: "مستلزمات العروس",
    offers: "العروض",
    about: "من نحن",
    contact: "تواصل معنا",
    searchPlaceholder: "ابحث عن منتج...",
    cart: "السلة",
    wishlist: "المفضلة",
    login: "دخول",
    account: "حسابي",
    admin: "الأدمن",
    logout: "تسجيل الخروج",
    shippingTo: "شحن إلى مصر والإمارات وقطر",
    welcome: "أهلاً بك في زينة النيل — أناقة سودانية بأصالة النيل",
    customerServiceEg: "خدمة العملاء — مصر",
    customerServiceAe: "خدمة العملاء — الإمارات والخليج",
    email: "البريد الإلكتروني",
    countryAndCurrency: "الدولة والعملة",
    lastUpdate: "آخر تحديث",
    updatingCurrency: "جاري تحديث العملة...",
    // Checkout
    checkoutTitle: "إتمام الطلب",
    deliveryDetails: "بيانات التوصيل",
    fullName: "الاسم الكامل",
    phone: "رقم الهاتف",
    country: "الدولة",
    city: "المدينة",
    detailedAddress: "العنوان بالتفصيل",
    paymentMethod: "طريقة الدفع",
    notes: "ملاحظات الطلب",
    orderSummary: "ملخص الطلب",
    total: "الإجمالي",
    confirmOrder: "تأكيد وإرسال الطلب",
  },
  en: {
    langName: "English",
    dir: "ltr",
    home: "Home",
    allProducts: "All Products",
    fashion: "Fashion",
    accessories: "Accessories & Bags",
    perfumes: "Perfumes",
    bridal: "Bridal",
    offers: "Offers",
    about: "About Us",
    contact: "Contact Us",
    searchPlaceholder: "Search for a product...",
    cart: "Cart",
    wishlist: "Wishlist",
    login: "Login",
    account: "Account",
    admin: "Admin",
    logout: "Logout",
    shippingTo: "Shipping to Egypt, UAE & Qatar",
    welcome: "Welcome to Zeena Al-Nil — Sudanese Elegance",
    customerServiceEg: "Customer Service — Egypt",
    customerServiceAe: "Customer Service — UAE & Gulf",
    email: "Email",
    countryAndCurrency: "Country & Currency",
    lastUpdate: "Last update",
    updatingCurrency: "Updating currency...",
    // Checkout
    checkoutTitle: "Checkout",
    deliveryDetails: "Delivery Details",
    fullName: "Full Name",
    phone: "Phone Number",
    country: "Country",
    city: "City",
    detailedAddress: "Detailed Address",
    paymentMethod: "Payment Method",
    notes: "Order Notes",
    orderSummary: "Order Summary",
    total: "Total",
    confirmOrder: "Confirm and Send Order",
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("ar");

  useEffect(() => {
    const savedLang = localStorage.getItem("zeenatLang");
    if (savedLang && (savedLang === "ar" || savedLang === "en")) {
      setLang(savedLang);
      document.documentElement.dir = translations[savedLang].dir;
      document.documentElement.lang = savedLang;
    }
  }, []);

  const changeLanguage = (newLang) => {
    if (newLang === "ar" || newLang === "en") {
      setLang(newLang);
      localStorage.setItem("zeenatLang", newLang);
      document.documentElement.dir = translations[newLang].dir;
      document.documentElement.lang = newLang;
    }
  };

  const t = useMemo(() => translations[lang], [lang]);

  const value = useMemo(() => ({
    lang,
    changeLanguage,
    t,
    isRtl: lang === "ar"
  }), [lang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
