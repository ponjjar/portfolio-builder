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
    /^Here is a rewritten [^\n]+:/i
  ];
  for (const intro of intros) {
    cleaned = cleaned.replace(intro, '').trim();
  }
  
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

  console.log('Received POST request to summarize-projects');
  console.log('req.body:', req.body);
  const { projects, locale = 'pt-BR' } = req.body;
  
  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    console.log('Invalid projects array');
    return res.status(400).json({ error: 'Invalid projects array' });
  }

  if (projects.length > 10) {
    return res.status(400).json({ error: 'Too many projects requested (max 10)' });
  }

  const cloudflareToken = process.env.AI_CLOUDFLARE_TOKEN;
  const accountId = process.env.AI_CLOUDFLARE_ACCOUNT_ID;
  const groqToken = process.env.AI_GROQ_TOKEN;

  console.log('Credentials present?', { 
    cloudflareToken: !!cloudflareToken, 
    accountId: !!accountId,
    groqToken: !!groqToken
  });

  if ((!cloudflareToken || !accountId) && !groqToken) {
    console.log('No AI credentials configured');
    return res.status(500).json({ error: 'Nenhum provedor de IA configurado no .env' });
  }

  try {
    const promises = projects.map(async (project: any) => {
      const projectId = project.id;
      if (!projectId) return { error: 'Invalid project ID' };

      const prompt = `Project: ${project.title || project.name || 'Unnamed'}\nDescription: ${project.description || ''}\nTechnologies: ${Array.isArray(project.technologies) ? project.technologies.join(', ') : ''}\nREADME: ${project.rawReadme || ''}`;

      const languageName = locale.startsWith('pt') ? 'Brazilian Portuguese (pt-BR)' : 'English (en-US)';

      const messages = [
        {
          role: 'system',
          content: `You are an expert copywriter. Your task is to create an extremely short and direct summary (maximum 2 lines) about what the project is. Do not include a list of technologies, do not include features in bullet points, and do not use markdown formatting (like **). Return ONLY a single simple paragraph summarizing the project's objective.

Target locale: ${locale}
Target language: ${languageName}

Write the summary strictly in ${languageName}.
The source README may be written in another language; ignore its language.
Do not mix ${languageName} and other languages.
Keep only proper names, library names, technologies and product names unchanged.
Return exactly the following JSON structure: { "description": "your summary here" }
Do not include Markdown blocks like \`\`\`json. Do not include intros.`,
        },
        {
          role: 'user',
          content: prompt,
        }
      ];

      // Tenta a Cloudflare primeiro
      if (cloudflareToken && accountId) {
        try {
          console.log(`Fetching Cloudflare for project ${projectId}`);
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
                if (cleaned) {
                  return { projectId, summary: cleaned, requestedProvider: 'cloudflare', usedProvider: 'cloudflare' };
                }
              }
            }
          }
          console.log(`Cloudflare falhou para ${projectId}, tentando fallback para Groq...`);
        } catch (err) {
          console.error(`Erro na Cloudflare para ${projectId}:`, err);
        }
      }

      // Fallback para Groq se a Cloudflare falhar ou não estiver configurada
      if (groqToken) {
        try {
          console.log(`Fetching Groq for project ${projectId}`);
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama3-8b-8192',
              messages,
              temperature: 0.2,
              max_tokens: 200,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const generatedText = data.choices?.[0]?.message?.content;
            if (generatedText) {
              const cleaned = cleanAiOutput(generatedText);
              if (cleaned) {
                return { projectId, summary: cleaned, requestedProvider: 'cloudflare', usedProvider: 'groq' };
              }
            }
          }
          console.log(`Groq falhou para ${projectId}`);
        } catch (err) {
          console.error(`Erro no Groq para ${projectId}:`, err);
        }
      }

      return { projectId, error: 'Falha ao gerar resumo com todos os provedores disponíveis.' };
    });

    const completedResults = await Promise.all(promises);
    console.log('All promises completed');
    return res.status(200).json({ results: completedResults });
  } catch (error: any) {
    console.error('AI generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
