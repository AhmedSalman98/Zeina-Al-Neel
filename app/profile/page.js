"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../components/AuthContext";
import PageShell from "../../components/PageShell";
import BackButton from "../../components/BackButton";
import Price from "../../components/Price";
import {
  User, Package, MapPin, Phone, Mail,
  ChevronLeft, Clock, CheckCircle2, ShoppingBag, Edit2, Save, X, Copy
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [viewingOrder, setViewingOrder] = useState(null);

  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    address: ""
  });

  useEffect(() => {
    if (user) {
      loadUserOrders();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        city: profile.city || "",
        address: profile.address || ""
      });
    }
  }, [profile]);

  async function loadUserOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setOrders(data);
    setLoading(false);
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMsg("");

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...editForm,
        updated_at: new Date()
      });

    if (!error) {
      setSuccessMsg("تم تحديث بياناتك بنجاح! ✨");
      setIsEditing(false);
      // We could trigger a re-fetch here if needed,
      // but for now, we'll assume the context will pick it up or user will refresh.
      // Better yet, let's just force a reload of the component data if possible.
      setTimeout(() => window.location.reload(), 1500);
    } else {
      alert("حدث خطأ أثناء التحديث: " + error.message);
    }
    setSaveLoading(false);
  }

  if (authLoading) return <div className="page-loading">جاري التحميل...</div>;
  if (!user) {
    return (
      <PageShell>
        <div className="unauthorized">
          <h1>يرجى تسجيل الدخول لعرض الملف الشخصي</h1>
          <Link href="/login" className="btn-primary mt-20" style={{display:'inline-flex'}}>تسجيل الدخول</Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="profile-container">
        <header className="profile-header">
          <div className="user-meta">
            <div className="user-avatar">
              <User size={40} />
            </div>
            <div>
              <h1>مرحباً، {profile?.full_name || 'عميلنا العزيز'}</h1>
              <p>{user.email}</p>
            </div>
          </div>
          <div className="profile-stats">
            <div className="p-stat">
              <strong>{orders.length}</strong>
              <span>طلب</span>
            </div>
          </div>
        </header>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <nav>
              <button
                className={activeTab === 'orders' ? 'active' : ''}
                onClick={() => setActiveTab('orders')}
              >
                <Package size={20} /> طلباتي
              </button>
              <button
                className={activeTab === 'info' ? 'active' : ''}
                onClick={() => setActiveTab('info')}
              >
                <User size={20} /> بياناتي
              </button>
            </nav>
          </aside>

          <main className="profile-main">
            {activeTab === 'orders' && (
              <div className="orders-section">
                <h2>تاريخ الطلبات</h2>
                {loading ? (
                  <p>جاري تحميل الطلبات...</p>
                ) : orders.length > 0 ? (
                  <div className="user-orders-list">
                    {orders.map(order => (
                      <div key={order.id} className="user-order-card">
                        <div className="order-card-header">
                          <div>
                            <span className="order-id">طلب #{order.id.slice(0,8)}</span>
                            <span className="order-date">{new Date(order.created_at).toLocaleDateString('ar-EG')}</span>
                          </div>
                          <span className={`status-pill ${order.status?.toLowerCase()}`}>
                            {order.status === 'Pending' ? 'قيد الانتظار' :
                             order.status === 'Processing' ? 'جاري التجهيز' :
                             order.status === 'Shipped' ? 'تم الشحن' :
                             order.status === 'Delivered' ? 'تم التوصيل' : 'ملغي'}
                          </span>
                        </div>

                        {/* نظام تتبع الطلب (Order Tracker) */}
                        {order.status !== 'Cancelled' ? (
                          <div className="order-tracker-bar">
                            <div className={`tracker-step ${['Pending', 'Processing', 'Shipped', 'Delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}>
                              <div className="step-dot"></div>
                              <span>طلب جديد</span>
                            </div>
                            <div className={`tracker-step ${['Processing', 'Shipped', 'Delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}>
                              <div className="step-dot"></div>
                              <span>تجهيز</span>
                            </div>
                            <div className={`tracker-step ${['Shipped', 'Delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}>
                              <div className="step-dot"></div>
                              <span>شحن</span>
                            </div>
                            <div className={`tracker-step ${order.status === 'Delivered' ? 'active' : ''}`}>
                              <div className="step-dot"></div>
                              <span>توصيل</span>
                            </div>
                          </div>
                        ) : (
                          <div className="order-cancelled-notice">
                             <X size={16} />
                             <span>هذا الطلب ملغي حالياً. نعتذر عن أي إزعاج، يرجى التواصل معنا للاستفسار.</span>
                          </div>
                        )}

                        <div className="order-card-body">
                          <div className="order-items-preview">
                            {JSON.parse(order.items || '[]').map((item, i) => (
                              <span key={i}>{item.name} (x{item.quantity})</span>
                            ))}
                          </div>
                          <div className="order-price">
                            <strong>الإجمالي: <Price amount={order.total_price} /></strong>
                            {order.status === 'Delivered' && (
                              <button className="view-invoice-btn" onClick={() => setViewingOrder(order)}>
                                <ShoppingBag size={14} /> عرض الفاتورة
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <ShoppingBag size={48} />
                    <p>لا يوجد لديك طلبات سابقة بعد</p>
                    <Link href="/products" className="btn-primary">ابدأ التسوق الآن</Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="info-section">
                <div className="section-header">
                  <h2>بيانات الحساب</h2>
                  {!isEditing && (
                    <button className="edit-toggle-btn" onClick={() => setIsEditing(true)}>
                      <Edit2 size={16} /> تعديل البيانات
                    </button>
                  )}
                </div>

                {successMsg && <div className="success-toast">{successMsg}</div>}

                {isEditing ? (
                  <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                    <div className="form-group">
                      <label>الاسم الكامل</label>
                      <input
                        required
                        value={editForm.full_name}
                        onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>
                    <div className="form-group">
                      <label>رقم الهاتف</label>
                      <input
                        required
                        value={editForm.phone}
                        onChange={e => setEditForm({...editForm, phone: e.target.value})}
                        placeholder="0123456789"
                      />
                    </div>
                    <div className="form-group">
                      <label>المدينة</label>
                      <input
                        required
                        value={editForm.city}
                        onChange={e => setEditForm({...editForm, city: e.target.value})}
                        placeholder="مثلاً: القاهرة"
                      />
                    </div>
                    <div className="form-group">
                      <label>العنوان بالتفصيل</label>
                      <textarea
                        required
                        value={editForm.address}
                        onChange={e => setEditForm({...editForm, address: e.target.value})}
                        placeholder="اسم الشارع، رقم العمارة، الشقة..."
                        rows={3}
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={saveLoading}>
                        <Save size={18} /> {saveLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                      </button>
                      <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>
                        <X size={18} /> إلغاء
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="info-card">
                    <div className="info-row">
                      <User size={18} />
                      <div>
                        <label>الاسم الكامل</label>
                        <p>{profile?.full_name || 'غير محدد'}</p>
                      </div>
                    </div>
                    <div className="info-row">
                      <Phone size={18} />
                      <div>
                        <label>رقم الهاتف</label>
                        <p>{profile?.phone || 'غير محدد'}</p>
                      </div>
                    </div>
                    <div className="info-row">
                      <MapPin size={18} />
                      <div>
                        <label>العنوان</label>
                        <p>{profile?.city ? `${profile.city}, ${profile.address}` : 'غير محدد'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {viewingOrder && (
        <div className="modal-overlay no-print">
          <div className="admin-modal invoice-modal">
            <div className="modal-header">
              <h3>معاينة الفاتورة</h3>
              <button onClick={() => setViewingOrder(null)}><X /></button>
            </div>
            <div className="p-25">
               <div className="invoice-container" id="printable-invoice" style={{boxShadow: 'none', border: '1px solid #eee', padding: '30px'}}>
                  <header className="invoice-header">
                    <div className="invoice-brand">
                      <img src="/images/logo-full.png" alt="Zeenat Alnile" style={{height: '50px'}} />
                      <h1>فاتورة شراء</h1>
                    </div>
                    <div className="invoice-meta">
                      <p>رقم الطلب: <strong>#{viewingOrder.id.slice(0, 8).toUpperCase()}</strong></p>
                      <p>التاريخ: <strong>{new Date(viewingOrder.created_at).toLocaleDateString('ar-EG')}</strong></p>
                    </div>
                  </header>

                  <div className="invoice-grid">
                    <div className="invoice-section">
                      <h3>بيانات العميل</h3>
                      <p><strong>الاسم:</strong> {viewingOrder.full_name}</p>
                      <p><strong>الهاتف:</strong> {viewingOrder.phone}</p>
                      <p><strong>العنوان:</strong> {viewingOrder.country}, {viewingOrder.city}, {viewingOrder.address}</p>
                    </div>
                    <div className="invoice-section">
                      <h3>طريقة الدفع</h3>
                      <p>{viewingOrder.payment_method}</p>
                      <p className="status-badge">الحالة: {
                        viewingOrder.status === 'Pending' ? 'قيد المراجعة' :
                        viewingOrder.status === 'Processing' ? 'جاري التجهيز' :
                        viewingOrder.status === 'Shipped' ? 'تم الشحن' :
                        viewingOrder.status === 'Delivered' ? 'تم التوصيل' : 'ملغي'
                      }</p>
                    </div>
                  </div>

                  <table className="invoice-table">
                    <thead>
                      <tr>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {JSON.parse(viewingOrder.items || '[]').map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name} {item.color ? `(${item.color})` : ''}</td>
                          <td>{item.quantity}</td>
                          <td><Price amount={item.price * item.quantity} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="invoice-summary">
                    <div className="summary-line">
                      <span>إجمالي المنتجات:</span>
                      <strong><Price amount={JSON.parse(viewingOrder.items || '[]').reduce((acc, item) => acc + (item.price * item.quantity), 0)} /></strong>
                    </div>

                    {viewingOrder.shipping_cost > 0 && (
                      <div className="summary-line">
                        <span>رسوم التوصيل:</span>
                        <strong><Price amount={viewingOrder.shipping_cost} /></strong>
                      </div>
                    )}

                    {viewingOrder.discount_applied > 0 && (
                      <div className="summary-line discount">
                        <span>خصم الكوبون ({viewingOrder.discount_applied}%):</span>
                        <strong>-<Price amount={(JSON.parse(viewingOrder.items || '[]').reduce((acc, item) => acc + (item.price * item.quantity), 0)) * (viewingOrder.discount_applied / 100)} /></strong>
                      </div>
                    )}

                    {viewingOrder.vat_amount > 0 && (
                      <div className="summary-line">
                        <span>ضريبة القيمة المضافة:</span>
                        <strong><Price amount={viewingOrder.vat_amount} /></strong>
                      </div>
                    )}

                    <div className="summary-line grand-total">
                      <span>الإجمالي النهائي:</span>
                      <strong><Price amount={viewingOrder.total_price} /></strong>
                    </div>
                  </div>
               </div>
               <button className="print-btn w-full mt-20" onClick={() => window.print()}>
                 <Copy size={18} /> طباعة الفاتورة
               </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
