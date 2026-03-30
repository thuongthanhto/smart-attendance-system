import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardCheck,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { Role } from '@smart-attendance/shared';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.MANAGER] },
  { to: '/employees', label: 'Nhân viên', icon: Users, roles: [Role.ADMIN, Role.MANAGER] },
  { to: '/branches', label: 'Chi nhánh', icon: Building2, roles: [Role.ADMIN, Role.MANAGER] },
  { to: '/attendance', label: 'Chấm công', icon: ClipboardCheck, roles: [Role.ADMIN, Role.MANAGER] },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-5">
        <h1 className="text-lg font-bold text-blue-600">Smart Attendance</h1>
        <p className="text-xs text-gray-500">HDBank</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems
          .filter((item) => user && item.roles.includes(user.role))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
