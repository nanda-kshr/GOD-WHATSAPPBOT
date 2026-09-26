import 'dotenv/config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterOptions {
  prompt: string;
  history?: ChatMessage[];
  systemPrompt?: string;
  model?: string;
}

export interface QueueItem {
  prompt: string;
  history?: ChatMessage[];
  systemPrompt?: string;
  timestamp?: number;
  [key: string]: unknown;
}

// Queue array with capacity of 100 items (reserved for future use)
export const MAX_QUEUE_SIZE = 100;
export const queue: QueueItem[] = [];

const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

/**
 * Sends a prompt with optional history and system prompt to OpenRouter and returns the output text.
 */
export async function generateText(options: OpenRouterOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER API key not found in environment variables.');
  }

  const { prompt, history = [], systemPrompt, model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL } = options;

  const messages: ChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  if (history.length > 0) {
    messages.push(...history);
  }

  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() || '';
}
