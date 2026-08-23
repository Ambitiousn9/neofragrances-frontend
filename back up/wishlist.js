/* ============================================
   NeoFragrances — wishlist.js (Phase 4)
   Heart-button save/remove on every product card,
   plus rendering the dedicated wishlist.html page.
   ============================================ */

let WISHLIST_IDS = new Set();

async function loadWishlist() {
  if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
    WISHLIST_IDS = new Set();
    return;
  }
  try {
    const auth = getAuth();
    const res = await fetch(`${API_BASE}/api/wishlist`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    WISHLIST_IDS = new Set(data.map(p => p.id));
  } catch (err) {
    console.error("Could not load wishlist:", err);
  }
}

function refreshWishlistIcons() {
  document.querySelectorAll(".wishlist-btn").forEach(btn => {
    const id = Number(btn.dataset.id);
    const icon = btn.querySelector("i");
    if (WISHLIST_IDS.has(id)) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
      btn.classList.add("active");
    } else {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
      btn.classList.remove("active");
    }
  });
}

async function toggleWishlist(productId, btn) {
  if (typeof isLoggedIn !== "function" || !isLoggedIn()) {
    if (confirm("You need to be logged in to save items. Go to the login page?")) {
      window.location.href = "login.html";
    }
    return;
  }

  const auth = getAuth();
  const inWishlist = WISHLIST_IDS.has(productId);

  try {
    if (inWishlist) {
      await fetch(`${API_BASE}/api/wishlist/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      WISHLIST_IDS.delete(productId);
    } else {
      await fetch(`${API_BASE}/api/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ productId }),
      });
      WISHLIST_IDS.add(productId);
    }
    refreshWishlistIcons();
    if (document.getElementById("wishlist-grid")) renderWishlistPage();
  } catch (err) {
    alert("Something went wrong updating your wishlist.");
  }
}

function renderWishlistPage() {
  const grid = document.getElementById("wishlist-grid");
  if (!grid) return;
  const items = PRODUCTS.filter(p => WISHLIST_IDS.has(p.id));
  grid.innerHTML = items.length
    ? items.map(productCard).join("")
    : `<p style="grid-column:1/-1; color:var(--ink-soft); padding:40px 0;">Your wishlist is empty. <a href="products.html" style="color:var(--wine); font-weight:600;">Browse fragrances</a></p>`;
  refreshWishlistIcons();
}

document.addEventListener("productsReady", async (e) => {
  if (!e.detail.success) return;
  await loadWishlist();
  refreshWishlistIcons();
  if (document.getElementById("wishlist-grid")) renderWishlistPage();
});
