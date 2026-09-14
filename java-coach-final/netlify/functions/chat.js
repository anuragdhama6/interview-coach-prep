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

  try {
    const { messages, system } = JSON.parse(event.body);

    const payload = JSON.stringify({
      model: "llama-3.1-70b-versatile",
      max_tokens: 1500,
      temperature: 0.7,
      messages: [{ role: "system", content: system }, ...messages],
    });

    const reply = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: "api.groq.com",
          path: "/openai/v1/chat/completions",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Length": Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) return reject(new Error(parsed.error.message || "Groq error"));
              resolve(parsed.choices?.[0]?.message?.content || "");
            } catch (e) {
              reject(new Error("Failed to parse Groq response"));
            }
          });
        }
      );
      req.on("error", reject);
      req.write(payload);
      req.end();
    });

    return { statusCode: 200, headers, body: JSON.stringify({ reply }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
