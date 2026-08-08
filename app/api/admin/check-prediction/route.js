import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { predictionId } = await req.json();
    const apiToken = process.env.REPLICATE_API_TOKEN;

    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { 'Authorization': `Token ${apiToken}` }
    });

    const result = await response.json();

    if (result.status === "succeeded") {
      return NextResponse.json({
        success: true,
        status: "succeeded",
        transformedUrl: result.output[0]
      });
    }

    return NextResponse.json({
      success: true,
      status: result.status // starting, processing, etc.
    });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
