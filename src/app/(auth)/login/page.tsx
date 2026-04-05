"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"teacher" | "admin">("teacher");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 講師ログイン
  const [teacherName, setTeacherName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // 室長ログイン
  const [password, setPassword] = useState("");

  async function handleTeacherLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("teacher", {
      name: teacherName,
      birthDate,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("氏名または生年月日が正しくありません");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("admin", {
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("パスワードが正しくありません");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {process.env.NEXT_PUBLIC_APP_NAME ?? "授業引継書システム"}
        </h1>

        {/* タブ切り替え */}
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === "teacher"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => { setTab("teacher"); setError(""); }}
          >
            講師ログイン
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === "admin"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => { setTab("admin"); setError(""); }}
          >
            室長ログイン
          </button>
        </div>

        {/* 講師ログインフォーム */}
        {tab === "teacher" && (
          <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                氏名
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="山田 太郎"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                生年月日
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        )}

        {/* 室長ログインフォーム */}
        {tab === "admin" && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
