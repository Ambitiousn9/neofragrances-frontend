/* ============================================
   NeoFragrances — offers.js
   Powers special-offers.html. Everything shown here
   (prices, discounts, countdown, which product is
   featured) comes from GET /api/offers/active —
   nothing is hardcoded. The Admin Portal is the
   source of truth; this file only renders what the
   API returns.
   ============================================ */

let OFFERS = [];
let ACTIVE_OFFER_FILTER = "all";
let COUNTDOWN_INTERVAL = null;

async function loadActiveOffers() {
  try {
    const res = await fetch(`${API_BASE}/api/offers/active`);
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    OFFERS = await res.json();
  } catch (err) {
    console.error("Could not load offers:", err);
    OFFERS = [];
  }
  renderOffersPage();
}

function offerDiscountBadge(offer) {
  if (offer.offer_type === "flash_sale") return "FLASH SALE";
  if (offer.badge) return offer.badge.toUpperCase();
  return "SALE";
}

/* ---------- Countdown: built from the offer's real end_at, recomputed
   every tick from the actual clock — never reset on reload. ---------- */
function formatCountdownParts(endAt) {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

function pad2(n) { return String(n).padStart(2, "0"); }

function startCountdowns() {
  if (COUNTDOWN_INTERVAL) clearInterval(COUNTDOWN_INTERVAL);
  COUNTDOWN_INTERVAL = setInterval(() => {
    document.querySelectorAll("[data-countdown-end]").forEach(el => {
      const parts = formatCountdownParts(el.dataset.countdownEnd);
      if (!parts) {
        // Offer expired while the customer was on the page — reload
        // from the API rather than just hiding the timer, since the
        // whole offer needs to disappear from the grid too.
        clearInterval(COUNTDOWN_INTERVAL);
        loadActiveOffers();
        return;
      }
      const d = el.querySelector(".cd-days"), h = el.querySelector(".cd-hours"),
            m = el.querySelector(".cd-minutes"), s = el.querySelector(".cd-seconds");
      if (d) d.textContent = pad2(parts.days);
      if (h) h.textContent = pad2(parts.hours);
      if (m) m.textContent = pad2(parts.minutes);
      if (s) s.textContent = pad2(parts.seconds);
    });
  }, 1000);
}

function countdownHTML(endAt) {
  return `
    <div class="offer-countdown" data-countdown-end="${endAt}" aria-label="Offer ends soon">
      <div class="cd-unit"><span class="cd-days">00</span><small>Days</small></div>
      <div class="cd-unit"><span class="cd-hours">00</span><small>Hours</small></div>
      <div class="cd-unit"><span class="cd-minutes">00</span><small>Minutes</small></div>
      <div class="cd-unit"><span class="cd-seconds">00</span><small>Seconds</small></div>
    </div>`;
}

/* ---------- Featured flash sale banner ---------- */
function renderFeaturedOffer() {
  const wrap = document.getElementById("featured-offer-wrap");
  if (!wrap) return;
  const featured = OFFERS.find(o => o.featured) || OFFERS[0];

  if (!featured) {
    wrap.innerHTML = "";
    return;
  }

  wrap.innerHTML = `
    <div class="featured-offer-banner">
      <div class="featured-offer-media">${productMedia(featured.image || featured.product_image, featured.product_name)}</div>
      <div class="featured-offer-info">
        <span class="featured-offer-eyebrow"><i class="fa-solid fa-bolt"></i> ${offerDiscountBadge(featured)}</span>
        <h2>${featured.title}</h2>
        ${featured.description ? `<p class="featured-offer-desc">${featured.description}</p>` : ""}
        <div class="featured-offer-product">${featured.brand} — ${featured.product_name}</div>
        <div class="featured-offer-prices">
          <span class="offer-price-original">${money(featured.original_price)}</span>
          <span class="offer-price-sale">${money(featured.sale_price)}</span>
          <span class="offer-save-badge">SAVE ${featured.discount_percent}%</span>
        </div>
        <div class="offer-ends-label"><i class="fa-regular fa-clock"></i> Offer ends in</div>
        ${countdownHTML(featured.end_at)}
        <a href="product-details.html?id=${featured.product_id}" class="btn btn-primary featured-offer-cta">Shop Now</a>
      </div>
    </div>`;
}

/* ---------- Offer product card (mirrors productCard() from main.js,
   with sale pricing added) ---------- */
function offerCardHTML(offer) {
  const stock = offer.stock_qty > 0;
  return `
  <div class="product-card offer-card" data-id="${offer.product_id}" data-offer-type="${offer.offer_type}">
    <div class="product-media">
      <span class="product-badge">${offerDiscountBadge(offer)}</span>
      <button class="wishlist-btn" data-id="${offer.product_id}" onclick="toggleWishlist(${offer.product_id}, this)" title="Save to wishlist" aria-label="Save to wishlist"><i class="fa-regular fa-heart"></i></button>
      ${productMedia(offer.product_image, offer.product_name)}
    </div>
    <div class="product-info">
      <span class="product-brand">${offer.brand}</span>
      <h3 class="product-name">${offer.product_name}</h3>
      <span class="product-cat">${capitalize(offer.category)}</span>
      <div class="offer-price-row">
        <span class="offer-price-original">${money(offer.original_price)}</span>
        <span class="offer-price-sale">${money(offer.sale_price)}</span>
        <span class="offer-save-badge">SAVE ${offer.discount_percent}%</span>
      </div>
      <div class="product-price-row">
        <span class="${stock ? 'stock-yes' : 'stock-no'}">${stock ? 'In stock' : 'Out of stock'}</span>
      </div>
    </div>
    <div class="product-actions">
      <button class="btn btn-primary add-to-cart" data-id="${offer.product_id}" ${stock ? "" : "disabled"} aria-label="Add ${offer.product_name} to cart"><i class="fa-solid fa-bag-shopping"></i>&nbsp; Add to Cart</button>
      <a href="product-details.html?id=${offer.product_id}" class="view-details-link">View details <i class="fa-solid fa-chevron-right"></i></a>
    </div>
  </div>`;
}

function renderOfferChips() {
  const wrap = document.getElementById("offer-chips");
  if (!wrap) return;
  const types = ["all", ...new Set(OFFERS.map(o => o.offer_type))];
  const labels = { all: "All Offers", discount: "Percentage Discounts", flash_sale: "Flash Sales", new_arrival: "New Arrivals", bestseller: "Bestsellers", limited: "Limited Offers" };
  wrap.innerHTML = types.map(t =>
    `<button type="button" class="chip${t === ACTIVE_OFFER_FILTER ? " active" : ""}" data-filter="${t}">${labels[t] || capitalize(t)}</button>`
  ).join("");
  wrap.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      ACTIVE_OFFER_FILTER = chip.dataset.filter;
      renderOffersPage();
    });
  });
}

function renderOfferGrid() {
  const grid = document.getElementById("offers-grid");
  const emptyState = document.getElementById("offers-empty-state");
  if (!grid) return;

  const list = ACTIVE_OFFER_FILTER === "all" ? OFFERS : OFFERS.filter(o => o.offer_type === ACTIVE_OFFER_FILTER);

  if (list.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }
  if (emptyState) emptyState.style.display = "none";
  grid.innerHTML = list.map(offerCardHTML).join("");
  if (typeof refreshWishlistIcons === "function") refreshWishlistIcons();
}

function renderOffersPage() {
  const noOffersBanner = document.getElementById("no-offers-banner");
  if (OFFERS.length === 0) {
    if (noOffersBanner) noOffersBanner.style.display = "block";
    document.getElementById("featured-offer-wrap")?.replaceChildren();
    document.getElementById("offer-chips")?.replaceChildren();
    document.getElementById("offers-grid")?.replaceChildren();
    return;
  }
  if (noOffersBanner) noOffersBanner.style.display = "none";

  renderFeaturedOffer();
  renderOfferChips();
  renderOfferGrid();
  startCountdowns();
}

document.addEventListener("productsReady", (e) => {
  if (!document.getElementById("offers-grid")) return; // not on this page
  loadActiveOffers();
});
