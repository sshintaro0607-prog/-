"use client";

import { useRef, useState } from "react";

type UploadedFile = {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: string;
};

type FileUploaderProps = {
  handoverId: string;
  existingFiles?: UploadedFile[];
  onUpload?: (file: UploadedFile) => void;
  onDelete?: (id: string) => void;
  currentUserId: string;
  isAdmin: boolean;
};

const ALLOWED_EXTENSIONS = ".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg,.gif,.webp";

export default function FileUploader({
  handoverId, existingFiles = [], onUpload, onDelete, currentUserId, isAdmin,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("handoverId", handoverId);

    try {
      const res = await fetch("/api/attachments", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "アップロードに失敗しました");
      } else {
        onUpload?.(json);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このファイルを削除しますか？")) return;
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (res.ok) onDelete?.(id);
  }

  return (
    <div>
      <div className="space-y-2 mb-3">
        {existingFiles.map((f) => {
          const canDelete = isAdmin || f.mimeType; // uploadedBy check done server-side
          return (
            <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
              <a
                href={`/api/attachments/${f.id}`}
                className="text-sm text-blue-600 hover:underline truncate flex-1"
                download
              >
                📎 {f.originalName}
              </a>
              <span className="text-xs text-gray-400 ml-2 shrink-0">
                {(parseInt(f.fileSize) / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => handleDelete(f.id)}
                className="ml-2 text-xs text-red-500 hover:text-red-700 shrink-0"
              >
                削除
              </button>
            </div>
          );
        })}
      </div>

      {existingFiles.length < 10 && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            {uploading ? "アップロード中..." : "📎 ファイルを追加"}
          </button>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          <p className="mt-1 text-xs text-gray-400">
            PDF / Word / Excel / PowerPoint / 画像（最大20MB、最大10ファイル）
          </p>
        </div>
      )}
    </div>
  );
}
