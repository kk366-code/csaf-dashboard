import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Clock, FileText, Shield } from "lucide-react";
import { Link } from "react-router";
import {
  useGetAdvisories,
  useGetAdvisoryStats,
} from "@/api/generated";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: stats } = useGetAdvisoryStats();
  const { data: recent } = useGetAdvisories({ page: 1, per_page: 5 });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-gray-500 text-sm mt-1">脆弱性情報の概要</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="総アドバイザリ数" value={stats?.total ?? 0} icon={Shield} color="bg-indigo-50 text-indigo-600" />
        <StatCard label="Critical" value={stats?.by_severity.critical ?? 0} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <StatCard label="レビュー中" value={stats?.by_status.review ?? 0} icon={Clock} color="bg-yellow-50 text-yellow-600" />
        <StatCard label="公開済み" value={stats?.by_status.published ?? 0} icon={CheckCircle} color="bg-green-50 text-green-600" />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">重大度別</h3>
          <div className="space-y-3">
            {(["critical", "high", "medium", "low"] as const).map((s) => {
              const count = stats?.by_severity[s] ?? 0;
              const total = stats?.total || 1;
              const pct = Math.round((count / total) * 100);
              const colors: Record<string, string> = {
                critical: "bg-red-500",
                high: "bg-orange-400",
                medium: "bg-yellow-400",
                low: "bg-blue-400",
              };
              return (
                <div key={s}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 capitalize">{s}</span>
                    <span className="text-gray-900 font-medium">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[s]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">ステータス別</h3>
          <div className="space-y-2">
            {(["draft", "review", "approved", "published"] as const).map((s) => {
              const count = stats?.by_status[s] ?? 0;
              return (
                <div key={s} className="flex items-center justify-between">
                  <StatusBadge status={s} />
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">クイックアクション</h3>
          <div className="space-y-2">
            <Link
              to="/advisories/new"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "#4f46e5" }}
            >
              <FileText size={16} />
              新規アドバイザリ作成
            </Link>
            <Link
              to="/advisories?status=review"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-800 border border-yellow-200"
            >
              <Clock size={16} />
              レビュー待ち一覧
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">最新アドバイザリ</h3>
          <Link to="/advisories" className="text-xs text-indigo-600 hover:underline">
            すべて見る →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recent?.items.map((advisory) => (
            <Link
              key={advisory.id}
              to={`/advisories/${advisory.id}`}
              className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{advisory.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{advisory.csaf_id}</p>
              </div>
              <SeverityBadge severity={advisory.severity} />
              <StatusBadge status={advisory.status} />
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {format(new Date(advisory.created_at), "MM/dd HH:mm", { locale: ja })}
              </span>
            </Link>
          ))}
          {!recent?.items.length && (
            <p className="text-center text-gray-400 text-sm py-8">データがありません</p>
          )}
        </div>
      </div>
    </div>
  );
}
