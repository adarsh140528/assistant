export const config = {
  runtime: "edge",
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default async function handler(req) {
  try {
    // 1️⃣ Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders(),
      });
    }

    // 2️⃣ Allow only POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Use POST method only" }),
        {
          status: 405,
          headers: {
            ...corsHeaders(),
            "Content-Type": "application/json",
          },
        }
      );
    }

    // 3️⃣ Parse JSON body safely
    const body = await req.json().catch(() => null);
    if (!body || !body.prompt)
      return new Response(
        JSON.stringify({ error: "Missing prompt" }),
        { status: 400, headers: corsHeaders() }
      );

    const prompt = body.prompt;

    // 4️⃣ Call Gemini API
    const apiKey = process.env.GEMINI_KEY;
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash-latest:generateContent?key=" +
      apiKey;

    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await geminiRes.json().catch(() => null);

    if (!data)
      return new Response(
        JSON.stringify({ error: "Gemini returned invalid JSON" }),
        { status: 500, headers: corsHeaders() }
      );

    if (data.error)
      return new Response(JSON.stringify({ error: data.error }), {
        status: 500,
        headers: corsHeaders(),
      });

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    // 5️⃣ Catch all crashes and still return CORS
    return new Response(
      JSON.stringify({ error: "Server crashed", details: err.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders(),
          "Content-Type": "application/json",
        },
      }
    );
  }
}
