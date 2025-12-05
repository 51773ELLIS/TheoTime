import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { dbGet } from '../utils/database.js';
import OpenAI from 'openai';

const router = express.Router();

// Get OpenAI client
const getOpenAIClient = async () => {
  const apiKey = await dbGet("SELECT value FROM settings WHERE key = 'openai_api_key'");
  const model = await dbGet("SELECT value FROM settings WHERE key = 'openai_model'");

  if (!apiKey || !apiKey.value) {
    throw new Error('OpenAI API key not configured');
  }

  return new OpenAI({
    apiKey: apiKey.value
  });
};

// Check if AI is enabled
const isAIEnabled = async () => {
  const aiEnabled = await dbGet("SELECT value FROM settings WHERE key = 'ai_enabled'");
  return aiEnabled && aiEnabled.value === 'true';
};

// Generate worship plan suggestion
router.post('/worship-plan', authenticateToken, requireRole('parent'), [
  body('age').optional().isInt({ min: 0, max: 120 }),
  body('theme').optional().trim()
], async (req, res) => {
  try {
    if (!(await isAIEnabled())) {
      return res.status(403).json({ error: 'AI assistant is disabled' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { age, theme, interests } = req.body;
    const openai = await getOpenAIClient();

    const prompt = `You are helping a Jehovah's Witness family plan their Family Worship night. 
Generate a worship plan suggestion that is:
- Age-appropriate for ${age ? `a ${age}-year-old` : 'children'}
- Bible-based and spiritually uplifting
- Engaging and interactive
${theme ? `- Focused on the theme: ${theme}` : ''}
${interests ? `- Incorporating interests: ${interests}` : ''}

Provide a structured plan with:
1. Bible reading (suggest specific chapters/verses)
2. Discussion questions
3. Activity suggestions (drawing, role-play, etc.)
4. JW.org video or song recommendations (only suggest content from jw.org or wol.jw.org)

Format your response as JSON with: title, bible_reading, discussion_questions (array), activities (array), video_suggestions (array), song_suggestions (array), notes.`;

    const completion = await openai.chat.completions.create({
      model: (await dbGet("SELECT value FROM settings WHERE key = 'openai_model'")).value || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for Jehovah\'s Witness families. Only suggest content from jw.org or wol.jw.org. Keep suggestions Bible-based and appropriate for family worship.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const responseText = completion.choices[0].message.content;
    let plan;
    try {
      plan = JSON.parse(responseText);
    } catch (e) {
      // If not JSON, return as notes
      plan = { notes: responseText };
    }

    res.json(plan);
  } catch (error) {
    console.error('AI worship plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate worship plan' });
  }
});

// Generate activity suggestions
router.post('/activities', authenticateToken, requireRole('parent'), [
  body('age').optional().isInt({ min: 0, max: 120 }),
  body('theme').optional().trim()
], async (req, res) => {
  try {
    if (!(await isAIEnabled())) {
      return res.status(403).json({ error: 'AI assistant is disabled' });
    }

    const { age, theme } = req.body;
    const openai = await getOpenAIClient();

    const prompt = `Suggest ${age ? `age-appropriate activities for a ${age}-year-old` : 'family activities'} for Jehovah's Witness Family Worship. 
${theme ? `Theme: ${theme}` : ''}
Activities should be Bible-based, engaging, and suitable for family worship. 
Suggest 5-7 activities with brief descriptions.`;

    const completion = await openai.chat.completions.create({
      model: (await dbGet("SELECT value FROM settings WHERE key = 'openai_model'")).value || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant for Jehovah\'s Witness families. Suggest Bible-based, age-appropriate activities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    res.json({ activities: completion.choices[0].message.content });
  } catch (error) {
    console.error('AI activities error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate activities' });
  }
});

// Child-safe AI chat (limited prompts)
router.post('/chat', authenticateToken, [
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    // Check if child mode is enabled for this user
    if (req.user.role === 'child') {
      const childAIMode = await dbGet("SELECT value FROM settings WHERE key = 'child_ai_enabled'");
      if (!childAIMode || childAIMode.value !== 'true') {
        return res.status(403).json({ error: 'AI assistant is not enabled for children' });
      }
    }

    if (!(await isAIEnabled())) {
      return res.status(403).json({ error: 'AI assistant is disabled' });
    }

    const { message } = req.body;

    // Filter for safe prompts only (for children)
    const safePrompts = ['story', 'kindness', 'love', 'helping', 'bible', 'character', 'parable'];
    if (req.user.role === 'child') {
      const messageLower = message.toLowerCase();
      if (!safePrompts.some(prompt => messageLower.includes(prompt))) {
        return res.status(400).json({ error: 'Please ask about Bible stories, kindness, or helping others' });
      }
    }

    const openai = await getOpenAIClient();

    const systemPrompt = req.user.role === 'child'
      ? 'You are a friendly assistant helping children learn about Bible stories and Christian values. Keep responses simple, positive, and age-appropriate. Only reference jw.org content.'
      : 'You are a helpful assistant for Jehovah\'s Witness families. Provide Bible-based, spiritually uplifting responses. Only reference jw.org or wol.jw.org content.';

    const completion = await openai.chat.completions.create({
      model: (await dbGet("SELECT value FROM settings WHERE key = 'openai_model'")).value || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat' });
  }
});

export default router;
