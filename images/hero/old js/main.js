/* ============================================
   NeoFragrances — main.js
   Sample product data + shared UI behaviour.
   In Phase 4 this PRODUCTS array will be replaced
   by data fetched from the MySQL database via PHP/Flask.
   ============================================ */

const PRODUCTS = [
  { id: 1, name: "Creed Aventus 100ml EDT", brand: "Creed", category: "Men", price: 145, stock: true, badge: "Bestseller",
    image: "images/perfumes/velvet-oud.jpg",
    notes: { top: "Bergamot,Pink Pepper", middle: "Pineapple,Patchouli", base: "Birch, Cedarwood" } },
  { id: 2, name: "Miss Dior 100ml EDT ", brand: "Christian Dior", category: "women", price: 98, stock: true, badge: "New",
    image: "images/perfumes/golden-bloom.jpg",
    notes: { top: "Mandarin, Neroli", middle: "Jasmine, Peony", base: "Musk, Vanilla" } },
  { id: 3, name: "Carolina Herrera Bad Boy Elixer 100ML EDP", brand: "Carolina Herrera", category: "men", price: 110, stock: true, badge: "",
    image: "images/perfumes/iron-cedar.jpg",
    notes: { top: "Grapefruit, Juniper", middle: "Cedar, Lavender", base: "Vetiver, Leather" } },
  { id: 4, name: "Dior J’adore intense 50ML EDT ", brand: "Christian Dior", category: "women", price: 132, stock: false, badge: "",
    image: "images/perfumes/silk-amber.jpg",
    notes: { top: "Saffron, Cardamom", middle: "Amber, Iris", base: "Vanilla, Tonka Bean" } },
  { id: 5, name: " Kilian Angels' Share 100ML EDP", brand: " BY Kilian", category: "unisex", price: 89, stock: true, badge: "",
    image: "images/perfumes/blue-horizon.jpg",
    notes: { top: "Sea Salt, Bergamot", middle: "Lavender, Rosemary", base: "Ambergris, Musk" } },
  { id: 6, name: "Amouage Interlude 100ml EDP", brand: "Amouage", category: "men", price: 121, stock: true, badge: "New",
    image: "images/perfumes/midnight-rose.jpg",
    notes: { top: "Blackcurrant, Pink Pepper", middle: "Rose, Patchouli", base: "Oud, Musk" } },
  { id: 7, name: "Gucci Bloom 100ML EPD ", brand: "Gucci", category: "women", price: 104, stock: true, badge: "",
    image: "images/perfumes/stone-smoke.jpg",
    notes: { top: "Bergamot, Elemi", middle: "Smoked Birch, Iris", base: "Guaiac Wood, Amber" } },
  { id: 8, name: "Baccarat Rouge 540 50ML EDP", brand: "Maison Francis Kurkdjian", category: "unisex", price: 76, stock: true, badge: "Bestseller",
    image: "images/perfumes/white-petal.jpg",
    notes: { top: "Lily, Citrus", middle: "White Tea, Freesia", base: "Cedar, Musk" } },
  { id: 9, name: "Bleu de Chanel 100ML EDT", brand: " CHANEL ", category: "men", price: 176, stock: true, badge: "Bestseller",
    image: "images/perfumes/Bleu.jpg", 
    notes: { top: "Lily, Citrus", middle: "White Tea, Freesia", base: "Cedar, Musk" } },
  { id: 10, name: "Amouage Guidance", brand: "Amouage", category: "women", price: 210, stock: true, badge: "",
    image: "images/perfumes/amouage-guidance.jpg",
    notes: { top: "Black Pepper, Nutmeg", middle: "Leather, Incense", base: "Oud, Amber" } },
  { id: 11, name: "Dior Sauvage Elixir", brand: "Dior", category: "men", price: 155, stock: true, badge: "Bestseller",
    image: "images/perfumes/dior-sauvage-elixir.jpg",
    notes: { top: "Cinnamon, Cardamom", middle: "Lavender, Nutmeg", base: "Amberwood, Vanilla" } },
  { id: 12, name: "Dior Sauvage", brand: "Dior", category: "men", price: 110, stock: true, badge: "Bestseller",
    image: "images/perfumes/dior-sauvage.jpg",
    notes: { top: "Bergamot, Pepper", middle: "Lavender, Sichuan Pepper", base: "Ambroxan, Cedar" } },
  { id: 13, name: "Stronger With You Intensely", brand: "Emporio Armani", category: "men", price: 98, stock: true, badge: "",
    image: "images/perfumes/stronger-with-you-intensely.jpg",
    notes: { top: "Cardamom, Pink Pepper", middle: "Toffee, Sage", base: "Vanilla, Amber" } },
  { id: 14, name: "Azzaro Most Wanted", brand: "Azzaro", category: "men", price: 88, stock: true, badge: "New",
    image: "images/perfumes/azzaro-most-wanted.jpg",
    notes: { top: "Cardamom, Toffee", middle: "Sage, Fir Balsam", base: "Amberwood, Tonka Bean" } },
  { id: 15, name: "JPG Ultra Male", brand: "Jean Paul Gaultier", category: "men", price: 92, stock: true, badge: "",
    image: "images/perfumes/jpg-ultra-male.jpg",
    notes: { top: "Lavender, Mint", middle: "Cardamom, Caramel", base: "Woody Notes, Patchouli" } },
  { id: 16, name: "Mancera Cedrat Boisé", brand: "Mancera", category: "unisex", price: 135, stock: true, badge: "",
    image: "images/perfumes/mancera-cedrat-boise.jpg",
    notes: { top: "Cedrat, Bergamot", middle: "Cedar, Spices", base: "Musk, Woody Notes" } },
  { id: 17, name: "Imperial Bois", brand: "Mancera", category: "unisex", price: 140, stock: true, badge: "",
    image: "images/perfumes/imperial-bois.jpg",
    notes: { top: "Saffron, Bergamot", middle: "Rose, Oud", base: "Sandalwood, Musk" } },
  { id: 18, name: "Tom Ford Ombré Leather", brand: "Tom Ford", category: "unisex", price: 255, stock: true, badge: "Bestseller",
    image: "images/perfumes/tomford-ombre-leather.jpg",
    notes: { top: "Cardamom, Chamomile", middle: "Leather, Jasmine", base: "Amber, Suede" } },
  { id: 19, name: "Ombré Nomade", brand: "Louis Vuitton", category: "unisex", price: 335, stock: true, badge: "Bestseller",
    image: "images/perfumes/ombre-nomade.jpg",
    notes: { top: "Oud, Berries", middle: "Rose, Incense", base: "Frankincense, Amber" } },
  { id: 20, name: "Vintage Radio 100ML EDP", brand: "Lattafah", category: "unisex", price: 125, stock: true, badge: "",
    image: "images/perfumes/vintage-radio.jpg",
    notes: { top: "Bergamot, Pepper", middle: "Iris, Violet", base: "Musk, Woody Notes" } },
  { id: 21, name: "Vanilla Voyage", brand: "Maison Asra", category: "women", price: 118, stock: true, badge: "",
    image: "images/perfumes/vanilla-voyage.jpg",
    notes: { top: "Bergamot, Pink Pepper", middle: "Cinnamon, Tonka", base: "Vanilla, Amber" } },
  { id: 22, name: "Lattafa Khamrah", brand: "Lattafa", category: "unisex", price: 38, stock: true, badge: "Bestseller",
    image: "images/perfumes/lattafa-khamrah.jpg",
    notes: { top: "Cinnamon, Nutmeg, Fruits", middle: "Dates, Cardamom", base: "Amber, Woody Notes" } },
  { id: 23, name: "Lattafa Eclaire", brand: "Lattafa", category: "women", price: 32, stock: true, badge: "",
    image: "images/perfumes/lattafa-eclaire.jpg",
    notes: { top: "Pear, Bergamot", middle: "Vanilla, Praline", base: "Musk, Sandalwood" } },
  { id: 24, name: "Lattafa Angham", brand: "Lattafa", category: "women", price: 30, stock: true, badge: "",
    image: "images/perfumes/lattafa-angham.jpg",
    notes: { top: "Citrus, Fruits", middle: "Floral Bouquet", base: "Musk, Amber" } },
  { id: 25, name: "Lattafa Yara", brand: "Lattafa", category: "women", price: 28, stock: true, badge: "Bestseller",
    image: "images/perfumes/lattafa-yara.jpg",
    notes: { top: "Orange Blossom, Pear", middle: "Jasmine, Tuberose", base: "Vanilla, Sandalwood, Tonka Bean" } },
  { id: 26, name: "Club de Nuit Intense Man", brand: "Armaf", category: "men", price: 42, stock: true, badge: "Bestseller",
    image: "images/perfumes/club-de-nuit-intense-man.jpg",
    notes: { top: "Pineapple, Blackcurrant", middle: "Birch, Jasmine", base: "Musk, Vanilla, Ambergris" } },
  { id: 27, name: "Club de Nuit Untold", brand: "Armaf", category: "men", price: 46, stock: true, badge: "New",
    image: "images/perfumes/club-de-nuit-untold.jpg",
    notes: { top: "Cardamom, Bergamot", middle: "Cinnamon, Praline", base: "Vanilla, Tonka Bean" } },
  { id: 28, name: "Club de Nuit Milestone", brand: "Armaf", category: "unisex", price: 49, stock: true, badge: "",
    image: "images/perfumes/club-de-nuit-milestone.jpg",
    notes: { top: "Saffron, Bergamot", middle: "Cinnamon, Cedar", base: "Amber, Musk" } },
  { id: 29, name: "Club de Nuit Intense Woman", brand: "Armaf", category: "women", price: 42, stock: true, badge: "",
    image: "images/perfumes/club-de-nuit-intense-woman.jpg",
    notes: { top: "Pear, Peach, Freesia", middle: "Jasmine, Amber", base: "Musk, Sandalwood" } },
    { id: 30, name: "Supremacy Collector's Edition", brand: "Afnan", category: "men", price: 55, stock: true, badge: "Bestseller",
    image: "images/perfumes/afnan-supremacy-collectors.jpg",
    notes: { top: "Bergamot, Pineapple", middle: "Lavender, Jasmine", base: "Vanilla, Tonka Bean, Musk" } },
];
    
/* Reusable bottle silhouette placeholder — swap for real product photos in /images/perfumes */
function bottleSVG(fill = "#2B1B2E") {
  return `<svg viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="24" y="4" width="12" height="10" rx="2" fill="${fill}" opacity="0.7"/>
    <rect x="21" y="14" width="18" height="8" rx="2" fill="${fill}" opacity="0.5"/>
    <path d="M14 26 h32 a4 4 0 0 1 4 4 v58 a6 6 0 0 1 -6 6 H16 a6 6 0 0 1 -6 -6 V30 a4 4 0 0 1 4 -4 Z" fill="${fill}"/>
    <rect x="18" y="46" width="24" height="22" rx="1" fill="#FAF6F0" opacity="0.9"/>
  </svg>`;
}

function handleImageError(img) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = bottleSVG();
  img.replaceWith(wrapper.firstElementChild);
}

function productMedia(imagePath, alt) {
  // Shows the real photo if it exists; falls back to the drawn bottle placeholder if the file is missing.
  return `<img src="${imagePath}" alt="${alt}" loading="lazy" onerror="handleImageError(this)">`;
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

/* Mobile nav toggle */
document.addEventListener("DOMContentLoaded", () => {
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
