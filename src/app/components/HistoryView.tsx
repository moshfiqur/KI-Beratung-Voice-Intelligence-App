"use client";

import { useEffect, useState } from "react";
import { loadSessions, Session } from "../services/sessions";

export default function HistoryView() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions().then((data) => {
      setSessions(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 w-full text-slate-500 bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-700">
        <p className="text-xl font-medium">No sessions found</p>
        <p className="text-sm">Record something to see it here!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-7xl gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Session List */}
      <div className="w-full lg:w-1/3 flex flex-col space-y-4 max-h-[700px] overflow-auto pr-2 scrollbar-hide">
        <h2 className="text-xl font-bold px-2 mb-2 flex items-center">
          <span className="w-2 h-6 bg-blue-500 rounded-full mr-3" />
          Past Sessions
        </h2>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setSelectedSession(session)}
            className={`flex flex-col p-5 rounded-[1.5rem] text-left transition-all border ${
              selectedSession?.id === session.id
                ? "bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10 scale-[1.02]"
                : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600 shadow-sm"
            }`}
          >
            <div className="flex justify-between items-start w-full mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {new Date(session.timestamp).toLocaleString()}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-900/50 rounded-full text-blue-400 font-bold border border-blue-500/20">
                {session.mode || "Freeform"}
              </span>
            </div>
            <p className="text-sm text-slate-200 font-medium line-clamp-2 leading-relaxed">
              {session.enrichedText || session.transcript}
            </p>
          </button>
        ))}
      </div>

      {/* Detail View */}
      <div className="flex-1 bg-slate-800/40 backdrop-blur-md rounded-[2.5rem] border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        {selectedSession ? (
          <div className="p-8 flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Session Detail</h3>
                <p className="text-sm text-slate-400 font-medium">
                  {new Date(selectedSession.timestamp).toLocaleString()} • {selectedSession.mode || "Freeform"}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigator.clipboard.writeText(selectedSession.enrichedText || "")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
                >
                  Copy AI Output
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 flex-1 overflow-auto pr-2 scrollbar-hide">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">AI Intelligence</h4>
                <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-700/30">
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selectedSession.enrichedText || "No enriched text available."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Original Transcript</h4>
                <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-700/20">
                  <p className="text-slate-400 leading-relaxed whitespace-pre-wrap text-sm italic">
                    {selectedSession.transcript}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center">
            <div className="w-20 h-20 bg-slate-900/50 rounded-full flex items-center justify-center mb-6 border border-slate-700/50 shadow-inner">
               <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
               </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">Select a session</h3>
            <p className="max-w-xs text-sm opacity-60">Pick one of your previous recordings from the left to view the details and AI analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
