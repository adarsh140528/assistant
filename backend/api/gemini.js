export const config = {
  runtime: "edge",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export default async function handler(req) {
  try {
    if (req.method === "OPTIONS") return json({});

    if (req.method !== "POST") 
      return json({ error: "Use POST method only" }, 405);

    const { prompt } = await req.json().catch(() => ({}));

    if (!prompt) return json({ error: "Missing 'prompt'" }, 400);

    const apiKey = process.env.GEMINI_KEY;

    if (!apiKey) return json({ error: "No GEMINI_KEY set on Vercel" }, 500);

    // ✅ NEW OFFICIAL GOOGLE AI API ENDPOINT (Guaranteed working)
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + apiKey;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return json({ error: "Gemini API error", details: data }, 500);
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text 
                || "No response from Gemini";

    return json({ reply });
  } catch (err) {
    return json({ error: "Server crashed", details: err.message }, 500);
  }
}
