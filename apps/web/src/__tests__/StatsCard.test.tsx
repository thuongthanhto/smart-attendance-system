import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(<StatsCard title="Tổng nhân viên" value={150} icon={Users} color="blue" />);
    expect(screen.getByText('Tổng nhân viên')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should render string value', () => {
    render(<StatsCard title="Status" value="OK" icon={Users} color="green" />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
