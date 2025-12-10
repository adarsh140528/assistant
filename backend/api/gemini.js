export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    // Handle OPTIONS (CORS preflight)
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Block non-POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Use POST method only" }),
        { status: 405 }
      );
    }

    // Read JSON body (Edge functions support this directly!)
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing 'prompt'" }),
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_KEY;

    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash-latest:generateContent?key=" +
      apiKey;

    // Call Gemini API
    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await geminiRes.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: "Gemini API error", details: data }), {
        status: 500,
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server crashed", details: err.message }),
      { status: 500 }
    );
  }
}
