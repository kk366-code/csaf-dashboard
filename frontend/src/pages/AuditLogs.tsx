import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useState } from "react";
import { useGetAuditLogs } from "@/api/generated";

const ACTION_LABELS: Record<string, string> = {
  login: "ログイン",
  create: "作成",
  update: "更新",
  delete: "削除",
  submit: "レビュー申請",
  approve: "承認",
  reject: "差し戻し",
  publish: "公開",
  create_user: "ユーザー作成",
  update_user: "ユーザー更新",
  delete_user: "ユーザー削除",
};

const ACTION_COLORS: Record<string, string> = {
  login: "bg-gray-100 text-gray-700",
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  submit: "bg-yellow-100 text-yellow-700",
  approve: "bg-blue-100 text-blue-700",
  reject: "bg-orange-100 text-orange-700",
  publish: "bg-green-100 text-green-700",
  create_user: "bg-purple-100 text-purple-700",
  update_user: "bg-purple-100 text-purple-700",
  delete_user: "bg-red-100 text-red-700",
};

export function AuditLogs() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");

  const { data, isLoading } = useGetAuditLogs({
    page,
    per_page: 50,
    action: action || undefined,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 50);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">監査ログ</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total ?? 0} 件</p>
        </div>
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">すべての操作</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="px-6 py-3">日時</th>
              <th className="px-6 py-3">ユーザー</th>
              <th className="px-6 py-3">操作</th>
              <th className="px-6 py-3">対象</th>
              <th className="px-6 py-3">詳細</th>
              <th className="px-6 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">読み込み中...</td>
              </tr>
            )}
            {!isLoading && !data?.items.length && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">データがありません</td>
              </tr>
            )}
            {data?.items.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {format(new Date(log.created_at), "MM/dd HH:mm:ss", { locale: ja })}
                </td>
                <td className="px-6 py-3 text-sm font-medium text-gray-700">{log.username}</td>
                <td className="px-6 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700"}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </td>
                <td className="px-6 py-3 text-xs text-gray-500">
                  {log.resource_type && (
                    <span>{log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ""}</span>
                  )}
                </td>
                <td className="px-6 py-3 text-xs text-gray-500 max-w-xs truncate">
                  {log.detail ? JSON.stringify(log.detail) : "—"}
                </td>
                <td className="px-6 py-3 text-xs font-mono text-gray-400">{log.ip_address ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">{page} / {totalPages} ページ</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
              >
                前へ
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40"
              >
                次へ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
