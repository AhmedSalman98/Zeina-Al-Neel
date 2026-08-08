import PageShell from "../../components/PageShell";
import Link from "next/link";
import {
  Sparkles, Gem, HeartHandshake, Scissors,
  ShoppingBag, CalendarDays, Target, Eye, Flag
} from "lucide-react";

export const metadata = {
  title: "من نحن | زينة النيل",
  description: "أناقة سودانية بروح النيل.. ولمسة عصر تتجدد"
};

export default function AboutPage() {
  return (
    <PageShell>
      <section className="about-page">
        <div className="about-hero">
          <span>قصتنا</span>
          <h1>من نحن</h1>
          <p>
            بدأت زينة النيل رحلتها لتقديم أزياء وإكسسوارات تجمع بين أصالة النيل ولمسة العصر المتجددة، لتعبر عن الهوية السودانية برؤية عالمية.
          </p>
        </div>

        <div className="about-story">
          <div className="about-story-card">
            <CalendarDays />
            <h2>أناقة تتجدد</h2>
            <p>
              نعمل بشغف على اختيار وتصميم منتجات أنيقة تناسب المرأة التي تبحث عن التميز، مع اهتمام بالتفاصيل وجودة الخامات.
            </p>
          </div>

          <div className="about-story-card">
            <Scissors />
            <h2>تصاميم مختارة بعناية</h2>
            <p>
              نقدم تصاميم فاشن متنوعة تشمل الدراعات، التياب، العبايات،
              ملابس المحجبات، الفساتين، الكاجوال والطرح.
            </p>
          </div>

          <div className="about-story-card">
            <Gem />
            <h2>إكسسوارات متكاملة</h2>
            <p>
              نوفر تشكيلة من الإكسسوارات، الشنط والأحذية التي تكمل
              الإطلالة وتناسب مختلف الأذواق والمناسبات.
            </p>
          </div>
        </div>


        <section className="mission-vision-goals">
          <article>
            <div className="mvg-icon"><Target /></div>
            <span>رسالتنا</span>
            <h2>تقديم أناقة موثوقة تصل لكل عميلة</h2>
            <p>
              رسالتنا هي توفير فاشن وإكسسوارات مختارة بعناية، تجمع بين
              الجودة والجمال والهوية السودانية، مع تجربة شراء سهلة وخدمة
              واضحة من اختيار المنتج وحتى استلام الطلب.
            </p>
          </article>

          <article>
            <div className="mvg-icon"><Eye /></div>
            <span>رؤيتنا</span>
            <h2>أن نصبح وجهة رائدة للأناقة السودانية</h2>
            <p>
              نطمح إلى أن تكون زينة النيل علامة موثوقة ومعروفة في مصر
              ودول الخليج، وأن نقدم التراث السوداني بصورة عصرية
              تناسب مختلف الأعمار والأذواق.
            </p>
          </article>

          <article>
            <div className="mvg-icon"><Flag /></div>
            <span>أهدافنا</span>
            <h2>جودة، تنوع وانتشار مستمر</h2>
            <p>
              نهدف إلى توسيع تشكيلاتنا، تحسين تجربة التسوق، دعم التصاميم
              السودانية، تطوير خدمات الشحن، والوصول إلى عدد أكبر من
              العملاء مع الحفاظ على الجودة والثقة.
            </p>
          </article>
        </section>

        <div className="about-content">
          <div>
            <span>رؤيتنا</span>
            <h2>أناقة تحافظ على الهوية</h2>
            <p>
              نؤمن أن الموضة ليست مجرد ملابس، بل تعبير عن الشخصية والثقافة.
              لذلك نحرص على تقديم منتجات تجمع بين التراث السوداني،
              التصميم الأنيق وسهولة الاستخدام اليومي.
            </p>
          </div>

          <div className="about-values">
            <div><Sparkles /><span><b>تصميم مميز</b><small>اختيارات عصرية بروح سودانية</small></span></div>
            <div><HeartHandshake /><span><b>خدمة موثوقة</b><small>متابعة ودعم قبل وبعد الطلب</small></span></div>
            <div><ShoppingBag /><span><b>تشكيلة متنوعة</b><small>فاشن، إكسسوارات، شنط وأحذية</small></span></div>
          </div>
        </div>

        <div className="about-cta">
          <h2>اكتشفي تشكيلات زينة النيل</h2>
          <p>تسوقي الآن من مصر، الإمارات وقطر.</p>
          <Link href="/products">تصفّح جميع المنتجات</Link>
        </div>
      </section>
    </PageShell>
  );
}
