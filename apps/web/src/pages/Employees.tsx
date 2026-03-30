import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Role } from '@smart-attendance/shared';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import { fetchUsers, createUser, updateUser, deleteUser } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  branch?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  [key: string]: unknown;
}

const roleLabels: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.MANAGER]: 'Manager',
  [Role.EMPLOYEE]: 'Nhân viên',
};

export default function Employees() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === Role.ADMIN;
  const [data, setData] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  // Form state
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: Role.EMPLOYEE });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchUsers({ page, limit: 20, search });
      const result = res as unknown as { data: UserRow[]; meta: { total: number; totalPages: number } };
      setData(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser(form);
    setModalOpen(false);
    setForm({ email: '', password: '', fullName: '', role: Role.EMPLOYEE });
    load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await updateUser(editingUser.id, { fullName: form.fullName, role: form.role });
    setEditingUser(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa nhân viên này?')) return;
    await deleteUser(id);
    load();
  };

  const openEdit = (user: UserRow) => {
    setEditingUser(user);
    setForm({ email: user.email, password: '', fullName: user.fullName, role: user.role });
  };

  const columns = [
    { key: 'fullName', label: 'Họ tên' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Vai trò',
      render: (row: UserRow) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' :
          row.role === Role.MANAGER ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {roleLabels[row.role]}
        </span>
      ),
    },
    {
      key: 'branch',
      label: 'Chi nhánh',
      render: (row: UserRow) => row.branch?.name || '-',
    },
    {
      key: 'department',
      label: 'Phòng ban',
      render: (row: UserRow) => row.department?.name || '-',
    },
    {
      key: 'isActive',
      label: 'Trạng thái',
      render: (row: UserRow) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {row.isActive ? 'Hoạt động' : 'Vô hiệu'}
        </span>
      ),
    },
    ...(isAdmin ? [{
      key: 'actions',
      label: '',
      render: (row: UserRow) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(row)} className="text-blue-600 hover:text-blue-800">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nhân viên</h1>
        {isAdmin && (
          <button
            onClick={() => { setEditingUser(null); setForm({ email: '', password: '', fullName: '', role: Role.EMPLOYEE }); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Thêm nhân viên
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        isLoading={loading}
      />

      {/* Create Modal */}
      <Modal title="Thêm nhân viên" isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate} className="space-y-4">
          <input placeholder="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <input placeholder="Mật khẩu" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <input placeholder="Họ tên" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none">
            {Object.values(Role).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
          </select>
          <button type="submit" className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Tạo
          </button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal title="Sửa nhân viên" isOpen={!!editingUser} onClose={() => setEditingUser(null)}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <input placeholder="Họ tên" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none">
            {Object.values(Role).map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
          </select>
          <button type="submit" className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Cập nhật
          </button>
        </form>
      </Modal>
    </div>
  );
}
