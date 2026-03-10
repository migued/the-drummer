"use client";

import { useState, useEffect } from "react";

const MODELS = [
  { id: "thedrummer/rocinante-12b", name: "Rocinante 12B" },
  { id: "thedrummer/cydonia-24b-v4.1", name: "Cydonia 24B V4.1" },
  { id: "thedrummer/skyfall-36b-v2", name: "Skyfall 36B V2" },
  { id: "thedrummer/unslopnemo-12b", name: "UnslopNemo 12B" },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [model, setModel] = useState(MODELS[0].id);

  useEffect(() => {
    setModel(localStorage.getItem("the-drummer-model") || MODELS[0].id);
  }, [isOpen]);

  function handleSave() {
    localStorage.setItem("the-drummer-model", model);
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
          <label className="text-sm text-zinc-400">Model</label>
          <div className="space-y-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                  model === m.id
                    ? "border-orange-500 bg-orange-500/10 text-white"
                    : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    model === m.id ? "border-orange-500" : "border-zinc-600"
                  }`}
                >
                  {model === m.id && (
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-zinc-500">{m.id}</div>
                </div>
              </button>
            ))}
          </div>
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
