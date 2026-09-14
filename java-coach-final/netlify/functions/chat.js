const https = require("https");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Check API key exists
  if (!process.env.GROQ_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "GROQ_API_KEY not set in environment variables" }),
    };
  }

  let messages, system;
  try {
    const body = JSON.parse(event.body);
    messages = body.messages || [];
    system   = body.system   || "";
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  // Keep last 20 messages to avoid token limits
  const trimmed = messages.slice(-20);

  const payload = JSON.stringify({
    model: "llama-3.1-70b-versatile",
    max_tokens: 1024,
    temperature: 0.7,
    messages: [
      { role: "system", content: system },
      ...trimmed,
    ],
  });

  try {
    const reply = await new Promise((resolve, reject) => {
      const options = {
        hostname: "api.groq.com",
        path: "/openai/v1/chat/completions",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Length": Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, (res) => {
        let raw = "";
        res.on("data", (chunk) => { raw += chunk; });
        res.on("end", () => {
          if (!raw || raw.trim() === "") {
            return reject(new Error("Empty response from Groq"));
          }
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {
            return reject(new Error("Invalid JSON from Groq: " + raw.slice(0, 100)));
          }
          if (parsed.error) {
            return reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          }
          const content = parsed.choices?.[0]?.message?.content;
          if (!content) {
            return reject(new Error("No content in Groq response: " + JSON.stringify(parsed).slice(0, 200)));
          }
          resolve(content);
        });
      });

      req.on("error", (e) => reject(new Error("Network error: " + e.message)));
      req.setTimeout(25000, () => {
        req.destroy();
        reject(new Error("Request timed out after 25s"));
      });

      req.write(payload);
      req.end();
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply }),
    };

  } catch (err) {
    console.error("chat.js error:", err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
