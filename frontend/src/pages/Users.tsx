import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Role, UserCreateIn } from "@/api/generated";
import {
  createUser,
  deleteUser,
  getUsersQueryKey,
  updateUser,
  useCreateUser,
  useGetUsers,
} from "@/api/generated";
import { useAuthStore } from "@/stores/authStore";

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UserCreateIn>({
    username: "",
    email: "",
    password: "",
    role: "viewer",
  });
  const [error, setError] = useState("");

  const mutation = useCreateUser({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsersQueryKey() });
      onClose();
    },
    onError: () => setError("作成に失敗しました"),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">ユーザー作成</h2>
        <div className="space-y-4">
          {(["username", "email", "password"] as const).map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field === "username" ? "ユーザー名" : field === "email" ? "メールアドレス" : "パスワード"}
              </label>
              <input
                type={field === "password" ? "password" : "text"}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ロール</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="admin">admin</option>
              <option value="editor">editor</option>
              <option value="viewer">viewer</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "#4f46e5" }}
          >
            {mutation.isPending ? "作成中..." : "作成"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

export function Users() {
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data } = useGetUsers();

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: getUsersQueryKey() });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: invalidateUsers,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateUser(id, { is_active }),
    onSuccess: invalidateUsers,
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
          <p className="text-gray-500 text-sm mt-1">{data?.total ?? 0} ユーザー</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: "#4f46e5" }}
        >
          <Plus size={16} />
          ユーザー追加
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="px-6 py-3">ユーザー名</th>
              <th className="px-6 py-3">メール</th>
              <th className="px-6 py-3">ロール</th>
              <th className="px-6 py-3">状態</th>
              <th className="px-6 py-3">作成日</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data?.items.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold">
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{u.username}</span>
                    {u.id === currentUser?.id && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                        あなた
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-600">{u.email}</td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : u.role === "editor"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      u.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.is_active ? "有効" : "無効"}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-xs text-gray-500">
                  {format(new Date(u.created_at), "yyyy/MM/dd", { locale: ja })}
                </td>
                <td className="px-6 py-3.5">
                  {u.id !== currentUser?.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })
                        }
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                        title={u.is_active ? "無効化" : "有効化"}
                      >
                        {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`「${u.username}」を削除しますか？`)) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
