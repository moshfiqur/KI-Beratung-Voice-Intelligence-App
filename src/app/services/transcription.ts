import OpenAI from "openai";
import { readFile } from "@tauri-apps/plugin-fs";
import { BaseDirectory } from "@tauri-apps/plugin-fs";
import { getOpenAIApiKey } from "./settings";

export async function transcribeAudio(
  filePath: string,
  language?: string
): Promise<string> {
  const apiKey = await getOpenAIApiKey();
  if (!apiKey) {
    throw new Error("OpenAI API Key not found. Please set it in settings.");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });

  try {
    console.log("Transcription: Received file path:", filePath);
    
    // Extract just the filename from the full path
    const fileName = filePath.split('/').pop() || 'recording.wav';
    console.log("Transcription: Extracted filename:", fileName);
    console.log("Transcription: Using BaseDirectory.Temp");
    
    // Read the file from the temp directory
    const fileBytes = await readFile(fileName, { baseDir: BaseDirectory.Temp });
    console.log("Transcription: Successfully read file, size:", fileBytes.length);
    
    const file = new File([fileBytes], fileName, { type: "audio/wav" });

    console.log("Transcription: Sending to OpenAI Whisper...");
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: language,
      prompt: "Transcribe this speech accurately, with punctuation.",
    });

    console.log("Transcription: Successfully transcribed audio");
    return transcription.text;
  } catch (error: unknown) {
    console.error("Transcription error:", error);
    const message = error instanceof Error ? error.message : "Failed to transcribe audio";
    throw new Error(message);
  }
}
