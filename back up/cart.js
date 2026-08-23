/* ============================================
   NeoFragrances — cart.js (Phase 4)
   Cart items still live in localStorage for now
   (real per-account carts come once Login/Register
   connect to the database). Product details for
   items in the cart now come from PRODUCTS, which
   is only ready after "productsReady" fires.
   ============================================ */

const CART_KEY = "neofragrances_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  saveCart(cart);
}

function removeFromCart(productId) {
  saveCart(getCart().filter(item => item.id !== productId));
}

function updateQty(productId, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

function updateCartCount() {
  const badge = document.querySelector(".cart-count");
  if (!badge) return;
  const total = getCart().reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? "flex" : "none";
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if (!btn || btn.disabled) return;
  addToCart(Number(btn.dataset.id));
  btn.textContent = "Added ✓";
  setTimeout(() => (btn.textContent = "Add to Cart"), 1200);
});

/* ---------- Render cart.html ---------- */
function renderCartPage() {
  const list = document.getElementById("cart-list");
  if (!list) return; // not on the cart page

  const cart = getCart();
  if (cart.length === 0) {
    list.innerHTML = `<p style="color:var(--ink-soft); padding:40px 0;">Your cart is empty. <a href="products.html" style="color:var(--wine); font-weight:600;">Browse fragrances</a></p>`;
    renderSummary(0);
    return;
  }

  list.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if (!p) return "";
    return `
    <div class="cart-item" data-id="${p.id}">
      <div class="cart-item-media">${productMedia(p.image, p.name)}</div>
      <div>
        <div class="product-brand">${p.brand}</div>
        <div class="product-name" style="font-size:16px;">${p.name}</div>
      </div>
      <div class="qty-control">
        <button class="qty-minus">−</button>
        <span>${item.qty}</span>
        <button class="qty-plus">+</button>
      </div>
      <div class="product-price">$${(p.price * item.qty).toFixed(2)}</div>
      <button class="remove-link">Remove</button>
    </div>`;
  }).join("");

  const total = cart.reduce((sum, item) => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
  renderSummary(total);

  list.querySelectorAll(".cart-item").forEach(row => {
    const id = Number(row.dataset.id);
    row.querySelector(".qty-plus").addEventListener("click", () => {
      const item = getCart().find(i => i.id === id);
      updateQty(id, item.qty + 1);
      renderCartPage();
    });
    row.querySelector(".qty-minus").addEventListener("click", () => {
      const item = getCart().find(i => i.id === id);
      if (item.qty <= 1) { removeFromCart(id); } else { updateQty(id, item.qty - 1); }
      renderCartPage();
    });
    row.querySelector(".remove-link").addEventListener("click", () => {
      removeFromCart(id);
      renderCartPage();
    });
  });
}

function renderSummary(subtotal) {
  const subtotalEl = document.getElementById("summary-subtotal");
  const totalEl = document.getElementById("summary-total");
  if (!subtotalEl) return;
  const shipping = subtotal > 0 ? 8 : 0;
  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("summary-shipping").textContent = shipping ? `$${shipping.toFixed(2)}` : "—";
  totalEl.textContent = `$${(subtotal + shipping).toFixed(2)}`;
}

async function handleCheckout() {
  if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
    if (confirm("You need to be logged in to check out. Go to the login page now?")) {
      window.location.href = "login.html";
    }
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const btn = document.getElementById("checkout-btn");
  btn.disabled = true;
  btn.textContent = "Placing order...";

  try {
    const auth = getAuth();
    const res = await fetch(`${API_BASE}/api/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ items: cart.map(i => ({ productId: i.id, qty: i.qty })) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Checkout failed.");

    localStorage.removeItem(CART_KEY);
    updateCartCount();

    document.getElementById("cart-list").innerHTML = `
      <div style="text-align:center; padding:60px 20px;">
        <i class="fa-solid fa-circle-check" style="font-size:40px; color:#22733B; margin-bottom:16px;"></i>
        <h3>Order placed!</h3>
        <p style="color:var(--ink-soft); margin-top:8px;">Order #${data.orderId} — total $${Number(data.total).toFixed(2)}</p>
        <a href="products.html" class="btn btn-primary" style="margin-top:20px;">Continue Shopping</a>
      </div>`;
    renderSummary(0);
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = "Checkout";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("cart-list")) {
    document.getElementById("cart-list").innerHTML =
      `<p style="color:var(--ink-soft); padding:40px 0;">Loading your cart...</p>`;
  }
  document.getElementById("checkout-btn")?.addEventListener("click", handleCheckout);
});

document.addEventListener("productsReady", (e) => {
  if (!document.getElementById("cart-list")) return;
  if (!e.detail.success) {
    document.getElementById("cart-list").innerHTML =
      `<p style="color:var(--wine); padding:40px 0;">Couldn't load your cart — make sure the backend server (node server.js) is running.</p>`;
    return;
  }
  renderCartPage();
});
