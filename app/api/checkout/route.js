import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe Secret Key is missing in .env.local' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { items, orderId, customerEmail } = await req.json();

    // تجهيز المنتجات لـ Stripe
    const line_items = items.map((item) => ({
      price_data: {
        currency: 'aed', // أو عملة متجرك الأساسية
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100), // Stripe يحسب بالهللة/السنت
      },
      quantity: item.quantity,
    }));

    // إنشاء جلسة الدفع
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${req.headers.get('origin')}/checkout`,
      customer_email: customerEmail,
      metadata: {
        order_id: orderId
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
