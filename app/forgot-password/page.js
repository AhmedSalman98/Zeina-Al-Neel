"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import PageShell from "../../components/PageShell";
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" }); // type: success or error

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.message.includes("rate limit")) {
          setStatus({ type: "error", msg: "طلبات كثيرة! يرجى الانتظار دقيقة والتحقق من صندوق الوارد." });
        } else {
          setStatus({ type: "error", msg: "عذرًا، " + error.message });
        }
      } else {
        setStatus({ type: "success", msg: "تم إرسال رابط الاستعادة بنجاح! تفقد بريدك الإلكتروني (الوارد أو الـ Spam) ✅" });
      }
    } catch (err) {
      setStatus({ type: "error", msg: "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً." });
    }

    setLoading(false);
  }

  return (
    <PageShell>
      <section className="login-page">
        <div className="login-card">
          <Link href="/login" className="back-to-login">
            <ArrowRight size={18}/> العودة للدخول
          </Link>

          <h1>استعادة الحساب</h1>
          <p>أدخلي بريدك الإلكتروني وسنرسل لكِ رابطاً لتعيين كلمة مرور جديدة</p>

          {status.type === "success" ? (
            <div className="success-state">
              <CheckCircle size={64} color="#25a45a" />
              <div className="auth-message success">{status.msg}</div>
              <p style={{marginTop: '10px'}}>إذا لم تجد الرسالة، يرجى التحقق من مجلد الـ Junk/Spam.</p>
              <Link href="/login" className="login-btn" style={{marginTop: '20px'}}>العودة لصفحة الدخول</Link>
            </div>
          ) : (
            <form onSubmit={handleReset}>
              <div className="input-group">
                <Mail size={18}/>
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {status.type === "error" && (
                <div className="auth-message" style={{display:'flex', alignItems:'center', gap:'8px'}}>
                  <AlertCircle size={16}/> {status.msg}
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
              </button>
            </form>
          )}
        </div>
      </section>
    </PageShell>
  );
}
