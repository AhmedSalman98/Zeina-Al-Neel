"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../components/AuthContext";
import PageShell from "../../components/PageShell";
import Price from "../../components/Price";
import { Package, Clock, CheckCircle, Truck, XCircle } from "lucide-react";

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMyOrders();
    }
  }, [authLoading, user]);

  async function fetchMyOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('phone', user.phone || '') // سنعتمد على الهاتف أو الإيميل حسب المتوفر
      .order('created_at', { ascending: false });

    if (!error) setOrders(data);
    setLoading(false);
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock size={18} className="text-orange" />;
      case 'Processing': return <Package size={18} className="text-blue" />;
      case 'Shipped': return <Truck size={18} className="text-purple" />;
      case 'Delivered': return <CheckCircle size={18} className="text-green" />;
      default: return <XCircle size={18} className="text-red" />;
    }
  };

  const getStatusText = (status) => {
    const statuses = {
      'Pending': 'بانتظار التأكيد',
      'Processing': 'قيد التجهيز',
      'Shipped': 'تم الشحن',
      'Delivered': 'تم التسليم',
      'Cancelled': 'ملغي'
    };
    return statuses[status] || status;
  };

  if (authLoading || loading) return <div className="page-loading">جاري تحميل طلباتك...</div>;

  return (
    <PageShell>
      <section className="catalog-page">
        <div className="catalog-top">
          <h1>طلباتي</h1>
          <p>تابعي حالة مشترياتك وتاريخ طلباتك السابقة.</p>
        </div>

        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="no-products">
              <Package size={64} color="#ddd" />
              <h2>لا توجد طلبات بعد</h2>
              <p>ابدئي التسوق الآن وستظهر طلباتك هنا.</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="order-item-card">
                <div className="order-header">
                  <div>
                    <span className="order-number">طلب رقم #{order.id}</span>
                    <small className="order-date">{new Date(order.created_at).toLocaleDateString('ar-EG')}</small>
                  </div>
                  <div className={`status-tag ${order.status}`}>
                    {getStatusIcon(order.status)}
                    <span>{getStatusText(order.status)}</span>
                  </div>
                </div>
                <div className="order-body">
                  <div className="order-info">
                    <span>الإجمالي: <strong><Price amount={order.total_price} /></strong></span>
                    <span>الوجهة: {order.country} - {order.city}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
