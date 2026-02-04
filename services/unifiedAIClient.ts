const API_BASE = "http://localhost:5001";

/* ----------------------------------
   🤖 AI TRANSPORT LAYER
   - NO dashboard logic
   - NO SensorData
---------------------------------- */
export async function askAI(message: string): Promise<string> {
  // 1️⃣ OFFLINE FIRST (Local AI)
  try {
    const res = await fetch(`${API_BASE}/ask_local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: message }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.response?.trim()) return data.response;
    }
  } catch {
    console.warn("Local AI unavailable");
  }
}
