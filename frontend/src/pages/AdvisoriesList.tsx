import { format } from "date-fns";
import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  type Severity,
  type Status,
  getAdvisoriesQueryKey,
  useDeleteAdvisory,
  useGetAdvisories,
} from "@/api/generated";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthStore } from "@/stores/authStore";

const severityOptions: { value: Severity | ""; label: string }[] = [
  { value: "", label: "すべての重大度" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const statusOptions: { value: Status | ""; label: string }[] = [
  { value: "", label: "すべてのステータス" },
  { value: "draft", label: "下書き" },
  { value: "review", label: "レビュー中" },
  { value: "approved", label: "承認済み" },
  { value: "published", label: "公開済み" },
];

export function AdvisoriesList() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetAdvisories(
    { page, per_page: 20, search: search || undefined, severity: severity || undefined, status: status || undefined },
  );

  const deleteMutation = useDeleteAdvisory({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getAdvisoriesQueryKey() });
    },
  });

  const handleDelete = (id: number, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return;
    deleteMutation.mutate(id);
  };

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">アドバイザリ</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.total ?? 0} 件
          </p>
        </div>
        {user?.role !== "viewer" && (
          <Link
            to="/advisories/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: "#4f46e5" }}
          >
            <Plus size={16} />
            新規作成
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="タイトル、CSAF IDで検索..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value as Severity | ""); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {severityOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value as Status | ""); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {statusOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="px-6 py-3">CSAF ID</th>
              <th className="px-6 py-3">タイトル</th>
              <th className="px-6 py-3">重大度</th>
              <th className="px-6 py-3">ステータス</th>
              <th className="px-6 py-3">CVE</th>
              <th className="px-6 py-3">作成日</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  読み込み中...
                </td>
              </tr>
            )}
            {!isLoading && !data?.items.length && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                  データがありません
                </td>
              </tr>
            )}
            {data?.items.map((advisory) => (
              <tr
                key={advisory.id}
                onClick={() => navigate(`/advisories/${advisory.id}`)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-3.5 text-xs font-mono text-gray-500">
                  {advisory.csaf_id}
                </td>
                <td className="px-6 py-3.5">
                  <p className="text-sm font-medium text-gray-900 max-w-xs truncate">
                    {advisory.title}
                  </p>
                  {advisory.created_by && (
                    <p className="text-xs text-gray-400">{advisory.created_by}</p>
                  )}
                </td>
                <td className="px-6 py-3.5">
                  <SeverityBadge severity={advisory.severity} />
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={advisory.status} />
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {advisory.cve_ids.slice(0, 2).map((cve) => (
                      <span key={cve} className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {cve}
                      </span>
                    ))}
                    {advisory.cve_ids.length > 2 && (
                      <span className="text-xs text-gray-400">+{advisory.cve_ids.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                  {format(new Date(advisory.created_at), "yyyy/MM/dd")}
                </td>
                <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                  {user?.role !== "viewer" && advisory.status !== "published" && (
                    <button
                      onClick={() => handleDelete(advisory.id, advisory.title)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {page} / {totalPages} ページ
            </span>
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
