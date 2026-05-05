import { type ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";

interface Props {
  children: ReactNode;
}

export function PrivateRoute({ children }: Props) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: Props) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
