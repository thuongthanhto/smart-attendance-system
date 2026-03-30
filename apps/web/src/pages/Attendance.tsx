import { useEffect, useState, useCallback } from 'react';
import { Clock, Wifi, MapPin } from 'lucide-react';
import { CheckInMethod } from '@smart-attendance/shared';
import DataTable from '../components/ui/DataTable';
import { fetchAttendance } from '../lib/api';

interface AttendanceRow {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
  status: string;
  method: CheckInMethod;
  distanceM: number | null;
  bssid: string | null;
  deviceId: string | null;
  user: { fullName: string; email: string };
  branch: { name: string };
  [key: string]: unknown;
}

export default function Attendance() {
  const [data, setData] = useState<AttendanceRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await fetchAttendance(params);
      const result = res as unknown as { data: AttendanceRow[]; meta: { total: number; totalPages: number } };
      setData(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, from, to]);

  useEffect(() => { load(); }, [load]);

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  const columns = [
    {
      key: 'user',
      label: 'Nhân viên',
      render: (row: AttendanceRow) => (
        <div>
          <p className="font-medium text-gray-900">{row.user.fullName}</p>
          <p className="text-xs text-gray-500">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'branch',
      label: 'Chi nhánh',
      render: (row: AttendanceRow) => row.branch.name,
    },
    {
      key: 'checkInAt',
      label: 'Check-in',
      render: (row: AttendanceRow) => (
        <span className="flex items-center gap-1 text-sm">
          <Clock className="h-3.5 w-3.5 text-gray-400" />
          {formatTime(row.checkInAt)}
        </span>
      ),
    },
    {
      key: 'checkOutAt',
      label: 'Check-out',
      render: (row: AttendanceRow) =>
        row.checkOutAt ? formatTime(row.checkOutAt) : (
          <span className="text-xs text-yellow-600">Chưa check-out</span>
        ),
    },
    {
      key: 'method',
      label: 'Phương thức',
      render: (row: AttendanceRow) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.method === CheckInMethod.WIFI ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}>
          {row.method === CheckInMethod.WIFI ? <Wifi className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
          {row.method}
        </span>
      ),
    },
    {
      key: 'distanceM',
      label: 'Khoảng cách',
      render: (row: AttendanceRow) =>
        row.distanceM != null ? `${row.distanceM.toFixed(0)}m` : '-',
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Lịch sử chấm công</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Từ ngày</label>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Đến ngày</label>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        {(from || to) && (
          <div className="flex items-end">
            <button onClick={() => { setFrom(''); setTo(''); setPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      <DataTable columns={columns} data={data} page={page} totalPages={totalPages} total={total} onPageChange={setPage} isLoading={loading} />
    </div>
  );
}
