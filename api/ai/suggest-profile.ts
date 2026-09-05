import { handleCors } from '../utils/cors';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyTurnstileToken } from '../utils/turnstile';

function cleanAiOutput(text: any): string {
  if (!text) return '';
  if (typeof text === 'object') {
    if (text.description) return String(text.description);
    if (text.summary) return String(text.summary);
    if (text.response) return String(text.response);
    text = JSON.stringify(text);
  } else if (typeof text !== 'string') {
    text = String(text);
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed.description) return String(parsed.description);
    if (parsed.summary) return String(parsed.summary);
  } catch (e) {}

  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```[a-z]*\n/, '').replace(/```$/, '').trim();
  
  const intros = [
    /^Here is a [^\n]+:/i,
    /^Here is the [^\n]+:/i,
    /^Based on the [^\n]+:/i,
    /^Segue [^\n]+:/i,
    /^Aqui está [^\n]+:/i,
    /^Here is a rewritten [^\n]+:/i,
    /^Here is a professional summary:/i,
    /^Segue uma sugestão de perfil profissional:/i,
    /^Com base nos projetos fornecidos:/i
  ];
  for (const intro of intros) {
    cleaned = cleaned.replace(intro, '').trim();
  }
  
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  
  return cleaned;
}

const cloudflareToken = process.env.AI_CLOUDFLARE_TOKEN;
const accountId = process.env.AI_CLOUDFLARE_ACCOUNT_ID;
const groqToken = process.env.AI_GROQ_TOKEN;

async function generateProfile(prompt: string, locale: string): Promise<{ text: string, provider: 'cloudflare' | 'groq' }> {
  const languageName = locale === 'pt-BR' ? 'Brazilian Portuguese (pt-BR)' : 'English (en-US)';
  const messages = [
    {
      role: 'system',
      content: `You are an expert tech career copywriter.
Your task is to create a short professional presentation (1 paragraph, 2 or 3 sentences, max 450 characters) that explains what the person does, based EXCLUSIVELY on the provided projects.
- Do not invent years of experience, job titles, companies or metrics.
- Do not list the projects. Highlight the types of products/solutions built.
- Do not claim expertise that cannot be supported by the projects.
- Do not add comments, intros or notes. Return ONLY the description text.

Target locale: ${locale}
Target language: ${languageName}

Write the description strictly in ${languageName}.
Do not mix ${languageName} and other languages.
Keep only proper names, library names, technologies and product names unchanged.
Return exactly the following JSON structure: { "description": "your description here" }
Do not include Markdown blocks like \`\`\`json.`,
    },
    { role: 'user', content: prompt }
  ];

  if (cloudflareToken && accountId) {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success !== false) {
          const generatedText = data.result?.response;
          if (generatedText) {
            const cleaned = cleanAiOutput(generatedText);
            if (cleaned) return { text: cleaned, provider: 'cloudflare' };
          }
        }
      }
    } catch (err) {
      console.error(`Erro na Cloudflare (generate):`, err);
    }
  }

  if (groqToken) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages,
          temperature: 0.3,
          max_tokens: 300,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;
        if (generatedText) {
          const cleaned = cleanAiOutput(generatedText);
          if (cleaned) return { text: cleaned, provider: 'groq' };
        }
      }
    } catch (err) {
      console.error(`Erro no Groq (generate):`, err);
    }
  }

  throw new Error('Falha ao gerar perfil com todos os provedores disponíveis.');
}

async function translateProfile(text: string, targetLocale: string): Promise<string> {
  const targetName = targetLocale === 'pt-BR' ? 'Brazilian Portuguese' : 'English';
  const messages = [
    {
      role: 'system',
      content: `You are a professional technical translator. Translate the given text to ${targetName}.
- Keep technical terms and proper nouns in original form if they are commonly used in English.
- Return ONLY the translated text in JSON format: { "description": "translated text here" }
- Do not include introductions, markdown formatting, or notes.`
    },
    { role: 'user', content: text }
  ];

  if (cloudflareToken && accountId) {
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success !== false) {
          const generatedText = data.result?.response;
          if (generatedText) {
            const cleaned = cleanAiOutput(generatedText);
            if (cleaned) return cleaned;
          }
        }
      }
    } catch (err) {
      console.error(`Erro na Cloudflare (translate):`, err);
    }
  }

  if (groqToken) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages,
          temperature: 0.1,
          max_tokens: 300,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;
        if (generatedText) {
          const cleaned = cleanAiOutput(generatedText);
          if (cleaned) return cleaned;
        }
      }
    } catch (err) {
      console.error(`Erro no Groq (translate):`, err);
    }
  }

  throw new Error('Falha ao traduzir com todos os provedores disponíveis.');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

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

  try {
    const { sourceLocale, targetLocales = [], projects = [], currentProfile } = req.body;

    if (!sourceLocale || !Array.isArray(projects) || projects.length === 0) {
      return res.status(400).json({ error: 'Parâmetros inválidos: sourceLocale e array de projetos são obrigatórios.' });
    }

    if ((!cloudflareToken || !accountId) && !groqToken) {
      return res.status(500).json({ error: 'Nenhum provedor de IA configurado no .env' });
    }

    const currentBio = currentProfile?.descriptions?.[sourceLocale as 'pt-BR' | 'en'] || 'N/A';
    
    const projectLines = projects.map(p => {
      const tech = p.technologies?.length ? ` [${p.technologies.join(', ')}]` : '';
      return `- ${p.name}${tech}: ${p.summary}`;
    }).join('\n');

    const prompt = `Current Bio: ${currentBio}\nProject Summaries:\n${projectLines}`;

    // 1. Gera base no sourceLocale
    const { text: baseDescription, provider } = await generateProfile(prompt, sourceLocale);
    
    const suggestions: Record<string, string> = {};
    suggestions[sourceLocale] = baseDescription;

    // 2. Traduz para os outros locales
    const translations = targetLocales.filter((loc: string) => loc !== sourceLocale);
    
    for (const locale of translations) {
      try {
        const translated = await translateProfile(baseDescription, locale);
        suggestions[locale] = translated;
      } catch (err: any) {
        console.error(`Erro ao traduzir para ${locale}:`, err.message);
        // Mesmo falhando uma tradução, mantemos as outras.
      }
    }

    return res.status(200).json({
      suggestions,
      sourceLocale,
      provider
    });
  } catch (error: any) {
    console.error('Erro na etapa do perfil:', error.message);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
