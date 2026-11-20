import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { aiClient } from '../services/aiClient.js';

const router = express.Router();

// POST /api/copilot/chat - Ask copilot for grounded explanation in Bangla or English
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { prompt, structured_context, language = 'en' } = req.body;

    // Treat user text as strictly data, never executable instructions
    const result = await aiClient.askCopilot({
      user_prompt: String(prompt || ''),
      structured_data: structured_context || {},
      language: language === 'bn' ? 'bn' : 'en'
    });

    res.json({
      data_label: 'Synthetic data explanation',
      copilot: result
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate copilot explanation', details: err.message });
  }
});

// GET /api/copilot/prompts - List prompt library catalog (C1, C2, C3)
router.get('/prompts', async (req, res) => {
  try {
    const prompts = await aiClient.getPromptLibrary();
    res.json(prompts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prompt library', details: err.message });
  }
});

// POST /api/copilot/prompts/execute - Execute prompt library entry
router.post('/prompts/execute', authenticate, async (req, res) => {
  try {
    const result = await aiClient.executePrompt(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to execute prompt', details: err.message });
  }
});

export default router;

