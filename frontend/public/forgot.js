document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotForm");
  const msg = document.getElementById("fp_msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("fp_username").value.trim();
    const new_password = document.getElementById("fp_newpass").value.trim();

    msg.style.color = "#00f5c4";
    msg.innerText = "Updating...";

    try {
      const apiBase = (window.ETHASMART_CONFIG && window.ETHASMART_CONFIG.API_BASE) || "http://127.0.0.1:7021";
      const res = await fetch(apiBase + "/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, new_password })
      });

      const data = await res.json();

      if (res.ok) {
        msg.style.color = "#00f5c4";
        msg.innerText = "Password updated ✅ Redirecting...";
        setTimeout(() => window.location.href = "index.html", 1200);
      } else {
        msg.style.color = "#ff6b6b";
        msg.innerText = data.error || "Failed to update password";
      }
    } catch (err) {
      msg.style.color = "#ff6b6b";
      msg.innerText = "Backend not reachable ❌";
    }
  });
});