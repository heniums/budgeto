import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { SignUp } from './SignUp';
import { SignIn } from './SignIn';

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

function renderAt(path: string, element: JSX.Element): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={element} />
          <Route path="/dashboard" element={<div>Dashboard home</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('form accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(register).mockResolvedValue(mockUser);
    vi.mocked(login).mockResolvedValue({ token: 'token-1', user: mockUser });
    window.localStorage.clear();
    cleanup();
  });

  it('associates every input with a visible label', async () => {
    renderAt('/signup', <SignUp />);
    await screen.findByLabelText(/full name/i);
    const all = Array.from(document.querySelectorAll('input'));
    expect(all.length).toBeGreaterThan(0);
    for (const input of all) {
      const labels = input.labels;
      expect(labels, `input ${input.id} has no label`).not.toBeNull();
      expect(labels?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('submits the sign-up form from the keyboard (Enter)', async () => {
    const user = userEvent.setup();
    renderAt('/signup', <SignUp />);
    await user.type(screen.getByLabelText(/full name/i), 'Ada');
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'supersecret');
    await user.type(screen.getByLabelText(/confirm password/i), 'supersecret');
    await user.click(screen.getByLabelText(/confirm password/i));
    await user.keyboard('{Enter}');
    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
    expect(vi.mocked(register)).toHaveBeenCalled();
  });

  it('submits the sign-in form from the keyboard (Enter)', async () => {
    const user = userEvent.setup();
    renderAt('/login', <SignIn />);
    await user.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByLabelText(/password/i));
    await user.keyboard('{Enter}');
    expect(await screen.findByText('Dashboard home')).toBeInTheDocument();
    expect(vi.mocked(login)).toHaveBeenCalled();
  });
  it('has a first focusable field on the sign-in page', async () => {
    renderAt('/login', <SignIn />);
    const emailInput = await screen.findByLabelText(/email address/i);
    expect(emailInput).toHaveFocus();
  });
});
