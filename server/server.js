import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import Stripe from "stripe";

dotenv.config();

const app = express();
const port = process.env.PORT || 4242;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5500";
const clientUrls = (
  process.env.CLIENT_URLS ||
  process.env.CLIENT_URL ||
  "http://localhost:5500"
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const allowedPriceIds = (process.env.ALLOWED_PRICE_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const shippingRateId = process.env.SHIPPING_RATE_ID;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      if (clientUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error(`CORS blocked for origin: ${origin}. Allowed: ${clientUrls.join(", ")}`)
      );
    },
  })
);
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    if (
      allowedPriceIds.length &&
      items.some((item) => !allowedPriceIds.includes(item.priceId))
    ) {
      return res.status(400).json({ error: "Invalid price ID in cart." });
    }

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

app.listen(port, () => {
  console.log(`Stripe server listening on port ${port}`);
});
