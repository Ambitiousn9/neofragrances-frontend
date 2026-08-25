/* ============================================
   NeoFragrances — checkout.js (Phase 4)
   Loading, selecting, and adding shipping
   addresses on cart.html before checkout.
   ============================================ */

let SELECTED_ADDRESS_ID = null;
let ADDRESSES = [];

async function loadAddresses() {
  if (typeof isLoggedIn !== "function" || !isLoggedIn()) return;
  try {
    const auth = getAuth();
    const res = await fetch(`${API_BASE}/api/addresses`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    ADDRESSES = res.ok ? await res.json() : [];
    renderAddressList();
  } catch (err) {
    console.error("Could not load addresses:", err);
  }
}

function renderAddressList() {
  const el = document.getElementById("address-list");
  if (!el) return;

  if (ADDRESSES.length === 0) {
    el.innerHTML = `<p style="color:var(--ink-soft); font-size:13px;">No saved addresses yet — add one below.</p>`;
    SELECTED_ADDRESS_ID = null;
    return;
  }

  if (!SELECTED_ADDRESS_ID) {
    const defaultAddr = ADDRESSES.find(a => a.is_default) || ADDRESSES[0];
    SELECTED_ADDRESS_ID = defaultAddr.id;
  }

  el.innerHTML = ADDRESSES.map(a => `
    <label style="display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-bottom:1px solid var(--line); cursor:pointer;">
      <input type="radio" name="selected-address" value="${a.id}" ${a.id === SELECTED_ADDRESS_ID ? "checked" : ""} style="margin-top:4px;">
      <span style="font-size:13px; line-height:1.5;">
        <strong>${a.label}</strong> — ${a.full_name}<br>
        ${a.address_line1}${a.address_line2 ? ", " + a.address_line2 : ""}<br>
        ${a.city}${a.region ? ", " + a.region : ""}, ${a.country}
      </span>
    </label>
  `).join("");

  el.querySelectorAll('input[name="selected-address"]').forEach(input => {
    input.addEventListener("change", () => { SELECTED_ADDRESS_ID = Number(input.value); });
  });
}

function toggleAddressForm(show) {
  document.getElementById("address-form-wrap").classList.toggle("hidden", !show);
}

function renderAddressForm() {
  const el = document.getElementById("address-form-wrap");
  el.innerHTML = `
    <div class="field-row">
      <div class="field"><label>Label</label><input type="text" id="addr-label" placeholder="Home"></div>
      <div class="field"><label>Full Name</label><input type="text" id="addr-name" required></div>
    </div>
    <div class="field"><label>Phone</label><input type="text" id="addr-phone"></div>
    <div class="field"><label>Address Line 1</label><input type="text" id="addr-line1" required></div>
    <div class="field"><label>Address Line 2</label><input type="text" id="addr-line2"></div>
    <div class="field-row">
      <div class="field"><label>City</label><input type="text" id="addr-city" required></div>
      <div class="field"><label>Region</label><input type="text" id="addr-region"></div>
    </div>
    <div class="field"><label>Country</label><input type="text" id="addr-country" required></div>
    <button class="btn btn-primary btn-sm" id="save-address-btn">Save Address</button>
    <p id="addr-msg" style="font-size:13px; margin-top:8px;"></p>
  `;
  document.getElementById("save-address-btn").addEventListener("click", saveNewAddress);
}

async function saveNewAddress() {
  const payload = {
    label: document.getElementById("addr-label").value.trim() || "Home",
    fullName: document.getElementById("addr-name").value.trim(),
    phone: document.getElementById("addr-phone").value.trim(),
    addressLine1: document.getElementById("addr-line1").value.trim(),
    addressLine2: document.getElementById("addr-line2").value.trim(),
    city: document.getElementById("addr-city").value.trim(),
    region: document.getElementById("addr-region").value.trim(),
    country: document.getElementById("addr-country").value.trim(),
    isDefault: ADDRESSES.length === 0,
  };

  if (!payload.fullName || !payload.addressLine1 || !payload.city || !payload.country) {
    document.getElementById("addr-msg").textContent = "Please fill in the required fields.";
    document.getElementById("addr-msg").style.color = "var(--wine)";
    return;
  }

  try {
    const auth = getAuth();
    const res = await fetch(`${API_BASE}/api/addresses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not save address.");
    SELECTED_ADDRESS_ID = data.id;
    toggleAddressForm(false);
    await loadAddresses();
  } catch (err) {
    document.getElementById("addr-msg").textContent = err.message;
    document.getElementById("addr-msg").style.color = "var(--wine)";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("add-address-btn")?.addEventListener("click", () => {
    renderAddressForm();
    toggleAddressForm(true);
  });
});

document.addEventListener("productsReady", () => {
  if (document.getElementById("address-list")) loadAddresses();
});
