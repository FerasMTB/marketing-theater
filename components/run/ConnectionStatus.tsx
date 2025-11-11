"use client";
export function ConnectionStatus({ status }: { status: "connecting" | "open" | "closed" }) {
  const color = status === "open" ? "bg-green-500" : status === "connecting" ? "bg-yellow-500" : "bg-gray-400";
  const text = status === "open" ? "Connected" : status === "connecting" ? "Connecting" : "Disconnected";
  return (
    <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border">
      <span className={`w-2 h-2 rounded-full ${color}`} />{text}
    </span>
  );
}

