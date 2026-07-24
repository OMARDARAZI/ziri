import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '../src/api/apiError';

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  setCsrfToken: vi.fn(),
  clear: vi.fn()
}));

vi.mock('../src/auth/auth.api', () => ({
  currentUser: mocks.currentUser,
  login: mocks.login,
  logout: mocks.logout
}));
vi.mock('../src/api/client', () => ({ setCsrfToken: mocks.setCsrfToken }));
vi.mock('../src/api/queryClient', () => ({ queryClient: { clear: mocks.clear } }));

import { AuthProvider, useAuth } from '../src/auth/AuthProvider';

function Probe() {
  const { user, isLoading, error, refresh } = useAuth();
  return (
    <>
      <p>{isLoading ? 'Loading' : 'Ready'}</p>
      <p>{user?.full_name || 'No user'}</p>
      <p>{error?.message || 'No error'}</p>
      <button type="button" onClick={() => void refresh('ADMIN')}>Refresh</button>
    </>
  );
}

describe('dashboard authentication refresh', () => {
  it('keeps the dashboard session on a transient server failure', async () => {
    mocks.currentUser
      .mockResolvedValueOnce({ user: { id: 1, role: 'ADMIN', full_name: 'Dashboard Admin', phone: '+96170000001', is_active: true }, csrf_token: 'csrf' })
      .mockRejectedValueOnce(new ApiError('Database is temporarily unavailable', 500, [], 'INTERNAL_ERROR'));

    render(<MemoryRouter initialEntries={['/admin']}><AuthProvider><Probe /></AuthProvider></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('Dashboard Admin')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => expect(screen.getByText('Database is temporarily unavailable')).toBeInTheDocument());
    expect(screen.getByText('Dashboard Admin')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
});
