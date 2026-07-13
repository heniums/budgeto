import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { Profile } from './Profile';

const mockUser = { id: 'u1', email: 'ada@example.com', name: 'Ada Lovelace' };

import type * as AuthModule from '../api/auth';

vi.mock('../api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof AuthModule>();
  return {
    ...actual,
    getMe: vi.fn(),
    updateName: vi.fn(),
    changePassword: vi.fn(),
  };
});

import { getMe, updateName, changePassword } from '../api/auth';
import { ApiError } from '../api/client';

function renderProfile(): void {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/account/profile']}>
        <Routes>
          <Route path="/account/profile" element={<Profile />} />
          <Route path="/login" element={<div>Sign in page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Profile page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue(mockUser);
    vi.mocked(updateName).mockImplementation((name) =>
      Promise.resolve({ ...mockUser, name }),
    );
    vi.mocked(changePassword).mockResolvedValue(undefined);
    window.localStorage.clear();
    cleanup();
  });

  it('displays the current user name and email', async () => {
    renderProfile();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });

  it('edits and saves the display name', async () => {
    const user = userEvent.setup();
    renderProfile();
    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: /edit name/i }));
    const input = screen.getByDisplayValue('Ada Lovelace');
    await user.clear(input);
    await user.type(input, 'Ada L.');
    // Update getMe mock BEFORE clicking save, so refreshUser gets the updated user
    vi.mocked(getMe).mockResolvedValue({ ...mockUser, name: 'Ada L.' });
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(await screen.findByText('Ada L.')).toBeInTheDocument();
    expect(vi.mocked(updateName)).toHaveBeenCalled();
  });

  it('rejects an empty display name', async () => {
    const user = userEvent.setup();
    renderProfile();
    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: /edit name/i }));
    const input = screen.getByDisplayValue('Ada Lovelace');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(
      await screen.findByText(/please enter a display name/i),
    ).toBeInTheDocument();
    expect(vi.mocked(updateName)).not.toHaveBeenCalled();
  });

  it('validates the change-password form', async () => {
    const user = userEvent.setup();
    renderProfile();
    await screen.findByText('Ada Lovelace');
    await user.type(screen.getByLabelText(/current password/i), 'oldpass1');
    await user.type(screen.getByLabelText(/^new password$/i), 'short');
    await user.type(screen.getByLabelText(/confirm new password/i), 'short');
    await user.click(
      screen.getByRole('button', { name: /update password/i }),
    );
    await waitFor(() => {
      const alerts = screen.getAllByText(/password must be at least 8 characters/i);
      expect(alerts.length).toBeGreaterThan(0);
    });
    expect(vi.mocked(changePassword)).not.toHaveBeenCalled();
  });

  it('rejects mismatched new passwords', async () => {
    const user = userEvent.setup();
    renderProfile();
    await screen.findByText('Ada Lovelace');
    await user.type(screen.getByLabelText(/current password/i), 'oldpass1');
    await user.type(screen.getByLabelText(/^new password$/i), 'newpassword');
    await user.type(screen.getByLabelText(/confirm new password/i), 'other1234');
    await user.click(
      screen.getByRole('button', { name: /update password/i }),
    );
    expect(
      await screen.findByText(/passwords do not match/i),
    ).toBeInTheDocument();
    expect(vi.mocked(changePassword)).not.toHaveBeenCalled();
  });

  it('updates the password on success', async () => {
    const user = userEvent.setup();
    renderProfile();
    await screen.findByText('Ada Lovelace');
    await user.type(screen.getByLabelText(/current password/i), 'oldpass1');
    await user.type(screen.getByLabelText(/^new password$/i), 'newpassword');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword');
    await user.click(
      screen.getByRole('button', { name: /update password/i }),
    );
    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
    expect(vi.mocked(changePassword)).toHaveBeenCalledWith({
      currentPassword: 'oldpass1',
      newPassword: 'newpassword',
    });
  });

  it('surfaces an invalid current password as an error', async () => {
    const user = userEvent.setup();
    vi.mocked(changePassword).mockRejectedValueOnce(
      new ApiError('Current password is incorrect', 401, 'INVALID_PASSWORD'),
    );
    renderProfile();
    await screen.findByText('Ada Lovelace');
    await user.type(screen.getByLabelText(/current password/i), 'wrong');
    await user.type(screen.getByLabelText(/^new password$/i), 'newpassword');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword');
    await user.click(
      screen.getByRole('button', { name: /update password/i }),
    );
    expect(
      await screen.findByText(/current password is incorrect/i),
    ).toBeInTheDocument();
  });

  it('signs out and returns to the sign-in page', async () => {
    const user = userEvent.setup();
    renderProfile();
    await screen.findByText('Ada Lovelace');
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    expect(await screen.findByText('Sign in page')).toBeInTheDocument();
  });
});
