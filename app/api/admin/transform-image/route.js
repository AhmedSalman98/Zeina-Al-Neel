import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { imageUrl } = await req.json();
    const apiToken = process.env.REPLICATE_API_TOKEN;

    if (!apiToken) {
      console.warn("REPLICATE_API_TOKEN is missing. Returning simulation mode.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({
        success: true,
        transformedUrl: imageUrl, // Fallback to original
        isSimulation: true
      });
    }

    // البرومبت الخاص بك مترجم للإنجليزية لأفضل نتائج مع محركات الذكاء الاصطناعي العالمية
    const aiPrompt = `Luxury studio fashion photography of the garment from the input image.
    DISPLAY: Put the exact clothing on a highly reflective, polished metallic gold mannequin with elegant posture.
    BACKGROUND: Set in a high-end luxury boutique with a back wall made of expensive Italian white Calacatta marble with delicate gold veins.
    FLOOR: Reflective polished white marble floor with soft reflections.
    LIGHTING: Professional studio lighting, warm golden hour glow, cinematic shadows, 8k resolution, hyper-realistic, fashion magazine quality.
    PRESERVE: Keep the original colors and patterns of the clothing exactly as they are in the source image.`;

    // استخدام Replicate API
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Model: stability-ai/sdxl
        version: "39ed52f2a78e934b3ba6e2a89f5b1d712de74ca53d70bb2f9503f7a0834d4023",
        input: {
          image: imageUrl,
          prompt: aiPrompt,
          negative_prompt: "deformed, blurry, low quality, changed clothing color, changed clothing pattern, human face, human skin",
          prompt_strength: 0.65,
          num_inference_steps: 50,
          guidance_scale: 7.5
        }
      }),
    });

    const prediction = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: prediction.detail || "API Token is invalid or expired"
      }, { status: response.status });
    }

    // نعود فوراً للمتصفح ببيانات التنبؤ (Prediction ID) ليقوم هو بالمتابعة
    // هذا يمنع الـ Timeout في السيرفر
    return NextResponse.json({
      success: true,
      predictionId: prediction.id,
      status: prediction.status
    });

  } catch (error) {
    console.error("Image Transform Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
