import { handleCors } from '../utils/cors';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyTurnstileToken } from '../utils/turnstile';

function filterResumeText(text: string): string {
  const keywords = [
    'experiência', 'formação', 'educação', 'studys', 'cursos', 'experiencia',
    'profissão', 'histórico', 'experience', 'education', 'work history', 'employment', 'academic',
    'projetos', 'projects', 'carreira', 'career'
  ];
  
  const lowerText = text.toLowerCase();
  let earliestIndex = text.length;
  
  for (const keyword of keywords) {
    const idx = lowerText.indexOf(keyword);
    // Only consider the keyword if it appears relatively early or is surrounded by newlines/spaces (basic heuristic)
    if (idx !== -1 && idx < earliestIndex) {
      earliestIndex = idx;
    }
  }
  
  let filteredText = text;
  if (earliestIndex > 0 && earliestIndex < text.length) {
    // Back up slightly to capture the header itself and preceding newline
    const startIdx = Math.max(0, earliestIndex - 20);
    filteredText = text.substring(startIdx);
  }
  
  // Hard limit to 8000 characters to prevent token overflow on both input and output
  return filteredText.substring(0, 8000);
}

function extractJson(text: string): any {
  let cleaned = text.trim();
  // Remove markdown
  if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\n?/, '');
  else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```[a-z]*\n?/, '');
  if (cleaned.endsWith('```')) cleaned = cleaned.replace(/```$/, '');
  cleaned = cleaned.trim();
  
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    cleaned = match[0];
  }
  
  // If it's still invalid, it might be truncated. We could try to fix it, but let's just let JSON.parse throw the actual error if it's unfixable.
  return JSON.parse(cleaned);
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';
// This will simulate using the managed AI endpoint configuration similar to suggest-profile.
// Since the prompt states "Reuse the existing AI/provider infrastructure only when needed",
// we will rely on Cloudflare/Groq endpoints as configured in the Vercel env vars, if we have them.
// But we actually use the AI client to forward requests directly if needed. 
// For managed AI, we just use the cloudflare worker or groq from the environment.
// Because the actual AI client code in `ai-client.ts` already handles external AI, 
// we will implement the managed logic here.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.headers['x-turnstile-token'] as string | undefined;
  const isHuman = await verifyTurnstileToken(token);
  if (!isHuman) {
    return res.status(403).json({ error: 'Invalid or missing Turnstile token' });
  }

  try {
    const { text: rawText, language } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const text = filterResumeText(rawText);

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) parser.
Your job is to read the unstructured text of a CV/resume and extract it into a structured JSON format.
Extract the professional Experience and Education. Do not invent information. If a field is unknown, leave it empty.

CRITICAL DATE FORMATTING:
Dates in the resume can appear in many formats (e.g. MM-DD-YYYY, YYYY-MM, MM-YY, MM/YYYY, or inverted based on language).
You MUST convert ALL extracted dates (startDate, endDate) into a strict "MM/YYYY" format (e.g., "10/2023"). If a date only has a year, use "01/YYYY".

Current interface language: ${language || 'en'}.
Return the result strictly as a JSON object with this shape:
{
  "experiences": [
    { "id": "exp_1", "company": "...", "title": "...", "startDate": "MM/YYYY", "endDate": "MM/YYYY or null", "current": boolean, "location": "...", "employmentType": "...", "description": "..." }
  ],
  "education": [
    { "id": "edu_1", "institution": "...", "course": "...", "degree": "...", "fieldOfStudy": "...", "startDate": "MM/YYYY", "endDate": "MM/YYYY or null", "current": boolean, "description": "..." }
  ]
}
No markdown wrappers, only pure JSON string.`;
    let errors: string[] = [];

    // Try GROQ first for fast inference
    const groqKey = process.env.AI_GROQ_TOKEN;
    if (groqKey) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 2000
        })
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        return res.status(200).json({ result: extractJson(content), provider: 'groq' });
      } else {
        errors.push(`Groq Error: ${response.status} ${await response.text()}`);
      }
    }

    // Fallback to Cloudflare
    const cfAccountId = process.env.AI_CLOUDFLARE_ACCOUNT_ID;
    const cfToken = process.env.AI_CLOUDFLARE_TOKEN;
    if (cfAccountId && cfToken) {
      const url = `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          max_tokens: 2000
        })
      });
      if (response.ok) {
        const data = await response.json();
        let content = data.result?.response || '';
        
        return res.status(200).json({ result: extractJson(content), provider: 'cloudflare' });
      } else {
        errors.push(`Cloudflare Error: ${response.status} ${await response.text()}`);
      }
    }

    console.error('AI Parsing failed:', errors);
    return res.status(503).json({ error: 'No managed AI providers available or request failed.', details: errors });
  } catch (error: any) {
    console.error('AI Parse error:', error);
    return res.status(500).json({ error: 'Failed to parse resume with AI', details: error.message });
  }
}
