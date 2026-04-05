import Link from "next/link";
import { SUBJECT_LABELS } from "@/types/index";
import type { Subject } from "@/generated/prisma/client";

type HandoverCardProps = {
  id: string;
  lessonDate: string;
  subject: Subject;
  student: { id: string; name: string; grade: string };
  author: { id: string; name: string };
  todaysContent: string | null;
  attachmentCount: number;
};

export default function HandoverCard({
  id, lessonDate, subject, student, author, todaysContent, attachmentCount,
}: HandoverCardProps) {
  const date = new Date(lessonDate).toLocaleDateString("ja-JP");

  return (
    <Link
      href={`/handovers/${id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{student.name}</span>
          <span className="text-xs text-gray-400">{student.grade}</span>
          <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full font-medium">
            {SUBJECT_LABELS[subject]}
          </span>
        </div>
        <span className="text-xs text-gray-400 shrink-0">{date}</span>
      </div>

      {todaysContent && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{todaysContent}</p>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">{author.name}</span>
        {attachmentCount > 0 && (
          <span className="text-xs text-gray-400">📎 {attachmentCount}</span>
        )}
      </div>
    </Link>
  );
}
