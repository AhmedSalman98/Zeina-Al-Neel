"use client";

import { useState, useEffect } from "react";
import { supabase, uploadImage } from "../../lib/supabase";
import { useAuth } from "../../components/AuthContext";
import PageShell from "../../components/PageShell";
import { useCurrency } from "../../components/CurrencyContext";
import { mainCategories, products as staticProducts } from "../../data/products";
import {
  PlusCircle, Package, Trash2, Edit, Save, X,
  LayoutDashboard, TrendingUp, AlertTriangle,
  ShoppingCart, Users, ChevronRight, BarChart3, Clock,
  Upload, Wand2, CheckCircle2, Sparkles, Truck, Settings, ShieldAlert, Percent
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { formatPrice, market, rates } = useCurrency();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // New States for expanded systems
  const [shippingRates, setShippingRates] = useState([]);
  const [taxConfig, setTaxConfig] = useState({
    Egypt: { enabled: false, percent: 14 },
    UAE: { enabled: false, percent: 5 },
    Qatar: { enabled: false, percent: 0 }
  });
  const [staff, setStaff] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");

  async function loadAdminData() {
    setLoading(true);
    try {
      const [prodRes, orderRes, custRes, coupRes, shipRes, setRes, staffRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('coupons').select('*').order('created_at', { ascending: false }),
        supabase.from('shipping_rates').select('*').order('country'),
        supabase.from('store_settings').select('*').eq('key', 'tax_config').single(),
        supabase.from('staff_roles').select('*')
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (orderRes.data) setOrders(orderRes.data);
      if (custRes.data) setCustomers(custRes.data);
      if (coupRes.data) setCoupons(coupRes.data);
      if (shipRes.data) setShippingRates(shipRes.data);
      if (setRes.data) setTaxConfig(setRes.data.value);
      if (staffRes.data) setStaff(staffRes.data);

    } catch (error) {
      console.error("Critical Admin Data Load Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStockId, setUpdatingStockId] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [modifiedStock, setModifiedStock] = useState({}); // { productId: newStock }
  const [aiLoading, setAiLoading] = useState(false);
  const [descLoading, setDescLoading] = useState(false);
  const [processingImages, setProcessingImages] = useState([]); // [url1, url2]
  const [useAiTransform, setUseAiTransform] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: "" });

  const initialForm = {
    sku: "",
    name: "",
    category: mainCategories[0].name,
    subcategory: mainCategories[0].subcategories[0],
    price: "",
    old_price: "",
    discount: 0,
    stock: 10,
    image: "",
    images: [],
    is_new: true,
    description: "",
    colors: []
  };

  const [form, setForm] = useState(initialForm);

  // دالة توليد الكود التسلسلي التالي للمنتج
  function getNextSku() {
    if (!products || products.length === 0) return "#ZA00001";

    const skuNumbers = products
      .map(p => p.sku)
      .filter(sku => sku && sku.startsWith("#ZA"))
      .map(sku => parseInt(sku.replace("#ZA", "")))
      .filter(num => !isNaN(num));

    if (skuNumbers.length === 0) return "#ZA00001";

    const maxNum = Math.max(...skuNumbers);
    const nextNum = maxNum + 1;
    return `#ZA${String(nextNum).padStart(5, '0')}`;
  }

  // عند فتح فورم الإضافة، نولد SKU جديد
  useEffect(() => {
    if (showAddForm && !editingProduct && !form.sku) {
      setForm(prev => ({ ...prev, sku: getNextSku() }));
    }
  }, [showAddForm, editingProduct]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadAdminData();
    }
  }, [authLoading, isAdmin]);

  async function updateOrderStatus(orderId, newStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      alert("تم تحديث حالة الطلب");
      loadAdminData();
    }
  }

  // ميزة اقتراح اسم للمنتج (نظام ذكي بديل في حال فشل الـ AI)
  function suggestName() {
    const suggestions = {
      "تياب": [
        "توب حرير سوداني مطرز بلمسة ملكية",
        "توب راتي فاخر بتصميم تراثي أصيل",
        "توب مشجر ألوان خريفية زاهية",
        "توب سهرات ملكي مشغول يدوياً",
        "توب جيرسي ناعم لإطلالة يومية أنيقة"
      ],
      "دراعات": [
        "دراعة استقبال فخمة بتطريز ذهبي",
        "دراعة خليجية راقية مناسبة للأعياد",
        "دراعة قطنية مريحة بتصميم عصري",
        "قفطان ملكي مطرز بلمسات زينة النيل"
      ],
      "عطور سودانية": [
        "خمرة محلب أصلية - سر الأناقة السودانية",
        "بخور صندل ملكي برائحة تدوم طويلاً",
        "مجموعة عطور العروس المتكاملة",
        "دلكة سودانية طبيعية للعناية الفائقة"
      ],
      "إكسسوارات": [
        "طقم عقد ذهبي بتصميم نوبي فريد",
        "أساور مطلية بالذهب عيار 21",
        "خاتم فضة مرصع بأحجار كريمة زاهية",
        "حلق تراثي يجسد أصالة النيل"
      ]
    };

    // محاولة جلب القائمة بناءً على القسم الفرعي أو الرئيسي
    const list = suggestions[form.subcategory] || suggestions[form.category] || ["منتج فاخر من تشكيلة زينة النيل"];

    // اختيار اسم عشوائي لضمان التنوع
    const randomName = list[Math.floor(Math.random() * list.length)];
    setForm(prev => ({ ...prev, name: randomName }));

    // إذا كان الوصف فارغاً، نضع وصفاً افتراضياً جذاباً أيضاً
    if (!form.description) {
      const defaultDesc = `قطعة فريدة من "زينة النيل" تجسد أصالة التراث السوداني بلمسات عصرية فاخرة. تم اختيار الخامات والألوان بعناية لتعكس الرقي والأناقة، مما يجعلها الخيار المثالي للمناسبات السعيدة والطلات الملكية المميزة.`;
      setForm(prev => ({ ...prev, description: defaultDesc }));
    }

    showToast("تم توليد اقتراح ذكي للمنتج ✨");
  }

  // ميزة رفع الصور (مع معالجة متوازية وسرعة فائقة)
  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    showToast(`جاري رفع ${files.length} صور... ⏳`);

    try {
      // معالجة كل الصور في نفس الوقت (Parallel) بدلاً من واحدة تلو الأخرى
      const uploadPromises = files.map(async (file) => {
        // 1. الرفع الأولي للصورة الأصلية (سريع)
        const rawUrl = await uploadImage(file, 'Public Bucket');
        if (!rawUrl) return null;

        // إظهار الصورة الأصلية فوراً في الواجهة لتقليل وقت الانتظار النفسي
        setForm(prev => ({
          ...prev,
          images: [...(prev.images || []), rawUrl],
          image: prev.image || rawUrl
        }));

        // 2. البدء في تحويل الصورة بالذكاء الاصطناعي في الخلفية (Background) إذا كان الخيار مفعلاً
        if (useAiTransform) {
          transformImageInBackground(rawUrl);
        }

        return rawUrl;
      });

      const results = await Promise.all(uploadPromises);
      const firstUrl = results.find(url => !!url);

      // تحليل الاسم لأول صورة مرفوعة تلقائياً إذا لم يكن هناك اسم مكتوب
      if (firstUrl) {
        generateAiName(firstUrl);
      }

    } catch (err) {
      console.error("Upload error:", err);
      showToast("حدث خطأ أثناء الرفع");
    } finally {
      setUploading(false);
      if (useAiTransform) {
        showToast("تم رفع الصور! جاري التحسين بالذكاء الاصطناعي في الخلفية... ✨");
      } else {
        showToast("تم رفع الصور الأصلية بنجاح ✅");
      }
    }
  }

  // دالة لتحويل الصورة في الخلفية وتحديث الرابط فور الجاهزية
  async function transformImageInBackground(rawUrl) {
    setProcessingImages(prev => [...prev, rawUrl]);
    try {
      const aiRes = await fetch('/api/admin/transform-image', {
        method: 'POST',
        body: JSON.stringify({ imageUrl: rawUrl }),
        headers: { 'Content-Type': 'application/json' }
      });

      const aiData = await aiRes.json();

      if (aiData.success && aiData.predictionId) {
        // البدء في الانتظار (Polling) للنتيجة
        let status = aiData.status;
        let finalUrl = null;

        while (status !== "succeeded" && status !== "failed") {
          await new Promise(r => setTimeout(r, 2500)); // ننتظر 2.5 ثانية بين كل فحص
          const checkRes = await fetch('/api/admin/check-prediction', {
            method: 'POST',
            body: JSON.stringify({ predictionId: aiData.predictionId }),
            headers: { 'Content-Type': 'application/json' }
          });
          const checkData = await checkRes.json();
          status = checkData.status;
          if (status === "succeeded") finalUrl = checkData.transformedUrl;
        }

        if (finalUrl) {
          setForm(prev => {
            const newImages = (prev.images || []).map(img => img === rawUrl ? finalUrl : img);
            return {
              ...prev,
              images: newImages,
              image: prev.image === rawUrl ? finalUrl : prev.image
            };
          });
          showToast("تم تحسين الصورة بنجاح! ✨");
        } else {
          showToast("انتهت المعالجة بدون نتيجة.");
        }
      } else {
        const errorMsg = aiData.message || "فشل بدء التحسين، يرجى التحقق من API Key";
        showToast(errorMsg);
      }
    } catch (err) {
      console.error("AI Transform Background Error:", err);
      showToast("خطأ في الاتصال بمحرك AI.");
    } finally {
      setProcessingImages(prev => prev.filter(url => url !== rawUrl));
    }
  }

  function removeImage(url) {
    setForm(prev => {
      const newImages = prev.images.filter(img => img !== url);
      return {
        ...prev,
        images: newImages,
        image: prev.image === url ? (newImages[0] || "") : prev.image
      };
    });
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    if (!form.image && (!form.images || form.images.length === 0)) return alert("يرجى إرفاق صورة للمنتج أولاً");

    setLoading(true);

    const currentRate = rates[market.currency] || 1;

    // تحويل السعر من العملة الحالية المختارة (درهم مثلاً) إلى العملة الأساسية (الجنيه المصري) قبل الحفظ
    const basePrice = parseFloat(form.price) / currentRate;
    const baseOldPrice = form.old_price ? parseFloat(form.old_price) / currentRate : null;

    const productData = {
      ...form,
      price: basePrice,
      old_price: baseOldPrice,
      discount: parseInt(form.discount) || 0,
      stock: parseInt(form.stock) || 0,
      updated_at: new Date()
    };

    let error;
    if (editingProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert([productData]);
      error = insertError;
    }

    if (!error) {
      setShowAddForm(false);
      setEditingProduct(null);
      alert(editingProduct ? "تم تحديث المنتج بنجاح! ✨" : "تم نشر المنتج بنجاح! 🚀");
      loadAdminData();
      setForm(initialForm);
    } else {
      alert("حدث خطأ: " + error.message);
    }
    setLoading(false);
  }

  function handleEdit(product) {
    const currentRate = rates[market.currency] || 1;

    setEditingProduct(product);
    setForm({
      sku: product.sku || "",
      name: product.name || "",
      category: product.category || mainCategories[0].name,
      subcategory: product.subcategory || "",
      // تحويل السعر من العملة الأساسية (جنيه) إلى عملة السوق الحالية للعرض في الفورم
      price: product.price ? (product.price * currentRate).toFixed(2) : "",
      old_price: product.old_price ? (product.old_price * currentRate).toFixed(2) : "",
      discount: product.discount || 0,
      stock: product.stock || 0,
      image: product.image || "",
      images: product.images || (product.image ? [product.image] : []),
      is_new: product.is_new ?? true,
      description: product.description || "",
      colors: product.colors || []
    });
    setShowAddForm(true);
  }

  function closeForm() {
    setShowAddForm(false);
    setEditingProduct(null);
    setForm(initialForm);
  }

  async function deleteProduct(id) {
    if (confirm("هل أنتِ متأكدة من حذف هذا المنتج؟")) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (!error) loadAdminData();
    }
  }

  function showToast(msg) {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 3000);
  }

  async function handleBulkSave() {
    const ids = Object.keys(modifiedStock);
    if (ids.length === 0) return;

    setBulkSaving(true);
    let successCount = 0;

    try {
      for (const id of ids) {
        const newVal = parseInt(modifiedStock[id]);
        console.log(`Updating product ${id} to stock ${newVal}...`);

        const { error } = await supabase
          .from('products')
          .update({ stock: newVal })
          .eq('id', id);

        if (!error) {
          successCount++;
        } else {
          console.error(`Error updating product ${id}:`, error.message, error);
        }
      }

      if (successCount === ids.length) {
        showToast("تم حفظ جميع التغيرات بنجاح ✅");
        setModifiedStock({});
        loadAdminData();
      } else {
        alert(`تم حفظ ${successCount} من أصل ${ids.length} تعديلات. يرجى مراجعة Console للأخطاء.`);
      }
    } catch (err) {
      console.error("Bulk save exception:", err);
      alert("حدث خطأ غير متوقع أثناء الحفظ.");
    } finally {
      setBulkSaving(false);
    }
  }

  function handleLocalStockChange(id, value) {
    const val = Math.max(0, parseInt(value) || 0);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: val } : p));
    setModifiedStock(prev => ({ ...prev, [id]: val }));
  }

  async function generateAiName(input = null) {
    const directUrl = typeof input === 'string' ? input : null;
    const targetImage = directUrl || form.image;

    if (!targetImage) {
      if (!directUrl) alert("يرجى رفع صورة المنتج أولاً ليقوم الذكاء الاصطناعي بتحليلها");
      return;
    }

    setAiLoading(true);
    try {
      const prompt = `Analyze this product image for an luxury Sudanese fashion brand ('زينة النيل'). Identify item type, colors, pattern, and generate an elegant Arabic title (max 5 words).`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const response = await fetch("/api/admin/generate-name", {
        method: "POST",
        body: JSON.stringify({ image: targetImage, prompt }),
        headers: { "Content-Type": "application/json" },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (result && result.success && result.name) {
        setForm(prev => ({ ...prev, name: result.name }));
        showToast("تم اقتراح الاسم بنجاح! ✨");
      } else {
        console.warn("AI Name generation failed or returned false, using fallback.");
        suggestName();
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      suggestName();
    } finally {
      setAiLoading(false);
    }
  }

  async function generateAiDescription() {
    if (!form.image) return alert("يرجى رفع صورة المنتج أولاً");

    setDescLoading(true);
    try {
      const response = await fetch("/api/admin/generate-description", {
        method: "POST",
        body: JSON.stringify({
          image: form.image,
          productName: form.name
        }),
        headers: { "Content-Type": "application/json" }
      });

      const result = await response.json();
      if (result && result.success) {
        setForm(prev => ({ ...prev, description: result.description }));
        showToast("تم توليد الوصف الإبداعي بنجاح! ✨");
      } else {
        showToast("فشل توليد الوصف، يرجى المحاولة لاحقاً.");
      }
    } catch (error) {
      console.error("AI Description Error:", error);
      showToast("خطأ في الاتصال بمحرك الذكاء الاصطناعي.");
    } finally {
      setDescLoading(false);
    }
  }

  // --- Tax Settings Functions ---
  async function saveTaxSettings(newConfig) {
    const { error } = await supabase.from('store_settings').upsert({
      key: 'tax_config',
      value: newConfig,
      updated_at: new Date()
    });
    if (!error) {
      setTaxConfig(newConfig);
      showToast("تم حفظ إعدادات الضريبة بنجاح");
    }
  }

  // --- Shipping Rates Functions ---
  const [showAddShipping, setShowAddShipping] = useState(false);
  const [shipForm, setShipForm] = useState({ country: 'مصر', city: '', rate: '' });

  async function handleAddShippingRate(e) {
    e.preventDefault();
    const { error } = await supabase.from('shipping_rates').insert([{
      country: shipForm.country,
      city: shipForm.city,
      rate: parseFloat(shipForm.rate)
    }]);
    if (!error) {
      setShowAddShipping(false);
      setShipForm({ country: 'مصر', city: '', rate: '' });
      loadAdminData();
      showToast("تم إضافة سعر الشحن بنجاح");
    } else alert(error.message);
  }

  async function deleteShippingRate(id) {
    if (confirm("حذف سعر الشحن؟")) {
      const { error } = await supabase.from('shipping_rates').delete().eq('id', id);
      if (!error) loadAdminData();
    }
  }

  // --- Staff Functions ---
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ email: '', role: 'Employee' });

  async function handleAddStaff(e) {
    e.preventDefault();
    const { error } = await supabase.from('staff_roles').insert([{
      email: staffForm.email.trim().toLowerCase(),
      role: staffForm.role
    }]);
    if (!error) {
      setShowAddStaff(false);
      setStaffForm({ email: '', role: 'Employee' });
      loadAdminData();
      showToast("تم إضافة الموظف بنجاح");
    } else alert(error.message);
  }

  async function deleteStaff(id) {
    if (confirm("إزالة صلاحيات الموظف؟")) {
      const { error } = await supabase.from('staff_roles').delete().eq('id', id);
      if (!error) loadAdminData();
    }
  }

  // --- Coupon Functions (Fixing call) ---
  const [couponForm, setCouponForm] = useState({ code: '', percent: 10, max_amount: 100, starts_at: '', expires_at: '' });

  async function handleAddCoupon(e) {
    e.preventDefault();
    const { error } = await supabase.from('coupons').insert([{
      code: couponForm.code.toUpperCase(),
      discount_percent: parseInt(couponForm.percent),
      max_discount_amount: parseFloat(couponForm.max_amount),
      starts_at: couponForm.starts_at || new Date(),
      expires_at: couponForm.expires_at || null,
      is_active: true
    }]);
    if (!error) {
      setShowAddCoupon(false);
      loadAdminData();
      showToast("تم إنشاء الكوبون بنجاح");
    } else alert(error.message);
  }

  async function toggleCoupon(id, current) {
    const { error } = await supabase.from('coupons').update({ is_active: !current }).eq('id', id);
    if (!error) loadAdminData();
  }

  async function deleteCoupon(id) {
    if (confirm("حذف الكوبون؟")) {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (!error) loadAdminData();
    }
  }

  if (authLoading) return <div className="page-loading">جاري التحقق...</div>;
  if (!isAdmin) return <div className="unauthorized"><h1>غير مسموح لكِ بالدخول</h1><a href="/admin/login">تسجيل الدخول للإدارة</a></div>;

  const selectedCat = mainCategories.find(c => c.name === form.category);

  return (
    <PageShell>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="sidebar-brand"><LayoutDashboard size={24} /><span>زينة النيل Pro</span></div>
          <nav className="sidebar-nav">
            <button className={activeTab === 'coupons' ? 'active' : ''} onClick={() => setActiveTab('coupons')}><Sparkles size={20}/> قسائم الخصم</button>
            <button className={activeTab === 'shipping' ? 'active' : ''} onClick={() => setActiveTab('shipping')}><Truck size={20}/> أسعار الشحن</button>
            <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}><Settings size={20}/> الضرائب والإعدادات</button>
            <button className={activeTab === 'staff' ? 'active' : ''} onClick={() => setActiveTab('staff')}><ShieldAlert size={20}/> الموظفين</button>
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><BarChart3 size={20}/> نظرة عامة</button>
            <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}><Package size={20}/> إدارة المنتجات</button>
            <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}><ShoppingCart size={20}/> الطلبات <span className="badge">{orders.filter(o => o.status === 'Pending').length}</span></button>
            <button className={activeTab === 'customers' ? 'active' : ''} onClick={() => setActiveTab('customers')}><Users size={20}/> العملاء</button>
          </nav>
        </aside>

        <main className="admin-main">
          <header className="admin-topbar">
            <h2>
              {activeTab === 'overview' ? 'الإحصائيات' :
               activeTab === 'products' ? 'المخزون' :
               activeTab === 'orders' ? 'إدارة الطلبات' :
               activeTab === 'coupons' ? 'إدارة الكوبونات' :
               activeTab === 'shipping' ? 'أسعار الشحن' :
               activeTab === 'settings' ? 'الإعدادات والضرائب' :
               activeTab === 'staff' ? 'إدارة الموظفين' :
               'العملاء'}
            </h2>
            <div className="topbar-actions">
              {activeTab === 'coupons' && (
                <button className="btn-primary" onClick={() => setShowAddCoupon(true)}><PlusCircle size={18}/> إنشاء كوبون</button>
              )}
              {activeTab === 'shipping' && (
                <button className="btn-primary" onClick={() => setShowAddShipping(true)}><PlusCircle size={18}/> إضافة سعر شحن</button>
              )}
              {activeTab === 'staff' && (
                <button className="btn-primary" onClick={() => setShowAddStaff(true)}><PlusCircle size={18}/> إضافة موظف</button>
              )}
              {activeTab === 'products' && (
                <>
                  <button
                    className={`btn-save-bulk mr-10 ${Object.keys(modifiedStock).length > 0 ? 'active' : ''}`}
                    onClick={handleBulkSave}
                    disabled={bulkSaving || Object.keys(modifiedStock).length === 0}
                  >
                    {bulkSaving ? <Clock size={18} className="animate-spin"/> : <Save size={18}/>}
                    حفظ التغيرات {Object.keys(modifiedStock).length > 0 && `(${Object.keys(modifiedStock).length})`}
                  </button>
                  <button className="btn-primary" onClick={() => setShowAddForm(true)}><PlusCircle size={18}/> إضافة منتج</button>
                </>
              )}
            </div>
          </header>

          {toast.show && <div className="admin-toast">{toast.msg}</div>}

          {activeTab === 'overview' && (
            <div className="overview-container">
              <div className="dashboard-grid">
                <div className="stat-box gold"><div className="stat-info"><span>إجمالي المبيعات</span><strong>{formatPrice(orders.reduce((acc, curr) => acc + Number(curr.total_price), 0))}</strong></div><TrendingUp size={32}/></div>
                <div className="stat-box navy"><div className="stat-info"><span>إجمالي الطلبات</span><strong>{orders.length}</strong></div><ShoppingCart size={32}/></div>
                <div className="stat-box"><div className="stat-info"><span>عدد المنتجات</span><strong>{products.length}</strong></div><Package size={32}/></div>
              </div>

              <div className="overview-secondary-grid mt-20">
                <div className="table-card">
                  <div className="card-header">
                    <h3>أحدث الطلبات</h3>
                    <button onClick={() => setActiveTab('orders')}>عرض الكل</button>
                  </div>
                  <table className="admin-table">
                    <thead><tr><th>العميل</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td>{o.full_name}</td>
                          <td>{formatPrice(o.total_price)}</td>
                          <td><span className={`status-pill ${o.status?.toLowerCase()}`}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="table-card">
                  <div className="card-header">
                    <h3>منتجات قاربت على النفاد</h3>
                    <button onClick={() => setActiveTab('products')}>إدارة المخزون</button>
                  </div>
                  <table className="admin-table">
                    <thead><tr><th>المنتج</th><th>المخزون</th></tr></thead>
                    <tbody>
                      {products.filter(p => p.stock < 5).slice(0, 5).map(p => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td><span className="stock-badge low">{p.stock} قطع</span></td>
                        </tr>
                      ))}
                      {products.filter(p => p.stock < 5).length === 0 && (
                        <tr><td colSpan="2" className="text-center">كل المنتجات متوفرة بكثرة ✅</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="products-view">
              {showAddForm && (
                <div className="modal-overlay">
                  <div className="admin-modal">
                    <div className="modal-header">
                      <h3>{editingProduct ? "تعديل المنتج" : "إضافة منتج احترافي"}</h3>
                      <button onClick={closeForm}><X/></button>
                    </div>
                    <form onSubmit={handleAddProduct} className="admin-form-grid">

                      <div className="full-width">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ margin: 0 }}>صور المنتج (يمكنك رفع عدة صور)</label>
                          <label className="checkbox-field" style={{ margin: 0, fontSize: '13px', color: 'var(--navy)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={useAiTransform}
                              onChange={(e) => setUseAiTransform(e.target.checked)}
                            />
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Sparkles size={14} color="var(--gold)" />
                              تحسين بالذكاء الاصطناعي (AI Studio)
                            </span>
                          </label>
                        </div>
                        <div className="image-upload-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '10px' }}>
                          {(form.images || []).map((imgUrl, idx) => (
                            <div key={idx} className="preview-container" style={{ position: 'relative', height: '100px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                              <img src={imgUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: processingImages.includes(imgUrl) ? 0.4 : 1 }} />

                              {processingImages.includes(imgUrl) && (
                                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.2)', fontSize: '10px', color: '#fff', fontWeight: '800', textAlign: 'center' }}>
                                  <div className="spinner-mini" style={{ marginBottom: '5px' }}></div>
                                  جاري التحسين بـ AI...
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => removeImage(imgUrl)}
                                style={{ position: 'absolute', top: '5px', left: '5px', background: '#ef4444', color: '#fff', border: 0, width: '20px', height: '20px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}
                              >
                                <X size={12}/>
                              </button>
                              {form.image === imgUrl && <span style={{ position: 'absolute', bottom: '0', right: '0', left: '0', background: 'rgba(16, 185, 129, 0.8)', color: '#fff', fontSize: '10px', textAlign: 'center', padding: '2px' }}>الرئيسية</span>}
                              {form.image !== imgUrl && (
                                <button
                                  type="button"
                                  onClick={() => setForm({ ...form, image: imgUrl })}
                                  style={{ position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 0, padding: '2px 5px', borderRadius: '4px', fontSize: '10px' }}
                                >
                                  تعيين كرئيسية
                                </button>
                              )}
                            </div>
                          ))}
                          <label className="upload-placeholder" style={{ height: '100px', border: '2px dashed #e2e8f0', borderRadius: '12px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                            <input type="file" accept="image/*" onChange={handleImageUpload} hidden multiple />
                            <div style={{ textAlign: 'center' }}>
                              <Upload size={20} />
                              <div style={{ fontSize: '10px' }}>{uploading ? "جاري الرفع..." : "إضافة صور"}</div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label>كود المنتج (تلقائي)</label>
                        <input value={form.sku} readOnly style={{ background: '#f8fafc', color: '#64748b' }} />
                      </div>

                      <div className="full-width">
                        <label>اسم المنتج</label>
                        <div className="input-with-action">
                          <div className="input-rel-container">
                            <input
                              required
                              value={form.name}
                              onChange={e => setForm({...form, name: e.target.value})}
                              placeholder="مثلاً: توب حرير مطرز"
                              disabled={aiLoading}
                            />
                            {aiLoading && <div className="inner-spinner"></div>}
                          </div>
                          <button
                            type="button"
                            onClick={generateAiName}
                            className="ai-gen-btn"
                            disabled={aiLoading || !form.image}
                            title="اقتراح اسم بالذكاء الاصطناعي"
                          >
                            <Sparkles size={18}/>
                            <span>{aiLoading ? "جاري التحليل..." : "AI Suggest"}</span>
                          </button>
                        </div>
                      </div>

                      <div className="full-width">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ margin: 0 }}>وصف المنتج (اختياري)</label>
                          <button
                            type="button"
                            onClick={generateAiDescription}
                            className="ai-gen-btn mini"
                            disabled={descLoading || !form.image}
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >
                            <Wand2 size={14}/>
                            <span>{descLoading ? "جاري الكتابة..." : "وصف إبداعي بـ AI"}</span>
                          </button>
                        </div>
                        <textarea
                          value={form.description}
                          onChange={e => setForm({...form, description: e.target.value})}
                          placeholder="اكتبي تفاصيل المنتج هنا (الخامة، المقاسات، إلخ)..."
                          rows={4}
                        />
                      </div>

                      <div className="full-width">
                        <label>الألوان المتاحة (افصلي بينها بفاصلة)</label>
                        <input
                          value={form.colors.join(', ')}
                          onChange={e => setForm({...form, colors: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                          placeholder="أزرق، أحمر، أخضر..."
                        />
                      </div>

                      <div>
                        <label>القسم الرئيسي</label>
                        <select value={form.category} onChange={e => {
                          const cat = mainCategories.find(c => c.name === e.target.value);
                          setForm({...form, category: e.target.value, subcategory: cat.subcategories[0]});
                        }}>
                          {mainCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label>القسم الفرعي</label>
                        <select value={form.subcategory} onChange={e => setForm({...form, subcategory: e.target.value})}>
                          {selectedCat?.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div>
                        <label>السعر ({market.symbol} - الأساسي)</label>
                        <input type="number" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="500" />
                      </div>

                      <div>
                        <label>السعر القديم ({market.symbol} - اختياري)</label>
                        <input type="number" value={form.old_price} onChange={e => setForm({...form, old_price: e.target.value})} placeholder="700" />
                      </div>

                      <div>
                        <label>نسبة الخصم %</label>
                        <input type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} />
                      </div>

                      <div>
                        <label>المخزون (قطع)</label>
                        <input type="number" required value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} />
                      </div>

                      <div className="full-width checkbox-field">
                        <input
                          type="checkbox"
                          id="is_new"
                          checked={form.is_new}
                          onChange={e => setForm({...form, is_new: e.target.checked})}
                        />
                        <label htmlFor="is_new">تمييز كمنتج "جديد"</label>
                      </div>

                      <button type="submit" className="btn-primary full-width" disabled={loading || uploading}>
                        {loading ? "جاري الحفظ..." : editingProduct ? "تحديث التغييرات" : "اعتماد ونشر المنتج"}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <div className="filters-bar">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="بحث في المنتجات..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-card">
                <table className="admin-table">
                  <thead><tr><th>الكود</th><th>الصورة</th><th>المنتج</th><th>السعر</th><th>المخزون</th><th>إجراءات</th></tr></thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" className="text-center p-25">جاري تحميل المنتجات...</td></tr>
                    ) : products.length === 0 ? (
                      <tr><td colSpan="6" className="text-center p-25">لا يوجد منتجات متاحة حالياً.</td></tr>
                    ) : (
                      products
                        .filter(p => {
                          const s = searchTerm.toLowerCase();
                          return (p.name?.toLowerCase() || "").includes(s) ||
                                 (p.sku?.toLowerCase() || "").includes(s) ||
                                 (p.category?.toLowerCase() || "").includes(s);
                        })
                        .map(p => (
                        <tr key={p.id}>
                          <td><code className="sku-badge">{p.sku || '#-'}</code></td>
                          <td><img src={p.image} className="admin-thumb" alt="" /></td>
                          <td>
                            <div className="prod-info">
                              <strong>{p.name}</strong>
                              <small>{p.category} › {p.subcategory}</small>
                            </div>
                          </td>
                          <td>
                            <div className="price-stack">
                              <strong>{formatPrice(p.price)}</strong>
                              {p.old_price && <del>{formatPrice(p.old_price)}</del>}
                            </div>
                          </td>
                          <td>
                            <div className="stock-control-wrapper">
                              <button
                                className="stock-btn minus"
                                onClick={() => handleLocalStockChange(p.id, (p.stock || 0) - 1)}
                                disabled={updatingStockId === p.id}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                className="stock-input"
                                value={p.stock || 0}
                                onChange={(e) => handleLocalStockChange(p.id, e.target.value)}
                                disabled={updatingStockId === p.id}
                              />
                              <button
                                className="stock-btn plus"
                                onClick={() => handleLocalStockChange(p.id, (p.stock || 0) + 1)}
                                disabled={bulkSaving}
                              >
                                +
                              </button>
                            </div>
                            {modifiedStock[p.id] !== undefined && <div className="stock-edit-indicator" title="تغيير غير محفوظ"></div>}
                            {p.stock < 5 && <small className="stock-warning">مخزون منخفض!</small>}
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon edit" onClick={() => handleEdit(p)} title="تعديل"><Edit size={16}/></button>
                              <button className="btn-icon delete" onClick={() => deleteProduct(p.id)} title="حذف"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-view">
              <div className="filters-bar" style={{ justifyContent: 'flex-start', marginBottom: '20px', gap: '15px', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '14px' }}>تصفية حسب الحالة:</span>
                <div className="filter-tabs" style={{ display: 'flex', gap: '10px' }}>
                  {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                    <button
                      key={status}
                      className={`filter-tab-btn ${orderStatusFilter === status ? 'active' : ''}`}
                      onClick={() => setOrderStatusFilter(status)}
                      style={{
                        padding: '6px 15px',
                        borderRadius: '20px',
                        border: '1px solid #ddd',
                        background: orderStatusFilter === status ? 'var(--navy)' : '#fff',
                        color: orderStatusFilter === status ? '#fff' : '#64748b',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {status === 'All' ? 'الكل' :
                       status === 'Pending' ? 'انتظار' :
                       status === 'Processing' ? 'تجهيز' :
                       status === 'Shipped' ? 'شحن' :
                       status === 'Delivered' ? 'تم' : 'ملغي'}
                    </button>
                  ))}
                </div>
              </div>

              {viewingOrder && (
                <div className="modal-overlay">
                  <div className="admin-modal">
                    <div className="modal-header">
                      <h3>تفاصيل الطلب #{viewingOrder.id.slice(0,8)}</h3>
                      <button onClick={() => setViewingOrder(null)}><X/></button>
                    </div>
                    <div className="order-details-content p-25">
                      <div className="order-info-grid">
                        <div>
                          <strong>بيانات العميل:</strong>
                          <p>{viewingOrder.full_name}<br/>{viewingOrder.phone}<br/>{viewingOrder.city}, {viewingOrder.address}</p>
                        </div>
                        <div>
                          <strong>حالة الطلب:</strong>
                          <select
                            value={viewingOrder.status}
                            onChange={(e) => updateOrderStatus(viewingOrder.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="Pending">قيد الانتظار</option>
                            <option value="Processing">جاري التجهيز</option>
                            <option value="Shipped">تم الشحن</option>
                            <option value="Delivered">تم التوصيل</option>
                            <option value="Cancelled">ملغي</option>
                          </select>
                        </div>
                      </div>

                      <div className="order-items-list mt-20">
                        <strong>المنتجات:</strong>
                        <table className="admin-table">
                          <thead>
                            <tr><th>المنتج</th><th>الكمية</th><th>السعر</th></tr>
                          </thead>
                          <tbody>
                            {JSON.parse(viewingOrder.items || '[]').map((item, idx) => (
                              <tr key={idx}>
                                <td>{item.name}</td>
                                <td>{item.quantity}</td>
                                <td>{formatPrice(item.price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="order-total-box mt-20">
                        <strong>الإجمالي الكلي: {formatPrice(viewingOrder.total_price)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="table-card">
                <table className="admin-table">
                  <thead>
                    <tr><th>رقم الطلب</th><th>العميل</th><th>التاريخ</th><th>الإجمالي</th><th>الحالة</th><th>إجراءات</th></tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter(o => orderStatusFilter === "All" || o.status === orderStatusFilter)
                      .map(o => (
                      <tr key={o.id}>
                        <td>#{o.id.slice(0,8)}</td>
                        <td>{o.full_name}</td>
                        <td>{new Date(o.created_at).toLocaleDateString('ar-EG')}</td>
                        <td>{formatPrice(o.total_price)}</td>
                        <td>
                          <span className={`status-pill ${o.status?.toLowerCase()}`}>
                            {o.status === 'Pending' ? 'انتظار' :
                             o.status === 'Processing' ? 'تجهيز' :
                             o.status === 'Shipped' ? 'شحن' :
                             o.status === 'Delivered' ? 'تم' : 'ملغي'}
                          </span>
                        </td>
                        <td>
                          <button className="btn-icon edit" onClick={() => setViewingOrder(o)}><ChevronRight size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="coupons-view">
              {showAddCoupon && (
                <div className="modal-overlay">
                  <div className="admin-modal" style={{maxWidth: '450px'}}>
                    <div className="modal-header"><h3>إنشاء كوبون خصم جديد</h3><button onClick={() => setShowAddCoupon(false)}><X/></button></div>
                    <form onSubmit={handleAddCoupon} className="p-25">
                      <div className="form-group mb-15">
                        <label>كود الخصم (مثلاً: SAVE20)</label>
                        <input required value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value})} placeholder="الرمز..." />
                      </div>
                      <div className="form-group mb-15">
                        <label>نسبة الخصم (%)</label>
                        <input type="number" required value={couponForm.percent} onChange={e => setCouponForm({...couponForm, percent: e.target.value})} />
                      </div>
                      <div className="form-group mb-20">
                        <label>الحد الأقصى لمبلغ الخصم ({market.label})</label>
                        <input type="number" required value={couponForm.max_amount} onChange={e => setCouponForm({...couponForm, max_amount: e.target.value})} />
                      </div>
                      <div className="form-grid mb-20" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                        <div className="form-group">
                          <label>تاريخ البدء</label>
                          <input type="date" value={couponForm.starts_at} onChange={e => setCouponForm({...couponForm, starts_at: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label>تاريخ الانتهاء (اختياري)</label>
                          <input type="date" value={couponForm.expires_at} onChange={e => setCouponForm({...couponForm, expires_at: e.target.value})} />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary full-width">حفظ ونشر الكوبون</button>
                    </form>
                  </div>
                </div>
              )}
              <div className="table-card">
                <table className="admin-table">
                  <thead><tr><th>الكود</th><th>النسبة</th><th>الحد الأقصى</th><th>الحالة</th><th>إجراءات</th></tr></thead>
                  <tbody>
                    {coupons.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.code}</strong></td>
                        <td>{c.discount_percent}%</td>
                        <td>{formatPrice(c.max_discount_amount)}</td>
                        <td><span className={`status-pill ${c.is_active ? 'delivered' : 'cancelled'}`}>{c.is_active ? 'فعال' : 'معطل'}</span></td>
                        <td>
                          <div className="actions-cell">
                            <button onClick={() => toggleCoupon(c.id, c.is_active)} className="btn-icon edit" title="تغيير الحالة"><Clock size={16}/></button>
                            <button onClick={() => deleteCoupon(c.id)} className="btn-icon delete" title="حذف الكوبون"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="shipping-view">
              {showAddShipping && (
                <div className="modal-overlay">
                  <div className="admin-modal" style={{maxWidth: '450px'}}>
                    <div className="modal-header"><h3>إضافة سعر شحن جديد</h3><button onClick={() => setShowAddShipping(false)}><X/></button></div>
                    <form onSubmit={handleAddShippingRate} className="p-25">
                      <div className="form-group mb-15">
                        <label>الدولة</label>
                        <select value={shipForm.country} onChange={e => setShipForm({...shipForm, country: e.target.value})}>
                          <option>مصر</option><option>الإمارات</option><option>قطر</option>
                        </select>
                      </div>
                      <div className="form-group mb-15">
                        <label>المدينة</label>
                        <input required value={shipForm.city} onChange={e => setShipForm({...shipForm, city: e.target.value})} placeholder="اسم المدينة..." />
                      </div>
                      <div className="form-group mb-20">
                        <label>سعر التوصيل ({market.label})</label>
                        <input type="number" required value={shipForm.rate} onChange={e => setShipForm({...shipForm, rate: e.target.value})} />
                      </div>
                      <button type="submit" className="btn-primary full-width">إضافة المنطقة</button>
                    </form>
                  </div>
                </div>
              )}
              <div className="table-card">
                <table className="admin-table">
                  <thead><tr><th>الدولة</th><th>المدينة</th><th>السعر</th><th>إجراءات</th></tr></thead>
                  <tbody>
                    {shippingRates.map(s => (
                      <tr key={s.id}>
                        <td>{s.country}</td>
                        <td><strong>{s.city}</strong></td>
                        <td>{formatPrice(s.rate)}</td>
                        <td><button onClick={() => deleteShippingRate(s.id)} className="btn-icon delete"><Trash2 size={16}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-view">
              <div className="table-card" style={{maxWidth: '700px', margin: '0 auto'}}>
                <div className="card-header"><h3>إعدادات الضرائب حسب الدولة</h3></div>
                <div className="p-25">
                  {['Egypt', 'UAE', 'Qatar'].map((country) => (
                    <div key={country} className="country-tax-card mb-20" style={{padding: '15px', border: '1px solid #eee', borderRadius: '10px', background: '#fcfcfc'}}>
                      <h4 style={{marginBottom: '15px', color: 'var(--navy)'}}>{country === 'Egypt' ? '🇪🇬 مصر' : country === 'UAE' ? '🇦🇪 الإمارات' : '🇶🇦 قطر'}</h4>
                      <div className="form-group mb-10">
                        <label className="checkbox-field">
                          <input
                            type="checkbox"
                            checked={taxConfig[country]?.enabled}
                            onChange={e => setTaxConfig({
                              ...taxConfig,
                              [country]: { ...taxConfig[country], enabled: e.target.checked }
                            })}
                          />
                          <span>تفعيل الضريبة</span>
                        </label>
                      </div>
                      {taxConfig[country]?.enabled && (
                        <div className="form-group">
                          <label>نسبة الضريبة (%)</label>
                          <input
                            type="number"
                            value={taxConfig[country]?.percent}
                            onChange={e => setTaxConfig({
                              ...taxConfig,
                              [country]: { ...taxConfig[country], percent: Number(e.target.value) }
                            })}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  <button onClick={() => saveTaxSettings(taxConfig)} className="btn-primary full-width mt-10"><Save size={20}/> حفظ إعدادات الضرائب</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="staff-view">
              {showAddStaff && (
                <div className="modal-overlay">
                  <div className="admin-modal" style={{maxWidth: '450px'}}>
                    <div className="modal-header"><h3>إضافة موظف جديد</h3><button onClick={() => setShowAddStaff(false)}><X/></button></div>
                    <form onSubmit={handleAddStaff} className="p-25">
                      <div className="form-group mb-15">
                        <label>البريد الإلكتروني للموظف</label>
                        <input type="email" required value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} placeholder="example@gmail.com" />
                      </div>
                      <div className="form-group mb-20">
                        <label>الصلاحية</label>
                        <select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})}>
                          <option value="Employee">موظف (إدارة طلبات ومخزون)</option>
                          <option value="Admin">مدير (صلاحيات كاملة)</option>
                        </select>
                      </div>
                      <button type="submit" className="btn-primary full-width">إعطاء الصلاحية</button>
                    </form>
                  </div>
                </div>
              )}
              <div className="table-card">
                <table className="admin-table">
                  <thead><tr><th>البريد الإلكتروني</th><th>الدور</th><th>تاريخ الإضافة</th><th>إجراءات</th></tr></thead>
                  <tbody>
                    {staff.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.email}</strong></td>
                        <td><span className={`status-pill ${s.role === 'Admin' ? 'delivered' : 'processing'}`}>{s.role === 'Admin' ? 'مدير' : 'موظف'}</span></td>
                        <td>{new Date(s.created_at).toLocaleDateString('ar-EG')}</td>
                        <td>{s.email !== user?.email && <button onClick={() => deleteStaff(s.id)} className="btn-icon delete"><Trash2 size={16}/></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'customers' && (
            <div className="customers-view">
              <div className="table-card" style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>الاسم</th>
                      <th>البريد الإلكتروني</th>
                      <th>رقم الهاتف</th>
                      <th>الدولة / المدينة</th>
                      <th>العنوان بالتفصيل</th>
                      <th>تاريخ الانضمام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.full_name || 'بدون اسم'}</strong></td>
                        <td>{c.email || <span style={{color: '#94a3b8', fontSize: '11px'}}>لم يسجل</span>}</td>
                        <td dir="ltr" style={{ textAlign: 'right' }}>{c.phone || '-'}</td>
                        <td>{c.country || '-'} / {c.city || '-'}</td>
                        <td><small title={c.address}>{c.address ? (c.address.length > 30 ? c.address.substring(0, 30) + '...' : c.address) : '-'}</small></td>
                        <td>{new Date(c.created_at).toLocaleDateString('ar-EG')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </PageShell>
  );
}
