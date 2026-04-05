import Link from "next/link";

type Student = {
  id: string;
  studentNumber: string;
  name: string;
  nameKana: string;
  grade: string;
};

type Props = {
  student: Student;
  isAdmin: boolean;
};

export default function StudentCard({ student, isAdmin }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400 font-mono">{student.studentNumber}</span>
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full shrink-0">
              {student.grade}
            </span>
          </div>
          <p className="text-base font-medium text-gray-900 truncate">{student.name}</p>
          <p className="text-xs text-gray-400 truncate">{student.nameKana}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <Link
          href={`/students/${student.id}`}
          className="flex-1 text-center py-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          詳細
        </Link>
        <Link
          href={`/handovers/new?studentId=${student.id}`}
          className="flex-1 text-center py-1 text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          引継書作成
        </Link>
        {isAdmin && (
          <Link
            href={`/students/${student.id}/edit`}
            className="flex-1 text-center py-1 text-xs text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            編集
          </Link>
        )}
      </div>
    </div>
  );
}
