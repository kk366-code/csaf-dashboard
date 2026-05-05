import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Rss,
  Shield,
  Users,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "ダッシュボード" },
  { to: "/advisories", icon: Shield, label: "アドバイザリ" },
];

const adminItems = [
  { to: "/users", icon: Users, label: "ユーザー管理" },
  { to: "/audit-logs", icon: ClipboardList, label: "監査ログ" },
];

export function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <aside className="w-60 flex flex-col" style={{ backgroundColor: "#1e1b4b" }}>
      <div className="px-6 py-5 border-b border-indigo-900">
        <div className="flex items-center gap-2">
          <Shield className="text-indigo-300" size={22} />
          <span className="text-white font-bold text-lg tracking-tight">CSAF Dashboard</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-700 text-white"
                  : "text-indigo-200 hover:bg-indigo-900 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        {user?.role === "admin" && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              管理
            </div>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-700 text-white"
                      : "text-indigo-200 hover:bg-indigo-900 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </>
        )}

        <div className="pt-4">
          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-indigo-200 hover:bg-indigo-900 hover:text-white transition-colors"
          >
            <Rss size={18} />
            RSS フィード
          </a>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-indigo-900">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.username}</p>
            <p className="text-indigo-300 text-xs truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-indigo-200 hover:bg-indigo-900 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          ログアウト
        </button>
      </div>
    </aside>
  );
}
