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
