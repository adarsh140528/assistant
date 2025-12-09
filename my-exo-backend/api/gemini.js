export default async function handler(req, res) {
  try {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST method" });
    }

    const { prompt } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: "Missing 'prompt'" });
    }

    const apiKey = process.env.GEMINI_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_KEY not set" });
    }

    // NEW WORKING ENDPOINT + MODEL
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok || data.error) {
      return res.status(500).json({
        error: "Gemini API error",
        details: data
      });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({
      error: "Server crashed",
      details: err.message
    });
  }
}
