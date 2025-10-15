// Serverless function to parse receipt images using Google Gemini directly.
// This avoids proxying to the same domain (which caused an infinite loop).
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

async function createClient() {
  // Prefer API key if provided
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }

  // Fallback: accept base64-encoded service account JSON in env var SERVICE_ACCOUNT_JSON_BASE64
  const saBase64 = process.env.SERVICE_ACCOUNT_JSON_BASE64 || process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  if (saBase64) {
    try {
      const json = Buffer.from(saBase64, 'base64').toString('utf8');
      const dest = path.join('/tmp', `google-sa-${Date.now()}.json`);
      await fs.promises.writeFile(dest, json, { encoding: 'utf8' });
      process.env.GOOGLE_APPLICATION_CREDENTIALS = dest;
      return new GoogleGenAI(); // SDK will pick up ADC from GOOGLE_APPLICATION_CREDENTIALS
    } catch (err) {
      console.error('Failed to write service account JSON from env:', err);
      throw err;
    }
  }

  // No credentials found - let the caller see an explicit error
  throw new Error('No Google credentials found. Set API_KEY/GEMINI_API_KEY or SERVICE_ACCOUNT_JSON_BASE64.');
}

function buildPrompt() {
  return `Extract structured data (merchant, total, items, categories) from the given receipt text or image. Return JSON only.`;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const { ocrText, imageBase64, mimeType = 'image/jpeg' } = req.body || {};

    const ai = await createClient();

    const contents = [{ role: 'user', parts: [{ text: buildPrompt() }] }];
    if (ocrText) contents[0].parts.push({ text: `OCR:\n${ocrText}` });
    if (imageBase64) {
      contents[0].parts.push({ inlineData: { mimeType, data: imageBase64 } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            total: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    let data;
    if (response && response.parsed) data = response.parsed;
    else if (response && typeof response.text === 'string') {
      try {
        data = JSON.parse(response.text);
      } catch (e) {
        console.error('Failed to parse model text:', e, response.text);
        data = { raw: response };
      }
    } else data = response ?? { message: 'No response from model' };

    res.json(data);
  } catch (err) {
    console.error('Error in /api/parse handler:', err);
    res.status(500).json({ error: 'Parse failed', detail: String(err) });
  }
}
