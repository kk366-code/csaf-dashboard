import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, CheckCircle, Edit, Send, ThumbsDown, XCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  getAdvisoriesQueryKey,
  getAdvisoryQueryKey,
  useApproveAdvisory,
  useGetAdvisory,
  usePublishAdvisory,
  useRejectAdvisory,
  useSubmitAdvisory,
} from "@/api/generated";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuthStore } from "@/stores/authStore";

export function AdvisoryDetail() {
  const { id } = useParams<{ id: string }>();
  const advisoryId = Number(id);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: advisory, isLoading } = useGetAdvisory(advisoryId);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getAdvisoryQueryKey(advisoryId) });
    queryClient.invalidateQueries({ queryKey: getAdvisoriesQueryKey() });
  };

  const submitMutation = useSubmitAdvisory({ onSuccess: invalidate });
  const approveMutation = useApproveAdvisory({ onSuccess: invalidate });
  const rejectMutation = useRejectAdvisory({ onSuccess: invalidate });
  const publishMutation = usePublishAdvisory({ onSuccess: invalidate });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-400">読み込み中...</div>
    );
  }
  if (!advisory) {
    return (
      <div className="p-8 text-center text-gray-400">見つかりません</div>
    );
  }

  const canEdit = user?.role !== "viewer" && advisory.status !== "published";
  const canSubmit = advisory.status === "draft" && user?.role !== "viewer";
  const canApproveReject = advisory.status === "review" && (user?.role === "admin" || user?.role === "editor");
  const canPublish = advisory.status === "approved" && user?.role === "admin";

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span className="font-mono">{advisory.csaf_id}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{advisory.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={advisory.severity} />
          <StatusBadge status={advisory.status} />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {canEdit && (
          <Link
            to={`/advisories/${advisory.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Edit size={15} />
            編集
          </Link>
        )}
        {canSubmit && (
          <button
            onClick={() => submitMutation.mutate(advisory.id)}
            disabled={submitMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-yellow-500 hover:bg-yellow-600 transition-colors disabled:opacity-60"
          >
            <Send size={15} />
            レビュー申請
          </button>
        )}
        {canApproveReject && (
          <>
            <button
              onClick={() => approveMutation.mutate(advisory.id)}
              disabled={approveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              <CheckCircle size={15} />
              承認
            </button>
            <button
              onClick={() => rejectMutation.mutate(advisory.id)}
              disabled={rejectMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              <XCircle size={15} />
              差し戻し
            </button>
          </>
        )}
        {canPublish && (
          <button
            onClick={() => publishMutation.mutate(advisory.id)}
            disabled={publishMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            <ThumbsDown size={15} className="rotate-180" />
            公開
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">概要</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {advisory.description || <span className="text-gray-400">説明なし</span>}
            </p>
          </div>

          {advisory.csaf_json && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">CSAF 2.0 JSON</h2>
              <pre className="text-xs bg-gray-950 text-green-400 rounded-lg p-4 overflow-x-auto max-h-80 overflow-y-auto">
                {JSON.stringify(advisory.csaf_json, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">詳細情報</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-400 text-xs">CVSS スコア</dt>
                <dd className="font-semibold text-gray-900">
                  {advisory.cvss_score ?? <span className="text-gray-400 font-normal">未設定</span>}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">作成者</dt>
                <dd className="text-gray-700">{advisory.created_by}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">作成日時</dt>
                <dd className="text-gray-700">
                  {format(new Date(advisory.created_at), "yyyy/MM/dd HH:mm", { locale: ja })}
                </dd>
              </div>
              {advisory.published_at && (
                <div>
                  <dt className="text-gray-400 text-xs">公開日時</dt>
                  <dd className="text-gray-700">
                    {format(new Date(advisory.published_at), "yyyy/MM/dd HH:mm", { locale: ja })}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {advisory.cve_ids.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">CVE ID</h2>
              <div className="flex flex-wrap gap-1.5">
                {advisory.cve_ids.map((cve) => (
                  <span key={cve} className="font-mono text-xs bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded">
                    {cve}
                  </span>
                ))}
              </div>
            </div>
          )}

          {advisory.affected_products.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">影響製品</h2>
              <div className="flex flex-wrap gap-1.5">
                {advisory.affected_products.map((p) => (
                  <span key={p} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
