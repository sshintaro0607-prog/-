"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SUBJECT_LABELS } from "@/types/index";
import StandingNotesDisplay from "@/components/handover/StandingNotesDisplay";

type Student = { id: string; name: string; grade: string };
type StandingNote = { id: string; content: string };
type Subject = keyof typeof SUBJECT_LABELS;

type HandoverFormProps = {
  students: Student[];
  defaultStudentId?: string;
  defaultValues?: {
    id: string;
    studentId: string;
    subject: Subject;
    lessonDate: string;
    todaysContent?: string;
    achieved?: string;
    notAchieved?: string;
    improvement?: string;
    specialNotes?: string;
  };
};

const today = new Date().toISOString().split("T")[0];

export default function HandoverForm({ students, defaultStudentId, defaultValues }: HandoverFormProps) {
  const router = useRouter();
  const isEdit = !!defaultValues;

  const [studentId, setStudentId] = useState(defaultValues?.studentId ?? defaultStudentId ?? "");
  const [subject, setSubject] = useState<Subject>(defaultValues?.subject ?? "MATH");
  const [lessonDate, setLessonDate] = useState(defaultValues?.lessonDate ?? today);
  const [todaysContent, setTodaysContent] = useState(defaultValues?.todaysContent ?? "");
  const [achieved, setAchieved] = useState(defaultValues?.achieved ?? "");
  const [notAchieved, setNotAchieved] = useState(defaultValues?.notAchieved ?? "");
  const [improvement, setImprovement] = useState(defaultValues?.improvement ?? "");
  const [specialNotes, setSpecialNotes] = useState(defaultValues?.specialNotes ?? "");
  const [standingNotes, setStandingNotes] = useState<StandingNote[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) { setStandingNotes([]); return; }
    fetch(`/api/students/${studentId}/standing-notes`)
      .then((r) => r.json())
      .then((data) => setStandingNotes(data ?? []))
      .catch(() => setStandingNotes([]));
  }, [studentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = { studentId, subject, lessonDate, todaysContent, achieved, notAchieved, improvement, specialNotes };
    const url = isEdit ? `/api/handovers/${defaultValues.id}` : "/api/handovers";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "保存に失敗しました");
        return;
      }
      router.push(`/handovers/${isEdit ? defaultValues.id : json.id}`);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  const textareaClass = "w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      {/* 固定引継事項 */}
      {standingNotes.length > 0 && <StandingNotesDisplay notes={standingNotes} />}

      {/* 基本情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div>
          <label className={labelClass}>対象生徒 <span className="text-red-500">*</span></label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
            disabled={isEdit}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          >
            <option value="">生徒を選択</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}（{s.grade}）</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>授業日 <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className={labelClass}>科目 <span className="text-red-500">*</span></label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as Subject)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {(Object.entries(SUBJECT_LABELS) as [Subject, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 授業記録 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        {[
          { label: "今日の内容", value: todaysContent, setter: setTodaysContent, rows: 3 },
          { label: "できたこと", value: achieved, setter: setAchieved, rows: 3 },
          { label: "できなかったこと", value: notAchieved, setter: setNotAchieved, rows: 3 },
          { label: "改善策", value: improvement, setter: setImprovement, rows: 3 },
          { label: "特記事項", value: specialNotes, setter: setSpecialNotes, rows: 2 },
        ].map(({ label, value, setter, rows }) => (
          <div key={label}>
            <label className={labelClass}>{label}</label>
            <textarea
              value={value}
              onChange={(e) => setter(e.target.value)}
              rows={rows}
              className={textareaClass}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "保存中..." : isEdit ? "更新する" : "保存して公開"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
