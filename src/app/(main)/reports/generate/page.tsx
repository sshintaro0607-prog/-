"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Student = { id: string; name: string };

export default function GenerateReportPage() {
  const router = useRouter();
  const [type, setType] = useState<"STUDENT" | "OVERALL">("STUDENT");
  const [studentId, setStudentId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const [year, setYear] = useState(prevYear);
  const [month, setMonth] = useState(prevMonth);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/students").then((r) => r.json()).then((d) => setStudents(d.records ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, studentId: type === "STUDENT" ? studentId : undefined, year, month }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "生成に失敗しました"); return; }
      router.push(`/reports/${json.id}`);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/reports" className="text-gray-400 hover:text-gray-600 text-sm">← AIレポート</Link>
        <h1 className="text-2xl font-bold text-gray-900">レポート生成</h1>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">レポート種別</label>
            <select value={type} onChange={(e) => setType(e.target.value as "STUDENT" | "OVERALL")} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option value="STUDENT">生徒個別</option>
              <option value="OVERALL">塾全体</option>
            </select>
          </div>
          {type === "STUDENT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">対象生徒</label>
              <select value={studentId} onChange={(e) => setStudentId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                <option value="">選択してください</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年</label>
              <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} min={2020} max={2100} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">月</label>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}月</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={generating} className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {generating ? "生成中（最大60秒）..." : "レポートを生成"}
          </button>
        </form>
      </div>
    </div>
  );
}
