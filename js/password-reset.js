/* ============================================
   NeoFragrances — password-reset.js (Phase 4)
   Handles both forgot-password.html and
   reset-password.html.

   IMPORTANT (worth understanding): a real deployed
   site would EMAIL the reset link, never show it on
   screen. It's shown here only because no email
   service (SMTP/Nodemailer) is set up for this
   coursework project — this keeps the flow fully
   testable without one.
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  const forgotForm = document.getElementById("forgot-form");
  if (forgotForm) {
    forgotForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("fp-email").value.trim();
      const resultEl = document.getElementById("fp-result");
      const btn = forgotForm.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Sending...";

      try {
        const res = await fetch(`${API_BASE}/api/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong.");

        if (data.resetLink) {
          resultEl.innerHTML = `
            <div style="background:#DAF3E1; color:#22733B; border:1px solid #b7e3c3; border-radius:4px; padding:14px 16px; font-size:13px;">
              In a real deployment this link would be emailed to you. For this demo, here it is directly:<br><br>
              <a href="${data.resetLink}" style="color:#22733B; font-weight:700; word-break:break-all;">${data.resetLink}</a>
            </div>`;
        } else {
          resultEl.innerHTML = `<p style="color:var(--ink-soft); font-size:14px;">${data.message}</p>`;
        }
      } catch (err) {
        resultEl.innerHTML = `<p style="color:var(--wine); font-size:14px;">${err.message}</p>`;
      } finally {
        btn.disabled = false;
        btn.textContent = "Send Reset Link";
      }
    });
  }

  const resetForm = document.getElementById("reset-form");
  if (resetForm) {
    resetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const password = document.getElementById("rp-password").value;
      const confirm = document.getElementById("rp-confirm").value;
      const resultEl = document.getElementById("rp-result");

      if (!token) {
        resultEl.innerHTML = `<p style="color:var(--wine); font-size:14px;">Missing reset token — use the link from the Forgot Password page.</p>`;
        return;
      }
      if (password.length < 6) {
        resultEl.innerHTML = `<p style="color:var(--wine); font-size:14px;">Password must be at least 6 characters.</p>`;
        return;
      }
      if (password !== confirm) {
        resultEl.innerHTML = `<p style="color:var(--wine); font-size:14px;">Passwords do not match.</p>`;
        return;
      }

      const btn = resetForm.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Resetting...";

      try {
        const res = await fetch(`${API_BASE}/api/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not reset your password.");

        resultEl.innerHTML = `<div style="background:#DAF3E1; color:#22733B; border:1px solid #b7e3c3; border-radius:4px; padding:14px 16px; font-size:13px; font-weight:600;">Password reset! Redirecting to login...</div>`;
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } catch (err) {
        resultEl.innerHTML = `<p style="color:var(--wine); font-size:14px;">${err.message}</p>`;
      } finally {
        btn.disabled = false;
        btn.textContent = "Reset Password";
      }
    });
  }
});
