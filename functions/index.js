const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const Stripe = require("stripe");

const stripeSecretKey = functions.config().stripe.secret_key;
if (!stripeSecretKey) {
  throw new Error("Missing stripe.secret_key in Firebase config.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Cart is empty." });
      }

      const allowedPriceIds = (functions.config().stripe.allowed_price_ids || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (
        allowedPriceIds.length &&
        items.some((item) => !allowedPriceIds.includes(item.priceId))
      ) {
        return res.status(400).json({ error: "Invalid price ID in cart." });
      }

      const clientUrl = functions.config().stripe.client_url || "http://localhost:5500";
      const shippingRateId = functions.config().stripe.shipping_rate_id;

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

      return res.json({ url: session.url });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
});
