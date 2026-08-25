/* ============================================
   NeoFragrances — my-orders.js (redesigned)
   Renders a logged-in customer's own order history
   on my-orders.html.

   Unchanged: authentication (isLoggedIn/getAuth),
   the /api/my-orders endpoint and its response
   shape, and the cart's addToCart/saveCart from
   cart.js used by "Buy Again".

   NOTE ON DATA: /api/my-orders items only return
   { name, quantity, price_at_purchase } — there is
   no product id or image on the order item itself.
   So thumbnails and "Buy Again" match each item to
   the live PRODUCTS catalog (loaded by main.js) by
   product name, and fall back to the existing
   bottle-silhouette placeholder when no match is
   found (e.g. a discontinued product).
   ============================================ */

let ALL_ORDERS = null;
let CURRENT_FILTER = "all";
let CURRENT_SEARCH = "";

const ORDER_STEP_LABELS = ["Ordered", "Processing", "Shipped", "Delivered"];

function statusStepIndex(status) {
  switch (status) {
    case "pending": return 0;
    case "processing": return 1;
    case "shipped": return 2;
    case "delivered": return 3;
    default: return -1; // cancelled / unknown
  }
}

function formatOrderDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function findProductByName(name) {
  if (!Array.isArray(PRODUCTS)) return null;
  const target = (name || "").trim().toLowerCase();
  return PRODUCTS.find(p => p.name.trim().toLowerCase() === target) || null;
}

function orderItemMedia(item) {
  const product = findProductByName(item.name);
  if (product && product.image && typeof productMedia === "function") {
    return productMedia(product.image, item.name);
  }
  return typeof bottleSVG === "function" ? bottleSVG() : "";
}

/* ---------- Progress tracker ---------- */
function buildProgressTrack(order) {
  const status = order.status.toLowerCase();

  if (status === "cancelled") {
    return `<div class="order-cancelled-banner"><i class="fa-solid fa-circle-xmark"></i> This order was cancelled</div>`;
  }

  const currentIdx = statusStepIndex(status);
  const isDelivered = status === "delivered";
  const orderDate = formatOrderDate(order.created_at);

  const stepBlocks = ORDER_STEP_LABELS.map((label, i) => {
    let stateClass = "upcoming";
    if (isDelivered) stateClass = "complete-success";
    else if (i < currentIdx) stateClass = "complete";
    else if (i === currentIdx) stateClass = "current";

    const showCheck = stateClass === "complete" || stateClass === "complete-success";
    return `
      <div class="progress-step ${stateClass}">
        <div class="step-dot">${showCheck ? '<i class="fa-solid fa-check"></i>' : ""}</div>
        <span class="step-label">${label}</span>
        ${i === 0 ? `<span class="step-date">${orderDate}</span>` : ""}
      </div>`;
  });

  let html = '<div class="order-progress-track">';
  stepBlocks.forEach((stepHtml, i) => {
    html += stepHtml;
    if (i < stepBlocks.length - 1) {
      const connectorState = isDelivered ? "complete-success" : (i < currentIdx ? "complete" : "upcoming");
      html += `<div class="progress-connector ${connectorState}"></div>`;
    }
  });
  html += "</div>";
  return html;
}

/* ---------- Order card ---------- */
function renderOrderCard(o) {
  const status = o.status.toLowerCase();
  const itemCount = o.items.length;
  const canTrack = ["pending", "processing", "shipped"].includes(status);
  const canBuyAgain = status === "delivered";

  return `
    <article class="order-card" data-order-id="${o.id}">
      <div class="order-card-top">
        <div class="order-card-id-wrap">
          <div class="order-card-icon"><i class="fa-solid fa-bag-shopping"></i></div>
          <div>
            <h3 class="order-card-id">Order #${o.id}</h3>
            <div class="order-card-meta">
              <i class="fa-regular fa-calendar"></i> ${formatOrderDate(o.created_at)}
              &nbsp;&middot;&nbsp; ${itemCount} item${itemCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div class="order-card-status-wrap">
          <span class="badge-status order-status-badge badge-${status}">${o.status}</span>
          <div class="order-card-total">$${Number(o.total).toFixed(2)}</div>
        </div>
      </div>

      ${buildProgressTrack(o)}

      <div class="order-items-list">
        ${o.items.map(item => `
          <div class="order-item-row">
            <div class="order-item-media">${orderItemMedia(item)}</div>
            <div class="order-item-info">
              <div class="order-item-name">${item.name}</div>
              <div class="order-item-qty">&times; ${item.quantity}</div>
            </div>
            <div class="order-item-price">$${(item.price_at_purchase * item.quantity).toFixed(2)}</div>
          </div>
        `).join("")}
      </div>

      <div class="order-card-actions">
        <button class="btn btn-outline btn-sm order-view-details-btn" type="button" data-order-id="${o.id}">
          <i class="fa-regular fa-eye"></i>&nbsp; View Details
        </button>
        ${canTrack ? `
          <a href="track-order.html?order=${o.id}" class="btn btn-outline btn-sm">
            <i class="fa-solid fa-truck-fast"></i>&nbsp; Track Order
          </a>` : ""}
        ${canBuyAgain ? `
          <button class="btn btn-primary btn-sm order-buy-again-btn" type="button" data-order-id="${o.id}">
            <i class="fa-solid fa-bag-shopping"></i>&nbsp; Buy Again
          </button>` : ""}
      </div>
    </article>
  `;
}

/* ---------- Empty states ---------- */
function noOrdersHTML() {
  return `
    <div class="orders-empty-state">
      <i class="fa-solid fa-receipt"></i>
      <h3>You haven't placed any orders yet</h3>
      <p>Discover your next signature fragrance and start your collection.</p>
      <a href="products.html" class="btn btn-primary">Start Shopping</a>
    </div>`;
}

function noResultsHTML() {
  return `
    <div class="orders-empty-state orders-empty-state-sm">
      <i class="fa-solid fa-magnifying-glass"></i>
      <h3>No orders match your search</h3>
      <p>Try a different order number, product name, or filter.</p>
      <button class="btn btn-outline" id="clear-orders-filter-btn" type="button">Clear Filters</button>
    </div>`;
}

/* ---------- Render / filter pipeline ---------- */
function applyFiltersAndRender() {
  const wrap = document.getElementById("orders-wrap");
  if (!wrap || ALL_ORDERS === null) return;

  if (ALL_ORDERS.length === 0) {
    wrap.innerHTML = noOrdersHTML();
    return;
  }

  let filtered = ALL_ORDERS;
  if (CURRENT_FILTER !== "all") {
    filtered = filtered.filter(o => o.status.toLowerCase() === CURRENT_FILTER);
  }
  if (CURRENT_SEARCH.trim()) {
    const q = CURRENT_SEARCH.trim().toLowerCase();
    filtered = filtered.filter(o =>
      String(o.id).includes(q) ||
      o.items.some(item => item.name.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    wrap.innerHTML = noResultsHTML();
    document.getElementById("clear-orders-filter-btn")?.addEventListener("click", resetOrderFilters);
    return;
  }

  wrap.innerHTML = filtered.map(renderOrderCard).join("");
  attachOrderCardListeners();
}

function resetOrderFilters() {
  CURRENT_FILTER = "all";
  CURRENT_SEARCH = "";
  const searchInput = document.getElementById("order-search-input");
  if (searchInput) searchInput.value = "";
  document.querySelectorAll(".order-filter-chip").forEach(c => c.classList.toggle("active", c.dataset.status === "all"));
  applyFiltersAndRender();
}

function attachOrderCardListeners() {
  document.querySelectorAll(".order-view-details-btn").forEach(btn => {
    btn.addEventListener("click", () => openOrderDetailsModal(Number(btn.dataset.orderId)));
  });
  document.querySelectorAll(".order-buy-again-btn").forEach(btn => {
    btn.addEventListener("click", () => buyAgainOrder(Number(btn.dataset.orderId)));
  });
}

/* ---------- Buy Again ---------- */
function buyAgainOrder(orderId) {
  const order = ALL_ORDERS?.find(o => o.id === orderId);
  if (!order) return;

  let addedCount = 0;
  let unavailable = [];

  order.items.forEach(item => {
    const product = findProductByName(item.name);
    if (product && product.stock) {
      addToCart(product.id, item.quantity);
      addedCount++;
    } else {
      unavailable.push(item.name);
    }
  });

  if (typeof showToast !== "function") return;

  if (addedCount > 0 && unavailable.length === 0) {
    showToast("Items added to your cart");
  } else if (addedCount > 0) {
    showToast(`Added ${addedCount} item${addedCount !== 1 ? "s" : ""} — some are currently unavailable`);
  } else {
    showToast("These items are currently unavailable", "error");
  }
}

/* ---------- View Details modal ---------- */
function openOrderDetailsModal(orderId) {
  const order = ALL_ORDERS?.find(o => o.id === orderId);
  const overlay = document.getElementById("order-details-overlay");
  const content = document.getElementById("order-details-modal-content");
  if (!order || !overlay || !content) return;

  const status = order.status.toLowerCase();

  content.innerHTML = `
    <button class="modal-close" id="order-details-close-btn" type="button" aria-label="Close">
      <i class="fa-solid fa-xmark"></i>
    </button>
    <h3>Order #${order.id}</h3>
    <div class="order-modal-meta">
      <span class="badge-status order-status-badge badge-${status}">${order.status}</span>
      <span class="order-modal-date"><i class="fa-regular fa-calendar"></i> ${formatOrderDate(order.created_at)}</span>
    </div>
    <div class="order-modal-items">
      ${order.items.map(item => `
        <div class="order-item-row">
          <div class="order-item-media">${orderItemMedia(item)}</div>
          <div class="order-item-info">
            <div class="order-item-name">${item.name}</div>
            <div class="order-item-qty">Qty: ${item.quantity} &times; $${Number(item.price_at_purchase).toFixed(2)}</div>
          </div>
          <div class="order-item-price">$${(item.price_at_purchase * item.quantity).toFixed(2)}</div>
        </div>
      `).join("")}
    </div>
    <div class="order-modal-total">
      <span>Total</span>
      <span>$${Number(order.total).toFixed(2)}</span>
    </div>
  `;

  document.getElementById("order-details-close-btn").addEventListener("click", closeOrderDetailsModal);
  overlay.classList.add("open");
}

function closeOrderDetailsModal() {
  document.getElementById("order-details-overlay")?.classList.remove("open");
}

/* ---------- Fetch orders (unchanged endpoint/auth) ---------- */
async function loadMyOrders() {
  const wrap = document.getElementById("orders-wrap");
  if (!wrap) return;

  if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
    window.location.href = "login.html?redirect=my-orders.html";
    return;
  }

  wrap.innerHTML = `<div class="orders-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading your orders...</div>`;

  try {
    const auth = getAuth();
    const res = await fetch(`${API_BASE}/api/my-orders`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const orders = await res.json();
    if (!res.ok) throw new Error(orders.error || "Could not load your orders.");

    ALL_ORDERS = orders;
    applyFiltersAndRender();
  } catch (err) {
    wrap.innerHTML = `<p style="color:var(--wine); padding:30px 0;">${err.message}</p>`;
  }
}

/* ---------- Wiring ---------- */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("order-search-input")?.addEventListener("input", (e) => {
    CURRENT_SEARCH = e.target.value;
    applyFiltersAndRender();
  });

  document.querySelectorAll(".order-filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".order-filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      CURRENT_FILTER = chip.dataset.status;
      applyFiltersAndRender();
    });
  });

  document.getElementById("order-details-overlay")?.addEventListener("click", (e) => {
    if (e.target.id === "order-details-overlay") closeOrderDetailsModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeOrderDetailsModal();
  });

  loadMyOrders();
});

/* Re-render once the product catalog arrives, so thumbnails / Buy Again
   have data to match against even if it loads after the orders do. */
document.addEventListener("productsReady", () => {
  if (ALL_ORDERS !== null) applyFiltersAndRender();
});
