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

    // Read JSON body (Vercel parses req.body for us)
    const { prompt } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'prompt' in body" });
    }

    const apiKey = process.env.GEMINI_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_KEY not set in environment" });
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
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
          // If tools cause issues, we can add them later:
          // tools: [{ google_search: {} }]
        })
      }
    );

    const data = await geminiResponse.json();

    // If Gemini returned an error object
    if (!geminiResponse.ok || data.error) {
      return res.status(500).json({
        error: "Gemini API error",
        status: geminiResponse.status,
        details: data
      });
    }

    // Safely extract text from candidates
    const candidates = data.candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(500).json({
        error: "Gemini returned no text",
        details: data
      });
    }

    const parts = candidates[0].content?.parts || [];
    const text = parts
      .map(p => p.text || "")
      .join(" ")
      .trim();

    if (!text) {
      return res.status(500).json({
        error: "Gemini returned empty response",
        details: data
      });
    }

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: String(err)
    });
  }
}
