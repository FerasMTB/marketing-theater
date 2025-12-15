"use client";

import { useEffect, useState } from "react";

export function PromptModal({
  title,
  description,
  placeholder,
  confirmLabel = "Continue",
  initialValue = "",
  onConfirm,
  onClose,
}: {
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  initialValue?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const trimmed = value.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">{title}</div>
          <button className="text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        {description && <div className="text-sm text-gray-600">{description}</div>}
        <div className="mt-3">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full border rounded px-3 py-2 h-28"
          />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button className="px-3 py-2 rounded border" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            disabled={!trimmed}
            onClick={() => onConfirm(trimmed)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
