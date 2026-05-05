import { Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { postAuthLogin } from "@/api/generated";
import { useAuthStore } from "@/stores/authStore";
import type { AuthUser } from "@/stores/authStore";

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await postAuthLogin({ username, password });
      setAuth(data.access_token, data.user as AuthUser);
      navigate("/dashboard");
    } catch {
      setError("ユーザー名またはパスワードが正しくありません");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: "#1e1b4b" }}>
            <Shield className="text-indigo-300" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CSAF Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">脆弱性情報管理システム</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ユーザー名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="admin"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#4f46e5" }}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-2">デモアカウント</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p><span className="font-mono bg-gray-100 px-1 rounded">admin</span> / admin1234 — 管理者</p>
              <p><span className="font-mono bg-gray-100 px-1 rounded">editor</span> / editor1234 — 編集者</p>
              <p><span className="font-mono bg-gray-100 px-1 rounded">viewer</span> / viewer1234 — 閲覧者</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
