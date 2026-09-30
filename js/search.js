/* ============================================
   NeoFragrances — search.js (pagination patch)
   Powers products.html ONLY. All search/filter/
   sort/pagination is now genuinely server-side:
   this file asks /api/products for exactly one
   page of results at a time (12 per page desktop,
   8 mobile) instead of loading the whole catalog
   and slicing it in the browser.

   The global PRODUCTS array (loaded by main.js,
   used everywhere else on the site) is untouched
   and still used here for one small, cheap thing:
   building the brand-filter chip list, since that
   needs to know every distinct brand up front.
   ============================================ */

let selectedBrand = "all";
let CURRENT_PAGE = 1;
let CURRENT_CATEGORY = "all";
let CURRENT_PRICE = "all";
let CURRENT_SORT = "featured";
let CURRENT_SEARCH = "";
let TOTAL_PAGES = 1;
let TOTAL_PRODUCTS = 0;
let searchDebounceTimer = null;

function getPerPage() {
  return window.innerWidth <= 640 ? 8 : 12;
}
let LAST_PER_PAGE = getPerPage();

function noFiltersActive() {
  return !CURRENT_SEARCH && CURRENT_CATEGORY === "all" && selectedBrand === "all" && CURRENT_PRICE === "all";
}

/* ---------- URL state ---------- */
function buildQueryString() {
  const params = new URLSearchParams();
  if (CURRENT_PAGE > 1) params.set("page", CURRENT_PAGE);
  if (CURRENT_CATEGORY !== "all") params.set("category", CURRENT_CATEGORY);
  if (selectedBrand !== "all") params.set("brand", selectedBrand);
  if (CURRENT_PRICE !== "all") params.set("price", CURRENT_PRICE);
  if (CURRENT_SORT !== "featured") params.set("sort", CURRENT_SORT);
  if (CURRENT_SEARCH) params.set("search", CURRENT_SEARCH);
  return params.toString();
}
function pushCurrentState() {
  const qs = buildQueryString();
  history.pushState({}, "", `${window.location.pathname}${qs ? "?" + qs : ""}`);
}
function replaceCurrentState() {
  const qs = buildQueryString();
  history.replaceState({}, "", `${window.location.pathname}${qs ? "?" + qs : ""}`);
}
function readStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  CURRENT_PAGE = Number(params.get("page")) || 1;
  CURRENT_CATEGORY = params.get("category") || "all";
  selectedBrand = params.get("brand") || "all";
  CURRENT_PRICE = params.get("price") || "all";
  CURRENT_SORT = params.get("sort") || "featured";
  CURRENT_SEARCH = params.get("search") || "";

  const catSelect = document.getElementById("category-filter");
  if (catSelect) catSelect.value = CURRENT_CATEGORY;
  const priceSelect = document.getElementById("price-filter");
  if (priceSelect) priceSelect.value = CURRENT_PRICE;
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.value = CURRENT_SORT;
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = CURRENT_SEARCH;
}

/* ---------- Brand chips (uses the existing global full-catalog PRODUCTS,
   loaded by main.js, only to know the distinct brand names) ---------- */
function renderBrandChips() {
  const row = document.getElementById("brand-chips");
  if (!row || !Array.isArray(PRODUCTS) || PRODUCTS.length === 0) return;

  const brands = ["all", ...new Set(PRODUCTS.map(p => p.brand))].sort((a, b) =>
    a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b)
  );

  row.innerHTML = brands.map(b =>
    `<button class="chip${b === selectedBrand ? " active" : ""}" data-brand="${b}">${b === "all" ? "All" : b}</button>`
  ).join("");

  row.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      selectedBrand = chip.dataset.brand;
      renderBrandChips();
      CURRENT_PAGE = 1;
      pushCurrentState();
      fetchProductsPage();
    });
  });
}

/* ---------- Results summary: "Showing 1-12 of 48 products" ---------- */
function renderResultsSummary(currentPage, perPage, totalProducts) {
  const el = document.getElementById("results-summary");
  if (!el) return;
  if (totalProducts === 0) {
    el.textContent = noFiltersActive() ? "No products found." : "No products match your search.";
    return;
  }
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalProducts);
  el.textContent = `Showing ${start}–${end} of ${totalProducts} products`;
}

/* ---------- Pagination controls ---------- */
function goToPage(p) {
  if (p < 1 || p > TOTAL_PAGES || p === CURRENT_PAGE) return;
  CURRENT_PAGE = p;
  pushCurrentState();
  fetchProductsPage();
  document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPaginationControls(currentPage, totalPages, totalProducts) {
  const wrap = document.getElementById("pagination-wrap");
  if (!wrap) return;
  if (totalProducts === 0 || totalPages <= 1) {
    wrap.innerHTML = "";
    return;
  }

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  let middleHTML;
  if (totalPages <= 5) {
    middleHTML = Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
      <button type="button" class="page-num${p === currentPage ? " active" : ""}" data-page="${p}" ${p === currentPage ? 'aria-current="page"' : ""}>${p}</button>
    `).join("");
  } else {
    middleHTML = `<span class="page-compact-label">Page ${currentPage} of ${totalPages}</span>`;
  }

  wrap.innerHTML = `
    <nav class="pagination" aria-label="Product pages">
      <button type="button" class="page-nav" id="page-prev" ${prevDisabled ? "disabled" : ""}>
        <i class="fa-solid fa-arrow-left"></i><span class="nav-label">&nbsp;Previous</span>
      </button>
      <div class="page-numbers">${middleHTML}</div>
      <button type="button" class="page-nav" id="page-next" ${nextDisabled ? "disabled" : ""}>
        <span class="nav-label">Next&nbsp;</span><i class="fa-solid fa-arrow-right"></i>
      </button>
    </nav>
  `;

  document.getElementById("page-prev")?.addEventListener("click", () => goToPage(currentPage - 1));
  document.getElementById("page-next")?.addEventListener("click", () => goToPage(currentPage + 1));
  wrap.querySelectorAll(".page-num").forEach(btn => {
    btn.addEventListener("click", () => goToPage(Number(btn.dataset.page)));
  });
}

/* ---------- Grid rendering ---------- */
function clearAllFilters() {
  CURRENT_SEARCH = "";
  CURRENT_CATEGORY = "all";
  CURRENT_PRICE = "all";
  CURRENT_SORT = "featured";
  selectedBrand = "all";
  CURRENT_PAGE = 1;

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  const catSelect = document.getElementById("category-filter");
  if (catSelect) catSelect.value = "all";
  const priceSelect = document.getElementById("price-filter");
  if (priceSelect) priceSelect.value = "all";
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.value = "featured";

  renderBrandChips();
  pushCurrentState();
  fetchProductsPage();
}

function renderProductGrid(list) {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  if (list.length) {
    grid.innerHTML = list.map(productCard).join("");
  } else if (noFiltersActive()) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px 0; color:var(--ink-soft);"><p>No products found.</p></div>`;
  } else {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:50px 0; color:var(--ink-soft);">
        <p style="margin-bottom:14px;">No products match your search.</p>
        <button type="button" class="btn btn-outline btn-sm" id="clear-filters-btn">Clear filters</button>
      </div>`;
    document.getElementById("clear-filters-btn")?.addEventListener("click", clearAllFilters);
  }
  if (window.AOS) AOS.refreshHard();
}

/* ---------- The actual server-side fetch: one page at a time ---------- */
async function fetchProductsPage() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = skeletonGrid(getPerPage());

  const params = new URLSearchParams();
  params.set("page", CURRENT_PAGE);
  params.set("limit", getPerPage());
  if (CURRENT_SEARCH) params.set("search", CURRENT_SEARCH);
  if (CURRENT_CATEGORY !== "all") params.set("category", CURRENT_CATEGORY);
  if (selectedBrand !== "all") params.set("brand", selectedBrand);
  if (CURRENT_PRICE !== "all") params.set("price", CURRENT_PRICE);
  if (CURRENT_SORT !== "featured") params.set("sort", CURRENT_SORT);

  try {
    const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
    if (!res.ok) throw new Error(`Server responded with ${res.status}`);
    const data = await res.json();

    CURRENT_PAGE = data.currentPage;
    TOTAL_PAGES = data.totalPages;
    TOTAL_PRODUCTS = data.totalProducts;

    const list = data.products.map(mapProductRow);
    renderProductGrid(list);
    renderResultsSummary(CURRENT_PAGE, data.perPage, TOTAL_PRODUCTS);
    renderPaginationControls(CURRENT_PAGE, TOTAL_PAGES, TOTAL_PRODUCTS);
    if (typeof refreshWishlistIcons === "function") refreshWishlistIcons();
    replaceCurrentState();
  } catch (err) {
    console.error("Could not load this page of products:", err);
    grid.innerHTML = `<p style="grid-column:1/-1; color:var(--wine); padding:40px 0;">We're having trouble loading products right now — please try refreshing in a moment.</p>`;
    const pagWrap = document.getElementById("pagination-wrap");
    if (pagWrap) pagWrap.innerHTML = "";
  }
}

/* ---------- Filter change handlers ---------- */
function onFilterChanged() {
  CURRENT_CATEGORY = document.getElementById("category-filter")?.value || "all";
  CURRENT_PRICE = document.getElementById("price-filter")?.value || "all";
  CURRENT_SORT = document.getElementById("sort-select")?.value || "featured";
  CURRENT_PAGE = 1;
  pushCurrentState();
  fetchProductsPage();
}

function onSearchInput() {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    CURRENT_SEARCH = document.getElementById("search-input")?.value.trim() || "";
    CURRENT_PAGE = 1;
    pushCurrentState();
    fetchProductsPage();
  }, 350);
}

/* ---------- Init ---------- */
function initProductsPage() {
  const grid = document.getElementById("product-grid");
  if (!grid) return; // not on products.html
  readStateFromURL();
  renderBrandChips();
  fetchProductsPage();
}

document.getElementById("filter-toggle-btn")?.addEventListener("click", () => {
  document.getElementById("filter-panel")?.classList.add("open");
  document.getElementById("filter-panel-overlay")?.classList.add("open");
});
function closeFilterPanel() {
  document.getElementById("filter-panel")?.classList.remove("open");
  document.getElementById("filter-panel-overlay")?.classList.remove("open");
}
document.getElementById("filter-panel-close")?.addEventListener("click", closeFilterPanel);
document.getElementById("filter-panel-overlay")?.addEventListener("click", closeFilterPanel);
document.getElementById("filter-panel-apply")?.addEventListener("click", closeFilterPanel);

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("product-grid")) return; // not on products.html

  initProductsPage();

  document.getElementById("search-input")?.addEventListener("input", onSearchInput);
  document.getElementById("category-filter")?.addEventListener("change", onFilterChanged);
  document.getElementById("price-filter")?.addEventListener("change", onFilterChanged);
  document.getElementById("sort-select")?.addEventListener("change", onFilterChanged);

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newPerPage = getPerPage();
      if (newPerPage !== LAST_PER_PAGE) {
        LAST_PER_PAGE = newPerPage;
        CURRENT_PAGE = 1;
        fetchProductsPage();
      }
    }, 300);
  });
});

// The global full-catalog load (main.js) may finish before or after our
// own paginated fetch — re-render brand chips whichever one lands last,
// so the chip list is never left empty.
document.addEventListener("productsReady", () => {
  if (!document.getElementById("product-grid")) return;
  renderBrandChips();
});

window.addEventListener("popstate", () => {
  if (!document.getElementById("product-grid")) return;
  readStateFromURL();
  renderBrandChips();
  fetchProductsPage();
});

