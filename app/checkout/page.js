"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../components/CartContext";
import { useCurrency } from "../../components/CurrencyContext";
import { useAuth } from "../../components/AuthContext";
import Price from "../../components/Price";
import BackButton from "../../components/BackButton";
import PageShell from "../../components/PageShell";
import {
  CheckCircle2, MessageCircle, MapPin, X, LocateFixed,
  Copy, Check, UploadCloud, Users, Package, BarChart3,
  ShieldCheck, ArrowRight, CreditCard, Wallet, Truck, Landmark, LogIn
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const countryConfigs = {
  "مصر": { dialCode: "+20", maxLength: 10, placeholder: "1x xxx xxxx" },
  "الإمارات": { dialCode: "+971", maxLength: 9, placeholder: "5x xxx xxxx" },
  "قطر": { dialCode: "+974", maxLength: 8, placeholder: "xxxx xxxx" }
};

const bankDetails = {
  bankName: "First Abu Dhabi Bank PJSC",
  accountName: "AHMEDALMORTADA SALMAN M FADALALLAH",
  accountType: "Saving Account Retail Islamic",
  accountNumber: "9356495764161001",
  iban: "AE090359356495764161001",
  swiftCode: "NBADAEAAXXX",
  currency: "AED"
};

const countryCities = {
  "مصر": [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية",
    "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "دمياط",
    "جنوب سيناء", "كفر الشيخ", "مطروح", "قنا", "شمال سيناء", "سوهاج", "بني سويف", "بورسعيد",
    "الأقصر", "أسوان", "أسيوط"
  ],
  "الإمارات": ["أبوظبي", "دبي", "الشارقة", "عجمان", "أم القيوين", "رأس الخيمة", "الفجيرة"],
  "قطر": ["الدوحة", "الريان", "الوكرة", "الخور", "الشمال", "الظعاين", "أم صلال", "الشيحانية"]
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { market, formatPrice, marketCode } = useCurrency();
  const { user, profile, loading: authLoading } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      // حفظ رابط الدفع للعودة إليه بعد تسجيل الدخول إذا أردت
      sessionStorage.setItem("redirectAfterLogin", "/checkout");
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // UI States
  const [step, setStep] = useState("input"); // "input" | "review"
  const [submitted, setSubmitted] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempCoords, setTempCoords] = useState(null);
  const [locationUrl, setLocationUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  // Shipping State
  const [shippingCost, setShippingCost] = useState(0);

  // Discount States
  const [discountOption, setDiscountOption] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [maxDiscountLimit, setMaxDiscountLimit] = useState(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Tax State
  const [taxConfig, setTaxConfig] = useState({});

  const [form, setForm] = useState({
    name: "",
    phone: "",
    country: "الإمارات",
    city: "أبوظبي",
    address: "",
    payment: "الدفع عند الاستلام",
    notes: "",
    transferIdentifier: ""
  });

  const currentCountryTax = useMemo(() => {
    const mapping = { "مصر": "Egypt", "الإمارات": "UAE", "قطر": "Qatar" };
    const key = mapping[form.country];
    return taxConfig[key] || { enabled: false, percent: 0 };
  }, [form.country, taxConfig]);

  // Sync profile data
  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        name: profile.full_name || f.name,
        phone: profile.phone || f.phone,
        city: profile.city || f.city,
        address: profile.address || f.address,
        transferIdentifier: profile.phone || f.phone
      }));
    }
  }, [profile]);

  // Fetch Shipping Rate when city changes
  useEffect(() => {
    async function fetchShipping() {
      if (!form.country || !form.city) return;
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('rate')
        .eq('country', form.country)
        .eq('city', form.city)
        .single();

      if (data) setShippingCost(Number(data.rate));
      else setShippingCost(0);
    }
    fetchShipping();
  }, [form.country, form.city]);

  // Fetch Tax Settings
  useEffect(() => {
    async function fetchTax() {
      const { data } = await supabase.from('store_settings').select('value').eq('key', 'tax_config').single();
      if (data && data.value) setTaxConfig(data.value);
    }
    fetchTax();
  }, []);

  const calculatedDiscount = useMemo(() => {
    if (discountPercent <= 0) return 0;
    const amountFromPercent = total * (discountPercent / 100);
    if (maxDiscountLimit > 0) return Math.min(amountFromPercent, maxDiscountLimit);
    return amountFromPercent;
  }, [total, discountPercent, maxDiscountLimit]);

  const vatAmount = useMemo(() => {
    if (!currentCountryTax.enabled) return 0;
    const taxableAmount = total - calculatedDiscount;
    return taxableAmount * (currentCountryTax.percent / 100);
  }, [total, calculatedDiscount, currentCountryTax]);

  const finalTotal = total - calculatedDiscount + shippingCost + vatAmount;

  function updateField(event) {
    const { name, value } = event.target;
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      const config = countryConfigs[form.country];
      if (numericValue.length <= config.maxLength) {
        setForm({ ...form, [name]: numericValue });
      }
      return;
    }
    if (name === "country") {
      const defaultCity = countryCities[value][0];
      setForm({ ...form, country: value, city: defaultCity, phone: "", payment: "الدفع عند الاستلام" });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  async function validateStock() {
    setIsValidatingStock(true);
    try {
      const ids = items.map(i => i.id);
      const { data: products, error } = await supabase.from('products').select('id, stock, name').in('id', ids);
      if (error) throw error;
      for (const item of items) {
        const p = products.find(prod => prod.id === item.id);
        if (!p || p.stock < item.quantity) {
          throw new Error(`عذراً، المنتج "${item.name}" لم يعد متوفراً بالكمية المطلوبة. المتاح: ${p?.stock || 0}`);
        }
      }
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    } finally {
      setIsValidatingStock(false);
    }
  }

  function getLocation() {
    setLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setTempCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoadingLocation(false);
          setShowMapModal(true);
        },
        () => {
          setLoadingLocation(false);
          alert("فشل تحديد الموقع. يرجى تفعيل GPS والمحاولة مرة أخرى.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLoadingLocation(false);
      alert("متصفحك لا يدعم تحديد الموقع.");
    }
  }

  async function handleReceiptUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingReceipt(true);
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('Public Bucket').upload(`receipts/${fileName}`, file);
    if (error) alert("خطأ في الرفع: " + error.message);
    else {
      const { data } = supabase.storage.from('Public Bucket').getPublicUrl(`receipts/${fileName}`);
      setReceiptFile(data.publicUrl);
    }
    setUploadingReceipt(false);
  }

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  }

  async function handleFinalSubmit(appliedCoupon = null) {
    if (!user) {
      alert("يرجى تسجيل الدخول أولاً لإتمام الطلب.");
      router.push("/login");
      return;
    }

    setIsSending(true);
    try {
      // 1. الخصم من المخزون
      for (const item of items) {
        const { error } = await supabase.rpc('decrement_stock', { p_id: item.id, p_qty: item.quantity });
        if (error) throw new Error(`عذراً، نفدت كمية "${item.name}"`);
      }

      const config = countryConfigs[form.country];
      const fullPhone = `${config.dialCode}${form.phone}`;

      // 2. تسجيل الطلب
      const orderData = {
        user_id: user?.id || null,
        full_name: form.name,
        phone: fullPhone,
        country: form.country,
        city: form.city,
        address: form.address,
        location_url: locationUrl,
        payment_method: form.payment,
        payment_receipt: receiptFile,
        transfer_identifier: form.transferIdentifier,
        notes: form.notes,
        items: JSON.stringify(items),
        total_price: finalTotal,
        discount_applied: discountPercent,
        status: 'Pending',
        created_at: new Date()
      };

      const { data: orderResult, error: orderError } = await supabase.from('orders').insert([orderData]).select();
      if (orderError) throw orderError;

      const orderId = orderResult[0].id;
      setCompletedOrder(orderResult[0]);

      // 3. التوجيه للدفع الإلكتروني (Visa/Mastercard)
      if (form.payment === "البطاقة الائتمانية") {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            orderId: orderId,
            customerEmail: user?.email
          }),
        });

        if (!response.ok) {
          throw new Error("فشل الاتصال ببوابة الدفع. تأكدي من إعدادات Stripe.");
        }

        const session = await response.json();
        if (session.url) {
          window.location.href = session.url;
          return;
        }
      }

      // 4. تحديث الملف الشخصي
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: form.name,
          phone: form.phone,
          country: form.country,
          city: form.city,
          address: form.address,
          updated_at: new Date()
        });
      }

      // 5. رسالة الواتساب
      const messageLines = [
        `🌟 *طلب جديد من متجر زينة النيل* 🌟`,
        `--------------------------------------------`,
        ``,
        `📍 *بيانات العميل والتوصيل:*`,
        `- *الاسم:* ${form.name}`,
        `- *الهاتف:* ${fullPhone}`,
        `- *الدولة:* ${form.country}`,
        `- *المدينة:* ${form.city}`,
        `- *العنوان:* ${form.address}`,
        locationUrl ? `- *رابط الموقع:* ${locationUrl}` : null,
        ``,
        `💳 *تفاصيل الدفع:*`,
        `- *طريقة الدفع:* ${form.payment}`,
        form.transferIdentifier ? `- *الرقم المحول منه:* ${form.transferIdentifier}` : null,
        receiptFile ? `- *رابط إيصال الدفع:* ${receiptFile}` : null,
        ``,
        `📦 *المنتجات المطلوبة:*`,
        `--------------------------------------------`,
        ...items.map((item, index) =>
          `${index + 1}. *${item.name}*\n   اللون: ${item.color} | الكمية: ${item.quantity} | ${formatPrice(item.price * item.quantity)}`
        ),
        `--------------------------------------------`,
        ``,
        `💰 *ملخص الحساب:*`,
        `- *إجمالي المنتجات:* ${formatPrice(total)}`,
        shippingCost > 0 ? `- *رسوم التوصيل:* ${formatPrice(shippingCost)}` : null,
        calculatedDiscount > 0 ? `- *الخصم المطبق:* ${formatPrice(calculatedDiscount)}` : null,
        vatAmount > 0 ? `- *الضريبة:* ${formatPrice(vatAmount)}` : null,
        `- *الإجمالي النهائي:* *${formatPrice(finalTotal)}*`,
        `- *العملة:* ${market.label}`,
        ``,
        `شكراً لتسوقك من زينة النيل! 💙`
      ].filter(l => l !== null);

      const whatsappNumber = marketCode === "EG" ? "201092879740" : "971556414279";
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageLines.join("\n"))}`, "_blank");

      setSubmitted(true);
      clearCart();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSending(false);
    }
  }

  if (authLoading) return (
    <PageShell>
      <div className="page-loading">جاري التحقق من الحساب...</div>
    </PageShell>
  );

  if (!user) return (
    <PageShell>
      <div className="unauthorized">
        <LogIn size={64} className="mb-20" color="var(--gold)" />
        <h1>يرجى تسجيل الدخول أولاً</h1>
        <p>يجب تسجيل الدخول لتتمكني من إتمام الطلب ومتابعة حالته.</p>
        <Link href="/login" className="btn-primary mt-20" style={{display: 'inline-flex'}}>تسجيل الدخول / إنشاء حساب</Link>
      </div>
    </PageShell>
  );

  if (submitted && completedOrder) {
    const orderItems = JSON.parse(completedOrder.items || '[]');
    return (
      <PageShell>
        <section className="invoice-page animate-fade-in">
          <div className="invoice-container" id="printable-invoice">
            <header className="invoice-header">
              <div className="invoice-brand">
                <img src="/images/logo-full.png" alt="Zeenat Alnile" />
                <h1>فاتورة شراء</h1>
              </div>
              <div className="invoice-meta">
                <p>رقم الطلب: <strong>#{completedOrder.id.slice(0, 8).toUpperCase()}</strong></p>
                <p>التاريخ: <strong>{new Date(completedOrder.created_at).toLocaleDateString('ar-EG')}</strong></p>
              </div>
            </header>

            <div className="invoice-grid">
              <div className="invoice-section">
                <h3>بيانات العميل</h3>
                <p><strong>الاسم:</strong> {completedOrder.full_name}</p>
                <p><strong>الهاتف:</strong> {completedOrder.phone}</p>
                <p><strong>العنوان:</strong> {completedOrder.country}, {completedOrder.city}, {completedOrder.address}</p>
              </div>
              <div className="invoice-section">
                <h3>طريقة الدفع</h3>
                <p>{completedOrder.payment_method}</p>
                <p className="status-badge">الحالة: قيد المراجعة</p>
              </div>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>المنتج</th>
                  <th>اللون</th>
                  <th>الكمية</th>
                  <th>السعر</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td>{item.color || '-'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-summary">
              <div className="summary-line">
                <span>إجمالي المنتجات:</span>
                <strong>{formatPrice(orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0))}</strong>
              </div>

              {completedOrder.shipping_cost > 0 && (
                <div className="summary-line">
                  <span>رسوم التوصيل:</span>
                  <strong>{formatPrice(completedOrder.shipping_cost)}</strong>
                </div>
              )}

              {completedOrder.discount_applied > 0 && (
                <div className="summary-line discount">
                  <span>خصم الكوبون ({completedOrder.discount_applied}%):</span>
                  <strong>-{formatPrice((orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)) * (completedOrder.discount_applied / 100))}</strong>
                </div>
              )}

              {completedOrder.vat_amount > 0 && (
                <div className="summary-line">
                  <span>ضريبة القيمة المضافة:</span>
                  <strong>{formatPrice(completedOrder.vat_amount)}</strong>
                </div>
              )}

              <div className="summary-line grand-total">
                <span>الإجمالي النهائي:</span>
                <strong>{formatPrice(completedOrder.total_price)}</strong>
              </div>
            </div>

            <footer className="invoice-footer">
              <p>شكراً لتسوقك من زينة النيل! نأمل أن تنال منتجاتنا إعجابك.</p>
              <p>لأي استفسار يرجى التواصل معنا عبر الواتساب برقم الطلب.</p>
            </footer>
          </div>

          <div className="invoice-actions no-print">
            <button className="print-btn" onClick={() => window.print()}>
              <Copy size={18}/> طباعة أو حفظ الفاتورة (PDF)
            </button>
            <button className="home-btn" onClick={() => window.location.href = "/"}>العودة للرئيسية</button>
          </div>
        </section>
      </PageShell>
    );
  }

  if (step === "review") {
    return (
      <PageShell>
        <section className="checkout-review-page">
          <div className="review-container">
            <header className="review-header">
              <h1>مراجعة وتأكيد الطلب</h1>
              <p>راجعي بياناتك ومنتجاتك بعناية قبل التأكيد النهائي.</p>
            </header>

            <div className="review-grid">
              <div className="review-main">
                <div className="review-card">
                  <div className="card-header"><Users size={20}/><h3>بيانات التوصيل</h3></div>
                  <div className="card-body customer-details">
                    <div className="info-row"><span>الاسم الكامل</span><strong>{form.name}</strong></div>
                    <div className="info-row"><span>الهاتف</span><strong dir="ltr">{countryConfigs[form.country].dialCode}{form.phone}</strong></div>
                    <div className="info-row"><span>الدولة / المدينة</span><strong>{form.country} / {form.city}</strong></div>
                    <div className="info-row"><span>طريقة الدفع</span><strong>{form.payment}</strong></div>
                    <div className="info-row full-width"><span>العنوان</span><strong>{form.address}</strong></div>
                  </div>
                </div>

                <div className="review-card">
                  <div className="card-header"><Package size={20}/><h3>المنتجات في السلة</h3></div>
                  <div className="card-body items-list">
                    {items.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="review-item">
                        <div className="item-img"><img src={item.image} alt={item.name} /></div>
                        <div className="item-info">
                          <h4>{item.name}</h4>
                          <p>اللون: {item.color} | الكمية: {item.quantity}</p>
                        </div>
                        <div className="item-price">
                           <Price amount={item.price * item.quantity} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="review-sidebar">
                <div className="review-card summary-card">
                  <div className="card-header"><BarChart3 size={20}/><h3>ملخص الحساب</h3></div>
                  <div className="card-body">
                    <div className="summary-row"><span>إجمالي المنتجات</span><Price amount={total}/></div>
                    <div className="summary-row"><span>رسوم التوصيل</span><Price amount={shippingCost}/></div>

                    {calculatedDiscount > 0 && (
                      <div className="summary-row discount"><span>خصم الكوبون ({discountPercent}%)</span><span>-{formatPrice(calculatedDiscount)}</span></div>
                    )}

                    {vatAmount > 0 && (
                      <div className="summary-row"><span>الضريبة ({currentCountryTax.percent}%)</span><Price amount={vatAmount}/></div>
                    )}

                    <div className="summary-row total"><span>الإجمالي النهائي</span><Price amount={finalTotal} className="final-price"/></div>

                    <div className="discount-interaction mt-20">
                      <p className="interaction-title">هل لديك كود خصم؟</p>
                      <div className="discount-options">
                        <button className={`opt-btn ${discountOption === 'yes' ? 'active' : ''}`} onClick={() => setDiscountOption('yes')}>نعم</button>
                        <button className={`opt-btn ${discountOption === 'no' ? 'active' : ''}`} onClick={() => { setDiscountOption('no'); setDiscountPercent(0); setCouponCode(""); }}>لا</button>
                      </div>
                      {discountOption === 'yes' && (
                        <div className="coupon-entry animate-fade-in">
                          <input placeholder="كود الخصم" value={couponCode} onChange={e => setCouponCode(e.target.value)} disabled={discountPercent > 0}/>
                          {discountPercent === 0 ? (
                            <button disabled={isValidatingCoupon} onClick={async () => {
                              setIsValidatingCoupon(true);
                              const cleanCode = couponCode.trim().toUpperCase();
                              const now = new Date().toISOString();

                              // التحقق من الكود مع مراعاة الحالة والنشاط والتاريخ
                              const { data, error } = await supabase
                                .from('coupons')
                                .select('*')
                                .eq('code', cleanCode)
                                .eq('is_active', true)
                                .lte('starts_at', now) // يجب أن يكون قد بدأ
                                .single();

                              if (data) {
                                // تحقق إضافي من تاريخ الانتهاء إذا وجد
                                if (data.expires_at && new Date(data.expires_at) < new Date()) {
                                  alert("عذراً، هذا الكوبون انتهت صلاحيته ❌");
                                } else {
                                  setDiscountPercent(data.discount_percent);
                                  setMaxDiscountLimit(data.max_discount_amount || 0);
                                  alert("تم تطبيق الكود بنجاح! ✅");
                                }
                              } else {
                                console.error("Coupon Error:", error);
                                alert("كود غير صحيح، أو ربما لم يبدأ تفعيله بعد.");
                              }
                              setIsValidatingCoupon(false);
                            }}>{isValidatingCoupon ? "..." : "تطبيق"}</button>
                          ) : <button className="success-check"><CheckCircle2 size={18}/></button>}
                        </div>
                      )}
                    </div>

                    <button className="final-submit-btn" disabled={isSending} onClick={() => handleFinalSubmit(couponCode)}>
                      {isSending ? <div className="spinner"></div> : <><MessageCircle size={20}/> تأكيد وإرسال الطلب</>}
                    </button>
                    <button className="go-back-btn" onClick={() => setStep("input")}>تعديل البيانات</button>
                  </div>
                </div>
                <div className="secure-badge"><ShieldCheck size={16}/><span>دفع آمن ومشفر 100%</span></div>
              </aside>
            </div>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="checkout-page">
        <BackButton fallback="/products" />
        <div className="checkout-heading">
          <span>زينة النيل</span>
          <h1>إتمام الطلب</h1>
          <p>أدخل بيانات التوصيل بدقة لضمان وصول طلبك في أسرع وقت.</p>
        </div>

        <form className="checkout-grid" onSubmit={async (e) => {
          e.preventDefault();
          if (!locationUrl) return alert("يرجى تحديد موقع التوصيل على الخريطة أولاً (إلزامي).");
          if (form.payment !== "الدفع عند الاستلام" && form.payment !== "البطاقة الائتمانية" && !receiptFile) {
            return alert("يرجى إرفاق صورة إشعار التحويل.");
          }
          const ok = await validateStock();
          if (ok) setStep("review");
        }}>
          <div className="checkout-form-card">
            <div className="form-grid">
              <label className="full-width"><span>الاسم الكامل</span><input required name="name" value={form.name} onChange={updateField} placeholder="اكتبي اسمك الكامل هنا..."/></label>

              <label>
                <span>رقم الهاتف</span>
                <div className="phone-input-wrapper">
                  <span className="phone-prefix">{countryConfigs[form.country].dialCode}</span>
                  <input type="tel" required name="phone" value={form.phone} onChange={updateField} placeholder={countryConfigs[form.country].placeholder}/>
                </div>
              </label>

              <label><span>الدولة</span><select name="country" value={form.country} onChange={updateField}><option>مصر</option><option>الإمارات</option><option>قطر</option></select></label>
              <label><span>المدينة</span><select name="city" value={form.city} onChange={updateField}>{countryCities[form.country].map(c => <option key={c}>{c}</option>)}</select></label>
              <label className="full-width"><span>العنوان بالتفصيل</span><input required name="address" value={form.address} onChange={updateField} placeholder="اسم الشارع، رقم المنزل، تفاصيل واضحة..."/></label>

              <div className="full-width location-box">
                <button type="button" className={`location-btn ${locationUrl ? "success" : ""}`} onClick={getLocation} disabled={loadingLocation}>
                  <MapPin size={18}/> {loadingLocation ? "جاري التحديد..." : locationUrl ? "تم حفظ موقعك بنجاح ✅" : "تحديد موقعي على الخريطة (إلزامي)"}
                </button>
              </div>

              <div className="full-width mt-20">
                <label className="mb-10 font-bold block">طريقة الدفع</label>
                <div className="payment-selector-grid">
                  <button type="button" className={`pay-method-btn ${form.payment === 'الدفع عند الاستلام' ? 'active' : ''}`} onClick={() => setForm({...form, payment: 'الدفع عند الاستلام'})}>
                    <Truck className="method-icon" size={28}/>
                    <div className="method-text">
                      <span className="method-title">الدفع عند الاستلام</span>
                      <small className="method-desc">كاش للمندوب</small>
                    </div>
                  </button>

                  <button type="button" className={`pay-method-btn ${form.payment === 'البطاقة الائتمانية' ? 'active' : ''}`} onClick={() => setForm({...form, payment: 'البطاقة الائتمانية'})}>
                    <CreditCard className="method-icon" size={28}/>
                    <div className="method-text">
                      <span className="method-title">بطاقة بنكية</span>
                      <div className="card-logos">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg" className="mini-card-logo" alt="Visa" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="mini-card-logo" alt="MC" />
                      </div>
                    </div>
                  </button>

                  {form.country === "مصر" ? (
                    <>
                      <button type="button" className={`pay-method-btn ${form.payment === 'فودافون كاش' ? 'active' : ''}`} onClick={() => setForm({...form, payment: 'فودافون كاش'})}>
                        <Wallet className="method-icon" size={28}/>
                        <div className="method-text">
                          <span className="method-title">فودافون كاش</span>
                          <small className="method-desc">تحويل فوري</small>
                        </div>
                      </button>
                      <button type="button" className={`pay-method-btn ${form.payment === 'إنستاباي' ? 'active' : ''}`} onClick={() => setForm({...form, payment: 'إنستاباي'})}>
                        <CheckCircle2 className="method-icon" size={28}/>
                        <div className="method-text">
                          <span className="method-title">إنستاباي</span>
                          <small className="method-desc">تحويل بنكي لحظي</small>
                        </div>
                      </button>
                    </>
                  ) : (
                    <button type="button" className={`pay-method-btn ${form.payment === 'تحويل بنكي' ? 'active' : ''}`} onClick={() => setForm({...form, payment: 'تحويل بنكي'})}>
                      <Landmark className="method-icon" size={28}/>
                      <div className="method-text">
                        <span className="method-title">تحويل بنكي</span>
                        <small className="method-desc">FAB أبوظبي</small>
                      </div>
                    </button>
                  )}
                </div>
              </div>

              {form.payment !== "الدفع عند الاستلام" && form.payment !== "البطاقة الائتمانية" && (
                <div className="full-width payment-details-container animate-fade-in mt-20">
                  {form.country === "مصر" ? (
                    <div className="wallet-details-card">
                      <p>يرجى التحويل إلى الرقم التالي:</p>
                      <strong className="wallet-number">01092879740</strong>
                      <div className="transfer-input mt-15">
                        <label>الرقم الذي قمت بالتحويل منه</label>
                        <input name="transferIdentifier" value={form.transferIdentifier} onChange={updateField} placeholder="أدخل رقم محفظتك هنا..." required />
                      </div>
                    </div>
                  ) : (
                    <div className="bank-details-card">
                      <h3>بيانات التحويل البنكي (FAB)</h3>
                      <div className="bank-info-grid">
                        <div className="info-box"><span>البنك</span><strong>{bankDetails.bankName}</strong></div>
                        <div className="info-box"><span>الاسم</span><strong>{bankDetails.accountName}</strong></div>
                        <div className="info-box full"><span>نوع الحساب</span><strong>{bankDetails.accountType}</strong></div>
                        <div className="info-box copyable">
                          <span>رقم الحساب</span>
                          <code>{bankDetails.accountNumber}</code>
                          <button type="button" onClick={() => copyToClipboard(bankDetails.accountNumber, "acc")}>
                            {copiedField === "acc" ? <Check size={14} color="#10b981"/> : <Copy size={14}/>}
                          </button>
                        </div>
                        <div className="info-box copyable full">
                          <span>الـ IBAN</span>
                          <code>{bankDetails.iban}</code>
                          <button type="button" onClick={() => copyToClipboard(bankDetails.iban, "iban")}>
                            {copiedField === "iban" ? <Check size={14} color="#10b981"/> : <Copy size={14}/>}
                          </button>
                        </div>
                        <div className="info-box"><span>SWIFT</span><strong>{bankDetails.swiftCode}</strong></div>
                        <div className="info-box"><span>العملة</span><strong>{bankDetails.currency}</strong></div>
                      </div>
                    </div>
                  )}

                  <div className="receipt-upload-box mt-20">
                    <label>إرفاق صورة إشعار التحويل (لقطة شاشة)</label>
                    <div className="upload-dropzone">
                      {receiptFile ? (
                        <div className="uploaded-receipt-preview">
                          <CheckCircle2 size={24} color="#10b981"/>
                          <span>تم رفع الإيصال بنجاح</span>
                          <button type="button" onClick={() => setReceiptFile(null)}><X size={16}/></button>
                        </div>
                      ) : (
                        <label className="upload-trigger">
                          <input type="file" accept="image/*,.pdf" onChange={handleReceiptUpload} hidden />
                          {uploadingReceipt ? <div className="spinner-dark"></div> : <><UploadCloud size={24}/> <span>اضغطي لرفع صورة الإيصال</span></>}
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <label className="full-width mt-10"><span>ملاحظات الطلب (اختياري)</span><textarea name="notes" value={form.notes} onChange={updateField} rows="3" placeholder="أي تعليمات إضافية للتوصيل..." /></label>
            </div>
          </div>

          <aside className="checkout-summary">
            <div className="summary-card-inner">
              <div className="checkout-total"><span>إجمالي المنتجات</span><Price amount={total} className="checkout-total-price"/></div>
              <div className="checkout-total" style={{fontSize: '15px', paddingTop: 0}}><span>تكلفة الشحن</span><Price amount={shippingCost}/></div>
              <button type="submit" className="confirm-order" disabled={isValidatingStock}>
                {isValidatingStock ? <div className="spinner"></div> : <>مراجعة الطلب والخصم <ArrowRight size={20}/></>}
              </button>
              <p className="summary-hint">يتم حساب الشحن تلقائياً حسب مدينتك.</p>
            </div>
          </aside>
        </form>

        {showMapModal && (
          <div className="map-modal-overlay">
            <div className="map-modal-content">
              <div className="map-modal-header"><h3>تأكيد موقع التوصيل</h3><button onClick={() => setShowMapModal(false)}><X/></button></div>
              <div className="map-placeholder">
                <iframe width="100%" height="100%" frameBorder="0" src={`https://www.openstreetmap.org/export/embed.html?bbox=${(tempCoords?.lng || 31.23)-0.01}%2C${(tempCoords?.lat || 30.04)-0.01}%2C${(tempCoords?.lng || 31.23)+0.01}%2C${(tempCoords?.lat || 30.04)+0.01}&layer=mapnik&marker=${tempCoords?.lat || 30.04}%2C${tempCoords?.lng || 31.23}`}></iframe>
                <div className="map-marker-centered"><MapPin size={48} fill="#ef4444" color="#fff" /></div>
              </div>
              <div className="map-modal-footer">
                <button className="btn-primary w-full" onClick={() => {
                  if (tempCoords) {
                    setLocationUrl(`https://www.google.com/maps?q=${tempCoords.lat},${tempCoords.lng}`);
                    setShowMapModal(false);
                    alert("تم حفظ موقعك بنجاح ✅");
                  }
                }}>تأكيد هذا الموقع</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}
