from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time
import os

app = Flask(__name__)
CORS(app)

users = {
    "admin": "admin"   
}

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "EthaSmart Backend Running ✅"})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if username in users and users[username] == password:
        return jsonify({"message": "Login successful"}), 200

    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    if username in users:
        return jsonify({"error": "User already exists"}), 409

    users[username] = password
    return jsonify({"message": "User created successfully"}), 201

@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    new_password = (data.get("new_password") or "").strip()

    if not username or not new_password:
        return jsonify({"error": "Username and new password required"}), 400

    if username not in users:
        return jsonify({"error": "User not found"}), 404

    users[username] = new_password
    return jsonify({"message": "Password updated ✅"}), 200

state = {
    "temp": 32.0,
    "ph": 5.20,
    "time_hrs": 18,
    "yield": 96.4,
    "last": time.time()
}

def clamp(value, low, high):
    return max(low, min(high, value))

@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    state["temp"] = clamp(state["temp"] + random.uniform(-0.3, 0.3), 30.0, 36.0)
    state["ph"] = clamp(state["ph"] + random.uniform(-0.03, 0.03), 4.8, 5.5)
    state["time_hrs"] = int(clamp(state["time_hrs"] + random.choice([-1, 0, 0, 1]), 14, 20))
    state["yield"] = clamp(state["yield"] + random.uniform(-0.4, 0.4), 92.0, 98.5)

    temp = round(state["temp"], 1)
    ph = round(state["ph"], 2)
    time_hrs = state["time_hrs"]
    yld = round(state["yield"], 1)

    insight = "Process stable ✅"
    if temp > 35:
        insight = "High temperature detected → Reduce by 1°C."
    elif temp < 31:
        insight = "Low temperature → Increase slightly."
    if ph < 5.0:
        insight += " pH low → Add buffer solution."

    return jsonify({
        "temperature": f"{temp}°C",
        "ph": f"{ph}",
        "time": f"{time_hrs} hrs",
        "yield": f"{yld}%",
        "ai_insight": insight
    })

@app.route("/api/insights", methods=["GET"])
def insights():
    temp = round(state["temp"], 1)
    ph = round(state["ph"], 2)
    yld = round(state["yield"], 1)

    risk = "Low"
    if temp > 35 or ph < 5.0:
        risk = "Medium"
    if temp > 35.5 and ph < 5.0:
        risk = "High"

    return jsonify({
        "risk_level": risk,
        "summary": "AI analyzed the current fermentation state.",
        "recommendations": [
            f"Maintain temperature around 33°C (current: {temp}°C).",
            f"Keep pH near 5.2 (current: {ph}).",
            f"Target yield above 96% (current: {yld}%)."
        ]
    })

@app.route("/api/energy", methods=["GET"])
def energy():
    today_kwh = round(random.uniform(110, 160), 1)
    yesterday_kwh = round(today_kwh + random.uniform(-15, 15), 1)
    efficiency = int(clamp(random.uniform(70, 95), 0, 100))
    savings = int(clamp((yesterday_kwh - today_kwh) / max(yesterday_kwh, 1) * 100, -20, 30))

    return jsonify({
        "today_kwh": today_kwh,
        "yesterday_kwh": yesterday_kwh,
        "efficiency_score": efficiency,
        "savings_percent": savings
    })

@app.route("/api/maintenance", methods=["GET"])
def maintenance():
    machines = ["Boiler-1", "Pump-3", "Motor-2", "Compressor-1", "Valve-7"]
    severities = ["Low", "Medium", "High"]

    alerts = []
    for _ in range(random.randint(1, 3)):
        m = random.choice(machines)
        s = random.choice(severities)
        msg = {
            "Low": "Routine check recommended in next service cycle.",
            "Medium": "Abnormal trend detected; schedule inspection.",
            "High": "Immediate attention required to avoid failure."
        }[s]
        alerts.append({"machine": m, "severity": s, "msg": msg})

    return jsonify({
        "overall_status": "Stable" if all(a["severity"] != "High" for a in alerts) else "Attention Needed",
        "alerts": alerts
    })
    
@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    msg = (data.get("message") or "").strip().lower()

    temp = round(state["temp"], 1)
    ph = round(state["ph"], 2)
    t_hr = state["time_hrs"]
    yld = round(state["yield"], 1)

    if not msg:
        return jsonify({"reply": "Type a question like: what is temperature? or how to improve yield?"})

    try:
        if "GEMINI_API_KEY" in os.environ:
            from google import genai
            client = genai.Client()
            system_instruction = f"""
            You are Ethasmart AI, an intelligent assistant for a fermentation optimization dashboard.
            Current Fermentation State:
            - Temperature: {temp}°C (Ideal: ~32-34°C)
            - pH Level: {ph} (Ideal: ~5.1-5.2)
            - Fermentation Time: {t_hr} hours
            - Predicted Yield: {yld}% (Target: ≥ 96%)
            
            Based on this real-time data, answer the user's question concisely and accurately. Limit responses to 2-3 sentences max.
            """
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=msg,
                config=genai.types.GenerateContentConfig(
                    system_instruction=system_instruction,
                ),
            )
            return jsonify({"reply": response.text})
    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Fallback to mock logic if API call fails or key is missing

    # Fallback mock logic
    if "temperature" in msg or "temp" in msg:
        reply = f"Current temperature is {temp}°C. Best range is ~32–34°C for stable fermentation."
    elif "ph" in msg:
        reply = f"Current pH is {ph}. Ideal is around 5.1–5.2. If it goes below 5.0, add buffer."
    elif "yield" in msg:
        reply = f"Current predicted yield is {yld}%. Keep temp and pH stable to improve yield."
    elif "time" in msg or "fermentation" in msg:
        reply = f"Current fermentation time is {t_hr} hrs. Increasing time may improve yield but increases energy use."
    elif "energy" in msg or "power" in msg:
        reply = "Energy tip: avoid peak loads, keep motors maintained, and control temperature to reduce kWh."
    elif "maintenance" in msg or "pump" in msg or "motor" in msg:
        reply = "Maintenance tip: inspect filters, monitor vibration/temperature, and schedule checks for abnormal trends."
    elif "hello" in msg or "hi" in msg:
        reply = "Hi! Ask me about temperature, pH, yield, energy, or maintenance."
    else:
        reply = "Ask me about temperature, pH, fermentation time, yield, energy, or maintenance."

    return jsonify({"reply": reply})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7021))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() in ("1", "true", "yes")
    app.run(host="0.0.0.0", port=port, debug=debug)