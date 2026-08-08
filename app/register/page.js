"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import PageShell from "../../components/PageShell";
import { User, Mail, Lock, Phone, MapPin, Globe, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    country: "الإمارات",
    city: "",
    address: ""
  });

  async function executeRegister() {
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            phone: form.phone,
          }
        }
      });

      if (error) {
        alert(`خطأ في إنشاء الحساب: ${error.message}`);
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // Success: Create/Update the profile in our custom table
      const userId = data?.user?.id;
      if (userId) {
        await supabase.from('profiles').upsert({
          id: userId,
          email: form.email.trim().toLowerCase(), // حفظ الإيميل للعرض في لوحة التحكم
          full_name: form.full_name,
          phone: form.phone,
          country: form.country,
          city: form.city,
          address: form.address,
          updated_at: new Date()
        });
      }

      alert("تم إنشاء الحساب بنجاح!");
      setSuccess(true);

      // Force hard navigation to homepage after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);

    } catch (err) {
      console.error("Registration Error:", err);
      alert(`خطأ غير متوقع: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <PageShell>
        <section className="order-success">
          <div className="message-bubble">
            <CheckCircle size={64} color="#25a45a"/>
            <h1>أهلاً بكِ في زينة النيل!</h1>
            <p>تم إعداد حسابك بنجاح. جاري تحويلك الآن...</p>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="login-page">
        <div className="login-card" style={{ maxWidth: "600px" }}>
          <h1>إنشاء حساب جديد</h1>
          <p>انضمي إلينا واحصلي على تجربة تسوق مخصصة</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
            <div className="input-group">
              <User size={18} />
              <input
                placeholder="الاسم الكامل"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

            <div className="input-group">
              <Mail size={18} />
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="input-group">
              <Lock size={18} />
              <input
                type="password"
                placeholder="كلمة المرور"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="input-group">
              <Phone size={18} />
              <input
                placeholder="رقم الهاتف"
                dir="ltr"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-row" style={{ display: "flex", gap: "10px" }}>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <Globe size={18} />
                <select
                  value={form.country}
                  onChange={e => setForm({ ...form, country: e.target.value })}
                  style={{ width: "100%", height: "54px", borderRadius: "10px", padding: "0 40px", border: "1px solid #ddd" }}
                >
                  <option>مصر</option>
                  <option>الإمارات</option>
                  <option>قطر</option>
                </select>
              </div>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <MapPin size={18} />
                <input
                  placeholder="المدينة"
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>

            <div className="input-group">
              <MapPin size={18} />
              <input
                placeholder="العنوان بالتفصيل"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>

            {errorMsg && <div className="auth-message">{errorMsg}</div>}

            <button
              type="button"
              onClick={executeRegister}
              className="login-btn"
              disabled={loading}
            >
              {loading ? "جاري المعالجة..." : "إنشاء الحساب والبدء"}
            </button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
