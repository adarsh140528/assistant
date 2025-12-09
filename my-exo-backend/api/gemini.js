export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
  
    const { prompt } = req.body;
  
    const apiKey = process.env.GEMINI_KEY;
  
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      }
    );
  
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  
    res.status(200).json({ reply: text });
  }
  