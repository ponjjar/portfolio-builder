import { SummarizeProjectsRequest, SummarizeProjectsResponse, SuggestProfileRequest, SuggestProfileResponse, TranslateRequest, TranslateResponse, ParseResumeRequest, ParseResumeResponse } from './types';
import { ExternalAiConfig } from '@/components/ai/AiExternalConfigModal';

import { Platform } from 'react-native';

function getApiBaseUrl() {
  let url = Platform.OS !== 'web' && process.env.EXPO_PUBLIC_API_MOBILE_URL 
    ? process.env.EXPO_PUBLIC_API_MOBILE_URL 
    : (process.env.EXPO_PUBLIC_API_BASE_URL || '');

  // Remove trailing slash and /api suffix so routes map correctly to /api/ai/...
  url = url.replace(/\/api\/?$/, '').replace(/\/$/, '');

  // Android Emulator needs 10.0.2.2 to access host's localhost
  if (Platform.OS === 'android' && url) {
    url = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }
  return url;
}

export class AiClient {
  static async summarizeProjects(request: SummarizeProjectsRequest): Promise<SummarizeProjectsResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/ai/summarize-projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.turnstileToken ? { 'x-turnstile-token': request.turnstileToken } : {})
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to summarize projects: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  static async suggestProfile(request: SuggestProfileRequest): Promise<SuggestProfileResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/ai/suggest-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.turnstileToken ? { 'x-turnstile-token': request.turnstileToken } : {})
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to suggest profile: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  static async translate(request: TranslateRequest): Promise<TranslateResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/ai/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.turnstileToken ? { 'x-turnstile-token': request.turnstileToken } : {})
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to translate: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  static async fetchExternalSummary(
    config: ExternalAiConfig, 
    projectPrompt: string, 
    languageName: string
  ): Promise<string> {
    const systemPrompt = `Você é um redator especialista. Sua tarefa é criar um resumo extremamente curto e direto (máximo de 2 linhas) sobre o que é o projeto. Não inclua lista de tecnologias, não inclua funcionalidades em tópicos, e não use formatação markdown (como **). Retorne APENAS um parágrafo simples resumindo o objetivo do projeto.\n\nThe current interface language is ${languageName}.\nGenerate every user-visible response strictly in ${languageName}.\nDo not choose the language based on the README.\nKeep only proper names, product names and technical terms in their original form.\nDo not mix languages.`;

    if (config.provider === 'openai' || config.provider === 'ollama' || config.provider === 'custom') {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
      
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: projectPrompt }
          ],
          temperature: 0.7,
        })
      });
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      const data = await res.json();
      return data.choices[0].message.content;
    } else if (config.provider === 'gemini') {
      const res = await fetch(`${config.endpoint}/models/${config.model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt } },
          contents: [{ parts: [{ text: projectPrompt }] }]
        })
      });
      if (!res.ok) throw new Error(`Gemini API Error: ${res.statusText}`);
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }
    throw new Error('Unsupported provider');
  }

  static async parseResume(request: ParseResumeRequest): Promise<ParseResumeResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/ai/parse-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(request.turnstileToken ? { 'x-turnstile-token': request.turnstileToken } : {})
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to parse resume: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  static async fetchExternalResumeParse(
    config: ExternalAiConfig, 
    text: string, 
    languageName: string
  ): Promise<any> {
    const systemPrompt = `You are an expert ATS (Applicant Tracking System) parser.
Your job is to read the unstructured text of a CV/resume and extract it into a structured JSON format.
Extract the professional Experience and Education. Do not invent information. If a field is unknown, leave it empty.
Current interface language: ${languageName}.
Return the result strictly as a JSON object with this shape:
{
  "experiences": [
    { "id": "exp_1", "company": "...", "title": "...", "startDate": "YYYY-MM", "endDate": "YYYY-MM or null", "current": boolean, "location": "...", "employmentType": "...", "description": "..." }
  ],
  "education": [
    { "id": "edu_1", "institution": "...", "course": "...", "degree": "...", "fieldOfStudy": "...", "startDate": "YYYY-MM", "endDate": "YYYY-MM or null", "current": boolean, "description": "..." }
  ]
}
No markdown wrappers, only pure JSON string.`;

    if (config.provider === 'openai' || config.provider === 'ollama' || config.provider === 'custom') {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.apiKey) headers['Authorization'] = `Bearer ${config.apiKey}`;
      
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        })
      });
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content);
    } else if (config.provider === 'gemini') {
      const res = await fetch(`${config.endpoint}/models/${config.model}:generateContent?key=${config.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: systemPrompt } },
          contents: [{ parts: [{ text }] }]
        })
      });
      if (!res.ok) throw new Error(`Gemini API Error: ${res.statusText}`);
      const data = await res.json();
      let content = data.candidates[0].content.parts[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) content = jsonMatch[0];
      return JSON.parse(content);
    }
    throw new Error('Unsupported provider');
  }
}
