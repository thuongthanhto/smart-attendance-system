import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Wifi, MapPin } from 'lucide-react';
import { Role } from '@smart-attendance/shared';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import {
  fetchBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  fetchBranchWifi,
  addBranchWifi,
  removeBranchWifi,
} from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

interface BranchRow {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  isActive: boolean;
  [key: string]: unknown;
}

interface WifiItem {
  id: string;
  bssid: string;
  description: string | null;
}

export default function Branches() {
  const isAdmin = useAuthStore((s) => s.user?.role === Role.ADMIN);
  const [data, setData] = useState<BranchRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchRow | null>(null);
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '', radiusM: '50' });

  // WiFi modal
  const [wifiBranch, setWifiBranch] = useState<BranchRow | null>(null);
  const [wifiList, setWifiList] = useState<WifiItem[]>([]);
  const [newBssid, setNewBssid] = useState('');
  const [wifiDesc, setWifiDesc] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBranches({ page, limit: 20, search });
      const result = res as unknown as { data: BranchRow[]; meta: { total: number; totalPages: number } };
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
    await createBranch({
      name: form.name, address: form.address,
      latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude),
      radiusM: parseInt(form.radiusM),
    });
    setModalOpen(false);
    load();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    await updateBranch(editingBranch.id, {
      name: form.name, address: form.address,
      latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude),
      radiusM: parseInt(form.radiusM),
    });
    setEditingBranch(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa chi nhánh này?')) return;
    await deleteBranch(id);
    load();
  };

  const openEdit = (b: BranchRow) => {
    setEditingBranch(b);
    setForm({ name: b.name, address: b.address, latitude: String(b.latitude), longitude: String(b.longitude), radiusM: String(b.radiusM) });
  };

  const openWifi = async (b: BranchRow) => {
    setWifiBranch(b);
    const list = await fetchBranchWifi(b.id);
    setWifiList(list);
  };

  const handleAddWifi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wifiBranch) return;
    await addBranchWifi(wifiBranch.id, { bssid: newBssid, description: wifiDesc || undefined });
    setNewBssid('');
    setWifiDesc('');
    const list = await fetchBranchWifi(wifiBranch.id);
    setWifiList(list);
  };

  const handleRemoveWifi = async (wifiId: string) => {
    if (!wifiBranch) return;
    await removeBranchWifi(wifiBranch.id, wifiId);
    const list = await fetchBranchWifi(wifiBranch.id);
    setWifiList(list);
  };

  const columns = [
    { key: 'name', label: 'Tên chi nhánh' },
    { key: 'address', label: 'Địa chỉ' },
    {
      key: 'location',
      label: 'Tọa độ',
      render: (row: BranchRow) => (
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3" />
          {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
        </span>
      ),
    },
    { key: 'radiusM', label: 'Bán kính (m)' },
    {
      key: 'isActive',
      label: 'Trạng thái',
      render: (row: BranchRow) => (
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
      render: (row: BranchRow) => (
        <div className="flex gap-2">
          <button onClick={() => openWifi(row)} className="text-green-600 hover:text-green-800" title="WiFi BSSID">
            <Wifi className="h-4 w-4" />
          </button>
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
        <h1 className="text-2xl font-bold text-gray-900">Chi nhánh</h1>
        {isAdmin && (
          <button
            onClick={() => { setEditingBranch(null); setForm({ name: '', address: '', latitude: '', longitude: '', radiusM: '50' }); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Thêm chi nhánh
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Tìm chi nhánh..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
      </div>

      <DataTable columns={columns} data={data} page={page} totalPages={totalPages} total={total} onPageChange={setPage} isLoading={loading} />

      {/* Create/Edit Modal */}
      <Modal title={editingBranch ? 'Sửa chi nhánh' : 'Thêm chi nhánh'} isOpen={modalOpen || !!editingBranch} onClose={() => { setModalOpen(false); setEditingBranch(null); }}>
        <form onSubmit={editingBranch ? handleUpdate : handleCreate} className="space-y-4">
          <input placeholder="Tên chi nhánh" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <input placeholder="Địa chỉ" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Vĩ độ (lat)" type="number" step="any" required value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input placeholder="Kinh độ (lng)" type="number" step="any" required value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <input placeholder="Bán kính (m)" type="number" required value={form.radiusM} onChange={(e) => setForm({ ...form, radiusM: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          <button type="submit" className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            {editingBranch ? 'Cập nhật' : 'Tạo'}
          </button>
        </form>
      </Modal>

      {/* WiFi Modal */}
      <Modal title={`WiFi BSSID - ${wifiBranch?.name || ''}`} isOpen={!!wifiBranch} onClose={() => setWifiBranch(null)}>
        <div className="space-y-4">
          <form onSubmit={handleAddWifi} className="flex gap-2">
            <input placeholder="AA:BB:CC:DD:EE:FF" required value={newBssid} onChange={(e) => setNewBssid(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input placeholder="Mô tả" value={wifiDesc} onChange={(e) => setWifiDesc(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Thêm
            </button>
          </form>

          <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
            {wifiList.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">Chưa có BSSID nào</p>
            ) : (
              wifiList.map((w) => (
                <div key={w.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <span className="font-mono text-sm text-gray-900">{w.bssid}</span>
                    {w.description && <span className="ml-2 text-xs text-gray-500">{w.description}</span>}
                  </div>
                  <button onClick={() => handleRemoveWifi(w.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
