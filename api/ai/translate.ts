import { handleCors } from '../utils/cors';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyTurnstileToken } from '../utils/turnstile';

function cleanAiOutput(text: any): string {
  if (!text) return '';
  
  if (typeof text === 'object') {
    if (text.text) return String(text.text);
    if (text.translation) return String(text.translation);
    text = JSON.stringify(text);
  } else if (typeof text !== 'string') {
    text = String(text);
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed.text) return String(parsed.text);
    if (parsed.translation) return String(parsed.translation);
  } catch (e) {
    // Not JSON
  }

  let cleaned = text.trim();
  // Remove markdown blocks
  cleaned = cleaned.replace(/^```[a-z]*\n/, '').replace(/```$/, '').trim();
  
  // Remove known intros
  const intros = [
    /^Here is a [^\n]+:/i,
    /^Here is the [^\n]+:/i,
    /^Based on the [^\n]+:/i,
    /^Segue [^\n]+:/i,
    /^Aqui está [^\n]+:/i,
    /^Translated text:/i
  ];
  for (const intro of intros) {
    cleaned = cleaned.replace(intro, '').trim();
  }
  
  // Remove wrapping quotes if present
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  
  return cleaned;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers['x-turnstile-token'] as string | undefined;
  const isHuman = await verifyTurnstileToken(token);
  if (!isHuman) {
    return res.status(403).json({ error: 'Invalid or missing Turnstile token' });
  }

  const { texts, sourceLocale, targetLocale } = req.body;
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: 'Invalid texts array' });
  }

  const cloudflareToken = process.env.AI_CLOUDFLARE_TOKEN;
  const accountId = process.env.AI_CLOUDFLARE_ACCOUNT_ID;
  const groqToken = process.env.AI_GROQ_TOKEN;

  if ((!cloudflareToken || !accountId) && !groqToken) {
    return res.status(500).json({ error: 'Nenhum provedor de IA configurado no .env' });
  }

  const sourceName = sourceLocale.startsWith('pt') ? 'Brazilian Portuguese' : 'English';
  const targetName = targetLocale.startsWith('pt') ? 'Brazilian Portuguese' : 'English';

  try {
    const promises = texts.map(async (item: any) => {
      const { id, text } = item;
      if (!id || !text) return { id, error: 'Invalid item' };

      const messages = [
        {
          role: 'system',
          content: `Translate the text faithfully from ${sourceName} to ${targetName}.

Preserve exactly the same meaning, facts, tone and level of detail.
Do not add, remove, summarize or reinterpret information.
Keep proper names, product names and technology names unchanged.
Return ONLY the translated paragraph.
Do not include introductions, labels, explanations, Markdown or quotation marks.
Return exactly the following JSON structure: { "translation": "translated text here" }`
        },
        {
          role: 'user',
          content: text
        }
      ];

      // Tenta Cloudflare
      if (cloudflareToken && accountId) {
        try {
          const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${cloudflareToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success !== false && data.result?.response) {
              const cleaned = cleanAiOutput(data.result.response);
              return { id, text: cleaned, provider: 'cloudflare' };
            }
          }
        } catch (err) {}
      }

      // Fallback Groq
      if (groqToken) {
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${groqToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama3-8b-8192',
              messages,
              temperature: 0.1,
              max_tokens: 300,
              response_format: { type: 'json_object' }
            })
          });

          if (response.ok) {
            const data = await response.json();
            const gen = data.choices?.[0]?.message?.content;
            if (gen) {
              const cleaned = cleanAiOutput(gen);
              return { id, text: cleaned, provider: 'groq' };
            }
          }
        } catch (err) {}
      }

      return { id, error: 'Falha na tradução' };
    });

    const results = await Promise.all(promises);
    return res.status(200).json({ results });
  } catch (err) {
    return res.status(500).json({ error: 'Internal error' });
  }
}
