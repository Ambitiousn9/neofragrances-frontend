/* ============================================
   NeoFragrances — admin-offers.js
   Special Offers management (Admin Portal).
   Reuses adminGuard(), renderAdminUser(), authHeaders(),
   showConfirm(), and money() from admin.js/main.js —
   does not redefine them.
   ============================================ */

let OFFERS_ADMIN = [];

/* ---------- Data loading ---------- */
async function loadOffersAdmin() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/offers`, { headers: authHeaders() });
    OFFERS_ADMIN = res.ok ? await res.json() : [];
  } catch (err) {
    console.error("Failed to load offers:", err);
    OFFERS_ADMIN = [];
  }
  renderOffersSummary();
  renderOffersTable();
}

/* ---------- Summary cards ---------- */
function renderOffersSummary() {
  const el = document.getElementById("offers-summary-cards");
  if (!el) return;
  const counts = { Active: 0, Scheduled: 0, Expired: 0, Disabled: 0 };
  let flashSales = 0;
  OFFERS_ADMIN.forEach(o => {
    counts[o.status] = (counts[o.status] || 0) + 1;
    if (o.offer_type === "flash_sale" && o.status === "Active") flashSales++;
  });

  el.innerHTML = `
    <div class="summary-card"><div class="icon"><i class="fa-solid fa-heart"></i></div><div class="label">Active Offers</div><div class="value">${counts.Active}</div></div>
    <div class="summary-card"><div class="icon"><i class="fa-regular fa-clock"></i></div><div class="label">Scheduled Offers</div><div class="value">${counts.Scheduled}</div></div>
    <div class="summary-card"><div class="icon"><i class="fa-solid fa-bolt"></i></div><div class="label">Flash Sales</div><div class="value">${flashSales}</div></div>
    <div class="summary-card"><div class="icon"><i class="fa-regular fa-circle-xmark"></i></div><div class="label">Expired Offers</div><div class="value">${counts.Expired}</div></div>
  `;
}

/* ---------- Table ---------- */
function offerStatusBadgeClass(status) {
  const map = { Active: "badge-delivered", Scheduled: "badge-processing", Expired: "badge-cancelled", Disabled: "badge-pending" };
  return `badge-status ${map[status] || "badge-pending"}`;
}

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function renderOffersTable() {
  const body = document.getElementById("offers-table-body");
  if (!body) return;

  body.innerHTML = OFFERS_ADMIN.length ? OFFERS_ADMIN.map(o => `
    <tr>
      <td>${o.product_name || "<em>Product removed</em>"}</td>
      <td>${o.title}</td>
      <td>${money(o.original_price)}</td>
      <td>${money(o.sale_price)}</td>
      <td>${o.discount_percent}%</td>
      <td>${fmtDateTime(o.start_at)}</td>
      <td>${fmtDateTime(o.end_at)}</td>
      <td><span class="${offerStatusBadgeClass(o.status)}">${o.status}</span></td>
      <td>
        <input type="checkbox" ${o.featured ? "checked" : ""} onchange="toggleOfferFeatured(${o.id}, this.checked)" title="Featured offer">
      </td>
      <td>
        <div class="table-actions">
          <button class="icon-btn" title="Edit" onclick="openOfferModal(${o.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn" title="${o.active ? 'Deactivate' : 'Activate'}" onclick="toggleOfferActive(${o.id}, ${!o.active})"><i class="fa-solid fa-power-off"></i></button>
          <button class="icon-btn danger" title="Delete" onclick="deleteOffer(${o.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("") : `<tr><td colspan="10"><div class="admin-empty">No offers yet — create one to get started.</div></td></tr>`;
}

/* ---------- Product dropdown ---------- */
function populateOfferProductSelect(selectedId = null) {
  const select = document.getElementById("offer-product-select");
  if (!select) return;
  select.innerHTML = PRODUCTS.map(p =>
    `<option value="${p.id}" ${p.id === selectedId ? "selected" : ""}>${p.name} (${p.brand})</option>`
  ).join("");
}

/* ---------- Live discount calculation ---------- */
function updateOfferDiscountDisplay() {
  const form = document.getElementById("offer-form");
  const original = Number(form.ooriginal.value);
  const sale = Number(form.osale.value);
  const display = document.getElementById("offer-discount-display");
  if (!original || !sale || sale > original) {
    display.value = sale > original ? "Sale price is higher than original" : "—";
    return;
  }
  const percent = Math.round(((original - sale) / original) * 100);
  const save = (original - sale).toFixed(2);
  display.value = `${percent}% (Save ${money(save)})`;
}

/* ---------- Modal open/close ---------- */
function toLocalDatetimeInputValue(iso) {
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function openOfferModal(id = null) {
  const overlay = document.getElementById("offer-modal-overlay");
  const form = document.getElementById("offer-form");
  const title = document.getElementById("offer-modal-title");
  form.reset();
  populateOfferProductSelect();

  if (id) {
    const o = OFFERS_ADMIN.find(off => off.id === id);
    if (!o) return;
    title.textContent = "Edit Special Offer";
    form.dataset.editId = id;
    form.otitle.value = o.title;
    form.odescription.value = o.description || "";
    populateOfferProductSelect(o.product_id);
    form.ooriginal.value = o.original_price;
    form.osale.value = o.sale_price;
    form.otype.value = o.offer_type;
    form.obadge.value = o.badge || "";
    form.ostart.value = toLocalDatetimeInputValue(o.start_at);
    form.oend.value = toLocalDatetimeInputValue(o.end_at);
    form.oimage.value = o.image || "";
    form.oactive.checked = !!o.active;
    form.ofeatured.checked = !!o.featured;
    form.oorder.value = o.display_order || 0;
    updateOfferDiscountDisplay();
  } else {
    title.textContent = "Create Special Offer";
    delete form.dataset.editId;
    document.getElementById("offer-discount-display").value = "—";
  }

  overlay.classList.add("open");
}

function closeOfferModal() {
  document.getElementById("offer-modal-overlay").classList.remove("open");
}

/* ---------- Save (create/update) ---------- */
async function handleOfferFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const editId = form.dataset.editId ? Number(form.dataset.editId) : null;
  const saveBtn = form.querySelector("button[type=submit]");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const payload = {
    title: form.otitle.value.trim(),
    description: form.odescription.value.trim() || null,
    product_id: Number(form.oproduct.value),
    original_price: Number(form.ooriginal.value),
    sale_price: Number(form.osale.value),
    offer_type: form.otype.value,
    badge: form.obadge.value.trim() || null,
    image: form.oimage.value.trim() || null,
    start_at: form.ostart.value,
    end_at: form.oend.value,
    active: form.oactive.checked,
    featured: form.ofeatured.checked,
    display_order: Number(form.oorder.value) || 0,
  };

  try {
    const url = editId ? `${API_BASE}/api/admin/offers/${editId}` : `${API_BASE}/api/admin/offers`;
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not save offer.");

    closeOfferModal();
    await loadOffersAdmin();
    if (typeof showToast === "function") showToast(editId ? "Offer updated" : "Offer created");
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message, "error");
    else alert(err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Offer";
  }
}

/* ---------- Activate / deactivate ---------- */
async function toggleOfferActive(id, newActive) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/offers/${id}/toggle`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ active: newActive }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update offer status.");
    await loadOffersAdmin();
    if (typeof showToast === "function") showToast(newActive ? "Offer activated" : "Offer deactivated");
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message, "error");
  }
}

/* ---------- Featured toggle (uses the same PUT endpoint, only
   changing the featured flag) ---------- */
async function toggleOfferFeatured(id, featured) {
  const o = OFFERS_ADMIN.find(off => off.id === id);
  if (!o) return;
  try {
    const res = await fetch(`${API_BASE}/api/admin/offers/${id}`, {
      method: "PUT", headers: authHeaders(),
      body: JSON.stringify({
        title: o.title, description: o.description, offer_type: o.offer_type, badge: o.badge,
        image: o.image, start_at: o.start_at, end_at: o.end_at, active: !!o.active,
        featured, display_order: o.display_order,
        product_id: o.product_id, original_price: o.original_price, sale_price: o.sale_price,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not update featured status.");
    await loadOffersAdmin();
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message, "error");
    renderOffersTable();
  }
}

/* ---------- Delete ---------- */
async function deleteOffer(id) {
  const o = OFFERS_ADMIN.find(off => off.id === id);
  const confirmed = await showConfirm(`Delete "${o ? o.title : "this offer"}"? This cannot be undone. Consider deactivating instead if you might want it again later.`);
  if (!confirmed) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/offers/${id}`, { method: "DELETE", headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not delete offer.");
    await loadOffersAdmin();
    if (typeof showToast === "function") showToast("Offer deleted");
  } catch (err) {
    if (typeof showToast === "function") showToast(err.message, "error");
  }
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("offers-table-body")) return; // not on this page
  if (!adminGuard()) return;
  renderAdminUser();

  document.getElementById("offer-form")?.addEventListener("submit", handleOfferFormSubmit);
  document.getElementById("offer-form")?.addEventListener("input", (e) => {
    if (e.target.name === "ooriginal" || e.target.name === "osale") updateOfferDiscountDisplay();
  });
});

document.addEventListener("productsReady", async (e) => {
  if (!document.getElementById("offers-table-body")) return;
  if (!adminGuard()) return;
  if (!e.detail.success) return;
  await loadOffersAdmin();
});
