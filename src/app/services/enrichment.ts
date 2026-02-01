import OpenAI from "openai";
import { getOpenAIApiKey } from "./settings";

const PROMPTS: Record<string, string> = {
  Freeform: "You are an expert editor. Clean up the following transcript by correcting punctuation and organizing it into logical paragraphs. Do not change the original meaning or remove important details. Keep the tone consistent with the original speech.",
  Meeting: "You are an expert meeting assistant. Summarize the following transcript into professional meeting notes. Include a brief summary, key discussion points, and a clear list of action items with owners if mentioned. Use markdown formatting.",
  Tasks: "You are a productivity expert. Extract all tasks and to-do items from the following transcript. Present them as a clean bulleted list of actionable items. Use markdown formatting.",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  pt: "Portuguese",
  es: "Spanish",
  fr: "French",
  de: "German",
};

export async function enrichText(
  transcript: string,
  mode: string,
  context: string,
  language: string,
  onToken: (token: string) => void
): Promise<void> {
  const apiKey = await getOpenAIApiKey();
  if (!apiKey) {
    throw new Error("OpenAI API Key not found. Please set it in settings.");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  const systemPromptBase = PROMPTS[mode] || PROMPTS.Freeform;
  const languageName = LANGUAGE_NAMES[language] || "the transcript's language";
  const systemPrompt = `${systemPromptBase}\n\nAlways respond in ${languageName}.`;
  const userPrompt = context
    ? `Additional Context: ${context}\n\nTranscript: ${transcript}`
    : `Transcript: ${transcript}`;

  const stream = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      onToken(token);
    }
  }
}
