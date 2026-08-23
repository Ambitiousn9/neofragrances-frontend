/* ============================================
   NeoFragrances — search.js (Phase 4)
   Client-side search/filter/sort for products.html.
   Waits for "productsReady" (fired by main.js once
   the API fetch finishes) before rendering anything,
   since PRODUCTS is empty until then.
   ============================================ */

let selectedBrand = "all";

function renderProductGrid(list) {
  const grid = document.getElementById("product-grid");
  const countEl = document.getElementById("results-count");
  if (countEl) countEl.textContent = list.length;
  if (!grid) return;
  grid.innerHTML = list.length
    ? list.map(productCard).join("")
    : `<p style="grid-column:1/-1; color:var(--ink-soft); padding:40px 0;">No fragrances match your filters.</p>`;
}

function renderBrandChips() {
  const row = document.getElementById("brand-chips");
  if (!row) return;

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
      applyFilters();
    });
  });
}

function applyFilters() {
  const searchTerm = (document.getElementById("search-input")?.value || "").toLowerCase();
  const category = document.getElementById("category-filter")?.value || "all";
  const price = document.getElementById("price-filter")?.value || "all";
  const sort = document.getElementById("sort-select")?.value || "featured";

  let results = PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.brand.toLowerCase().includes(searchTerm);
    const matchesCategory = category === "all" || p.category === category;
    const matchesBrand = selectedBrand === "all" || p.brand === selectedBrand;
    const matchesPrice =
      price === "all" ||
      (price === "under100" && p.price < 100) ||
      (price === "100to130" && p.price >= 100 && p.price <= 130) ||
      (price === "over130" && p.price > 130);
    return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
  });

  if (sort === "price-low") results.sort((a, b) => a.price - b.price);
  if (sort === "price-high") results.sort((a, b) => b.price - a.price);
  if (sort === "newest") results = results.filter(p => p.badge === "New").concat(results.filter(p => p.badge !== "New"));
  if (sort === "popular") results = results.filter(p => p.badge === "Bestseller").concat(results.filter(p => p.badge !== "Bestseller"));

  renderProductGrid(results);
}

function initProductsPage() {
  const grid = document.getElementById("product-grid");
  if (!grid) return; // not on products.html

  renderBrandChips();
  renderProductGrid(PRODUCTS);

  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  if (cat) {
    const catSelect = document.getElementById("category-filter");
    if (catSelect) catSelect.value = cat;
  }
  applyFilters();
}

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("product-grid");
  if (!grid) return; // not on products.html

  document.getElementById("product-grid").innerHTML =
    `<p style="grid-column:1/-1; color:var(--ink-soft); padding:40px 0;">Loading fragrances...</p>`;

  ["search-input", "category-filter", "price-filter", "sort-select"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", applyFilters);
  });
});

document.addEventListener("productsReady", (e) => {
  if (!document.getElementById("product-grid")) return;
  if (!e.detail.success) {
    document.getElementById("product-grid").innerHTML =
      `<p style="grid-column:1/-1; color:var(--wine); padding:40px 0;">Couldn't load products — make sure the backend server (node server.js) is running.</p>`;
    return;
  }
  initProductsPage();
});
