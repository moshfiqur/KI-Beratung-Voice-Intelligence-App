"use client";

import { useState, useEffect } from "react";
import { getSettings, saveSettings, Settings } from "../services/settings";
import { invoke } from "@tauri-apps/api/core";

export default function SettingsView() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [devices, setDevices] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
    invoke<string[]>("list_audio_devices").then(setDevices).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    try {
      await saveSettings(settings);
      // Re-register shortcut
      await invoke("update_shortcut", { shortcutStr: settings.hotkey });
      setMessage({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage({ type: "error", text: `Failed to save: ${e}` });
    }
  };

  if (!settings) return null;

  return (
    <div className="w-full max-w-3xl bg-slate-800/60 backdrop-blur-md p-10 rounded-[2.5rem] border border-slate-700/50 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
      <h2 className="text-3xl font-bold mb-8 flex items-center">
        <span className="w-3 h-8 bg-blue-500 rounded-full mr-4" />
        Application Settings
      </h2>

      <div className="space-y-8">
        {/* API Key */}
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/30">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={settings.openai_api_key || ""}
            onChange={(e) => setSettings({ ...settings, openai_api_key: e.target.value })}
            placeholder="sk-..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
          />
          <p className="mt-3 text-[11px] text-slate-500 font-medium">
             Your key is stored locally. It's required for transcription (Whisper) and analysis (GPT-4o).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hotkey */}
          <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/30">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
              Global Shortcut
            </label>
            <input
              type="text"
              value={settings.hotkey}
              onChange={(e) => setSettings({ ...settings, hotkey: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
            />
            <p className="mt-3 text-[11px] text-slate-500 font-medium">
               Example: <code className="text-blue-400">Command + Shift + V (Mac), Control + Shift + V (Windows/Linux)</code>
            </p>
          </div>

          {/* Default Mode */}
          <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/30">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
              Default AI Mode
            </label>
            <select
              value={settings.default_mode}
              onChange={(e) => setSettings({ ...settings, default_mode: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Freeform">Freeform Clean-up</option>
              <option value="Meeting">Meeting Notes</option>
              <option value="Tasks">Task Capture</option>
            </select>
          </div>
        </div>

        {/* Mic Selection (Placeholder/Mock as we don't save it yet) */}
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/30 opacity-60">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">
            Microphone Input (Preview)
          </label>
          <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-not-allowed">
            {devices.length > 0 ? (
              devices.map((d) => <option key={d}>{d}</option>)
            ) : (
              <option>Default System Microphone</option>
            )}
          </select>
          <p className="mt-3 text-[11px] text-slate-500 font-medium">
             Device selection is currently automatic.
          </p>
        </div>

        <div className="flex flex-col space-y-4 pt-4">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            Save Settings
          </button>

          {message && (
            <div className={`p-4 rounded-xl text-center text-sm font-bold animate-in fade-in zoom-in duration-300 ${
              message.type === "success" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="border-t border-slate-700/50 pt-8 mt-4 text-center">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
                By using this app, you acknowledge that audio data and transcripts are sent to OpenAI for processing.
                Your API key and history are stored locally on this machine.
            </p>
        </div>
      </div>
    </div>
  );
}
