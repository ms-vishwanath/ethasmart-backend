document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("error-msg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    msg.innerText = "Checking...";
    msg.style.color = "#cbd5e1";

    try {
      const apiBase = (window.ETHASMART_CONFIG && window.ETHASMART_CONFIG.API_BASE) || "http://127.0.0.1:7021";
      const res = await fetch(apiBase + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("ethasmartLoggedIn", "true");
        localStorage.setItem("ethasmartUser", username);
        window.location.href = "dashboard.html";
      } else {
        msg.style.color = "#ff6b6b";
        msg.innerText = data.error || "Login failed";
      }
    } catch (err) {
      msg.style.color = "#ff6b6b";
      msg.innerText = "Backend not reachable ❌";
      console.error(err);
    }
  });
});