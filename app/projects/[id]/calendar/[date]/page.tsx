"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { PromptModal } from "../../../../../components/common/PromptModal";
import { useRunStore, type CalendarEntry } from "../../../../../store/useRunStore";
import { IS_REMOTE } from "../../../../../lib/config";
import { uploadFilesRemote } from "../../../../../lib/upload";
import {
  ensureDemoAssetVersion,
  generateAssetVersion,
  getAssetVersions,
  getLatestRunForProject,
  type Asset,
  type AssetVersion,
} from "../../../../../lib/api";

function defaultBaseText(entry: CalendarEntry) {
  return [
    `Create assets for this calendar entry:`,
    `- Date: ${entry.date}`,
    `- Channel: ${entry.channel}`,
    `- Type: ${entry.type}`,
    `- Title: ${entry.title}`,
    ``,
    `Write in brand voice and include a clear CTA.`,
  ].join("\n");
}

export default function CalendarDayPage() {
  const { id, date } = useParams<{ id: string; date: string }>();
  const run = useRunStore();

  const [dayEntries, setDayEntries] = useState<CalendarEntry[]>([]);
  const [loadingDay, setLoadingDay] = useState(true);

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const selectedEntry = useMemo(
    () => dayEntries.find((e) => e.id === selectedEntryId) || null,
    [dayEntries, selectedEntryId]
  );

  const [versions, setVersions] = useState<AssetVersion[]>([]);
  const [cursor, setCursor] = useState<number>(0);
  const current = versions[cursor] || null;

  const [draftBaseText, setDraftBaseText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editRequest, setEditRequest] = useState<string | null>(null);

  const [editPromptOpen, setEditPromptOpen] = useState(false);
  const [uploadPromptOpen, setUploadPromptOpen] = useState(false);
  const [pendingUploadPrompt, setPendingUploadPrompt] = useState<string | null>(
    null
  );

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [busy, setBusy] = useState<null | "loadingVersions" | "generating" | "uploading">(null);
  const [error, setError] = useState<string | null>(null);

  // --- 1. Load Day Entries ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingDay(true);
      setError(null);
      try {
        const fromStore = (run.calendar && run.calendar[date]) || [];
        if (fromStore.length) {
          if (!mounted) return;
          setDayEntries(fromStore);
          return;
        }

        const snap = await getLatestRunForProject(id);
        const fromSnap: CalendarEntry[] =
          (snap?.calendar?.[date] ?? []) as unknown as CalendarEntry[];
        if (snap) {
          run.setRunId(snap.runId);
          run.setCalendar(snap.calendar as unknown as Record<string, CalendarEntry[]>);
          run.setPhaseStatus(4, "done");
          run.setCurrentPhase(5);
          run.setStatus("done");
        }
        if (!mounted) return;
        setDayEntries(fromSnap);
      } catch (_err) {
        if (!mounted) return;
        setError("Failed to load day entries.");
        setDayEntries([]);
      } finally {
        if (mounted) setLoadingDay(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, date]);

  // --- 2. Select Default Entry ---
  useEffect(() => {
    if (!dayEntries.length) {
      setSelectedEntryId(null);
      return;
    }
    setSelectedEntryId((prev) => prev || dayEntries[0]!.id);
  }, [dayEntries]);

  // --- 3. Load Versions for Selected Entry ---
  useEffect(() => {
    if (!selectedEntry) return;
    let mounted = true;
    (async () => {
      setBusy("loadingVersions");
      setError(null);
      try {
        await ensureDemoAssetVersion({ projectId: id, entry: selectedEntry });
        const list = await getAssetVersions(id, selectedEntry.id);
        if (!mounted) return;
        setVersions(list);
        setCursor(Math.max(0, list.length - 1));
        setIsEditing(false);
        setEditRequest(null);
      } catch (_err) {
        if (!mounted) return;
        setVersions([]);
        setCursor(0);
        setError("Failed to load asset versions.");
      } finally {
        if (mounted) setBusy(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, selectedEntry?.id]);

  // --- 4. Sync Draft Text ---
  useEffect(() => {
    if (!selectedEntry) return;
    if (isEditing) return;
    setDraftBaseText(current?.baseText || defaultBaseText(selectedEntry));
  }, [selectedEntry?.id, isEditing, current?.id]);

  // --- 5. 🌟 NEW: Polling Logic for Async Generation ---
  useEffect(() => {
    // If no entry is selected or no versions exist, stop.
    if (!selectedEntry || !current) return;

    // Check if the current version already has a visual asset (Image or Carousel)
    // Note: 'text' is always present, so we look specifically for visual types.
    const hasMedia = current.assets.some(
      (a) => a.kind === "image" || a.kind === "carousel"
    );

    // If we have media, we don't need to poll anymore.
    if (hasMedia) return;

    // If we don't have media yet (generation in progress), poll every 3 seconds
    const intervalId = setInterval(() => {
      getAssetVersions(id, selectedEntry.id)
        .then((list) => {
          setVersions(list);
          // Safety: If the list shrank (unlikely) ensure cursor is valid
          if (cursor >= list.length) {
            setCursor(Math.max(0, list.length - 1));
          }
        })
        .catch((err) => console.error("Polling failed", err));
    }, 3000);

    // Cleanup interval on unmount or when dependencies change (e.g. image arrives)
    return () => clearInterval(intervalId);
  }, [id, selectedEntry, current, cursor]);
  // ---------------------------------------------------------

  const prettyDate = useMemo(() => {
    const d = dayjs(date);
    if (!d.isValid()) return date;
    return d.format("dddd, MMM D, YYYY");
  }, [date]);

  async function refreshVersions(entry: CalendarEntry) {
    const list = await getAssetVersions(id, entry.id);
    setVersions(list);
    setCursor(Math.max(0, list.length - 1));
  }

  async function onGenerateNew() {
    if (!selectedEntry) return;
    setBusy("generating");
    setError(null);
    try {
      await generateAssetVersion({
        projectId: id,
        entry: selectedEntry,
        baseText: draftBaseText,
        changeRequest: editRequest || undefined,
      });
      await refreshVersions(selectedEntry);
      setIsEditing(false);
      setEditRequest(null);
    } catch (_err) {
      setError("Failed to generate assets.");
    } finally {
      setBusy(null);
    }
  }

  function beginEdit(prompt: string) {
    setEditRequest(prompt);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditRequest(null);
    if (selectedEntry) setDraftBaseText(current?.baseText || defaultBaseText(selectedEntry));
  }

  function beginUpload(prompt: string) {
    setPendingUploadPrompt(prompt);
    setUploadPromptOpen(false);
    fileRef.current?.click();
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedEntry) return;
    const prompt = pendingUploadPrompt;
    setPendingUploadPrompt(null);
    if (!prompt) return;

    setBusy("uploading");
    setError(null);
    try {
      let imageUrl: string | undefined;
      if (IS_REMOTE) {
        const uploaded = await uploadFilesRemote([file], "image", id);
        imageUrl = uploaded[0]?.url;
      } else {
        imageUrl = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onerror = () => rej(new Error("read_failed"));
          reader.onload = () => res(String(reader.result || ""));
          reader.readAsDataURL(file);
        });
      }

      await generateAssetVersion({
        projectId: id,
        entry: selectedEntry,
        baseText: draftBaseText,
        uploadPrompt: prompt,
        imageOverrideUrl: imageUrl,
      });
      await refreshVersions(selectedEntry);
    } catch (_err) {
      setError("Failed to upload image.");
    } finally {
      setBusy(null);
    }
  }

  const canPrev = cursor > 0;
  const canNext = cursor < versions.length - 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-gray-600">
            <Link href={`/projects/${id}/calendar`} className="underline">
              Calendar
            </Link>{" "}
            / {prettyDate}
          </div>
          <h1 className="text-2xl font-semibold">Day Plan</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${id}/calendar`}
            className="px-3 py-2 rounded border"
          >
            Back to Calendar
          </Link>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 rounded p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loadingDay ? (
        <div className="border rounded-lg p-4 text-sm text-gray-600">
          Loading day...
        </div>
      ) : dayEntries.length === 0 ? (
        <div className="border rounded-lg p-4 text-sm text-gray-600">
          No events scheduled for this day.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-5">
          <aside className="md:col-span-2 border rounded-lg p-3">
            <div className="text-sm font-medium mb-2">Events</div>
            <div className="space-y-2">
              {dayEntries.map((e) => {
                const active = e.id === selectedEntryId;
                return (
                  <button
                    key={e.id}
                    className={`w-full text-left border rounded p-3 ${
                      active ? "border-black bg-gray-50" : "hover:bg-gray-50"
                    }`}
                    onClick={() => setSelectedEntryId(e.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{e.title}</div>
                        <div className="text-xs text-gray-600">
                          {e.channel} • {e.type}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{e.effort || ""}</div>
                    </div>
                    {e.description ? (
                      <div className="mt-2 text-xs text-gray-600 line-clamp-2">
                        {e.description}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="md:col-span-3 border rounded-lg p-4 space-y-4">
            {!selectedEntry ? null : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-gray-600">
                      {selectedEntry.channel} • {selectedEntry.type}
                    </div>
                    <div className="text-lg font-medium">{selectedEntry.title}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 rounded border disabled:opacity-50"
                      disabled={!canPrev}
                      onClick={() => setCursor((c) => Math.max(0, c - 1))}
                      title="Previous version"
                    >
                      ←
                    </button>
                    <div className="text-xs text-gray-600">
                      Version {versions.length ? cursor + 1 : 0}/{versions.length}
                    </div>
                    <button
                      className="px-2 py-1 rounded border disabled:opacity-50"
                      disabled={!canNext}
                      onClick={() => setCursor((c) => Math.min(versions.length - 1, c + 1))}
                      title="Next version"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      Asset Brief (editable)
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <button
                          className="text-sm px-3 py-1 rounded border"
                          onClick={() => setEditPromptOpen(true)}
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          className="text-sm px-3 py-1 rounded border"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        className="text-sm px-3 py-1 rounded bg-black text-white disabled:opacity-50"
                        disabled={busy === "generating" || busy === "loadingVersions"}
                        onClick={onGenerateNew}
                      >
                        {busy === "generating" ? "Generating..." : "Generate New Version"}
                      </button>
                    </div>
                  </div>

                  {editRequest && isEditing ? (
                    <div className="text-xs text-gray-600">
                      Edit prompt: <span className="font-medium">{editRequest}</span>
                    </div>
                  ) : null}

                  <textarea
                    value={draftBaseText}
                    onChange={(e) => setDraftBaseText(e.target.value)}
                    readOnly={!isEditing}
                    className="w-full border rounded px-3 py-2 h-32 disabled:opacity-60"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Generated Assets</div>
                  <div className="flex gap-2">
                    <button
                      className="text-sm px-3 py-1 rounded border"
                      onClick={() => setUploadPromptOpen(true)}
                      disabled={busy === "uploading" || busy === "loadingVersions"}
                    >
                      {busy === "uploading" ? "Uploading..." : "Upload Image"}
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFilePicked}
                    />
                  </div>
                </div>

                {busy === "loadingVersions" ? (
                  <div className="border rounded p-3 text-sm text-gray-600">
                    Loading assets...
                  </div>
                ) : !current ? (
                  <div className="border rounded p-3 text-sm text-gray-600">
                    No generated versions yet. Click “Generate New Version”.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <div className="text-xs text-gray-500">
                      Generated {new Date(current.createdAt).toLocaleString()}
                    </div>
                    {current.changeRequest ? (
                      <div className="text-xs text-gray-600">
                        Change request:{" "}
                        <span className="font-medium">{current.changeRequest}</span>
                      </div>
                    ) : null}
                    {current.uploadPrompt ? (
                      <div className="text-xs text-gray-600">
                        Upload prompt:{" "}
                        <span className="font-medium">{current.uploadPrompt}</span>
                      </div>
                    ) : null}
                    <AssetGrid assets={current.assets} />
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {editPromptOpen && (
        <PromptModal
          title="Edit Prompt (required)"
          description="Before editing the brief, describe what you want to change."
          placeholder="e.g., Make it more playful, add a stronger CTA, shorten the hook..."
          confirmLabel="Start Editing"
          onConfirm={(prompt) => {
            setEditPromptOpen(false);
            beginEdit(prompt);
          }}
          onClose={() => setEditPromptOpen(false)}
        />
      )}

      {uploadPromptOpen && (
        <PromptModal
          title="Upload Prompt (required)"
          description="Before uploading an image, add context on how it should be used."
          placeholder="e.g., Use this image as the hero visual; keep brand colors; crop for 1:1..."
          confirmLabel="Choose Image"
          onConfirm={beginUpload}
          onClose={() => setUploadPromptOpen(false)}
        />
      )}
    </div>
  );
}

function AssetGrid({ assets }: { assets: Asset[] }) {
  return (
    <div className="grid gap-3">
      {assets.map((a) => {
        if (a.kind === "text") {
          return (
            <div key={a.id} className="border rounded-lg p-3">
              <div className="text-sm font-medium mb-1">{a.title}</div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {a.text}
              </div>
            </div>
          );
        }
        if (a.kind === "image") {
          return (
            <div key={a.id} className="border rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Image</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={a.alt || "Generated image"}
                className="w-full rounded border"
              />
            </div>
          );
        }
        if (a.kind === "carousel") {
          return (
            <div key={a.id} className="border rounded-lg p-3">
              <div className="text-sm font-medium mb-2">Carousel</div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {a.items.map((it, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={it.url}
                    alt={it.alt || `Slide ${i + 1}`}
                    className="h-40 rounded border"
                  />
                ))}
              </div>
            </div>
          );
        }
        return (
          <div key={a.id} className="border rounded-lg p-3">
            <div className="text-sm font-medium mb-2">{a.title}</div>
            {a.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.thumbnailUrl}
                alt="Video thumbnail"
                className="w-full rounded border mb-2"
              />
            ) : null}
            <pre className="text-xs whitespace-pre-wrap bg-gray-50 border rounded p-2">
              {a.script}
            </pre>
          </div>
        );
      })}
    </div>
  );
}