/* ============================================
   NeoFragrances — validation.js (Phase 3)
   Real-time + on-submit validation for Login,
   Register, and Contact. Works with the existing
   HTML as-is (no markup changes needed) — it
   targets fields by their existing IDs.

   No backend exists yet (Phase 4), so on a
   successful validation this shows a demo
   success message instead of actually logging
   in / creating an account / sending an email.
   ============================================ */

// Inject the small set of styles this needs, so no CSS file has to be touched.
(function injectValidationStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .field-error {
      color: #A3273F;
      font-size: 12px;
      margin-top: 5px;
      font-weight: 600;
    }
    .field input.invalid, .field select.invalid, .field textarea.invalid {
      border-color: #A3273F !important;
      box-shadow: 0 0 0 3px rgba(163,39,63,0.12) !important;
    }
    .field input.valid, .field select.valid, .field textarea.valid {
      border-color: #22733B !important;
    }
    .form-success {
      background: #DAF3E1;
      color: #22733B;
      border: 1px solid #b7e3c3;
      border-radius: 4px;
      padding: 14px 16px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 18px;
    }
  `;
  document.head.appendChild(style);
})();

function showFieldError(input, message) {
  input.classList.add("invalid");
  input.classList.remove("valid");
  let err = input.parentElement.querySelector(".field-error");
  if (!err) {
    err = document.createElement("div");
    err.className = "field-error";
    input.parentElement.appendChild(err);
  }
  err.textContent = message;
}

function clearFieldError(input) {
  input.classList.remove("invalid");
  input.classList.add("valid");
  const err = input.parentElement.querySelector(".field-error");
  if (err) err.remove();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value) {
  return /^[+0-9\s-]{7,16}$/.test(value.trim());
}

function validateField(input, rules) {
  const value = input.value.trim();

  if (rules.required && value === "") {
    showFieldError(input, "This field is required.");
    return false;
  }
  if (rules.email && value !== "" && !isValidEmail(value)) {
    showFieldError(input, "Enter a valid email address.");
    return false;
  }
  if (rules.phone && value !== "" && !isValidPhone(value)) {
    showFieldError(input, "Enter a valid phone number.");
    return false;
  }
  if (rules.minLength && value.length > 0 && value.length < rules.minLength) {
    showFieldError(input, `Must be at least ${rules.minLength} characters.`);
    return false;
  }
  if (rules.matchInput && value !== rules.matchInput.value.trim()) {
    showFieldError(input, "Passwords do not match.");
    return false;
  }

  clearFieldError(input);
  return true;
}

function attachLiveValidation(input, rules) {
  input.addEventListener("blur", () => validateField(input, rules));
  input.addEventListener("input", () => {
    if (input.classList.contains("invalid")) validateField(input, rules);
  });
}

function showFormSuccess(form, message) {
  let banner = form.querySelector(".form-success");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "form-success";
    form.prepend(banner);
  }
  banner.textContent = message;
  form.reset();
  form.querySelectorAll(".valid, .invalid").forEach(el => el.classList.remove("valid", "invalid"));
  form.querySelectorAll(".field-error").forEach(el => el.remove());
}

/* ---------- Login ---------- */
function initLoginValidation() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  if (!emailInput || !passwordInput) return;
  const form = emailInput.closest("form");

  attachLiveValidation(emailInput, { required: true, email: true });
  attachLiveValidation(passwordInput, { required: true });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const validEmail = validateField(emailInput, { required: true, email: true });
    const validPassword = validateField(passwordInput, { required: true });
    if (!validEmail || !validPassword) return;

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in...";

    try {
      const user = await loginUser({ email: emailInput.value.trim(), password: passwordInput.value });
      showFormSuccess(form, `Welcome back, ${user.full_name}! Redirecting...`);
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "index.html";
      setTimeout(() => (window.location.href = redirectTo), 1200);
    } catch (err) {
      const friendlyMessage = err.message === "Invalid email or password."
        ? "Unable to sign in. Please check your email and password."
        : err.message;
      showFieldError(passwordInput, friendlyMessage);
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In";
    }
  });
}

/* ---------- Register ---------- */
function initRegisterValidation() {
  const fullnameInput = document.getElementById("fullname");
  if (!fullnameInput) return;
  const form = fullnameInput.closest("form");
  const emailInput = document.getElementById("reg-email");
  const phoneInput = document.getElementById("phone");
  const passwordInput = document.getElementById("reg-password");
  const confirmInput = document.getElementById("confirm-password");

  attachLiveValidation(fullnameInput, { required: true });
  attachLiveValidation(emailInput, { required: true, email: true });
  attachLiveValidation(phoneInput, { required: true, phone: true });
  attachLiveValidation(passwordInput, { required: true, minLength: 6 });
  attachLiveValidation(confirmInput, { required: true, matchInput: passwordInput });

  // Re-check the confirm field if the password field changes after confirm was already filled in
  passwordInput.addEventListener("input", () => {
    if (confirmInput.value.trim() !== "") {
      validateField(confirmInput, { required: true, matchInput: passwordInput });
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const results = [
      validateField(fullnameInput, { required: true }),
      validateField(emailInput, { required: true, email: true }),
      validateField(phoneInput, { required: true, phone: true }),
      validateField(passwordInput, { required: true, minLength: 6 }),
      validateField(confirmInput, { required: true, matchInput: passwordInput }),
    ];
    if (!results.every(Boolean)) return;

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account...";

    try {
      const user = await registerUser({
        fullName: fullnameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        password: passwordInput.value,
      });
      showFormSuccess(form, `Welcome, ${user.full_name}! Your account was created. Redirecting...`);
      setTimeout(() => (window.location.href = "index.html"), 1200);
    } catch (err) {
      showFieldError(emailInput, err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account";
    }
  });
}

/* ---------- Contact ---------- */
function initContactValidation() {
  const nameInput = document.getElementById("c-name");
  if (!nameInput) return;
  const form = nameInput.closest("form");
  const emailInput = document.getElementById("c-email");
  const messageInput = document.getElementById("c-message");

  attachLiveValidation(nameInput, { required: true });
  attachLiveValidation(emailInput, { required: true, email: true });
  attachLiveValidation(messageInput, { required: true, minLength: 10 });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const results = [
      validateField(nameInput, { required: true }),
      validateField(emailInput, { required: true, email: true }),
      validateField(messageInput, { required: true, minLength: 10 }),
    ];
    if (results.every(Boolean)) {
      showFormSuccess(form, "Message ready to send! (Demo only — real delivery arrives once the backend is connected.)");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLoginValidation();
  initRegisterValidation();
  initContactValidation();
});
