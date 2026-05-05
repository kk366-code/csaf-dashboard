import { ArrowLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { AdvisoryIn, Severity } from "@/api/generated";
import {
  getAdvisoriesQueryKey,
  getAdvisoryQueryKey,
  useCreateAdvisory,
  useGetAdvisory,
  useUpdateAdvisory,
} from "@/api/generated";

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput("");
  };

  return (
    <div className="border border-gray-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent">
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))}>
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder}
        className="w-full text-sm outline-none text-gray-700 placeholder-gray-400"
      />
    </div>
  );
}

type FormValues = Omit<AdvisoryIn, "cve_ids" | "affected_products">;

export function AdvisoryForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const advisoryId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing } = useGetAdvisory(advisoryId, { enabled: isEdit });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { severity: "medium" },
  });
  const [cveIds, setCveIds] = useState<string[]>([]);
  const [products, setProducts] = useState<string[]>([]);

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        description: existing.description ?? "",
        severity: existing.severity,
        cvss_score: existing.cvss_score ?? undefined,
      });
      setCveIds(existing.cve_ids);
      setProducts(existing.affected_products);
    }
  }, [existing, reset]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getAdvisoriesQueryKey() });
    if (isEdit) queryClient.invalidateQueries({ queryKey: getAdvisoryQueryKey(advisoryId) });
  };

  const createMutation = useCreateAdvisory({
    onSuccess: (data) => { invalidate(); navigate(`/advisories/${data.id}`); },
  });
  const updateMutation = useUpdateAdvisory(advisoryId, {
    onSuccess: () => { invalidate(); navigate(`/advisories/${advisoryId}`); },
  });

  const onSubmit = (values: FormValues) => {
    const body: AdvisoryIn = { ...values, cve_ids: cveIds, affected_products: products };
    if (isEdit) updateMutation.mutate(body);
    else createMutation.mutate(body);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {isEdit ? "アドバイザリを編集" : "新規アドバイザリ作成"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              {...register("title", { required: "タイトルは必須です" })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="例: Apache Log4j リモートコード実行の脆弱性"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">概要</label>
            <textarea
              {...register("description")}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="脆弱性の詳細説明..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">重大度</label>
              <select
                {...register("severity")}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {(["critical", "high", "medium", "low"] as Severity[]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CVSS スコア</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                {...register("cvss_score", {
                  setValueAs: (v) => (v === "" ? null : parseFloat(v)),
                })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="0.0 〜 10.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              CVE ID <span className="text-gray-400 font-normal text-xs">（Enter で追加）</span>
            </label>
            <TagInput
              value={cveIds}
              onChange={setCveIds}
              placeholder="例: CVE-2021-44228"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              影響製品 <span className="text-gray-400 font-normal text-xs">（Enter で追加）</span>
            </label>
            <TagInput
              value={products}
              onChange={setProducts}
              placeholder="例: Apache Log4j 2.0-2.14.1"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 transition-colors"
            style={{ backgroundColor: "#4f46e5" }}
          >
            {isPending ? "保存中..." : isEdit ? "更新する" : "作成する"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
