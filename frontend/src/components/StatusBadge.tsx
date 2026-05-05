import type { Status } from "@/api/generated";

const config: Record<Status, { label: string; className: string }> = {
  draft: { label: "下書き", className: "bg-gray-100 text-gray-700" },
  review: { label: "レビュー中", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "承認済み", className: "bg-blue-100 text-blue-800" },
  published: { label: "公開済み", className: "bg-green-100 text-green-800" },
};

export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = config[status] ?? config.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
