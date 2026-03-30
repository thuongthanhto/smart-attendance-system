import { useEffect, useState } from 'react';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';
import { fetchOverview, fetchAttendanceStats } from '../lib/api';

interface Overview {
  totalEmployees: number;
  checkedInToday: number;
  notCheckedIn: number;
  lateCount: number;
}

interface DeptStat {
  departmentName: string;
  total: string;
  onTimeCount: string;
  lateCount: string;
}

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [stats, setStats] = useState<DeptStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchOverview(), fetchAttendanceStats()])
      .then(([ov, st]) => {
        setOverview(ov);
        setStats(st);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Đang tải...</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {overview && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Tổng nhân viên" value={overview.totalEmployees} icon={Users} color="blue" />
          <StatsCard title="Đã check-in hôm nay" value={overview.checkedInToday} icon={UserCheck} color="green" />
          <StatsCard title="Chưa check-in" value={overview.notCheckedIn} icon={UserX} color="red" />
          <StatsCard title="Đi muộn" value={overview.lateCount} icon={Clock} color="yellow" />
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Thống kê theo phòng ban</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Phòng ban</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Tổng check-in</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Đúng giờ</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Đi muộn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                    Chưa có dữ liệu chấm công hôm nay
                  </td>
                </tr>
              ) : (
                stats.map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {s.departmentName || 'Chưa phân phòng'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{s.total}</td>
                    <td className="px-5 py-3 text-sm text-green-600 font-medium">{s.onTimeCount}</td>
                    <td className="px-5 py-3 text-sm text-red-600 font-medium">{s.lateCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
