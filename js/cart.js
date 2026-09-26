/* ============================================
   NeoFragrances — cart.js (offer-pricing fix)
   Cart items still live in localStorage (same as
   before — real per-account carts remain a future
   phase). Product details come from PRODUCTS,
   populated after "productsReady" fires.

   FIX: cart lines now carry an optional offerId,
   and the cart cross-checks it against the same
   public /api/offers/active endpoint the Special
   Offers page already uses — so the price shown
   here matches what checkout/payment will validate
   server-side. The backend is still the ONLY
   authority on what actually gets charged; this is
   purely for a consistent, honest display before
   the customer pays.

   Because the same product can now be in the cart
   twice (once at regular price, once under an
   offer), cart lines are identified by the
   (productId, offerId) PAIR, not productId alone —
   addToCart/removeFromCart/updateQty all take an
   optional trailing offerId (defaults to null, so
   every existing call site with just a productId
   still works unchanged).

   All existing endpoints/behavior preserved:
   - /api/coupons/validate
   - /api/payments/initialize
   - localStorage cart persistence
   - existing addToCart/removeFromCart/updateQty API
     used by other pages (product-details.html, etc.)
   ============================================ */

const CART_KEY = "neofragrances_cart";
let APPLIED_COUPON = null;
let COUPON_LOADING = false;

// Active offers, keyed by offer id — used only to resolve display
// pricing for cart lines that were added under an offer. Refreshed
// whenever the cart page loads, so it reflects the current live state
// (an offer may have expired or been disabled since the item was added).
let ACTIVE_OFFERS_BY_ID = {};

async function loadActiveOffersForCart() {
  try {
    const res = await fetch(`${API_BASE}/api/offers/active`);
    if (!res.ok) return;
    const offers = await res.json();
    ACTIVE_OFFERS_BY_ID = {};
    offers.forEach(o => { ACTIVE_OFFERS_BY_ID[o.id] = o; });
  } catch (err) {
    console.error("Could not load active offers for cart pricing:", err);
  }
}

// Resolves what a cart line should show right now: sale price if its
// offerId still points at a currently-active offer for this product,
// otherwise the product's regular price. This mirrors (but does not
// replace) the server's own re-validation at checkout time.
function resolveCartItemPricing(item, product) {
  const offer = item.offerId ? ACTIVE_OFFERS_BY_ID[item.offerId] : null;
  if (offer && offer.product_id === product.id) {
    return { unitPrice: Number(offer.sale_price), originalPrice: Number(offer.original_price), offer };
  }
  return { unitPrice: product.price, originalPrice: null, offer: null };
}

async function applyCoupon() {
  const input = document.getElementById("coupon-input");
  const msg = document.getElementById("coupon-msg");
  const btn = document.getElementById("apply-coupon-btn");
  const code = input.value.trim();
  if (!code || COUPON_LOADING) return;

  COUPON_LOADING = true;
  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.textContent = "Applying...";
  msg.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Invalid coupon.");

    APPLIED_COUPON = data;
    msg.textContent = "";
    input.value = "";
    renderCartPage();
    if (typeof showToast === "function") showToast(`"${data.code}" applied`);
  } catch (err) {
    APPLIED_COUPON = null;
    msg.textContent = err.message;
    msg.style.color = "var(--wine)";
    renderPromoAppliedWrap();
  } finally {
    COUPON_LOADING = false;
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

function removeCoupon() {
  APPLIED_COUPON = null;
  const msg = document.getElementById("coupon-msg");
  if (msg) msg.textContent = "";
  renderCartPage();
}

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

function addToCart(productId, qty = 1, offerId = null) {
  const cart = getCart();
  const existing = cart.find(item => item.id === productId && (item.offerId || null) === (offerId || null));
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty, offerId: offerId || null });
  }
  saveCart(cart);
}

function removeFromCart(productId, offerId = null) {
  saveCart(getCart().filter(item => !(item.id === productId && (item.offerId || null) === (offerId || null))));
}

function updateQty(productId, qty, offerId = null) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId && (i.offerId || null) === (offerId || null));
  if (item) {
    item.qty = Math.max(1, qty);
    saveCart(cart);
  }
}

function updateCartCount() {
  const badges = document.querySelectorAll(".cart-count");
  if (!badges.length) return;
  const total = getCart().reduce((sum, item) => sum + item.qty, 0);
  badges.forEach(badge => {
    badge.textContent = total;
    badge.style.display = total > 0 ? "flex" : "none";
  });
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart");
  if (!btn || btn.disabled) return;
  const offerId = btn.dataset.offerId ? Number(btn.dataset.offerId) : null;
  addToCart(Number(btn.dataset.id), 1, offerId);
  btn.textContent = "Added ✓";
  setTimeout(() => (btn.textContent = "Add to Cart"), 1200);
  if (typeof showToast === "function") showToast("Added to cart");
});

/* ---------- Render an individual cart item card ---------- */
function cartItemCardHTML(p, item) {
  const atMax = item.qty >= (p.stockQty ?? 999);
  const atMin = item.qty <= 1;
  const { unitPrice, originalPrice, offer } = resolveCartItemPricing(item, p);
  const lineTotal = unitPrice * item.qty;

  // Reuses the exact same classes offers.js already renders with on the
  // Special Offers page (offer-price-row / offer-price-original /
  // offer-save-badge) — no new CSS needed, guaranteed same look.
  const priceBlock = offer
    ? `
      <div class="offer-price-row">
        <span class="offer-price-original">${money(originalPrice)}</span>
        <span class="offer-save-badge">SAVE ${offer.discount_percent}%</span>
      </div>
      <div class="product-price">${money(lineTotal)}</div>
    `
    : `<div class="product-price">${money(lineTotal)}</div>`;

  return `
  <div class="cart-item-card" data-id="${p.id}" data-offer-id="${item.offerId || ""}">
    <div class="cart-item-media">${productMedia(p.image, p.name)}</div>
    <div class="cart-item-info">
      <span class="product-brand">${p.brand}</span>
      <div class="product-name">${p.name}</div>
      ${priceBlock}
    </div>
    <div class="cart-item-qty">
      <div class="qty-control-v2">
        <button class="qty-minus" type="button" aria-label="Decrease quantity" ${atMin ? "disabled" : ""}>−</button>
        <span aria-live="polite">${item.qty}</span>
        <button class="qty-plus" type="button" aria-label="Increase quantity" ${atMax ? "disabled" : ""}>+</button>
      </div>
      ${atMax ? `<div class="qty-stock-note">Max available stock reached</div>` : ""}
    </div>
    <div class="cart-item-remove">
      <button class="remove-link-v2" type="button" aria-label="Remove ${p.name} from cart">
        <i class="fa-regular fa-trash-can"></i> Remove
      </button>
    </div>
  </div>`;
}

/* ---------- Render cart.html ---------- */
function renderCartPage() {
  const list = document.getElementById("cart-list");
  if (!list) return; // not on the cart page

  const cart = getCart();
  const stickyBar = document.getElementById("cart-sticky-bar");

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="cart-empty-state">
        <i class="fa-solid fa-bag-shopping"></i>
        <h3>Your Cart is Empty</h3>
        <p>Discover your next signature fragrance.</p>
        <a href="products.html" class="btn btn-primary">Continue Shopping</a>
      </div>`;
    renderSummary(0);
    if (stickyBar) stickyBar.style.display = "none";
    return;
  }

  list.innerHTML = cart.map(item => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if (!p) return "";
    return cartItemCardHTML(p, item);
  }).join("");

  const total = cart.reduce((sum, item) => {
    const p = PRODUCTS.find(pr => pr.id === item.id);
    if (!p) return sum;
    const { unitPrice } = resolveCartItemPricing(item, p);
    return sum + unitPrice * item.qty;
  }, 0);
  renderSummary(total);
  renderPromoAppliedWrap();

  list.querySelectorAll(".cart-item-card").forEach(row => {
    const id = Number(row.dataset.id);
    const offerId = row.dataset.offerId ? Number(row.dataset.offerId) : null;
    const product = PRODUCTS.find(pr => pr.id === id);

    row.querySelector(".qty-plus").addEventListener("click", () => {
      const item = getCart().find(i => i.id === id && (i.offerId || null) === (offerId || null));
      const max = product?.stockQty ?? 999;
      if (item.qty >= max) return;
      updateQty(id, item.qty + 1, offerId);
      renderCartPage();
    });
    row.querySelector(".qty-minus").addEventListener("click", () => {
      const item = getCart().find(i => i.id === id && (i.offerId || null) === (offerId || null));
      if (item.qty <= 1) return; // button is disabled at 1; guard anyway
      updateQty(id, item.qty - 1, offerId);
      renderCartPage();
    });
    row.querySelector(".remove-link-v2").addEventListener("click", () => {
      if (!confirm(`Remove ${product ? product.name : "this item"} from your cart?`)) return;
      removeFromCart(id, offerId);
      if (typeof showToast === "function") showToast("Item removed");
      renderCartPage();
    });
  });
}

function renderPromoAppliedWrap() {
  const wrap = document.getElementById("promo-applied-wrap");
  if (!wrap) return;
  if (!APPLIED_COUPON) {
    wrap.innerHTML = "";
    return;
  }
  wrap.innerHTML = `
    <div class="promo-applied-row">
      <span><i class="fa-solid fa-circle-check"></i>&nbsp; "${APPLIED_COUPON.code}" applied</span>
      <button type="button" id="remove-coupon-btn">Remove</button>
    </div>`;
  document.getElementById("remove-coupon-btn").addEventListener("click", removeCoupon);
}

function renderSummary(subtotal) {
  const subtotalEl = document.getElementById("summary-subtotal");
  const totalEl = document.getElementById("summary-total");
  if (!subtotalEl) return;
  const shipping = subtotal > 0 ? 8 : 0;

  let discount = 0;
  if (APPLIED_COUPON && subtotal > 0) {
    if (APPLIED_COUPON.discountPercent) {
      discount = subtotal * (Number(APPLIED_COUPON.discountPercent) / 100);
    } else if (APPLIED_COUPON.discountAmount) {
      discount = Number(APPLIED_COUPON.discountAmount);
    }
    discount = Math.min(discount, subtotal);
  }

  subtotalEl.textContent = money(subtotal);
  document.getElementById("summary-shipping").textContent = shipping ? money(shipping) : "—";

  const discountRow = document.getElementById("summary-discount-row");
  const discountLabel = document.getElementById("summary-discount-label");
  if (discountRow) {
    discountRow.style.display = discount > 0 ? "flex" : "none";
    document.getElementById("summary-discount").textContent = `-${money(discount)}`;
    if (discountLabel && APPLIED_COUPON) discountLabel.textContent = `Discount (${APPLIED_COUPON.code})`;
  }

  const finalTotal = subtotal + shipping - discount;
  totalEl.textContent = money(finalTotal);

  const savedEl = document.getElementById("summary-saved");
  if (savedEl) {
    if (discount > 0) {
      savedEl.style.display = "block";
      savedEl.textContent = `You saved ${money(discount)}`;
    } else {
      savedEl.style.display = "none";
    }
  }

  const stickyAmount = document.getElementById("sticky-total-amount");
  const stickyBar = document.getElementById("cart-sticky-bar");
  if (stickyAmount) stickyAmount.textContent = money(finalTotal);
  if (stickyBar) stickyBar.style.display = subtotal > 0 ? "" : "none";
}

async function handleCheckout() {
  if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
    if (confirm("You need to be logged in to check out. Go to the login page now?")) {
      window.location.href = "login.html?redirect=cart.html";
    }
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    if (typeof showToast === "function") showToast("Your cart is empty.", "error");
    return;
  }

  if (typeof SELECTED_ADDRESS_ID !== "undefined" && !SELECTED_ADDRESS_ID) {
    if (typeof showToast === "function") showToast("Please add or select a shipping address first.", "error");
    return;
  }

  const btns = [document.getElementById("checkout-btn"), document.getElementById("sticky-checkout-btn")].filter(Boolean);
  btns.forEach(b => { b.disabled = true; b.dataset.originalText = b.innerHTML; b.innerHTML = "Redirecting to payment..."; });

  try {
    const auth = getAuth();
    const res = await fetch(`${API_BASE}/api/payments/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        items: cart.map(i => ({ productId: i.id, qty: i.qty, offerId: i.offerId || null })),
        addressId: typeof SELECTED_ADDRESS_ID !== "undefined" ? SELECTED_ADDRESS_ID : null,
        couponId: APPLIED_COUPON ? APPLIED_COUPON.id : null,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.priceChanged) {
        // A special offer expired/changed since it was added — refresh
        // pricing and let the customer see the corrected total before
        // trying again, rather than silently charging something else.
        if (typeof showToast === "function") showToast(data.error, "error");
        await loadActiveOffersForCart();
        renderCartPage();
        btns.forEach(b => { b.disabled = false; b.innerHTML = b.dataset.originalText; });
        return;
      }
      throw new Error(data.error || "Could not start payment.");
    }

    window.location.href = data.authorizationUrl;
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message, "error");
    btns.forEach(b => { b.disabled = false; b.innerHTML = b.dataset.originalText; });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("cart-list")) {
    document.getElementById("cart-list").innerHTML =
      `<p style="color:var(--ink-soft); padding:40px 0;">Loading your cart...</p>`;
  }
  document.getElementById("checkout-btn")?.addEventListener("click", handleCheckout);
  document.getElementById("sticky-checkout-btn")?.addEventListener("click", handleCheckout);
  document.getElementById("apply-coupon-btn")?.addEventListener("click", applyCoupon);
  document.getElementById("coupon-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); applyCoupon(); }
  });
});

document.addEventListener("productsReady", async (e) => {
  if (!document.getElementById("cart-list")) return;
  if (!e.detail.success) {
    document.getElementById("cart-list").innerHTML =
      `<p style="color:var(--wine); padding:40px 0;">We're having trouble loading your cart right now — please try refreshing in a moment.</p>`;
    return;
  }
  await loadActiveOffersForCart();
  renderCartPage();
});
