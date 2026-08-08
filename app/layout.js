import "./globals.css";
import Providers from "../components/Providers";

export const metadata = {
  title: "زينة النيل | التوب والإكسسوارات السودانية",
  description: "متجر زينة النيل للشحن داخل مصر والإمارات وقطر"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
