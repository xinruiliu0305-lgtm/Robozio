import { promises as fs } from "node:fs";
import path from "node:path";

let kbCache = null;

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function loadKb() {
  if (kbCache) return kbCache;
  const kbPath = path.join(process.cwd(), "data", "kb.json");
  const raw = await fs.readFile(kbPath, "utf8");
  kbCache = JSON.parse(raw);
  return kbCache;
}

async function getEmbedding(text, apiKey, model) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: text
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Embedding request failed: ${detail.slice(0, 500)}`);
  }
  const data = await response.json();
  return data?.data?.[0]?.embedding;
}

function retrieveTopContext(queryEmbedding, records, topK = 5) {
  return records
    .map((record) => ({
      ...record,
      score: cosineSimilarity(queryEmbedding, record.embedding || [])
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const embeddingModel = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY is not configured" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const message = String(body.message || "").trim();
    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    let contextRecords = [];
    try {
      const kb = await loadKb();
      const queryEmbedding = await getEmbedding(message, apiKey, embeddingModel);
      if (queryEmbedding && Array.isArray(kb.records)) {
        contextRecords = retrieveTopContext(queryEmbedding, kb.records, 5);
      }
    } catch (_kbError) {
      // Continue without KB context if not built yet.
      contextRecords = [];
    }

    const contextText = contextRecords
      .map((item, index) => `Source ${index + 1} (${item.source}): ${item.content}`)
      .join("\n\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are RobotZio AI Assistant for a Middle East robotics marketplace. Keep answers concise and practical. Focus on: product discovery, RFQ submission, merchant onboarding, support, and partnership. Use the provided knowledge context first. If answer is not in context, clearly say you are not fully sure and suggest relevant platform pages."
          },
          {
            role: "system",
            content: contextText
              ? `Knowledge context:\n${contextText}`
              : "Knowledge context is not available. Use general platform-safe guidance."
          },
          { role: "user", content: message }
        ]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      res.status(502).json({ error: "OpenAI request failed", detail: text.slice(0, 500) });
      return;
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      res.status(502).json({ error: "No reply from OpenAI" });
      return;
    }

    res.status(200).json({
      reply,
      sources: contextRecords.map((item) => item.source)
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error", detail: String(error) });
  }
}
