/* ============================================
   NeoFragrances — auth.js (Phase 4)
   Handles real Register/Login against the API,
   and stores the returned token + user info so
   the site can tell if someone is logged in.

   Relies on API_BASE, which is already defined
   in main.js — make sure main.js loads first.
   ============================================ */

const AUTH_KEY = "neofragrances_auth";

function saveAuth(token, user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
}

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch (e) {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function isLoggedIn() {
  return !!getAuth()?.token;
}

async function registerUser({ fullName, email, phone, password }) {
  const res = await fetch(`${API_BASE}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, phone, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed.");
  saveAuth(data.token, data.user);
  return data.user;
}

async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed.");
  saveAuth(data.token, data.user);
  return data.user;
}

function logoutUser() {
  clearAuth();
  window.location.href = "index.html";
}
function updateAccountNav() {
  const auth = getAuth();
  if (!auth || !auth.user) return;

  try {
    const mobileItems = document.querySelectorAll(".mobile-account-item");
    const loginItem = Array.from(mobileItems).find(li => li.querySelector('a[href="login.html"]'));

    if (loginItem) {
      loginItem.innerHTML = `<div style="padding:4px 0; font-weight:700; color:var(--ink);">${auth.user.full_name}</div>`;

      const accountLi = document.createElement("li");
      accountLi.className = "mobile-account-item";
      accountLi.innerHTML = `<a href="my-account.html"><i class="fa-regular fa-id-badge"></i>&nbsp;My Account</a>`;
      loginItem.after(accountLi);

      const ordersItem = Array.from(mobileItems).find(li => li.querySelector('a[href="my-orders.html"]'));
      if (ordersItem && !document.getElementById("mobile-logout-btn")) {
        const logoutLi = document.createElement("li");
        logoutLi.className = "mobile-account-item";
        logoutLi.innerHTML = `<a href="#" id="mobile-logout-btn" style="color:#C0392B; font-weight:600;"><i class="fa-solid fa-arrow-right-from-bracket"></i>&nbsp;Logout</a>`;
        ordersItem.after(logoutLi);
        document.getElementById("mobile-logout-btn").addEventListener("click", (e) => {
          e.preventDefault();
          if (confirm("Log out of your account?")) logoutUser();
        });
      }
    }
  } catch (err) {
    console.error("Mobile account nav update failed:", err);
  }

  try {
    document.querySelectorAll('.nav-icons a[href="login.html"]').forEach(icon => {
      icon.href = "my-account.html";
      icon.title = auth.user.full_name;
      const i = icon.querySelector("i");
      if (i) { i.classList.remove("fa-regular"); i.classList.add("fa-solid"); }
    });
  } catch (err) {
    console.error("Desktop icon update failed:", err);
  }
}
document.addEventListener("DOMContentLoaded", updateAccountNav);