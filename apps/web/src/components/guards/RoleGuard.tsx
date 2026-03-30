import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import type { Role } from '@smart-attendance/shared';

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user);

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
