import Link from "next/link";
import PageShell from "../components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <section className="not-found-page">
        <h1>404</h1>
        <h2>عذرًا، الصفحة غير موجودة</h2>
        <p>يبدو أن الرابط الذي تحاول الوصول إليه غير متاح حاليًا أو تم نقله.</p>
        <Link href="/">العودة للرئيسية</Link>
      </section>
    </PageShell>
  );
}
