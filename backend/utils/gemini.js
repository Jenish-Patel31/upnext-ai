import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

/**
 * Tried in order after GEMINI_MODEL / GEMINI_MODEL_FALLBACKS (deduped).
 * Omit gemini-1.5-* — many IDs 404 on v1beta for new API keys; use current aliases only.
 * @see https://ai.google.dev/gemini-api/docs/models
 */
const DEFAULT_MODEL_CHAIN = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.5-pro',
];

function shouldTryNextModel(error) {
  const status = error?.status ?? error?.statusCode;
  const msg = (error?.message || '').toLowerCase();

  if (status === 401) return false;
  if (status === 400 && !msg.includes('quota') && !msg.includes('resource exhausted')) return false;

  if (status === 429 || status === 404 || status === 503 || status === 502) return true;
  if (msg.includes('quota') || msg.includes('resource exhausted')) return true;
  if (msg.includes('too many requests')) return true;
  if (msg.includes('not found') && msg.includes('model')) return true;
  if (msg.includes('is not found') && msg.includes('generatecontent')) return true;
  if (msg.includes('unavailable') || msg.includes('overloaded')) return true;
  return false;
}

export function getModelIdChain() {
  const primary = process.env.GEMINI_MODEL?.trim();
  const fromEnv =
    process.env.GEMINI_MODEL_FALLBACKS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) || [];
  const chain = [...(primary ? [primary] : []), ...fromEnv, ...DEFAULT_MODEL_CHAIN];
  return [...new Set(chain)];
}

/**
 * Runs generateContent with the first model that succeeds.
 * Retries on 429 / 404 / overloaded so one bad model does not break chat.
 *
 * @param {Parameters<import('@google/generative-ai').GenerativeModel['generateContent']>[0]} request
 * @returns {Promise<import('@google/generative-ai').GenerateContentResult>}
 */
export async function generateContentWithFallback(request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const chain = getModelIdChain();
  let lastError;

  for (const modelId of chain) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(request);
      console.log(`[Gemini] OK model=${modelId}`);
      return result;
    } catch (e) {
      lastError = e;
      if (shouldTryNextModel(e)) {
        console.warn(
          `[Gemini] model=${modelId} failed (${e.status ?? 'no-status'}): ${(e.message || '').slice(0, 120)} → next`
        );
        continue;
      }
      throw e;
    }
  }

  const hint =
    'All Gemini models in the chain failed. Set GEMINI_MODEL / GEMINI_MODEL_FALLBACKS in .env, or set OPENAI_API_KEY for automatic OpenAI fallback in chat.';
  throw lastError ?? new Error(hint);
}

/** @deprecated Use generateContentWithFallback */
export function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const modelId = getModelIdChain()[0];
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelId });
}

export function getGeminiModelId() {
  return getModelIdChain()[0];
}
