import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

/**
 * Optional chat completion when every Gemini model fails (set OPENAI_API_KEY).
 * @param {string} userPrompt full prompt text
 * @returns {Promise<string|null>} reply text or null if not configured / failed
 */
export async function generateChatWithOpenAI(userPrompt) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  try {
    const client = new OpenAI({ apiKey: key });
    const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
    const res = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 1500,
      temperature: 0.7,
    });
    const text = res.choices[0]?.message?.content?.trim();
    if (text) console.log(`[OpenAI] OK model=${model}`);
    return text || null;
  } catch (e) {
    console.error('[OpenAI] fallback failed:', e.message || e);
    return null;
  }
}
