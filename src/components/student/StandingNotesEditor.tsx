"use client";

import { useState } from "react";

type NoteItem = {
  id?: string;
  content: string;
  sortOrder: number;
  updatedAt?: string;
  editor?: { id: string; name: string };
};

type Props = {
  studentId: string;
  initialNotes: NoteItem[];
};

export default function StandingNotesEditor({ studentId, initialNotes }: Props) {
  const [notes, setNotes] = useState<NoteItem[]>(
    initialNotes.length > 0
      ? initialNotes
      : [{ content: "", sortOrder: 0 }]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addNote() {
    setNotes((prev) => [
      ...prev,
      { content: "", sortOrder: prev.length },
    ]);
    setSaved(false);
  }

  function removeNote(index: number) {
    setNotes((prev) => prev.filter((_, i) => i !== index));
    setSaved(false);
  }

  function updateContent(index: number, content: string) {
    setNotes((prev) =>
      prev.map((note, i) => (i === index ? { ...note, content } : note))
    );
    setSaved(false);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setNotes((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next.map((note, i) => ({ ...note, sortOrder: i }));
    });
    setSaved(false);
  }

  function moveDown(index: number) {
    if (index === notes.length - 1) return;
    setNotes((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next.map((note, i) => ({ ...note, sortOrder: i }));
    });
    setSaved(false);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    setSaved(false);

    const notesToSave = notes
      .map((note, i) => ({ content: note.content.trim(), sortOrder: i }))
      .filter((note) => note.content.length > 0);

    try {
      const res = await fetch(`/api/students/${studentId}/standing-notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesToSave }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "保存に失敗しました");
        return;
      }

      const saved = await res.json() as NoteItem[];
      setNotes(
        saved.length > 0 ? saved : [{ content: "", sortOrder: 0 }]
      );
      setSaved(true);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          毎回の引継書に常時表示されるメモです。アレルギー情報・苦手単元・保護者への注意事項などを登録してください。
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3 mb-4">
        {notes.map((note, index) => (
          <div key={index} className="flex items-start gap-2">
            {/* 並び替えボタン */}
            <div className="flex flex-col gap-1 pt-1 shrink-0">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                aria-label="上へ"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === notes.length - 1}
                className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                aria-label="下へ"
              >
                ▼
              </button>
            </div>

            {/* テキストエリア */}
            <textarea
              value={note.content}
              onChange={(e) => updateContent(index, e.target.value)}
              rows={2}
              placeholder={`固定引継事項 ${index + 1}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* 削除ボタン */}
            <button
              type="button"
              onClick={() => removeNote(index)}
              className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-1"
              aria-label="削除"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* 更新者情報（最終項目） */}
      {initialNotes.length > 0 && initialNotes[initialNotes.length - 1]?.editor && (
        <p className="text-xs text-gray-400 mb-4">
          最終更新: {initialNotes[initialNotes.length - 1].editor!.name}
          {initialNotes[initialNotes.length - 1].updatedAt &&
            ` (${new Date(initialNotes[initialNotes.length - 1].updatedAt!).toLocaleDateString("ja-JP")})`}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addNote}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
        >
          + 項目を追加
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">保存しました</span>
        )}
      </div>
    </div>
  );
}
