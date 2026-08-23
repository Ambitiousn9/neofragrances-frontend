/* ============================================
   NeoFragrances — my-orders.js (Phase 4)
   Renders a logged-in customer's own order history
   on my-orders.html.
   ============================================ */

async function loadMyOrders() {
  const wrap = document.getElementById("orders-wrap");
  if (!wrap) return;

  if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
    window.location.href = "login.html?redirect=my-orders.html";
    return;
  }

  wrap.innerHTML = `<p style="color:var(--ink-soft);">Loading your orders...</p>`;

  try {
    const auth = getAuth();
    const res = await fetch(`${API_BASE}/api/my-orders`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const orders = await res.json();
    if (!res.ok) throw new Error(orders.error || "Could not load your orders.");

    if (orders.length === 0) {
      wrap.innerHTML = `<p style="color:var(--ink-soft);">You haven't placed any orders yet. <a href="products.html" style="color:var(--wine); font-weight:600;">Browse fragrances</a></p>`;
      return;
    }

    wrap.innerHTML = orders.map(o => `
      <div class="admin-table-wrap" style="margin-bottom:20px; padding:22px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
          <div>
            <strong>Order #${o.id}</strong>
            <div style="font-size:13px; color:var(--ink-soft);">${new Date(o.created_at).toLocaleDateString()}</div>
          </div>
          <span class="badge-status badge-${o.status.toLowerCase()}">${o.status}</span>
        </div>
        <div style="border-top:1px solid var(--line); padding-top:14px;">
          ${o.items.map(item => `
            <div style="display:flex; justify-content:space-between; font-size:14px; padding:6px 0;">
              <span>${item.name} &times; ${item.quantity}</span>
              <span>$${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
            </div>
          `).join("")}
        </div>
        <div style="border-top:1px solid var(--line); margin-top:10px; padding-top:10px; display:flex; justify-content:space-between; font-weight:700;">
          <span>Total</span>
          <span>$${Number(o.total).toFixed(2)}</span>
        </div>
      </div>
    `).join("");
  } catch (err) {
    wrap.innerHTML = `<p style="color:var(--wine);">${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadMyOrders);
