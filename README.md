# Project 44: RAG Implementation

**Emganwini Nedbank Hub | Master Project Portfolio**  
*Phase 4: AI Integration (Formative Practice)*

---

## 📌 Project Overview
Implement a complete Retrieval-Augmented Generation (RAG) system with document ingestion, text chunking, vector embeddings, similarity search, and context-grounded citations for the Nedbank platform.

## 🛠️ Tech Stack
- **Runtime**: Node.js (ESM)
- **Framework**: Express.js
- **Vector DB / Index**: VectorStore with Cosine Similarity Indexing (64–1536 dim vectors)
- **Document Chunking**: 500-character windows with 50-character sliding overlaps
- **Authentication**: JWT verification middleware

## 📋 Requirements & Deliverables

| # | Requirement | Implementation | Status |
|---|---|---|---|
| 1 | **Load documents** | `loadDocuments()` in `services/ragService.js` loads institutional product catalog | ✅ Complete |
| 2 | **Chunk documents (500 chars)** | `chunkDocument()` splits into 500-char chunks with 50-char overlap | ✅ Complete |
| 3 | **Generate embeddings** | `generateEmbedding()` converts text to dense vectors | ✅ Complete |
| 4 | **Store in vector DB** | `VectorStore` registers embeddings and executes similarity rankings | ✅ Complete |
| 5 | **POST /api/ai/rag endpoint** | Implemented in `routes/rag.js` | ✅ Complete |
| 6 | **Return answer with citations** | Generates response with `[Source 1]`, `[Source 2]` citations and chunk snippets | ✅ Complete |

## 🚀 API Specification

### Endpoint: `POST /api/ai/rag`
**Request Body:**
```json
{
  "question": "What interest rate is offered on the 32-day notice deposit?"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "question": "What interest rate is offered on the 32-day notice deposit?",
  "answer": "Nedbank offers interest rates reaching up to 8.75% on the 32-day notice deposit for qualifying balances [Source 1].",
  "citations": [
    {
      "citationNumber": 1,
      "chunkId": "chunk-1",
      "score": 0.9421,
      "source": "Nedbank Institutional Knowledge Base (v2026.1)",
      "snippet": "Nedbank 32-Day Notice Deposit: Requires R1,000 minimum deposit. Tiered interest rates range from 7.80% to 8.75%..."
    }
  ]
}
```
