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

// Helper functions to extract structured data from text if JSON parsing fails
const extractTitle = (text) => {
  const titleMatch = text.match(/(?:title|Title)[:\-]\s*(.+?)(?:\n|$)/i);
  return titleMatch ? titleMatch[1].trim() : null;
};

const extractBibleReading = (text) => {
  const bibleMatch = text.match(/(?:bible reading|Bible Reading|bible_reading)[:\-]\s*(.+?)(?:\n|$)/i);
  const result = bibleMatch ? bibleMatch[1].trim() : null;
  // Ensure it's a string, not an object
  if (result && typeof result === 'object') {
    return JSON.stringify(result);
  }
  return result;
};

const extractDiscussionQuestions = (text) => {
  const questions = [];
  const questionSection = text.match(/(?:discussion questions?|questions?)[:\-]?\s*([\s\S]*?)(?:\n\n|\n(?:activities|videos|songs|notes)|$)/i);
  if (questionSection) {
    const lines = questionSection[1].split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*[\d\-•]\s*(.+)$/);
      if (match) questions.push(match[1].trim());
    });
  }
  return questions.length > 0 ? questions : null;
};

const extractActivities = (text) => {
  const activities = [];
  const activitySection = text.match(/(?:activities?|activity suggestions?)[:\-]?\s*([\s\S]*?)(?:\n\n|\n(?:videos?|songs?|notes|discussion)|$)/i);
  if (activitySection) {
    const lines = activitySection[1].split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*[\d\-•]\s*(.+)$/);
      if (match) activities.push(match[1].trim());
    });
  }
  return activities.length > 0 ? activities : null;
};

// Helper function to normalize JW.org URLs
const normalizeJWOrgURL = (url) => {
  if (!url) return null;
  
  // Remove any markdown formatting
  url = url.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$2'); // Remove markdown links
  url = url.trim();
  
  // Remove trailing punctuation that might have been included
  url = url.replace(/[.,;:!?]+$/, '');
  
  // If it's already a full URL, validate and return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Ensure it's a JW.org domain
    if (url.includes('jw.org') || url.includes('wol.jw.org')) {
      // Validate it's a proper JW.org URL format
      // Accept: www.jw.org, jw.org, wol.jw.org
      const jwDomainMatch = url.match(/https?:\/\/(?:www\.)?(jw\.org|wol\.jw\.org)/i);
      if (jwDomainMatch) {
        // Normalize to https://www.jw.org or https://wol.jw.org
        const domain = jwDomainMatch[1].toLowerCase();
        const path = url.substring(url.indexOf(jwDomainMatch[1]) + jwDomainMatch[1].length);
        return `https://${domain}${path}`;
      }
      return url; // Return as-is if it contains jw.org
    }
    return null; // Not a JW.org URL
  }
  
  // If it contains jw.org but doesn't start with http, add https://
  if (url.includes('jw.org') || url.includes('wol.jw.org')) {
    // Extract the domain and path
    const jwMatch = url.match(/(?:www\.)?(jw\.org|wol\.jw\.org)(\/.*)?/i);
    if (jwMatch) {
      const domain = jwMatch[1].toLowerCase();
      const path = jwMatch[2] || '';
      // Ensure path starts with /
      const normalizedPath = path.startsWith('/') ? path : '/' + path;
      return `https://${domain}${normalizedPath}`;
    }
  }
  
  // Try to extract URL from text
  const urlMatch = url.match(/(https?:\/\/[^\s<>"']+)/);
  if (urlMatch) {
    const foundUrl = urlMatch[1];
    if (foundUrl.includes('jw.org') || foundUrl.includes('wol.jw.org')) {
      return normalizeJWOrgURL(foundUrl); // Recursively normalize
    }
  }
  
  // If it looks like a path (starts with /), assume it's a JW.org path
  if (url.startsWith('/')) {
    return `https://www.jw.org${url}`;
  }
  
  return null;
};

const extractVideoSuggestions = (text) => {
  const videos = [];
  const videoSection = text.match(/(?:video(?: suggestions?|s?))[:\-]?\s*([\s\S]*?)(?:\n\n|\n(?:songs?|notes|activities|discussion)|$)/i);
  if (videoSection) {
    const lines = videoSection[1].split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*[\d\-•]\s*(.+)$/);
      if (match) {
        const url = normalizeJWOrgURL(match[1].trim());
        if (url) videos.push(url);
      }
    });
  }
  return videos.length > 0 ? videos : null;
};

const extractSongSuggestions = (text) => {
  const songs = [];
  const songSection = text.match(/(?:song(?: suggestions?|s?))[:\-]?\s*([\s\S]*?)(?:\n\n|\n(?:videos?|notes|activities|discussion)|$)/i);
  if (songSection) {
    const lines = songSection[1].split('\n');
    lines.forEach(line => {
      const match = line.match(/^\s*[\d\-•]\s*(.+)$/);
      if (match) {
        const url = normalizeJWOrgURL(match[1].trim());
        if (url) songs.push(url);
      }
    });
  }
  return songs.length > 0 ? songs : null;
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
1. Bible reading (suggest specific chapters/verses that relate to ${theme ? `the theme "${theme}"` : 'spiritual growth'})
2. Discussion questions (related to ${theme ? `the theme "${theme}"` : 'the Bible reading'})
3. Activity suggestions (drawing, role-play, etc. related to ${theme ? `the theme "${theme}"` : 'the lesson'})
4. JW.org video and song recommendations

CRITICAL REQUIREMENTS for video_suggestions and song_suggestions:
- You MUST select videos and songs that DIRECTLY relate to ${theme ? `the theme "${theme}"` : 'the Bible reading and spiritual lesson'}
- For videos: Choose from JW.org video library (https://www.jw.org/en/library/videos/)
  * Format: https://www.jw.org/en/library/videos/{category}/{video-title}/
  * Examples: 
    - https://www.jw.org/en/library/videos/bible-treasures/why-does-god-allow-suffering/
    - https://www.jw.org/en/library/videos/children/be-kind-to-others/
    - https://www.jw.org/en/library/videos/jw-broadcasting/monthly-program/
- For songs: Choose from JW.org music library (https://www.jw.org/en/library/music-songs/)
  * Format: https://www.jw.org/en/library/music-songs/{song-title}/
  * Or use the search/browse format: https://www.jw.org/en/library/music-songs/#en/mediaitems/VODMusic/pub-jwb-XXX_1_AUDIO
- ALL URLs must be complete, working links to actual JW.org content
- Select media that matches the age group (${age ? `${age} years old` : 'children'}) and theme (${theme ? `"${theme}"` : 'spiritual growth'})
- Do NOT make up URLs - only suggest real, existing JW.org content
- If you cannot find specific URLs, you may suggest browsing categories like:
  * Videos: https://www.jw.org/en/library/videos/bible-treasures/ (for Bible lessons)
  * Videos: https://www.jw.org/en/library/videos/children/ (for children's content)
  * Songs: https://www.jw.org/en/library/music-songs/ (for Kingdom songs)

Format your response as JSON with: title, bible_reading, discussion_questions (array), activities (array), video_suggestions (array of full URLs related to the theme), song_suggestions (array of full URLs related to the theme), notes.`;

    const completion = await openai.chat.completions.create({
      model: (await dbGet("SELECT value FROM settings WHERE key = 'openai_model'")).value || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for Jehovah's Witness families planning Family Worship nights. 

CRITICAL RULES:
1. Only suggest content from jw.org or wol.jw.org
2. When providing video or song links, you MUST provide complete, working URLs
3. Videos must be from: https://www.jw.org/en/library/videos/ (format: /videos/{category}/{video-title}/)
4. Songs must be from: https://www.jw.org/en/library/music-songs/ (format: /music-songs/{song-title}/ or media item URLs)
5. ALL media suggestions MUST directly relate to the theme and age group provided
6. Never make up URLs - only suggest real, existing JW.org content
7. If you cannot find specific URLs, suggest the appropriate category page for the family to browse
8. Keep all suggestions Bible-based, age-appropriate, and spiritually uplifting
9. Ensure videos and songs match the worship plan theme and Bible reading topic`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const responseText = completion.choices[0].message.content.trim();
    let plan;
    
    // Try to extract JSON from the response (sometimes AI wraps it in markdown code blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }
    
    try {
      plan = JSON.parse(jsonText);
    } catch (e) {
      // If not JSON, try to parse as structured text
      console.warn('Failed to parse AI response as JSON, attempting to extract structured data:', e.message);
      
      // Try to extract structured information from text
      plan = {
        title: extractTitle(responseText),
        bible_reading: extractBibleReading(responseText),
        discussion_questions: extractDiscussionQuestions(responseText),
        activities: extractActivities(responseText),
        video_suggestions: extractVideoSuggestions(responseText),
        song_suggestions: extractSongSuggestions(responseText),
        notes: responseText
      };
    }
    
    // Ensure bible_reading is always a string
    if (plan.bible_reading) {
      if (typeof plan.bible_reading === 'object') {
        // If it's an object, try to extract text or stringify it
        plan.bible_reading = plan.bible_reading.text || plan.bible_reading.title || JSON.stringify(plan.bible_reading);
      } else if (typeof plan.bible_reading !== 'string') {
        plan.bible_reading = String(plan.bible_reading);
      }
    }
    
    // Ensure arrays are arrays
    if (plan.discussion_questions && !Array.isArray(plan.discussion_questions)) {
      plan.discussion_questions = [plan.discussion_questions];
    }
    if (plan.activities && !Array.isArray(plan.activities)) {
      plan.activities = [plan.activities];
    }
    if (plan.video_suggestions && !Array.isArray(plan.video_suggestions)) {
      plan.video_suggestions = [plan.video_suggestions];
    }
    if (plan.song_suggestions && !Array.isArray(plan.song_suggestions)) {
      plan.song_suggestions = [plan.song_suggestions];
    }
    
    // Normalize all video and song URLs to ensure they're full JW.org URLs
    if (plan.video_suggestions) {
      plan.video_suggestions = plan.video_suggestions
        .map(url => {
          const normalized = normalizeJWOrgURL(url);
          // Validate it's a video URL (contains /videos/ or /library/videos/)
          if (normalized && (normalized.includes('/videos/') || normalized.includes('/library/videos/'))) {
            return normalized;
          }
          return null;
        })
        .filter(url => url !== null);
    }
    if (plan.song_suggestions) {
      plan.song_suggestions = plan.song_suggestions
        .map(url => {
          const normalized = normalizeJWOrgURL(url);
          // Validate it's a music/song URL (contains /music-songs/ or /library/music-songs/ or VODMusic)
          if (normalized && (normalized.includes('/music-songs/') || normalized.includes('/library/music-songs/') || normalized.includes('VODMusic'))) {
            return normalized;
          }
          return null;
        })
        .filter(url => url !== null);
    }
    
    // Add a note if theme was provided but no relevant media was found
    if (theme && plan.video_suggestions && plan.video_suggestions.length === 0 && plan.song_suggestions && plan.song_suggestions.length === 0) {
      if (!plan.notes) plan.notes = '';
      plan.notes += `\n\nNote: Please browse JW.org for videos and songs related to "${theme}" at:\n- Videos: https://www.jw.org/en/library/videos/\n- Songs: https://www.jw.org/en/library/music-songs/`;
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
