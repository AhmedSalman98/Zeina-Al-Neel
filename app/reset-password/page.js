"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import PageShell from "../../components/PageShell";
import { Lock, Save } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpdate(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("تم تحديث كلمة المرور بنجاح! جاري تحويلك...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    }
    setLoading(false);
  }

  return (
    <PageShell>
      <section className="login-page">
        <div className="login-card">
          <h1>تعيين كلمة مرور جديدة</h1>
          <p>يرجى اختيار كلمة مرور قوية وجديدة لحسابك</p>

          <form onSubmit={handleUpdate}>
            <div className="input-group">
              <Lock size={18}/>
              <input
                type="password"
                placeholder="كلمة المرور الجديدة"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {message && <div className={`auth-message ${message.includes("بنجاح") ? "success" : ""}`}>{message}</div>}

            <button type="submit" className="login-btn" disabled={loading}>
              <Save size={18}/> {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
            </button>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
