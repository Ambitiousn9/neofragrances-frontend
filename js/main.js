/* ============================================
   NeoFragrances — main.js (Phase 4 + clickable cards)
   Products now load from the real database via
   the Express API, instead of being hardcoded.

   IMPORTANT: PRODUCTS starts EMPTY and fills in
   after the fetch below finishes. Any script that
   needs PRODUCTS must wait for the "productsReady"
   event instead of assuming it's ready immediately.

   NEW: the entire .product-card is clickable and
   opens product-details.html for that product,
   while .wishlist-btn, .add-to-cart, and
   .view-details-link keep working independently
   (handled via one delegated listener below —
   applies automatically to every page that uses
   productCard(), since it's the single shared
   template for all of them).
   ============================================ */

const API_BASE = "https://neofragrances-server.onrender.com";
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
      avgRating: Number(p.avg_rating) || 0,
      reviewCount: p.review_count || 0,
      description: p.description || "",
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

function money(amount) {
  return `GH₵${Number(amount).toFixed(2)}`;
}

function productCard(p) {
  return `
  <div class="product-card" data-id="${p.id}" data-name="${p.name.toLowerCase()}" data-brand="${p.brand}" data-cat="${p.category}" data-price="${p.price}" tabindex="0" role="link" aria-label="View details for ${p.name}">
    <div class="product-media">
      ${p.badge ? `<span class="product-badge${p.badge === 'New' ? ' badge-new' : ''}">${p.badge}</span>` : ""}
      <button class="wishlist-btn" data-id="${p.id}" onclick="toggleWishlist(${p.id}, this)" title="Save to wishlist" aria-label="Save ${p.name} to wishlist"><i class="fa-regular fa-heart"></i></button>
      ${productMedia(p.image, p.name)}
    </div>
    <div class="product-info">
      <span class="product-brand">${p.brand}</span>
      <h3 class="product-name">${p.name}</h3>
      <span class="product-cat">${capitalize(p.category)}</span>
      <div class="product-price-row">
                <span class="product-price">${money(p.price)}</span>
        <span class="${p.stock ? 'stock-yes' : 'stock-no'}">${p.stock ? 'In stock' : 'Out of stock'}</span>
      </div>
    </div>
    <div class="product-actions">
      <button class="btn btn-primary add-to-cart" data-id="${p.id}" ${p.stock ? "" : "disabled"}><i class="fa-solid fa-bag-shopping"></i>&nbsp; Add to Cart</button>
      <a href="product-details.html?id=${p.id}" class="view-details-link">View details <i class="fa-solid fa-chevron-right"></i></a>
    </div>
  </div>`;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function skeletonGrid(count = 8) {
  let html = "";
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-card">
        <div class="skeleton-img skeleton-shimmer"></div>
        <div class="skeleton-line skeleton-shimmer w-60"></div>
        <div class="skeleton-line skeleton-shimmer w-80"></div>
        <div class="skeleton-line skeleton-shimmer w-40"></div>
      </div>`;
  }
  return html;
}

/* ---------- Whole-card navigation to product details ----------
   Single delegated listener, so this works for every product card
   on every page (products.html, homepage, wishlist.html, related-
   products grids), no matter which script rendered it, and works
   for cards added dynamically after this script runs. */
function navigateToProductFromCard(card) {
  const id = card.dataset.id;
  if (!id) return;
  window.location.href = `product-details.html?id=${id}`;
}

document.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;

  // Let these keep handling themselves — do not navigate for them.
  if (e.target.closest(".wishlist-btn")) return;
  if (e.target.closest(".add-to-cart")) return;
  if (e.target.closest(".view-details-link")) return; // its own href already goes to the right place

  navigateToProductFromCard(card);
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest(".product-card");
  if (!card) return;
  // Only trigger card-level navigation when the card itself has focus —
  // if a button/link inside it has focus, let that element's own
  // Enter/Space behavior run instead (native button/link activation).
  if (e.target !== card) return;
  e.preventDefault();
  navigateToProductFromCard(card);
});

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();

  if (window.AOS) {
    AOS.init({ duration: 700, once: true, offset: 60 });
  }