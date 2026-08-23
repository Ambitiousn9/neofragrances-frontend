/* ============================================
   NeoFragrances — admin.js (Phase 2)
   Mock data + logic for the Admin Dashboard.
   Products come from the shared PRODUCTS array
   in main.js. Orders/Customers/Inventory are
   mock data here until Phase 4 connects a real
   database — nothing here persists after a
   page refresh.
   ============================================ */

const ORDERS = [
  { id: "NF-1001", customer: "Ambitious", email: "ambitiousn9@icloud.com", date: "2026-07-10", total: 245, status: "Delivered", items: [1, 5] },
  { id: "NF-1002", customer: "Kwame Boateng", email: "kwame.b@email.com", date: "2026-07-11", total: 121, status: "Shipped", items: [6] },
  { id: "NF-1003", customer: "Efua Mensah", email: "efua.m@email.com", date: "2026-07-12", total: 194, status: "Processing", items: [3, 8] },
  { id: "NF-1004", customer: "Yaw Asante", email: "yaw.asante@email.com", date: "2026-07-13", total: 89, status: "Pending", items: [5] },
  { id: "NF-1005", customer: "Abena Darko", email: "abena.d@email.com", date: "2026-07-13", total: 267, status: "Pending", items: [1, 4] },
  { id: "NF-1006", customer: "Kofi Owusu", email: "kofi.owusu@email.com", date: "2026-07-14", total: 104, status: "Cancelled", items: [7] },
  { id: "NF-1007", customer: "Adjoa Boateng", email: "adjoa.b@email.com", date: "2026-07-15", total: 76, status: "Delivered", items: [8] },
  { id: "NF-1008", customer: "Kwabena Mensah", email: "kwabena.m@email.com", date: "2026-07-16", total: 145, status: "Processing", items: [1] },
];

const CUSTOMERS = [
  { id: 1, name: "Ama Owusu", email: "ama.owusu@email.com", orders: 3, joined: "2026-02-14" },
  { id: 2, name: "Kwame Boateng", email: "kwame.b@email.com", orders: 1, joined: "2026-03-02" },
  { id: 3, name: "Efua Mensah", email: "efua.m@email.com", orders: 5, joined: "2026-01-20" },
  { id: 4, name: "Yaw Asante", email: "yaw.asante@email.com", orders: 1, joined: "2026-06-11" },
  { id: 5, name: "Abena Darko", email: "abena.d@email.com", orders: 2, joined: "2026-05-05" },
  { id: 6, name: "Kofi Owusu", email: "kofi.owusu@email.com", orders: 1, joined: "2026-07-01" },
  { id: 7, name: "Adjoa Boateng", email: "adjoa.b@email.com", orders: 4, joined: "2026-02-28" },
  { id: 8, name: "Kwabena Mensah", email: "kwabena.m@email.com", orders: 2, joined: "2026-04-17" },
];

// Mock stock quantities, keyed by product id — replaces the simple true/false
// stock flag with real numbers for the Inventory page.
const INVENTORY = {};
PRODUCTS.forEach(p => { INVENTORY[p.id] = p.stock ? Math.floor(Math.random() * 45) + 8 : 0; });

const STATUS_LIST = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function statusBadgeClass(status) {
  return `badge-status badge-${status.toLowerCase()}`;
}

function money(n) {
  return `$${n.toFixed(2)}`;
}

function thumbHTML(p) {
  if (!p) return `<div class="thumb">${bottleSVG()}</div>`;
  return `<div class="thumb"><img src="../${p.image}" alt="${p.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='${bottleSVG().replace(/'/g, "\\'")}';"></div>`;
}

/* =========================================================
   DASHBOARD (admin/dashboard.html)
   ========================================================= */
function renderDashboard() {
  const summaryEl = document.getElementById("summary-cards");
  if (!summaryEl) return;

  const revenue = ORDERS.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + o.total, 0);

  summaryEl.innerHTML = `
    <div class="summary-card">
      <div class="icon"><i class="fa-solid fa-flask"></i></div>
      <div class="label">Total Products</div>
      <div class="value">${PRODUCTS.length}</div>
    </div>
    <div class="summary-card">
      <div class="icon"><i class="fa-solid fa-bag-shopping"></i></div>
      <div class="label">Orders</div>
      <div class="value">${ORDERS.length}</div>
    </div>
    <div class="summary-card">
      <div class="icon"><i class="fa-solid fa-users"></i></div>
      <div class="label">Customers</div>
      <div class="value">${CUSTOMERS.length}</div>
    </div>
    <div class="summary-card">
      <div class="icon"><i class="fa-solid fa-sack-dollar"></i></div>
      <div class="label">Revenue</div>
      <div class="value">${money(revenue)}</div>
    </div>
  `;

  const recentBody = document.getElementById("recent-orders-body");
  if (recentBody) {
    const recent = [...ORDERS].slice(-5).reverse();
    recentBody.innerHTML = recent.map(o => `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.customer}</td>
        <td>${o.date}</td>
        <td>${money(o.total)}</td>
        <td><span class="${statusBadgeClass(o.status)}">${o.status}</span></td>
      </tr>
    `).join("");
  }
}

/* =========================================================
   PRODUCT MANAGEMENT (admin/products.html)
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
    form.pstock.value = p.stock ? "true" : "false";
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

function handleProductFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const editId = form.dataset.editId ? Number(form.dataset.editId) : null;

  const data = {
    name: form.pname.value.trim(),
    brand: form.pbrand.value.trim(),
    category: form.pcategory.value,
    price: Number(form.pprice.value),
    stock: form.pstock.value === "true",
    badge: form.pbadge.value,
    image: form.pimage.value.trim() || "images/perfumes/placeholder.jpg",
    notes: { top: "—", middle: "—", base: "—" },
  };

  if (editId) {
    const idx = PRODUCTS.findIndex(p => p.id === editId);
    PRODUCTS[idx] = { ...PRODUCTS[idx], ...data };
    INVENTORY[editId] = data.stock ? (INVENTORY[editId] || 20) : 0;
  } else {
    const newId = Math.max(...PRODUCTS.map(p => p.id)) + 1;
    PRODUCTS.push({ id: newId, ...data });
    INVENTORY[newId] = data.stock ? 20 : 0;
  }

  closeProductModal();
  renderProductsTable();
  renderInventoryTable();
  renderDashboard();
}

function deleteProduct(id) {
  const p = PRODUCTS.find(pr => pr.id === id);
  if (!confirm(`Delete "${p.name}"? This can't be undone (until the page is refreshed, since nothing is saved to a database yet).`)) return;
  const idx = PRODUCTS.findIndex(pr => pr.id === id);
  PRODUCTS.splice(idx, 1);
  delete INVENTORY[id];
  renderProductsTable();
  renderInventoryTable();
  renderDashboard();
}

/* =========================================================
   INVENTORY MANAGEMENT (admin/inventory.html)
   ========================================================= */
function renderInventoryTable() {
  const body = document.getElementById("inventory-table-body");
  if (!body) return;

  body.innerHTML = PRODUCTS.map(p => {
    const qty = INVENTORY[p.id] ?? 0;
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

function updateStock(id) {
  const input = document.getElementById(`qty-input-${id}`);
  const qty = Math.max(0, Number(input.value) || 0);
  INVENTORY[id] = qty;
  const p = PRODUCTS.find(pr => pr.id === id);
  if (p) p.stock = qty > 0;
  renderInventoryTable();
  renderProductsTable();
}

function restock(id) {
  INVENTORY[id] = (INVENTORY[id] || 0) + 20;
  const p = PRODUCTS.find(pr => pr.id === id);
  if (p) p.stock = true;
  renderInventoryTable();
  renderProductsTable();
}

/* =========================================================
   ORDER MANAGEMENT (admin/orders.html)
   ========================================================= */
function renderOrdersTable() {
  const body = document.getElementById("orders-table-body");
  if (!body) return;

  const statusFilter = document.getElementById("order-status-filter")?.value || "all";
  const list = statusFilter === "all" ? ORDERS : ORDERS.filter(o => o.status === statusFilter);

  body.innerHTML = list.length ? list.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.customer}<div style="font-size:12px; color:var(--ink-soft);">${o.email}</div></td>
      <td>${o.date}</td>
      <td>${o.items.length} item${o.items.length > 1 ? "s" : ""}</td>
      <td>${money(o.total)}</td>
      <td>
        <select class="status-select" onchange="changeOrderStatus('${o.id}', this.value)">
          ${STATUS_LIST.map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
    </tr>
  `).join("") : `<tr><td colspan="6"><div class="admin-empty">No orders with this status.</div></td></tr>`;
}

function changeOrderStatus(orderId, newStatus) {
  const order = ORDERS.find(o => o.id === orderId);
  if (order) order.status = newStatus;
  renderOrdersTable();
  renderDashboard();
}

/* =========================================================
   CUSTOMERS (admin/customers.html)
   ========================================================= */
function renderCustomersTable() {
  const body = document.getElementById("customers-table-body");
  if (!body) return;
  body.innerHTML = CUSTOMERS.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.email}</td>
      <td>${c.orders}</td>
      <td>${c.joined}</td>
    </tr>
  `).join("");
}

/* =========================================================
   REPORTS (admin/reports.html)
   ========================================================= */
function renderReports() {
  const el = document.getElementById("reports-cards");
  if (!el) return;

  const validOrders = ORDERS.filter(o => o.status !== "Cancelled");
  const revenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrder = validOrders.length ? revenue / validOrders.length : 0;

  const categoryCounts = {};
  PRODUCTS.forEach(p => { categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1; });
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

  el.innerHTML = `
    <div class="summary-card">
      <div class="icon"><i class="fa-solid fa-sack-dollar"></i></div>
      <div class="label">Total Revenue</div>
      <div class="value">${money(revenue)}</div>
    </div>
    <div class="summary-card">
      <div class="icon"><i class="fa-solid fa-receipt"></i></div>
      <div class="label">Completed Orders</div>
      <div class="value">${validOrders.length}</div>
    </div>
    <div class="summary-card">
      <div class="icon"><i class="fa-solid fa-chart-line"></i></div>
      <div class="label">Avg. Order Value</div>
      <div class="value">${money(avgOrder)}</div>
    </div>
    <div class="summary-card">
      <div class="icon"><i class="fa-solid fa-star"></i></div>
      <div class="label">Top Category</div>
      <div class="value" style="text-transform:capitalize; font-size:22px;">${topCategory ? topCategory[0] : "—"}</div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  renderProductsTable();
  renderInventoryTable();
  renderOrdersTable();
  renderCustomersTable();
  renderReports();

  document.getElementById("admin-product-search")?.addEventListener("input", renderProductsTable);
  document.getElementById("order-status-filter")?.addEventListener("input", renderOrdersTable);
  document.getElementById("product-form")?.addEventListener("submit", handleProductFormSubmit);
});
