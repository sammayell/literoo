import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import Stripe from "stripe";

function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil" as any,
}); }

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id ||
        (session.subscription
          ? ((await getStripe().subscriptions.retrieve(session.subscription as string)).metadata?.supabase_user_id)
          : null);

      if (userId && session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(session.subscription as string);
        await supabase.from("parents").update({
          subscription_status: "active",
          subscription_id: subscription.id,
          stripe_customer_id: session.customer as string,
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          refund_guarantee_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq("id", userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      if (userId) {
        await supabase.from("parents").update({
          subscription_status: subscription.status === "active" ? "active" : subscription.status,
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        }).eq("id", userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      if (userId) {
        await supabase.from("parents").update({
          subscription_status: "canceled",
          subscription_id: null,
          current_period_end: null,
        }).eq("id", userId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as any;
      if (invoice.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(invoice.subscription as string);
        const userId = subscription.metadata?.supabase_user_id;
        if (userId) {
          await supabase.from("parents").update({
            subscription_status: "past_due",
          }).eq("id", userId);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
