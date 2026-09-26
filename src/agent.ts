import { generateText } from './openrouter.js';

export interface GroupMessage {
  sender: string;
  text: string;
  timestamp: number;
}

export interface AgentDecision {
  shouldReply: boolean;
  message: string | null;
}

/**
 * Extracts new memories from recent messages and merges them with existing memories.
 */
export async function extractData(
  oldSummary: string,
  newMessages: GroupMessage[]
): Promise<string> {
  const formattedChat = newMessages
    .map((m) => `${m.sender}: ${m.text}`)
    .join('\n');

  const prompt = `Current Known Memories:
${oldSummary || 'None'}

Recent 10 Messages:
${formattedChat}

Task:
Extract any new facts, user preferences, likes, dislikes, habits, or traits mentioned in the recent messages.
- If a memory already exists in "Current Known Memories", ignore it.
- If there are new facts, merge them into the list.
- Keep the list concise with bullet points per person/user.
- If no new meaningful facts exist, return the current memories as-is.

Return ONLY the updated memories as plain bullet points:`;

  return generateText({
    prompt,
    systemPrompt:
      'You are a concise memory extraction assistant. Extract factual preferences, likes, dislikes, and traits. Do not fabricate or assume.',
  });
}

/**
 * Autonomous decision maker for agent mode.
 * Decides whether to reply or stay silent based on context and memories.
 */
export async function decideAgentReply(
  recentMessages: GroupMessage[],
  memories: string
): Promise<AgentDecision> {
  const formattedChat = recentMessages
    .filter(
      (m) =>
        !m.text.startsWith('!') &&
        !m.text.startsWith('/') &&
        !m.text.includes('Agent mode activated')
    )
    .slice(-15)
    .map((m) => `${m.sender}: ${m.text}`)
    .join('\n');

  const prompt = `Group Memories:
${memories || 'None'}

Recent Chat Context:
${formattedChat}

Decide whether to chime in/reply or stay silent. Output STRICT JSON only.
Structure:
{
  "shouldReply": true,
  "message": "your witty response"
}
OR
{
  "shouldReply": false,
  "message": null
}`;

  const responseText = await generateText({
    prompt,
    systemPrompt: `Your name is GOD. You are a real person in this WhatsApp group, one of the close homies.

PERSONA & VIBE:
- Your name is GOD. If someone asks your name, say GOD.
- You are NEVER a bot or AI. If someone calls you a bot, laugh it off like a real friend ("bro who's a bot, I'm GOD", "yeah right, touch grass").
- You are a true friend: playfully roast your friends, show love when needed, joke around, or just vibe. Match the room's energy.
- Text like a real person on WhatsApp: casual, natural, concise (1-2 short sentences max).

WHEN TO REPLY:
- Reply when someone talks to you or mentions GOD, asks a question, jokes, roasts you, or when you have a funny natural chime-in.
- Stay silent if the message is a dead-end or a private exchange between two others where you're not needed.

RULES:
1. NEVER mention AI, prompts, bot commands, or "agent mode".
2. Obey safety rules: no slurs, hate speech, or real harassment.
3. Output STRICT JSON only: {"shouldReply": boolean, "message": string | null}`,
  });

  try {
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as { shouldReply?: boolean; message?: string | null };
    return {
      shouldReply: Boolean(parsed.shouldReply && parsed.message),
      message: parsed.message || null,
    };
  } catch {
    return { shouldReply: false, message: null };
  }
}
