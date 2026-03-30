import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe('Login Page', () => {
  it('should render login form', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Smart Attendance')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@hdbank.com.vn')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập mật khẩu')).toBeInTheDocument();
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
  });

  it('should have email input of type email', () => {
    renderWithRouter(<Login />);
    const emailInput = screen.getByPlaceholderText('email@hdbank.com.vn');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should have password input of type password', () => {
    renderWithRouter(<Login />);
    const passwordInput = screen.getByPlaceholderText('Nhập mật khẩu');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
