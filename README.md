# VCodeTutor

VCodeTutor is a React + Vite study workspace that explains highlighted code for beginner programmers.

## Ask Assistant Phase 1

The Phase 1 assistant demonstrates a local RAG-style flow while keeping the public portfolio site safe:

1. Ingest knowledge base markdown from `knowledge_base/`.
2. Chunk documents into searchable teaching snippets.
3. Retrieve relevant chunks with local keyword/scoring retrieval.
4. Augment the assistant prompt with retrieved context.
5. Generate a structured beginner-friendly response.

The public app defaults to mock mode, so it does not call an API and does not need a key.

## Modes

Mock mode is safest for deployment:

```bash
VITE_ASSISTANT_MODE=mock
npm run dev
```

Local backend mode is for private demos:

```bash
cp .env.example .env.local
# Add your real OPENAI_API_KEY to .env.local
npm run dev:api
```

In a second terminal:

```bash
VITE_ASSISTANT_MODE=local npm run dev
```

API keys are only read by `server/index.js` through `.env.local`. Do not put secrets in `VITE_` variables because Vite exposes those to browser code.

## Knowledge Base

Starter markdown files live in `knowledge_base/`:

- `python_basics.md`
- `python_packages.md`
- `javascript_basics.md`
- `cpp_basics.md`
- `common_errors.md`
- `explanation_style_guide.md`

Phase 1 retrieval code is structured so the retrieval layer can later be replaced without changing the assistant UI:

- Shared RAG functions: `src/services/rag/core.js`
- Frontend mock KB loader: `src/services/rag/knowledgeBase.js`
- Local backend KB loader: `server/knowledgeBase.js`
- Frontend assistant client: `src/services/assistantClient.js`
- Local OpenAI route: `server/index.js`

## Phase 2 TODO: Chroma Vector RAG Upgrade

Chroma should replace only the retrieval implementation, not the whole assistant flow.

Run Chroma locally:

```bash
npm install chromadb
npx chroma run --path ./.chroma
```

Create embeddings:

- Add a script such as `scripts/indexKnowledgeBase.js`.
- Reuse `ingestKnowledgeBase()` and `chunkDocuments()` from `src/services/rag/core.js`.
- For each chunk, create an embedding with a local embedding model or OpenAI embeddings from the backend only.
- Store each chunk in a Chroma collection with `id`, `text`, and metadata such as `source`, `title`, and `language`.

Replace keyword retrieval:

- Add `server/chromaRetriever.js`.
- Implement the same input/output shape as `retrieveFromLocalDocuments()`.
- Query Chroma with the selected code, full context identifiers, selected language, and optional question.
- Return chunks shaped like `{ id, source, title, language, text, score }`.

Files expected to change:

- `server/knowledgeBase.js` can keep markdown ingestion and chunking for indexing.
- `server/index.js` should swap `retrieveFromLocalDocuments()` for `retrieveFromChroma()`.
- `src/services/rag/knowledgeBase.js` can remain keyword-based for public mock mode, or be replaced with precomputed demo chunks.
- `package.json` should add scripts such as `chroma:run` and `kb:index`.

The assistant pipeline should remain:

1. ingest knowledge base
2. chunk documents
3. retrieve relevant chunks
4. augment prompt with retrieved context
5. generate response

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
