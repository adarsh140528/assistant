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

        // READ JSON BODY SAFELY
        let body = "";
        req.on("data", chunk => body += chunk);
        await new Promise(resolve => req.on("end", resolve));

        let json;
        try {
            json = JSON.parse(body);
        } catch (err) {
            return res.status(400).json({ error: "Invalid JSON" });
        }

        const prompt = json.prompt;
        if (!prompt) {
            return res.status(400).json({ error: "Missing prompt" });
        }

        const apiKey = process.env.GEMINI_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "GEMINI_KEY not found in Vercel" });
        }

        // CALL GEMINI API
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
                    ],
                    tools: [{ google_search: {} }]
                })
            }
        );

        const data = await geminiResponse.json();

        // GEMINI ERROR
        if (!data?.candidates) {
            return res.status(500).json({
                error: "Gemini returned no candidates",
                details: data
            });
        }

        const reply = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ reply });

    } catch (error) {
        console.error("SERVER ERROR:", error);
        return res.status(500).json({ error: "Server crashed", details: String(error) });
    }
}
