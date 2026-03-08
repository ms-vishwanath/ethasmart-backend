console.log("✅ script.js running");
const API = (window.ETHASMART_CONFIG && window.ETHASMART_CONFIG.API_BASE) || "http://127.0.0.1:7021";
document.addEventListener("DOMContentLoaded", () => {
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
  };
  const safeJSON = async (res) => {
    try { return await res.json(); } catch { return {}; }
  };
  const trend = { labels: [], temp: [], ph: [], time: [], yield: [] };
  let tempChartObj = null, phChartObj = null, timeChartObj = null, yieldChartObj = null;

  // ------------------ NEW FEATURES ------------------
  window.toggleTheme = function () {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    localStorage.setItem("ethasmartTheme", isLight ? "light" : "dark");

    // Update theme toggle button text
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      if (isLight) {
        btn.innerHTML = `<i class="fas fa-moon"></i> Dark Mode`;
      } else {
        btn.innerHTML = `<i class="fas fa-sun"></i> Light Mode`;
      }
    }
  };

  // Check saved theme on load
  if (localStorage.getItem("ethasmartTheme") === "light") {
    document.body.classList.add("light-mode");
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.innerHTML = `<i class="fas fa-moon"></i> Dark Mode`;
  }

  window.toggleNotifications = function () {
    const dropdown = document.getElementById("notifDropdown");
    if (dropdown) {
      dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
    }
  };

  window.openModal = function (machineName, severity, msg) {
    const modal = document.getElementById("machineModal");
    if (!modal) return;
    document.getElementById("modalMachineName").innerText = machineName;
    document.getElementById("modalMachineStatus").innerText = severity;
    // color status
    const statusEl = document.getElementById("modalMachineStatus");
    statusEl.style.color = severity === "High" ? "#ef4444" : (severity === "Medium" ? "#f59e0b" : "#3b82f6");
    document.getElementById("modalMachineMsg").innerText = msg;

    const d = new Date();
    document.getElementById("modalMachineDate").innerText = d.toLocaleDateString() + " " + d.toLocaleTimeString();

    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("show"), 10);
  };

  window.closeModal = function (e, force = false) {
    const modal = document.getElementById("machineModal");
    if (!modal) return;
    if (force || e.target === modal) {
      modal.classList.remove("show");
      setTimeout(() => modal.style.display = "none", 300);
    }
  };

  function createLineChart(canvasId, label, dataArr, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (typeof Chart === "undefined") {
      console.error("❌ Chart.js not loaded. Check chart.umd.min.js include in HTML.");
      return null;
    }
    const ctx = canvas.getContext("2d");
    return new Chart(ctx, {
      type: "line",
      data: {
        labels: trend.labels,
        datasets: [{
          label,
          data: dataArr,
          borderColor: color,
          backgroundColor: color.replace("1)", "0.15)"),
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { labels: { color: "white" } } },
        scales: {
          x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(255,255,255,0.05)" } }
        }
      }
    });
  }

  function initDashboardChartsIfNeeded() {
    if (!tempChartObj) tempChartObj = createLineChart("tempChart", "Temperature (°C)", trend.temp, "rgba(255,99,132,1)");
    if (!phChartObj) phChartObj = createLineChart("phChart", "pH Level", trend.ph, "rgba(54,162,235,1)");
    if (!timeChartObj) timeChartObj = createLineChart("timeChart", "Fermentation Time (hrs)", trend.time, "rgba(255,206,86,1)");
    if (!yieldChartObj) yieldChartObj = createLineChart("yieldChart", "Predicted Yield (%)", trend.yield, "rgba(0,245,196,1)");
  }

  function pushPoint(maxPoints, tempStr, phStr, timeStr, yieldStr) {
    const label = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    const t = parseFloat(String(tempStr).replace("°C", ""));
    const p = parseFloat(String(phStr));
    const ti = parseFloat(String(timeStr).replace("hrs", "").replace("hr", "").trim());
    const y = parseFloat(String(yieldStr).replace("%", ""));

    trend.labels.push(label);
    trend.temp.push(isNaN(t) ? null : t);
    trend.ph.push(isNaN(p) ? null : p);
    trend.time.push(isNaN(ti) ? null : ti);
    trend.yield.push(isNaN(y) ? null : y);

    while (trend.labels.length > maxPoints) {
      trend.labels.shift();
      trend.temp.shift();
      trend.ph.shift();
      trend.time.shift();
      trend.yield.shift();
    }
  }

  async function loadDashboardData() {

    if (!document.getElementById("temp") && !document.getElementById("tempChart")) return;

    try {
      const res = await fetch(`${API}/api/dashboard`);
      const data = await safeJSON(res);

      if (!res.ok) throw new Error(data.error || "Dashboard fetch failed");

      const statusEl = document.getElementById("backendStatus");
      if (statusEl) statusEl.innerHTML = `<span class="pulse-dot"></span>Connected`;
      setText("temp", data.temperature);
      setText("ph", data.ph);
      setText("time", data.time);
      setText("yield", data.yield);
      setText("suggestion", data.ai_insight);

      setText("yieldNum", data.yield);
      setText("yieldBig", data.yield);
      const yieldVal = parseFloat(String(data.yield).replace("%", ""));
      const yieldBar = document.getElementById("yieldBar");
      if (yieldBar && !isNaN(yieldVal)) {
        yieldBar.style.width = yieldVal + "%";
      }

      initDashboardChartsIfNeeded();
      pushPoint(12, data.temperature, data.ph, data.time, data.yield);

      tempChartObj?.update();
      phChartObj?.update();
      timeChartObj?.update();
      yieldChartObj?.update();
    } catch (e) {
      const statusEl2 = document.getElementById("backendStatus");
      if (statusEl2) statusEl2.innerHTML = `Backend not reachable ❌`;
      console.log("Dashboard fetch error:", e);
    }
  }

  // ------------------ ENERGY ------------------
  let energyChart = null;
  const energyLabels = [];
  const energyData = [];

  async function loadEnergyData() {
    if (!document.getElementById("energyChart") &&
      !document.getElementById("todayKwh")) return;

    try {
      const res = await fetch(`${API}/api/energy`);
      const d = await safeJSON(res);
      if (!res.ok) throw new Error(d.error || "Energy fetch failed");

      setText("todayKwh", d.today_kwh + " kWh");
      setText("yesterdayKwh", d.yesterday_kwh + " kWh");
      setText("efficiency", d.efficiency_score + "%");
      setText("savings", d.savings_percent + "%");

      if (!document.getElementById("energyChart")) return;

      energyLabels.push(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      energyData.push(d.today_kwh);

      while (energyLabels.length > 10) {
        energyLabels.shift();
        energyData.shift();
      }

      if (!energyChart) {
        if (typeof Chart === "undefined") {
          console.error("❌ Chart.js not loaded on energy page. Add chart.umd.min.js in energy.html");
          return;
        }

        const ctx = document.getElementById("energyChart").getContext("2d");
        energyChart = new Chart(ctx, {
          type: "line",
          data: {
            labels: energyLabels,
            datasets: [{
              label: "Today Usage (kWh)",
              data: energyData,
              borderColor: "rgba(0,245,196,1)",
              backgroundColor: "rgba(0,245,196,0.15)",
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: { legend: { labels: { color: "white" } } },
            scales: {
              x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(255,255,255,0.05)" } },
              y: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(255,255,255,0.05)" } }
            }
          }
        });
      } else {
        energyChart.update();
      }
    } catch (e) {
      console.log("Energy fetch error:", e);
    }
  }

  // ------------------ MAINTENANCE ------------------
  async function loadMaintenanceData() {
    try {
      const res = await fetch(`${API}/api/maintenance`);
      const d = await safeJSON(res);
      if (!res.ok) throw new Error(d.error || "Maintenance fetch failed");

      if (document.getElementById("overallStatus")) {
        setText("overallStatus", d.overall_status);
      }

      const box = document.getElementById("alertsBox");
      if (box) {
        box.innerHTML = "";
        (d.alerts || []).forEach(a => {
          const div = document.createElement("div");
          div.className = "alert-item";
          div.style.cursor = "pointer";
          div.onclick = () => window.openModal(a.machine, a.severity, a.msg);
          div.innerHTML = `<b>${a.machine}</b> — ${a.severity}<br>${a.msg}`;
          box.appendChild(div);
        });
      }

      // Update Notifications Dropdown globally
      const notifList = document.getElementById("notifList");
      const notifBadge = document.getElementById("notifBadge");
      if (notifList && notifBadge) {
        notifList.innerHTML = "";
        const alerts = d.alerts || [];
        if (alerts.length > 0) {
          notifBadge.style.display = "block";
          notifBadge.innerText = alerts.length;
          alerts.forEach(a => {
            const item = document.createElement("div");
            item.className = `notif-item ${a.severity.toLowerCase()}`;
            item.innerHTML = `<b>${a.machine}</b> - ${a.severity}<br><span style="font-size:11px;">${a.msg}</span>`;
            if (document.getElementById("machineModal")) {
              item.style.cursor = "pointer";
              item.onclick = () => window.openModal(a.machine, a.severity, a.msg);
            }
            notifList.appendChild(item);
          });
        } else {
          notifBadge.style.display = "none";
          notifList.innerHTML = `<div class="notif-item" style="color:#cbd5e1; text-align:center;">No new alerts.</div>`;
        }
      }
    } catch (e) {
      console.log("Maintenance fetch error:", e);
    }
  }

  // ------------------ INSIGHTS ------------------
  async function loadInsightsData() {
    if (!document.getElementById("recList") && !document.getElementById("riskLevel") && !document.getElementById("riskLabel")) return;

    try {
      const res = await fetch(`${API}/api/insights`);
      const data = await safeJSON(res);
      if (!res.ok) throw new Error(data.error || "Insights fetch failed");

      const statusEl = document.getElementById("backendStatus");
      if (statusEl) statusEl.innerHTML = `<span class="pulse-dot"></span>Connected`;
      setText("riskLevel", data.risk_level);
      setText("riskLabel", data.risk_level);
      setText("insightSummary", data.summary);

      const ul = document.getElementById("recList");
      if (!ul) return;

      ul.innerHTML = "";
      (data.recommendations || []).forEach(r => {
        const li = document.createElement("li");
        li.innerText = r;
        ul.appendChild(li);
      });
    } catch (e) {
      const statusEl2 = document.getElementById("backendStatus");
      if (statusEl2) statusEl2.innerHTML = `Backend not reachable ❌`;
      console.log("Insights fetch error:", e);
    }
  }

  // ------------------ CHAT (GLOBAL) ------------------
  window.sendChat = async function () {
    const input = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");
    if (!input || !chatBox) return;

    const text = input.value.trim();
    if (!text) return;

    chatBox.innerHTML += `<div style="margin-top:8px; color:#00f5c4;"><b>You:</b> ${text}</div>`;
    input.value = "";

    const loadingId = "loading_" + Date.now();
    chatBox.innerHTML += `<div id="${loadingId}" style="margin-top:8px;"><b>AI:</b> Typing...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await safeJSON(res);

      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.outerHTML = `<div style="margin-top:8px;"><b>AI:</b> ${data.reply || "No reply"}</div>`;
      chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
      const loadingEl = document.getElementById(loadingId);
      if (loadingEl) loadingEl.outerHTML =
        `<div style="margin-top:8px; color:#ff6b6b;"><b>AI:</b> Backend not reachable.</div>`;
    }
  };

  const chatInput = document.getElementById("chatInput");
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        window.sendChat();
      }
    });
  }

  // ------------------ start polling ------------------
  loadDashboardData();
  loadEnergyData();
  loadMaintenanceData();
  loadInsightsData();

  const cfg = window.ETHASMART_CONFIG || {};
  setInterval(loadDashboardData, cfg.DASHBOARD_POLL_MS || 3000);
  setInterval(loadEnergyData, cfg.ENERGY_POLL_MS || 1000);
  setInterval(loadMaintenanceData, cfg.MAINTENANCE_POLL_MS || 5000);
  setInterval(loadInsightsData, cfg.INSIGHTS_POLL_MS || 1000);
});