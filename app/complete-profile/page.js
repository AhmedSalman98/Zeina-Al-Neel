"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import PageShell from "../../components/PageShell";
import { User, Phone, MapPin, Globe, Calendar, CheckCircle } from "lucide-react";

export default function CompleteProfilePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    country: "مصر",
    city: "",
    address: "",
    birth_date: "",
    preferences: "فاشن وتياب"
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        ...form,
        updated_at: new Date()
      });

      if (!error) {
        setSuccess(true);
        setTimeout(() => { window.location.href = "/"; }, 3000);
      } else {
        alert(error.message);
      }
    }
    setLoading(false);
  }

  if (success) {
    return (
      <PageShell>
        <section className="order-success">
          <div className="message-bubble">
            <CheckCircle size={64} color="#25a45a"/>
            <h1>تم حفظ بياناتك بنجاح!</h1>
            <p>أهلاً بكِ في عائلة زينة النيل. سيتم توجيهك للرئيسية الآن لتستمتعي بتجربة تسوق فريدة.</p>
          </div>
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="login-page">
        <div className="login-card" style={{maxWidth: '600px'}}>
          <h1>إكمال الملف الشخصي</h1>
          <p>ساعدينا لنتعرف عليكِ أكثر ولنقدم لكِ أفضل خدمة شحن وتوصيل</p>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="input-group">
              <User size={18}/><input placeholder="الاسم الكامل" required onChange={e => setForm({...form, full_name: e.target.value})}/>
            </div>

            <div className="input-group">
              <Phone size={18}/><input placeholder="رقم الهاتف" required dir="ltr" onChange={e => setForm({...form, phone: e.target.value})}/>
            </div>

            <div className="form-row" style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
              <div className="input-group" style={{flex:1, marginBottom:0}}>
                <Globe size={18}/>
                <select onChange={e => setForm({...form, country: e.target.value})} style={{width:'100%', height:'54px', borderRadius:'10px', padding:'0 40px', border:'1px solid #ddd'}}>
                  <option>مصر</option>
                  <option>الإمارات</option>
                  <option>قطر</option>
                </select>
              </div>
              <div className="input-group" style={{flex:1, marginBottom:0}}>
                <MapPin size={18}/><input placeholder="المدينة" required onChange={e => setForm({...form, city: e.target.value})}/>
              </div>
            </div>

            <div className="input-group">
              <MapPin size={18}/><input placeholder="العنوان بالتفصيل" required onChange={e => setForm({...form, address: e.target.value})}/>
            </div>

            <div className="input-group">
              <Calendar size={18}/>
              <input type="date" placeholder="تاريخ الميلاد" onChange={e => setForm({...form, birth_date: e.target.value})}/>
            </div>
            <small style={{display:'block', marginBottom:'20px', color:'#888'}}>* تاريخ الميلاد اختياري (لنرسل لكِ هدايا في عيد ميلادك 🎁)</small>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ البيانات والبدء بالتسوق"}
            </button>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
