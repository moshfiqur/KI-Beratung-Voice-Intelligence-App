import { load } from "@tauri-apps/plugin-store";

const STORE_PATH = "settings.json";

export interface Settings {
  openai_api_key: string | null;
  hotkey: string;
  default_mode: string;
  language: string;
}

const DEFAULT_SETTINGS: Settings = {
  openai_api_key: null,
  hotkey: "CommandOrControl+Shift+V",
  default_mode: "Freeform",
  language: "de",
};

export async function getSettings(): Promise<Settings> {
  const store = await load(STORE_PATH, { autoSave: true, defaults: {} });
  const settings: Settings = { ...DEFAULT_SETTINGS };

  const apiKey = await store.get<string>("openai_api_key");
  if (apiKey) settings.openai_api_key = apiKey;

  const hotkey = await store.get<string>("hotkey");
  if (hotkey) settings.hotkey = hotkey;

  const mode = await store.get<string>("default_mode");
  if (mode) settings.default_mode = mode;

  const language = await store.get<string>("language");
  if (language) settings.language = language;

  return settings;
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const store = await load(STORE_PATH, { autoSave: true, defaults: {} });
  if (settings.openai_api_key !== undefined) {
    await store.set("openai_api_key", settings.openai_api_key);
  }
  if (settings.hotkey !== undefined) {
    await store.set("hotkey", settings.hotkey);
  }
  if (settings.default_mode !== undefined) {
    await store.set("default_mode", settings.default_mode);
  }
  if (settings.language !== undefined) {
    await store.set("language", settings.language);
  }
  await store.save();
}

export async function getOpenAIApiKey(): Promise<string | null> {
  const settings = await getSettings();
  return settings.openai_api_key;
}

export async function setOpenAIApiKey(apiKey: string): Promise<void> {
  await saveSettings({ openai_api_key: apiKey });
}
