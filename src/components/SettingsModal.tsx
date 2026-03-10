"use client";

import { useState, useEffect } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");

  useEffect(() => {
    setApiKey(localStorage.getItem("the-drummer-api-key") || "");
    setModel(localStorage.getItem("the-drummer-model") || "");
  }, [isOpen]);

  function handleSave() {
    localStorage.setItem("the-drummer-api-key", apiKey);
    if (model) localStorage.setItem("the-drummer-model", model);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-white">Settings</h2>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">OpenRouter API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. google/gemini-pro-1.5"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
          />
          <p className="text-xs text-zinc-600">
            Check <a href="https://openrouter.ai/models" target="_blank" rel="noopener" className="text-orange-400 hover:underline">openrouter.ai/models</a> for available models
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
