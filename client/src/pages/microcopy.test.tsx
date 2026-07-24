import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { SignUp } from './SignUp';
import { SignIn } from './SignIn';
import { Profile } from './Profile';

import type * as AuthModule from '../api/auth';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return { ...actual, getMe: vi.fn(), login: vi.fn(), register: vi.fn() };
});

import { getMe } from '../api/auth';

function renderAt(path: string, element: JSX.Element): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('conversational microcopy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue({ id: 'u1', email: 'a@b.co', name: 'Ada' });
    window.localStorage.clear();
    cleanup();
  });

  it('welcomes returning users on the sign-in page', async () => {
    renderAt('/login', <SignIn />);
    expect(
      await screen.findByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument();
  });

  it('uses a friendly invitation on the sign-up page', async () => {
    renderAt('/signup', <SignUp />);
    expect(
      await screen.findByRole('heading', { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/ready to take control of your budget/i),
    ).toBeInTheDocument();
  });

  it('frames the profile page around the person', async () => {
    renderAt('/settings/user', <Profile />);
    expect(
      await screen.findByRole('heading', { name: /your profile/i }),
    ).toBeInTheDocument();
  });
});
