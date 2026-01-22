const Stripe = require("stripe");

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const { items } = JSON.parse(event.body);
    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Cart is empty." }),
      };
    }

    const allowedPriceIds = (process.env.ALLOWED_PRICE_IDS || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (
      allowedPriceIds.length &&
      items.some((item) => !allowedPriceIds.includes(item.priceId))
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid price ID in cart." }),
      };
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5500";
    const shippingRateId = process.env.SHIPPING_RATE_ID;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => ({
        price: item.priceId,
        quantity: item.quantity,
      })),
      success_url: `${clientUrl}/store.html?success=true`,
      cancel_url: `${clientUrl}/store.html?canceled=true`,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      shipping_options: shippingRateId ? [{ shipping_rate: shippingRateId }] : undefined,
      automatic_tax: { enabled: true },
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
