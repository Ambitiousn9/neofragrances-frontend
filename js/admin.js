/* ============================================
   NeoFragrances — admin.js (Phase 4)
   All product/order/customer data now comes from
   the real database. Add/Edit/Delete Product,
   stock updates, and order status changes all
   call the real API and persist permanently.

   Also gates every admin page behind a real login
   check — only accounts with role='admin' can view
   this dashboard at all.
   ============================================ */

let ORDERS = [];
let CUSTOMERS = [];

const STATUS_LIST = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function statusBadgeClass(status) {
  return `badge-status badge-${status.toLowerCase()}`;
}
function money(n) { return `$${Number(n).toFixed(2)}`; }

function thumbHTML(p) {
  if (!p) return `<div class="thumb">${bottleSVG()}</div>`;
  return `<div class="thumb"><img src="../${p.image}" alt="${p.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='${bottleSVG().replace(/'/g, "\\'")}';"></div>`;
}

/* ---------- Admin login guard ---------- */
function adminGuard() {
  const auth = typeof getAuth === "function" ? getAuth() : null;
  if (!auth || !auth.user || auth.user.role !== "admin") {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function renderAdminUser() {
  const el = document.querySelector(".admin-user");
  if (!el) return;
  const auth = getAuth();
  if (!auth || !auth.user) return;
  const initial = auth.user.full_name.charAt(0).toUpperCase();
  el.innerHTML = `
    <div class="avatar">${initial}</div>
    <span>${auth.user.full_name}</span>
    <button id="admin-topbar-logout" title="Logout" style="background:none; border:none; color:var(--ink-soft); cursor:pointer; font-size:15px; margin-left:8px;"><i class="fa-solid fa-arrow-right-from-bracket"></i></button>
  `;
  document.getElementById("admin-topbar-logout").addEventListener("click", () => {
    if (confirm("Log out of the admin dashboard?")) {
      clearAuth();
      window.location.href = "login.html";
    }
  });
}
function showConfirm(message) {
  return new Promise((resolve) => {
    let overlay = document.getElementById("confirm-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.id = "confirm-modal-overlay";
      overlay.innerHTML = `
        <div class="modal" style="max-width:380px;">
          <p id="confirm-modal-message" style="margin-bottom:20px; font-size:14px; color:var(--ink);"></p>
          <div class="modal-actions">
            <button type="button" class="btn btn-outline" id="confirm-modal-cancel">Cancel</button>
            <button type="button" class="btn btn-primary" id="confirm-modal-ok">Confirm</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
    }
    document.getElementById("confirm-modal-message").textContent = message;
    overlay.classList.add("open");
    const cleanup = (result) => { overlay.classList.remove("open"); resolve(result); };
    document.getElementById("confirm-modal-ok").onclick = () => cleanup(true);
    document.getElementById("confirm-modal-cancel").onclick = () => cleanup(false);
  });
}

function downloadCSV(filename, rows) {
  const csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportProductsCSV() {
  const header = ["ID", "Name", "Brand", "Category", "Price", "Stock", "Badge"];
  const rows = [header, ...PRODUCTS.map(p => [p.id, p.name, p.brand, p.category, p.price, p.stockQty ?? 0, p.badge || ""])];
  downloadCSV("neofragrances-products.csv", rows);
  if (typeof showToast === "function") showToast("Products exported");
}

function exportOrdersCSV() {
  const header = ["Order ID", "Customer", "Email", "Date", "Items", "Total", "Status"];
  const rows = [header, ...ORDERS.map(o => [o.id, o.customer_name, o.customer_email, new Date(o.created_at).toLocaleDateString(), o.item_count, o.total, o.status])];
  downloadCSV("neofragrances-orders.csv", rows);
  if (typeof showToast === "function") showToast("Orders exported");
}

function renderLowStockBadge() {
  const badge = document.getElementById("low-stock-badge");
  if (!badge) return;
  const count = PRODUCTS.filter(p => (p.stockQty ?? 0) <= 10).length;
  badge.textContent = count > 0 ? count : "";
}

function authHeaders() {
  const auth = getAuth();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${auth.token}`,
  };
}

async function loadAdminData() {
  try {
    const [ordersRes, customersRes] = await Promise.all([
      fetch(`${API_BASE}/api/admin/orders`, { headers: authHeaders() }),
      fetch(`${API_BASE}/api/admin/customers`, { headers: authHeaders() }),
    ]);
    ORDERS = ordersRes.ok ? await ordersRes.json() : [];
    CUSTOMERS = customersRes.ok ? await customersRes.json() : [];
  } catch (err) {
    console.error("Failed to load admin data:", err);
    ORDERS = [];
    CUSTOMERS = [];
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */
function renderDashboard() {
  const summaryEl = document.getElementById("summary-cards");
  if (!summaryEl) return;

  const revenue = ORDERS.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + Number(o.total), 0);

  summaryEl.innerHTML = `
    <div class="summary-card"><div class="icon"><i class="fa-solid fa-flask"></i></div><div class="label">Total Products</div><div class="value">${PRODUCTS.length}</div></div>
    <div class="summary-card"><div class="icon"><i class="fa-solid fa-bag-shopping"></i></div><div class="label">Orders</div><div class="value">${ORDERS.length}</div></div>
    <div class="summary-card"><div class="icon"><i class="fa-solid fa-users"></i></div><div class="label">Customers</div><div class="value">${CUSTOMERS.length}</div></div>
    <div class="summary-card"><div class="icon"><i class="fa-solid fa-sack-dollar"></i></div><div class="label">Revenue</div><div class="value">${money(revenue)}</div></div>
  `;

  const recentBody = document.getElementById("recent-orders-body");
  if (recentBody) {
    const recent = ORDERS.slice(0, 5);
    recentBody.innerHTML = recent.length ? recent.map(o => `
      <tr>
        <td><strong>#${o.id}</strong></td>
        <td>${o.customer_name}</td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
        <td>${money(o.total)}</td>
        <td><span class="${statusBadgeClass(o.status)}">${o.status}</span></td>
      </tr>
    `).join("") : `<tr><td colspan="5"><div class="admin-empty">No orders yet.</div></td></tr>`;
  }
}

/* =========================================================
   PRODUCT MANAGEMENT
   ========================================================= */
function renderProductsTable() {
  const body = document.getElementById("products-table-body");
  if (!body) return;

  const term = (document.getElementById("admin-product-search")?.value || "").toLowerCase();
  const list = PRODUCTS.filter(p => p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term));

  body.innerHTML = list.length ? list.map(p => `
    <tr>
      <td>
        <div class="cell-product">
          ${thumbHTML(p)}
          <div>
            <div class="name">${p.name}</div>
            <div style="font-size:12px; color:var(--ink-soft);">#${p.id}</div>
          </div>
        </div>
      </td>
      <td>${p.brand}</td>
      <td style="text-transform:capitalize;">${p.category}</td>
      <td>${money(p.price)}</td>
      <td>${p.stock ? `<span class="stock-ok">In Stock</span>` : `<span class="stock-low">Out of Stock</span>`}</td>
      <td>
        <div class="table-actions">
          <button class="icon-btn" title="Edit" onclick="openProductModal(${p.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn danger" title="Delete" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("") : `<tr><td colspan="6"><div class="admin-empty">No products match your search.</div></td></tr>`;
}

function openProductModal(id = null) {
  const overlay = document.getElementById("product-modal-overlay");
  const form = document.getElementById("product-form");
  const title = document.getElementById("product-modal-title");
  form.reset();

  if (id) {
    const p = PRODUCTS.find(pr => pr.id === id);
    title.textContent = "Edit Product";
    form.dataset.editId = id;
    form.pname.value = p.name;
    form.pbrand.value = p.brand;
    form.pcategory.value = p.category;
    form.pprice.value = p.price;
    form.pstock.value = p.stockQty ?? 0;
    form.pbadge.value = p.badge || "";
    form.pimage.value = p.image;
  } else {
    title.textContent = "Add Product";
    delete form.dataset.editId;
  }

  overlay.classList.add("open");
}

function closeProductModal() {
  document.getElementById("product-modal-overlay").classList.remove("open");
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const editId = form.dataset.editId ? Number(form.dataset.editId) : null;
  const saveBtn = form.querySelector("button[type=submit]");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const payload = {
    name: form.pname.value.trim(),
    brand: form.pbrand.value.trim(),
    category: form.pcategory.value,
    price: Number(form.pprice.value),
    stock_qty: Number(form.pstock.value) || 0,
    badge: form.pbadge.value || null,
    image: form.pimage.value.trim() || "images/perfumes/placeholder.jpg",
    top_notes: "—",
    middle_notes: "—",
    base_notes: "—",
  };

  try {
    const url = editId ? `${API_BASE}/api/admin/products/${editId}` : `${API_BASE}/api/admin/products`;
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not save product.");

    closeProductModal();
    await loadProducts();
    renderProductsTable();
    renderInventoryTable();
    renderDashboard();
  } catch (err) {
    alert(err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Product";
  }
}

async function deleteProduct(id) {
  const p = PRODUCTS.find(pr => pr.id === id);
  const confirmed = await showConfirm(`Delete "${p.name}"? It will be hidden from the store immediately (it's a soft-delete, so order history stays intact).`);
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}`, { method: "DELETE", headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not delete product.");

    await loadProducts();
    renderProductsTable();
    renderInventoryTable();
    renderDashboard();
    if (typeof showToast === "function") showToast(`"${p.name}" deleted`);
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message, "error");
  }
}

/* =========================================================
   INVENTORY MANAGEMENT
   ========================================================= */
function renderInventoryTable() {
  const body = document.getElementById("inventory-table-body");
  if (!body) return;

  body.innerHTML = PRODUCTS.map(p => {
    const qty = p.stockQty ?? 0;
    const low = qty > 0 && qty <= 10;
    const out = qty === 0;
    return `
    <tr>
      <td>
        <div class="cell-product">
          ${thumbHTML(p)}
          <div class="name">${p.name}</div>
        </div>
      </td>
      <td><input type="number" min="0" class="stock-input" id="qty-input-${p.id}" value="${qty}"></td>
      <td>
        ${out ? `<span class="stock-low">Out of Stock</span>` : low ? `<span class="stock-low">Low Stock</span>` : `<span class="stock-ok">In Stock</span>`}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn btn-outline btn-sm" onclick="updateStock(${p.id})">Update</button>
          <button class="btn btn-gold btn-sm" onclick="restock(${p.id})">Restock +20</button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

async function updateStock(id) {
  const input = document.getElementById(`qty-input-${id}`);
  const qty = Math.max(0, Number(input.value) || 0);
  try {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}/stock`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ stock_qty: qty }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update stock.");
    await loadProducts();
    renderInventoryTable();
    renderProductsTable();
  } catch (err) {
   if (typeof showToast === "function") showToast(err.message, "error");
  }
}

async function restock(id) {
  const p = PRODUCTS.find(pr => pr.id === id);
  const newQty = (p.stockQty ?? 0) + 20;
  try {
    const res = await fetch(`${API_BASE}/api/admin/products/${id}/stock`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ stock_qty: newQty }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not restock.");
    await loadProducts();
    renderInventoryTable();
    renderProductsTable();
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message, "error");
  }
}

/* =========================================================
   ORDER MANAGEMENT
   ========================================================= */
function renderOrdersTable() {
  const body = document.getElementById("orders-table-body");
  if (!body) return;

  const statusFilter = document.getElementById("order-status-filter")?.value || "all";
  const list = statusFilter === "all" ? ORDERS : ORDERS.filter(o => o.status === statusFilter);

  body.innerHTML = list.length ? list.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.customer_name}<div style="font-size:12px; color:var(--ink-soft);">${o.customer_email}</div></td>
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
      <td>${o.item_count} item${o.item_count != 1 ? "s" : ""}</td>
      <td>${money(o.total)}</td>
      <td>
        <select class="status-select" onchange="changeOrderStatus(${o.id}, this.value)">
          ${STATUS_LIST.map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
    </tr>
  `).join("") : `<tr><td colspan="6"><div class="admin-empty">No orders with this status.</div></td></tr>`;
}

async function changeOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update order status.");
    const order = ORDERS.find(o => o.id === orderId);
    if (order) order.status = newStatus;
    renderOrdersTable();
    renderDashboard();
    if (typeof showToast === "function") showToast(`Order #${orderId} marked ${newStatus}`);
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message, "error");
    renderOrdersTable();
  }
}

/* =========================================================
   CUSTOMERS
   ========================================================= */
function renderCustomersTable() {
  const body = document.getElementById("customers-table-body");
  if (!body) return;
  const term = (document.getElementById("admin-customer-search")?.value || "").toLowerCase();
  const filtered = CUSTOMERS.filter(c => c.full_name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term));
  body.innerHTML = filtered.length ? filtered.map(c => `
    <tr>
      <td><strong>${c.full_name}</strong></td>
      <td>${c.email}</td>
      <td>${c.order_count}</td>
      <td>${new Date(c.created_at).toLocaleDateString()}</td>
    </tr>
  `).join("") : `<tr><td colspan="4"><div class="admin-empty">No customers match your search.</div></td></tr>`;
}

/* =========================================================
   REPORTS
   ========================================================= */
function renderReports() {
  const el = document.getElementById("reports-cards");
  if (!el) return;

  const validOrders = ORDERS.filter(o => o.status !== "Cancelled");
  const revenue = validOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrder = validOrders.length ? revenue / validOrders.length : 0;

  const categoryCounts = {};
  PRODUCTS.forEach(p => { categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1; });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  el.innerHTML = `
    <div class="summary-card"><div class="icon"><i class="fa-solid fa-sack-dollar"></i></div><div class="label">Total Revenue</div><div class="value">${money(revenue)}</div></div>
    <div class="summary-card"><div class="icon"><i class="fa-solid fa-receipt"></i></div><div class="label">Completed Orders</div><div class="value">${validOrders.length}</div></div>
    <div class="summary-card"><div class="icon"><i class="fa-solid fa-chart-line"></i></div><div class="label">Avg. Order Value</div><div class="value">${money(avgOrder)}</div></div>
    <div class="summary-card"><div class="icon"><i class="fa-solid fa-star"></i></div><div class="label">Top Category</div><div class="value" style="text-transform:capitalize; font-size:22px;">${topCategory ? topCategory[0] : "—"}</div></div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  if (!adminGuard()) return;
  renderAdminUser();

  document.getElementById("admin-product-search")?.addEventListener("input", renderProductsTable);
  document.getElementById("admin-customer-search")?.addEventListener("input", renderCustomersTable);
  document.getElementById("order-status-filter")?.addEventListener("input", renderOrdersTable);
  document.getElementById("product-form")?.addEventListener("submit", handleProductFormSubmit);
});

document.addEventListener("productsReady", async (e) => {
  if (!adminGuard()) return;

  if (!e.detail.success) {
    const wrap = document.querySelector(".admin-main");
    if (wrap) {
      wrap.insertAdjacentHTML("afterbegin",
        `<div style="background:#FADCE0; color:#A3273F; padding:14px 18px; border-radius:4px; margin-bottom:20px; font-weight:600;">
          Couldn't load data — make sure the backend server (node server.js) is running.
        </div>`);
    }
    return;
  }

  await loadAdminData();
  renderLowStockBadge();
  renderDashboard();
  renderProductsTable();
  renderInventoryTable();
  renderOrdersTable();
  renderCustomersTable();
  renderReports();
});