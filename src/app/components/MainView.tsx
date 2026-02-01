"use client";

import { convertFileSrc } from "@tauri-apps/api/core";

interface MainViewProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isEnriching: boolean;
  duration: number;
  transcript: string;
  enrichedText: string;
  error: string | null;
  mode: string;
  setMode: (mode: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  context: string;
  setContext: (context: string) => void;
  toggleRecording: () => void;
  handleEnrichment: (text: string) => void;
  lastFilePath: string | null;
  handleTranscription: (path: string) => void;
}

export default function MainView({
  isRecording,
  isTranscribing,
  isEnriching,
  duration,
  transcript,
  enrichedText,
  error,
  mode,
  setMode,
  language,
  setLanguage,
  context,
  setContext,
  toggleRecording,
  handleEnrichment,
  lastFilePath,
  handleTranscription,
}: MainViewProps) {
  return (
    <div className="flex flex-col items-center space-y-6 w-full max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row w-full gap-4 items-center justify-center">
        <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <label className="text-xs font-semibold text-slate-500 uppercase px-2">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-slate-900 border-none text-white text-sm rounded-lg focus:ring-0 block p-2 cursor-pointer"
          >
            <option value="Freeform">Freeform Clean-up</option>
            <option value="Meeting">Meeting Notes</option>
            <option value="Tasks">Task Capture</option>
          </select>
        </div>
        <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <label className="text-xs font-semibold text-slate-500 uppercase px-2">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-900 border-none text-white text-sm rounded-lg focus:ring-0 block p-2 cursor-pointer"
          >
            <option value="de">German</option>
            <option value="en">English</option>
            <option value="pt">Portuguese</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
      </div>

      <button
        onClick={toggleRecording}
        disabled={isTranscribing}
        className={`w-40 h-40 rounded-full flex flex-col items-center justify-center text-lg font-bold transition-all shadow-[0_0_30px_rgba(0,0,0,0.3)] ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 animate-pulse scale-105 ring-4 ring-red-500/20"
            : isTranscribing
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 hover:scale-105 ring-4 ring-blue-500/10"
        }`}
      >
        {isRecording ? (
          <>
            <div className="w-8 h-8 bg-white rounded-sm mb-2" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-white border-b-[12px] border-b-transparent ml-2 mb-2" />
            <span>Record</span>
          </>
        )}
      </button>

      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50">
          <div
            className={`w-3 h-3 rounded-full ${
              isRecording ? "bg-red-500 animate-pulse" : isTranscribing ? "bg-yellow-500 animate-bounce" : "bg-gray-500"
            }`}
          />
          <span className="text-lg font-medium">
            {isRecording
              ? `Recording... ${duration}s`
              : isTranscribing
              ? "Transcribing..."
              : "Ready to record"}
          </span>
        </div>
        {error && (
          <div className="bg-red-900/40 border border-red-500/50 p-4 rounded-2xl max-w-md w-full flex flex-col items-center space-y-3 backdrop-blur-sm">
            <p className="text-red-200 text-sm text-center font-medium">{error}</p>
            {lastFilePath && !isRecording && (
              <div className="text-center space-y-2 w-full">
                <button
                  onClick={() => handleTranscription(lastFilePath)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Retry Transcription
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-full">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
          Additional Context
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g. 'Meeting with team X', 'Formal tone', 'Technical discussion'..."
          className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all h-24 resize-none shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mt-4">
        {/* Transcript Pane */}
        <div className="flex flex-col bg-slate-800/80 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border border-slate-700/50 min-h-[450px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <span className="w-2 h-6 bg-blue-500 rounded-full mr-3" />
              Transcript
            </h2>
            {transcript && (
              <button
                onClick={() => navigator.clipboard.writeText(transcript)}
                className="text-xs bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl transition-all font-semibold active:scale-95"
              >
                Copy
              </button>
            )}
          </div>
          <div className="flex-1 bg-slate-900/60 rounded-2xl p-5 border border-slate-700/30 overflow-auto scrollbar-hide">
            {isTranscribing ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="relative">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                   <div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-blue-500/20"></div>
                </div>
                <p className="text-slate-400 font-medium animate-pulse">Processing audio...</p>
              </div>
            ) : transcript ? (
              <p className="whitespace-pre-wrap text-slate-200 leading-relaxed text-base font-normal">
                {transcript}
              </p>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <p className="italic text-center text-sm">Waiting for your voice...</p>
              </div>
            )}
          </div>
        </div>

        {/* Enrichment Pane */}
        <div className="flex flex-col bg-slate-800/80 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border border-slate-700/50 min-h-[450px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <span className="w-2 h-6 bg-indigo-500 rounded-full mr-3" />
              Intelligence
            </h2>
            <div className="flex space-x-2 items-center">
              {transcript && (
                <div className="relative">
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="h-9 bg-slate-900 border border-slate-700 text-xs text-white rounded-2xl focus:ring-0 focus:border-indigo-500 px-4 pr-10 cursor-pointer appearance-none"
                  >
                    <option value="Freeform">Freeform Clean-up</option>
                    <option value="Meeting">Meeting Notes</option>
                    <option value="Tasks">Task Capture</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 10 6"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9 1L5 5 1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}
              {transcript && (
                <button
                  onClick={() => handleEnrichment(transcript)}
                  disabled={isEnriching}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 px-4 py-2 rounded-xl transition-all font-semibold active:scale-95 shadow-lg shadow-indigo-900/20"
                >
                  {isEnriching ? "Processing..." : "Re-process"}
                </button>
              )}
              {enrichedText && (
                <button
                  onClick={() => navigator.clipboard.writeText(enrichedText)}
                  className="text-xs bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl transition-all font-semibold active:scale-95"
                >
                  Copy
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 bg-slate-900/60 rounded-2xl p-5 border border-slate-700/30 overflow-auto scrollbar-hide">
            {isEnriching && !enrichedText ? (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                 <div className="relative">
                   <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                   <div className="absolute top-0 left-0 animate-ping rounded-full h-12 w-12 border-2 border-indigo-500/20"></div>
                </div>
                <p className="text-slate-400 font-medium animate-pulse">AI is thinking...</p>
              </div>
            ) : enrichedText ? (
              <div className="relative h-full">
                <p className="whitespace-pre-wrap text-slate-200 leading-relaxed text-base font-normal">
                  {enrichedText}
                </p>
                {isEnriching && (
                  <span className="inline-block w-2 h-5 ml-1 bg-indigo-500 animate-pulse rounded-sm align-middle" />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="italic text-center text-sm">AI analysis will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {lastFilePath && !isRecording && !isTranscribing && (
        <div className="w-full max-w-2xl p-4 bg-slate-800/40 rounded-3xl border border-slate-700/50 backdrop-blur-sm animate-in slide-in-from-bottom-4">
          <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-widest font-bold ml-2">
            Playback Last Recording
          </p>
          <audio controls src={convertFileSrc(lastFilePath)} className="w-full h-10 contrast-125 opacity-80 hover:opacity-100 transition-opacity" />
        </div>
      )}

      <p className="text-[10px] text-slate-600 font-medium uppercase tracking-[0.2em] mt-8">
        Privacy: Audio and text are processed via OpenAI APIs
      </p>
    </div>
  );
}
