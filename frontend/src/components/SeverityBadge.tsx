import type { Severity } from "@/api/generated";

const config: Record<Severity, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-100 text-red-800 border border-red-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-800 border border-orange-200" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
  low: { label: "Low", className: "bg-blue-100 text-blue-800 border border-blue-200" },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { label, className } = config[severity] ?? config.medium;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
