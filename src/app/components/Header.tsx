"use client";

interface HeaderProps {
  currentView: string;
  setView: (view: string) => void;
  onMinimize: () => void;
}

export default function Header({ currentView, setView, onMinimize }: HeaderProps) {
  return (
    <header className="w-full flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
      <div className="flex items-center space-x-4">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          Voice Intelligence
        </h1>
      </div>
      <div className="flex items-center space-x-2 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
        <button
          onClick={() => setView("main")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentView === "main" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          Record
        </button>
        <button
          onClick={() => setView("history")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentView === "history" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          History
        </button>
        <button
          onClick={() => setView("settings")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentView === "settings" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          Settings
        </button>
      </div>
      <button
        onClick={onMinimize}
        className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        Minimize
      </button>
    </header>
  );
}
