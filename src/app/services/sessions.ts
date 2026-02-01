import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import { BaseDirectory } from "@tauri-apps/plugin-fs";

export interface Session {
  id: string;
  timestamp: number;
  audioPath: string;
  transcript: string;
  enrichedText?: string;
  mode?: string;
}

const SESSIONS_FILE = "sessions.json";

export async function saveSession(session: Session): Promise<void> {
  const sessions = await loadSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index !== -1) {
    sessions[index] = session;
  } else {
    sessions.unshift(session); // Add to the beginning
  }
  await writeTextFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), {
    baseDir: BaseDirectory.AppData,
    createNew: false
  });
}

export async function loadSessions(): Promise<Session[]> {
  try {
    const content = await readTextFile(SESSIONS_FILE, { baseDir: BaseDirectory.AppData });
    const sessions = JSON.parse(content) as Session[];
    return sessions.slice(0, 20); // Limit to past 20 sessions
  } catch (error) {
    // File doesn't exist or can't be read, return empty array
    console.error("Failed to load sessions:", error);
    return [];
  }
}
