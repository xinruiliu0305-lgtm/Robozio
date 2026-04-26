# RobotZio AI Assistant Setup

This project uses:
- Static pages (`*.html`)
- Serverless API route at `api/chat.js` for OpenAI

The floating AI assistant in the UI calls:
- `POST /api/chat`
- Retrieval context from `data/kb.json` (RAG)

## 1) Configure environment variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Then set your real key:

```env
OPENAI_API_KEY=your_real_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBED_MODEL=text-embedding-3-small
```

## 1.5) Build knowledge base (important)

Generate local RAG knowledge from your website pages + FAQ:

```bash
npm run build:kb
```

This creates:
- `data/kb.json`

Re-run this command whenever website content changes.

## 2) Run locally with Vercel

Install Vercel CLI (if needed):

```bash
npm i -g vercel
```

Run local dev:

```bash
vercel dev
```

Open the local URL shown in terminal (usually `http://localhost:3000`).

## 3) Deploy to Vercel

From project root:

```bash
vercel
```

For production deployment:

```bash
vercel --prod
```

In Vercel dashboard, add environment variables:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional)

Then redeploy.

## 4) Quick verification

1. Open any page (AI widget appears bottom-right).
2. Ask: `How do I join as a merchant?`
3. Ask: `How can I submit RFQ?`
4. Confirm AI replies are generated.
5. Ask a question tied to site content (merchant, RFQ, support) and verify answer quality.

If API key is missing or invalid, assistant will fallback to built-in local replies.
