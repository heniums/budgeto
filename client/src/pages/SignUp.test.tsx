import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { SignUp } from './SignUp';

const mockUser = { id: 'u1', email: 'ada@example.com', name: 'Ada' };

import type * as AuthModule from '../api/auth';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return {
    ...actual,
    getMe: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
  };
});

import { getMe, register, login } from '../api/auth';
import { ApiError } from '../api/client';

function LocationSpy(): JSX.Element {
  const location = useLocation();
  return <div>location: {location.pathname}</div>;
}

function renderSignUp(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<div>Sign in page</div>} />
          <Route path="/account/profile" element={<div>Profile home</div>} />
          <Route path="*" element={<LocationSpy />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('SignUp form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(register).mockResolvedValue(mockUser);
    vi.mocked(login).mockResolvedValue({ token: 'token-1', user: mockUser });
    window.localStorage.clear();
    cleanup();
  });

  it('shows inline validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderSignUp();
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(
      await screen.findByText(/please tell us your name/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(
      screen.getByText(/password must be at least 8 characters/i),
    ).toBeInTheDocument();
    expect(vi.mocked(register)).not.toHaveBeenCalled();
  });

  it('rejects an invalid email address', async () => {
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByLabelText(/full name/i), 'Ada');
    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.type(screen.getByLabelText(/^password$/i), 'supersecret');
    await user.type(screen.getByLabelText(/confirm password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(
      await screen.findByText(/enter a valid email address/i),
    ).toBeInTheDocument();
    expect(vi.mocked(register)).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords', async () => {
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByLabelText(/full name/i), 'Ada');
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'supersecret');
    await user.type(screen.getByLabelText(/confirm password/i), 'different1');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
    expect(vi.mocked(register)).not.toHaveBeenCalled();
  });

  it('registers, signs in, and redirects on success', async () => {
    const user = userEvent.setup();
    renderSignUp();
    await user.type(screen.getByLabelText(/full name/i), 'Ada');
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'supersecret');
    await user.type(screen.getByLabelText(/confirm password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText('Profile home')).toBeInTheDocument();
    expect(vi.mocked(register)).toHaveBeenCalledWith({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'supersecret',
    });
    expect(vi.mocked(login)).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'supersecret',
    });
  });

  it('surfaces server errors as a form-level message', async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockRejectedValueOnce(
      new ApiError('Email already registered', 409, 'EMAIL_TAKEN'),
    );
    renderSignUp();
    await user.type(screen.getByLabelText(/full name/i), 'Ada');
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'supersecret');
    await user.type(screen.getByLabelText(/confirm password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(
      await screen.findByText(/email already registered/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Profile home')).not.toBeInTheDocument();
    });
  });
});
