"use client";

import { useState } from "react";
import PageShell from "../../components/PageShell";
import { useCurrency } from "../../components/CurrencyContext";
import {
  Mail, Phone, MessageCircle, MapPin,
  Clock3, Send
} from "lucide-react";

export default function ContactPage() {
  const { marketCode } = useCurrency();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function sendMessage(event) {
    event.preventDefault();

    const text = encodeURIComponent(
      `رسالة جديدة من موقع زينة النيل\n\n` +
      `الاسم: ${form.name}\n` +
      `الهاتف: ${form.phone}\n` +
      `البريد: ${form.email || "غير مذكور"}\n` +
      `الرسالة: ${form.message}`
    );

    const whatsappNumber = marketCode === "EG" ? "201092879740" : "971556414279";
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");
  }

  return (
    <PageShell>
      <section className="contact-page">
        <div className="contact-hero">
          <span>نحن هنا لمساعدتك</span>
          <h1>تواصل معنا</h1>
          <p>
            تواصلي معنا للاستفسار عن المنتجات، المقاسات، الشحن أو حالة الطلب.
          </p>
        </div>

        <div className="contact-grid">
          <div className="contact-info-card">
            <h2>بيانات التواصل</h2>

            <a href="tel:+201092879740" className="contact-item">
              <Phone />
              <span>
                <b>مصر <img src="https://flagcdn.com/w40/eg.png" alt="مصر" className="flag-img" /></b>
                <small dir="ltr">+20 109 287 9740</small>
              </span>
            </a>

            <a href="tel:+971556414279" className="contact-item">
              <Phone />
              <span>
                <b>الإمارات ودول الخليج <img src="https://flagcdn.com/w40/ae.png" alt="الإمارات" className="flag-img" /></b>
                <small dir="ltr">+971 55 641 4279</small>
              </span>
            </a>

            <a href="mailto:zeinaalneel@gmail.com" className="contact-item">
              <Mail />
              <span>
                <b>البريد الإلكتروني</b>
                <small>zeinaalneel@gmail.com</small>
              </span>
            </a>

            <div className="contact-item">
              <MapPin />
              <span>
                <b>مناطق الشحن</b>
                <small>مصر، الإمارات وقطر</small>
              </span>
            </div>

            <div className="contact-item">
              <Clock3 />
              <span>
                <b>خدمة العملاء</b>
                <small>متاحة يوميًا لمتابعة الطلبات والاستفسارات</small>
              </span>
            </div>

            <div className="contact-buttons">
              <a
                href="https://wa.me/201092879740"
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle />
                WhatsApp مصر <img src="https://flagcdn.com/w40/eg.png" alt="مصر" className="flag-img" />
              </a>
              <a
                href="https://wa.me/971556414279"
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle />
                WhatsApp الإمارات <img src="https://flagcdn.com/w40/ae.png" alt="الإمارات" className="flag-img" />
              </a>
            </div>
          </div>

          <form className="contact-form-card" onSubmit={sendMessage}>
            <h2>أرسلي لنا رسالة</h2>

            <label>
              <span>الاسم</span>
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                required
              />
            </label>

            <label>
              <span>رقم الهاتف</span>
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                required
              />
            </label>

            <label>
              <span>البريد الإلكتروني</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
              />
            </label>

            <label>
              <span>الرسالة</span>
              <textarea
                name="message"
                rows="6"
                value={form.message}
                onChange={updateField}
                required
              />
            </label>

            <button type="submit">
              <Send />
              إرسال عبر WhatsApp
            </button>
          </form>
        </div>
      </section>
    </PageShell>
  );
}
