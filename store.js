// Use Netlify function URL in production, local server for development
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:4242"
  : "/.netlify/functions/create-checkout-session";

const cart = new Map();

const cartItemsEl = document.querySelector(".cart-items");
const cartEmptyEl = document.querySelector(".cart-empty");
const cartTotalEl = document.querySelector(".cart-total");
const checkoutButton = document.querySelector(".checkout-button");

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount
  );

const renderCart = () => {
  cartItemsEl.innerHTML = "";

  if (cart.size === 0) {
    cartEmptyEl.style.display = "block";
    cartTotalEl.textContent = "$0.00";
    checkoutButton.disabled = true;
    return;
  }

  cartEmptyEl.style.display = "none";
  let total = 0;

  for (const item of cart.values()) {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;

    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <div class="cart-item-details">
        <span class="cart-item-name">${item.name}</span>
        <span class="cart-item-price">${formatCurrency(item.price)}</span>
      </div>
      <div class="cart-item-actions">
        <button class="qty-btn" data-action="decrease" data-price-id="${item.priceId}">-</button>
        <span class="cart-item-qty">${item.quantity}</span>
        <button class="qty-btn" data-action="increase" data-price-id="${item.priceId}">+</button>
        <button class="remove-btn" data-action="remove" data-price-id="${item.priceId}">Remove</button>
      </div>
    `;
    cartItemsEl.appendChild(li);
  }

  cartTotalEl.textContent = formatCurrency(total);
  checkoutButton.disabled = false;
};

const addToCart = (button) => {
  const name = button.dataset.name;
  const price = Number.parseFloat(button.dataset.price);
  const priceId = button.dataset.priceId;

  if (!priceId) {
    alert("Missing Stripe price ID for this product.");
    return;
  }

  const existing = cart.get(priceId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.set(priceId, { name, price, priceId, quantity: 1 });
  }

  renderCart();
};

document.querySelectorAll(".add-to-cart").forEach((button) => {
  button.addEventListener("click", () => addToCart(button));
});

cartItemsEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const action = target.dataset.action;
  const priceId = target.dataset.priceId;
  const item = cart.get(priceId);
  if (!item) return;

  if (action === "increase") {
    item.quantity += 1;
  } else if (action === "decrease") {
    item.quantity -= 1;
    if (item.quantity <= 0) {
      cart.delete(priceId);
    }
  } else if (action === "remove") {
    cart.delete(priceId);
  }

  renderCart();
});

checkoutButton.addEventListener("click", async () => {
  if (cart.size === 0) return;

  checkoutButton.disabled = true;
  checkoutButton.textContent = "Starting checkout...";

  try {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: Array.from(cart.values()).map((item) => ({
          priceId: item.priceId,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Unable to create checkout session.");
    }

    window.location.href = data.url;
  } catch (error) {
    alert(error.message);
    checkoutButton.disabled = false;
    checkoutButton.textContent = "Checkout";
  }
});

renderCart();
