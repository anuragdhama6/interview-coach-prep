const https = require("https");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!process.env.GROQ_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "GROQ_API_KEY not configured in Netlify environment variables" }) };
  }

  let messages = [], system = "";
  try {
    const b = JSON.parse(event.body || "{}");
    messages = (b.messages || []).slice(-10);
    system = b.system || "";
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Bad request body" }) };
  }

  const payload = JSON.stringify({
    model: "llama-3.3-70b-versatile",
    max_tokens: 800,
    temperature: 0.7,
    messages: [{ role: "system", content: system }, ...messages],
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GROQ_API_KEY,
        "Content-Length": Buffer.byteLength(payload),
      },
    }, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try {
          const data = JSON.parse(raw);
          if (data.error) {
            resolve({ statusCode: 200, headers, body: JSON.stringify({ error: data.error.message || "Groq API error" }) });
          } else {
            const reply = data.choices?.[0]?.message?.content || "No response from AI";
            resolve({ statusCode: 200, headers, body: JSON.stringify({ reply }) });
          }
        } catch (e) {
          resolve({ statusCode: 200, headers, body: JSON.stringify({ error: "Groq parse error: " + raw.substring(0, 200) }) });
        }
      });
    });

    req.on("error", (e) => {
      resolve({ statusCode: 200, headers, body: JSON.stringify({ error: "Network error: " + e.message }) });
    });

    req.setTimeout(25000, () => {
      req.destroy();
      resolve({ statusCode: 200, headers, body: JSON.stringify({ error: "Request timed out" }) });
    });

    req.write(payload);
    req.end();
  });
};
