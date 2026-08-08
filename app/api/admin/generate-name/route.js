import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { image, prompt } = await req.json();
    const apiToken = process.env.REPLICATE_API_TOKEN;

    if (!image) {
      return NextResponse.json({ success: false, message: 'Image is missing' }, { status: 400 });
    }

    // إذا لم يتوفر مفتاح API، نستخدم المنطق الافتراضي
    if (!apiToken) {
      console.warn("REPLICATE_API_TOKEN is missing. Returning simulation name.");
      const fallbackNames = [
        "توب حرير مطرز بلمسة ملكية",
        "دراعة استقبال فاخرة بتصميم عصري",
        "طقم عطور التراث السوداني الأصيل",
        "توب مشجر ألوان زاهية للمناسبات",
        "دراعة خليجية مطرزة يدوياً"
      ];
      let suggestedName = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
      if (image.includes('tiyab') || image.includes('top')) suggestedName = "توب سوداني فاخر - تصميم حصري";

      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json({ success: true, name: suggestedName });
    }

    const geminiKey = process.env.GEMINI_API_KEY || apiToken;

    if (geminiKey && geminiKey.startsWith('AQ')) {
      // استخدام Gemini للسرعة الفائقة في جلب الاسم
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "Identify this Sudanese product from the image and give me a 3-5 word elegant Arabic title for a luxury brand 'Zeenat Al-Nile'. Output ONLY the Arabic title." },
                { inline_data: { mime_type: "image/jpeg", data: await fetch(image).then(r => r.arrayBuffer()).then(b => Buffer.from(b).toString('base64')) } }
              ]
            }]
          })
        });
        const data = await response.json();
        const name = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (name) return NextResponse.json({ success: true, name: name.trim().replace(/["']/g, "") });
      } catch (e) { console.error("Gemini Name Error", e); }
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Replicate API Error:", errorData);
      return NextResponse.json({ success: false, message: "Invalid API Token or Replicate Error" });
    }

    const prediction = await response.json();
    let result = prediction;

    // Polling للنتيجة مع حد أقصى للمحاولات (30 ثانية كحد أقصى)
    let attempts = 0;
    const maxAttempts = 15; // 15 * 2s = 30s

    while (result.status !== "succeeded" && result.status !== "failed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const checkRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${apiToken}` }
      });
      result = await checkRes.json();
      attempts++;
    }

    if (result.status === "succeeded") {
      // تنظيف النص الناتج وإزالة الاقتباسات
      let name = result.output.join("").replace(/["'“”]/g, "").trim();
      // إزالة أي كلمات زائدة مثل "اسم المنتج:" أو "Product Name:"
      name = name.replace(/^(اسم المنتج:|المنتج:|Product Name:|Title:)\s*/i, "");

      return NextResponse.json({ success: true, name: name });
    } else {
      // Fallback في حال الفشل أو التوقف
      console.warn("AI Name generation timed out or failed, status:", result.status);
      return NextResponse.json({ success: false, message: "AI generation timed out" });
    }

  } catch (error) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
