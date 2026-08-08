"use client";

import { useState } from "react";
import Link from "next/link";
import PageShell from "../../components/PageShell";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    // Crucial: Prevents the HTML form '?' reload bug
    if (e && e.preventDefault) e.preventDefault();

    setLoading(true);
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log("Attempting login for:", cleanEmail);
      // 2. Standard Supabase Auth logic for all other users
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        console.error("Supabase Login Error:", error);
        let errorMsg = error.message;

        if (error.message.includes("Invalid login credentials")) {
          errorMsg = "خطأ في البيانات! تأكدي من الإيميل وكلمة المرور.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMsg = "يرجى تأكيد بريدك الإلكتروني أولاً. افحصي صندوق الوارد.";
        } else if (error.message.includes("Rate limit exceeded")) {
          errorMsg = "محاولات كثيرة جداً. يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.";
        }

        setMessage(errorMsg);
        setLoading(false);
        return;
      }

      if (data?.session) {
        console.log("Login successful!");
        // Redirect based on role if necessary, default to homepage or admin
        window.location.href = '/';
      }
    } catch (err) {
      console.error("Unexpected Login Error:", err);
      setMessage("حدث خطأ غير متوقع أثناء تسجيل الدخول. تأكدي من اتصالك بالإنترنت.");
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <section className="login-page">
        <div className="login-card">
          <h1>تسجيل الدخول</h1>
          <p>مرحباً بكِ مجدداً في زينة النيل</p>

          <form onSubmit={handleLogin} className="space-y-4" style={{ marginTop: '20px' }}>
            <div className="input-group">
              <Mail size={18}/>
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <Lock size={18}/>
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="forgot-pass-link">
              <Link href="/forgot-password">نسيتِ كلمة المرور؟</Link>
            </div>

            {message && <div className="auth-message">{message}</div>}

            <div className="auth-actions">
              <button
                type="submit"
                className="login-btn"
                disabled={loading}
              >
                <LogIn size={18}/> {loading ? "جاري الدخول..." : "تسجيل الدخول"}
              </button>

              <div className="auth-divider" style={{ margin: '15px 0', color: '#888', fontSize: '14px' }}>
                <span>أو</span>
              </div>

              <Link href="/register" className="signup-btn">
                <UserPlus size={18}/> إنشاء حساب جديد
              </Link>
            </div>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
