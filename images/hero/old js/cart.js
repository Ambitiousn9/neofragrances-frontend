/* ============================================
   NeoFragrances — cart.js
   Uses localStorage for now so the cart survives
   page navigation across this static site.
   In Phase 4, replace getCart()/saveCart() with real
   API calls to the backend + database.
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

/* Wire up "Add to Cart" buttons on any page that renders product cards */
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

document.addEventListener("DOMContentLoaded", renderCartPage);
