"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { GRADES } from "@/types/index";

type StudentData = {
  id: string;
  studentNumber: string;
  name: string;
  nameKana: string;
  grade: string;
};

export default function EditStudentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("生徒情報の取得に失敗しました");
        return res.json();
      })
      .then((data) => setStudent(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    const form = e.currentTarget;
    const data = {
      studentNumber: (form.elements.namedItem("studentNumber") as HTMLInputElement).value.trim(),
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      nameKana: (form.elements.namedItem("nameKana") as HTMLInputElement).value.trim(),
      grade: (form.elements.namedItem("grade") as HTMLSelectElement).value,
    };

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError("この操作は室長のみ実行できます");
        } else if (json.details?.fieldErrors) {
          setFieldErrors(json.details.fieldErrors);
        } else {
          setError(json.error ?? "更新に失敗しました");
        }
        return;
      }

      router.push(`/students/${id}`);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <p className="text-gray-500 text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="max-w-lg mx-auto">
        <p className="text-red-600 text-sm">{error ?? "生徒が見つかりません"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/students/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 生徒詳細
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">生徒情報編集</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="studentNumber" className="block text-sm font-medium text-gray-700 mb-1">
              生徒番号 <span className="text-red-500">*</span>
            </label>
            <input
              id="studentNumber"
              name="studentNumber"
              type="text"
              required
              maxLength={20}
              defaultValue={student.studentNumber}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldErrors.studentNumber && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.studentNumber[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              氏名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              defaultValue={student.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="nameKana" className="block text-sm font-medium text-gray-700 mb-1">
              氏名かな <span className="text-red-500">*</span>
            </label>
            <input
              id="nameKana"
              name="nameKana"
              type="text"
              required
              maxLength={100}
              defaultValue={student.nameKana}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {fieldErrors.nameKana && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.nameKana[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
              学年 <span className="text-red-500">*</span>
            </label>
            <select
              id="grade"
              name="grade"
              required
              defaultValue={student.grade}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            {fieldErrors.grade && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.grade[0]}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "保存中..." : "保存する"}
            </button>
            <Link
              href={`/students/${id}`}
              className="flex-1 py-2 text-center bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
