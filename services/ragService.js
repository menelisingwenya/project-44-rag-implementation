import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateEmbedding, generateResponse } from '../project-42-ai-service-module/aiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cosine similarity computation
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(vecA.length, vecB.length);

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 1. Load documents from knowledge base
export function loadDocuments(customPath = null) {
  const defaultPath = path.resolve(
    __dirname,
    '../../../phase-01-ai-foundations/project-04-simple-rag-pipeline/knowledge.txt'
  );
  const targetPath = customPath || defaultPath;

  if (fs.existsSync(targetPath)) {
    return fs.readFileSync(targetPath, 'utf8');
  }

  // Built-in institutional knowledge base fallback
  return `Nedbank Corporate and Retail Banking Product Knowledge Base:
Nedbank 32-Day Notice Deposit: Requires R1,000 minimum deposit. Tiered interest rates range from 7.80% to 8.75% for high-net-worth balances.
Nedbank Greenbacks Rewards: Loyalty programme providing up to 2% cash back on retail spending and fuel vouchers.
Nedbank Home Loans and FLISP: Government-subsidized first-time home buyer programme with up to 105% loan-to-value options for qualifying applicants earning between R3,501 and R22,000 monthly.
POPIA Compliance: Data protection officer enforces strict encryption and consent management protocols across all customer touchpoints.`;
}

// 2. Chunk documents (500 chars with 50-character overlap)
export function chunkDocument(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let startIndex = 0;
  let chunkId = 1;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const content = text.slice(startIndex, endIndex).trim();

    if (content.length > 0) {
      chunks.push({
        id: `chunk-${chunkId}`,
        content,
        startIndex,
        endIndex,
        source: 'Nedbank Institutional Knowledge Base (v2026.1)'
      });
      chunkId++;
    }

    if (endIndex === text.length) break;
    startIndex += chunkSize - overlap;
  }

  return chunks;
}

// 3 & 4. In-memory vector store
class VectorStore {
  constructor() {
    this.vectors = [];
  }

  async addDocument(chunk) {
    const embedding = await generateEmbedding(chunk.content);
    this.vectors.push({
      ...chunk,
      embedding
    });
  }

  async search(queryText, topK = 3) {
    const queryEmbedding = await generateEmbedding(queryText);
    const scored = this.vectors.map((item) => ({
      chunk: item,
      score: cosineSimilarity(queryEmbedding, item.embedding)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

let activeStore = null;

export async function initializeVectorDatabase() {
  if (activeStore && activeStore.vectors.length > 0) return activeStore;

  const docText = loadDocuments();
  const chunks = chunkDocument(docText, 500, 50);
  const store = new VectorStore();

  for (const chunk of chunks) {
    await store.addDocument(chunk);
  }

  activeStore = store;
  return store;
}

// 5 & 6. Query and Augment with Citations
export async function queryRAG(question) {
  if (!question || typeof question !== 'string') {
    throw new Error('Question must be a non-empty string.');
  }

  const store = await initializeVectorDatabase();
  const results = await store.search(question, 3);

  const contextText = results
    .map((r, i) => `[Source ${i + 1}: ${r.chunk.id}]:\n${r.chunk.content}`)
    .join('\n\n');

  const prompt = `You are NedPulse, an institutional AI banking assistant. Answer the user question strictly using the retrieved context. If the context does not contain enough information, respond: "I do not have sufficient information in the verified Nedbank knowledge base to answer this question."

Retrieved Context:
${contextText}

Question: ${question}

Response format:
- Concise, accurate answer.
- Citations referring to [Source 1], [Source 2], etc.`;

  const rawAnswer = await generateResponse(prompt, { temperature: 0.2 });

  return {
    question,
    answer: rawAnswer,
    citations: results.map((r, i) => ({
      citationNumber: i + 1,
      chunkId: r.chunk.id,
      score: Number(r.score.toFixed(4)),
      source: r.chunk.source,
      snippet: r.chunk.content.slice(0, 120) + '...'
    }))
  };
}
