import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { image, productName } = await req.json();
    // نفضل استخدام مفتاح Gemini للسرعة والدقة في النصوص
    const geminiKey = process.env.GEMINI_API_KEY || process.env.REPLICATE_API_TOKEN;

    if (!image) {
      return NextResponse.json({ success: false, message: 'الصورة مفقودة' }, { status: 400 });
    }

    // إذا كان المفتاح هو مفتاح Gemini (يبدأ بـ AQ)
    if (geminiKey && geminiKey.startsWith('AQ')) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Analyze this product image for a luxury Sudanese brand 'Zeenat Al-Nile' (زينة النيل). Product: ${productName || ''}. Write a poetic, high-end Arabic description (3-4 sentences) focusing on elegance, heritage, and quality. Output ONLY the Arabic text.` },
              { inline_data: { mime_type: "image/jpeg", data: await fetch(image).then(r => r.arrayBuffer()).then(b => Buffer.from(b).toString('base64')) } }
            ]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return NextResponse.json({ success: true, description: data.candidates[0].content.parts[0].text.trim() });
      }
    }

    // Fallback to Replicate if Gemini fails or not configured
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        version: "e2717fed0a451b448002f9d57a63c607f4a1a68ca51030e400c9695ea41893c0",
        input: { image, prompt: `Write a high-end Arabic product description for this luxury Sudanese garment from 'Zeenat Al-Nile'. Poetic and professional.` }
      }),
    });

    const prediction = await response.json();
    let result = prediction;
    let attempts = 0;
    while (result.status !== "succeeded" && result.status !== "failed" && attempts < 15) {
      await new Promise(r => setTimeout(r, 2000));
      const c = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, { headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` } });
      result = await c.json();
      attempts++;
    }

    if (result.status === "succeeded") {
      return NextResponse.json({ success: true, description: result.output.join("").trim() });
    }

    throw new Error("فشل توليد الوصف من محركات الذكاء الاصطناعي");

  } catch (error) {
    console.error("AI Desc Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
