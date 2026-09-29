import { Router } from 'express';
import { queryRAG } from '../services/ragService.js';
import { authenticateToken } from '../../../phase-02-backend-development/backend/src/middleware/auth.js';

const router = Router();

// POST /api/ai/rag
router.post('/rag', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'A non-empty "question" string is required.'
      });
    }

    const result = await queryRAG(question.trim());

    return res.status(200).json({
      success: true,
      question: result.question,
      answer: result.answer,
      citations: result.citations
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'RAGPipelineError',
      message: err.message
    });
  }
});

export default router;
