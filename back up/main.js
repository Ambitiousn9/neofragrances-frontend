/* ============================================
   NeoFragrances — main.js (Phase 4)
   Products now load from the real database via
   the Express API, instead of being hardcoded.

   IMPORTANT: PRODUCTS starts EMPTY and fills in
   after the fetch below finishes. Any script that
   needs PRODUCTS must wait for the "productsReady"
   event instead of assuming it's ready immediately.
   ============================================ */

const API_BASE = "http://172.20.10.2:5000";
let PRODUCTS = [];

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    const data = await res.json();

    // Convert the database's column names/shapes into the same shape
    // the rest of the site's code already expects.
    PRODUCTS = data.map(p => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: Number(p.price),
      stock: p.stock_qty > 0,
      stockQty: p.stock_qty,
      badge: p.badge || "",
      image: p.image,
      notes: { top: p.top_notes, middle: p.middle_notes, base: p.base_notes },
    }));
  } catch (err) {
    console.error("Could not load products from the API:", err);
    PRODUCTS = [];
  }
  // Let every other script know the data has arrived (or failed).
  document.dispatchEvent(new CustomEvent("productsReady", { detail: { success: PRODUCTS.length > 0 } }));
}

/* Reusable bottle silhouette placeholder — shown if a photo file is missing */
function bottleSVG(fill = "#2B1B2E") {
  return `<svg viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="24" y="4" width="12" height="10" rx="2" fill="${fill}" opacity="0.7"/>
    <rect x="21" y="14" width="18" height="8" rx="2" fill="${fill}" opacity="0.5"/>
    <path d="M14 26 h32 a4 4 0 0 1 4 4 v58 a6 6 0 0 1 -6 6 H16 a6 6 0 0 1 -6 -6 V30 a4 4 0 0 1 4 -4 Z" fill="${fill}"/>
    <rect x="18" y="46" width="24" height="22" rx="1" fill="#FAF6F0" opacity="0.9"/>
  </svg>`;
}

function productMedia(imagePath, alt) {
  return `<img src="${imagePath}" alt="${alt}" loading="lazy" onerror="handleImageError(this)">`;
}

function handleImageError(img) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = bottleSVG();
  img.replaceWith(wrapper.firstElementChild);
}

function productCard(p) {
  return `
  <div class="product-card" data-id="${p.id}" data-name="${p.name.toLowerCase()}" data-brand="${p.brand}" data-cat="${p.category}" data-price="${p.price}">
    <div class="product-media">
      ${p.badge ? `<span class="product-badge${p.badge === 'New' ? ' badge-new' : ''}">${p.badge}</span>` : ""}
      ${productMedia(p.image, p.name)}
    </div>
    <div class="product-info">
      <span class="product-brand">${p.brand}</span>
      <h3 class="product-name">${p.name}</h3>
      <span class="product-cat">${capitalize(p.category)}</span>
      <div class="product-price-row">
        <span class="product-price">$${p.price}</span>
        <span class="${p.stock ? 'stock-yes' : 'stock-no'}">${p.stock ? 'In stock' : 'Out of stock'}</span>
      </div>
    </div>
    <div class="product-actions">
      <a href="product-details.html?id=${p.id}" class="btn btn-outline btn-sm">View</a>
      <button class="btn btn-primary btn-sm add-to-cart" data-id="${p.id}" ${p.stock ? "" : "disabled"}>Add to Cart</button>
    </div>
  </div>`;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }

  if (window.AOS) {
    AOS.init({ duration: 700, once: true, offset: 60 });
  }

  updateCartCount();
});
