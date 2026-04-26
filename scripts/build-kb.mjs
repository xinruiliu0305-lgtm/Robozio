import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const embeddingModel = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
const apiKey = process.env.OPENAI_API_KEY;

const sourceFiles = [
  "index.html",
  "products.html",
  "product.html",
  "merchant.html",
  "support.html",
  "partnership.html",
  "featured.html",
  "data/faq.md"
];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chunkText(text, chunkSize = 900, overlap = 150) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + chunkSize);
    const slice = text.slice(start, end).trim();
    if (slice.length > 80) chunks.push(slice);
    start += Math.max(1, chunkSize - overlap);
  }
  return chunks;
}

async function embedTexts(texts) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Cannot build embedding knowledge base.");
  }
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: embeddingModel,
      input: texts
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Embedding request failed: ${detail.slice(0, 500)}`);
  }
  const json = await response.json();
  return json.data.map((item) => item.embedding);
}

async function main() {
  const docs = [];

  for (const relativePath of sourceFiles) {
    const absolutePath = path.join(root, relativePath);
    try {
      const raw = await fs.readFile(absolutePath, "utf8");
      const text = relativePath.endsWith(".html") ? stripHtml(raw) : raw;
      docs.push({ path: relativePath, text });
    } catch (_error) {
      // Skip missing optional files.
    }
  }

  const records = [];
  for (const doc of docs) {
    const chunks = chunkText(doc.text);
    chunks.forEach((content, index) => {
      records.push({
        id: `${doc.path}#${index}`,
        source: doc.path,
        content
      });
    });
  }

  if (records.length === 0) {
    throw new Error("No knowledge source content found.");
  }

  const embeddings = [];
  const batchSize = 40;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const vectors = await embedTexts(batch.map((r) => r.content));
    vectors.forEach((vector) => embeddings.push(vector));
    process.stdout.write(`Embedded ${Math.min(i + batch.length, records.length)}/${records.length}\n`);
  }

  const kb = {
    generatedAt: new Date().toISOString(),
    embeddingModel,
    records: records.map((record, idx) => ({
      ...record,
      embedding: embeddings[idx]
    }))
  };

  await fs.writeFile(path.join(root, "data", "kb.json"), JSON.stringify(kb), "utf8");
  process.stdout.write(`Knowledge base generated: data/kb.json (${records.length} chunks)\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
