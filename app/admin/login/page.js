"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function executeSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
      setLoading(true);
      setMessage("");

      const supabase = createClient();

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (error) {
        console.error("Admin Login Error:", error);
        let errorMsg = error.message;
        if (error.message.includes("Invalid login credentials")) {
          errorMsg = "خطأ في بيانات الأدمن! تأكد من البريد وكلمة المرور.";
        }
        setMessage(errorMsg);
        return;
      }

      if (!data.user) {
        throw new Error("تعذر تسجيل الدخول");
      }

      alert("تم تسجيل دخول المسؤول بنجاح!");
      window.location.href = "/admin";
    } catch (error) {
      console.error("Admin login exception:", error);
      setMessage(error?.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        direction: "rtl",
        background: "#f6f1e8",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "32px",
          background: "#ffffff",
          border: "1px solid #d5a236",
          borderRadius: "22px",
          boxShadow: "0 20px 55px rgba(0,43,92,0.16)",
        }}
      >
        <img
          src="/images/logo-header.png"
          alt="زينة النيل"
          style={{
            display: "block",
            width: "210px",
            maxWidth: "85%",
            height: "auto",
            margin: "0 auto 20px",
          }}
        />

        <h1
          style={{
            margin: "0 0 10px",
            color: "#002b5c",
            textAlign: "center",
            fontSize: "28px",
          }}
        >
          تسجيل دخول الإدارة
        </h1>

        <p
          style={{
            margin: "0 0 26px",
            color: "#667085",
            textAlign: "center",
            lineHeight: "1.8",
          }}
        >
          أدخل بيانات حساب الأدمن للوصول إلى لوحة التحكم.
        </p>

        <form onSubmit={executeSubmit} style={{ display: "grid", gap: "18px" }}>
          <label
            style={{
              display: "grid",
              gap: "8px",
              color: "#132238",
              fontWeight: "700",
            }}
          >
            البريد الإلكتروني
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                color: "#0f172a",
                fontSize: "16px",
                background: "#ffffff",
                border: "1px solid #d9dee7",
                borderRadius: "11px",
                outline: "none",
              }}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: "8px",
              color: "#132238",
              fontWeight: "700",
            }}
          >
            كلمة المرور
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="أدخل كلمة المرور"
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "14px",
                  paddingLeft: "70px",
                  color: "#0f172a",
                  fontSize: "16px",
                  background: "#ffffff",
                  border: "1px solid #d9dee7",
                  borderRadius: "11px",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "12px",
                  padding: "5px",
                  color: "#002b5c",
                  fontWeight: "700",
                  cursor: "pointer",
                  background: "transparent",
                  border: 0,
                  transform: "translateY(-50%)",
                }}
              >
                {showPassword ? "إخفاء" : "إظهار"}
              </button>
            </div>
          </label>

          {message && (
            <div
              style={{
                padding: "12px",
                color: "#be123c",
                background: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: "10px",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "800",
              cursor: loading ? "not-allowed" : "pointer",
              background: "#002b5c",
              border: 0,
              borderRadius: "11px",
              opacity: loading ? 0.65 : 1,
            }}
          >
            {loading ? "جارٍ تسجيل الدخول..." : "دخول لوحة التحكم"}
          </button>
        </form>
      </section>
    </main>
  );
}
