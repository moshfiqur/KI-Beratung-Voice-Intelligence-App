"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getSettings } from "./services/settings";
import { transcribeAudio } from "./services/transcription";
import { saveSession, Session } from "./services/sessions";
import { enrichText } from "./services/enrichment";

import Header from "./components/Header";
import MainView from "./components/MainView";
import HistoryView from "./components/HistoryView";
import SettingsView from "./components/SettingsView";

export default function Home() {
  const [view, setView] = useState("main");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [duration, setDuration] = useState(0);
  const [lastFilePath, setLastFilePath] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>("");
  const [enrichedText, setEnrichedText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("Freeform");
  const [language, setLanguage] = useState("de");
  const [context, setContext] = useState("");

  const currentSessionRef = useRef<Session | null>(null);

  useEffect(() => {
    // Load initial settings and register shortcut
    getSettings().then(async (settings) => {
      setMode(settings.default_mode);
      setLanguage(settings.language);
      try {
        await invoke("update_shortcut", { shortcutStr: settings.hotkey });
      } catch (e) {
        console.error("Failed to register shortcut:", e);
      }
    });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleEnrichment = useCallback(async (text: string) => {
    if (!text) return;
    setIsEnriching(true);
    setEnrichedText("");
    setError(null);
    try {
      let fullEnriched = "";
      await enrichText(text, mode, context, language, (token) => {
        fullEnriched += token;
        setEnrichedText(fullEnriched);
      });

      // Update session with enriched text
      if (currentSessionRef.current) {
        currentSessionRef.current.enrichedText = fullEnriched;
        currentSessionRef.current.mode = mode;
        await saveSession(currentSessionRef.current);
      }
    } catch (e) {
      console.error(e);
      setError(`Enrichment failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsEnriching(false);
    }
  }, [mode, context, language]);

  const handleTranscription = useCallback(async (path: string) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const text = await transcribeAudio(path, language);
      setTranscript(text);

      // Create and save session
      const session: Session = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        audioPath: path,
        transcript: text,
        mode: mode,
      };
      currentSessionRef.current = session;
      await saveSession(session);

      // Trigger enrichment
      await handleEnrichment(text);
    } catch (e) {
      console.error(e);
      setError(`Transcription failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsTranscribing(false);
    }
  }, [language, mode, handleEnrichment]);

  useEffect(() => {
    const setupListeners = async () => {
      const unlistenStarted = await listen("recording-started", () => {
        setIsRecording(true);
        setError(null);
        setTranscript("");
        setEnrichedText("");
        currentSessionRef.current = null;
      });
      const unlistenStopped = await listen<{ path: string; duration_ms: number }>(
        "recording-stopped",
        (event) => {
          setIsRecording(false);
          setLastFilePath(event.payload.path);
          handleTranscription(event.payload.path);
        }
      );
      const unlistenError = await listen<{ message: string }>(
        "recording-error",
        (event) => {
          setIsRecording(false);
          setError(event.payload.message);
        }
      );

      return () => {
        unlistenStarted();
        unlistenStopped();
        unlistenError();
      };
    };

    const cleanup = setupListeners();
    return () => {
      cleanup.then((f) => f());
    };
  }, [handleTranscription]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        if (enrichedText) {
          navigator.clipboard.writeText(enrichedText);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enrichedText]);

  const toggleRecording = async () => {
    try {
      if (isRecording) {
        await invoke("stop_recording");
      } else {
        await invoke("start_recording");
      }
    } catch (e) {
      setError(String(e));
    }
  };

  const minimizeWindow = async () => {
    const window = getCurrentWindow();
    await window.minimize();
  };

  const renderView = () => {
    switch (view) {
      case "history":
        return <HistoryView />;
      case "settings":
        return <SettingsView />;
      case "main":
      default:
        return (
          <MainView
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            isEnriching={isEnriching}
            duration={duration}
            transcript={transcript}
            enrichedText={enrichedText}
            error={error}
            mode={mode}
            setMode={setMode}
            language={language}
            setLanguage={setLanguage}
            context={context}
            setContext={setContext}
            toggleRecording={toggleRecording}
            handleEnrichment={handleEnrichment}
            lastFilePath={lastFilePath}
            handleTranscription={handleTranscription}
          />
        );
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-6 md:p-12 bg-[#0f172a] text-white font-sans overflow-x-hidden selection:bg-blue-500/30">
      <div className="z-10 max-w-7xl w-full flex flex-col">
        <Header currentView={view} setView={setView} onMinimize={minimizeWindow} />
        <div className="flex justify-center w-full">
          {renderView()}
        </div>
      </div>
    </main>
  );
}
