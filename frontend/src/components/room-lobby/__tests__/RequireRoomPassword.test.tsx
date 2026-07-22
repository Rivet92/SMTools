import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { RequireRoomPassword } from '../RequireRoomPassword';
import { ApiError } from '../../../api/client';

function createApiError(status: number, code?: string): ApiError {
  const body = JSON.stringify({ code });
  return new ApiError(
    new Response(body, {
      status,
      headers: { 'Content-Type': 'application/problem+json' },
    }),
    body,
  );
}

describe('RequireRoomPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when idle', () => {
    const joinRoom = vi.fn().mockReturnValue(new Promise(() => {}));
    renderWithProviders(
      <RequireRoomPassword
        roomId="room-1"
        joinRoom={joinRoom}
        setRoom={vi.fn()}
        setStoreError={vi.fn()}
        lobbyPath="/tools/retro"
        i18nPrefix="retro"
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('retro.connecting')).toBeInTheDocument();
  });

  it('renders password dialog when password is required', async () => {
    const apiError = createApiError(403);
    const joinRoom = vi.fn().mockRejectedValueOnce(apiError).mockRejectedValueOnce(apiError);
    renderWithProviders(
      <RequireRoomPassword
        roomId="room-1"
        joinRoom={joinRoom}
        setRoom={vi.fn()}
        setStoreError={vi.fn()}
        lobbyPath="/tools/retro"
        i18nPrefix="retro"
      />,
    );

    const passwordInput = await screen.findByLabelText('retro.passwordLabel');
    expect(passwordInput).toBeInTheDocument();
  });

  it('submits password when form is filled', async () => {
    const mockRoom = { id: 'room-1', ownParticipantId: 'p1' };
    const apiError = createApiError(403);
    const joinRoom = vi
      .fn()
      .mockRejectedValueOnce(apiError)
      .mockRejectedValueOnce(apiError)
      .mockResolvedValueOnce(mockRoom);
    const setRoom = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <RequireRoomPassword
        roomId="room-1"
        joinRoom={joinRoom}
        setRoom={setRoom}
        setStoreError={vi.fn()}
        lobbyPath="/tools/retro"
        i18nPrefix="retro"
      />,
    );

    const passwordInput = await screen.findByLabelText('retro.passwordLabel');
    await user.type(passwordInput, 'my-password');
    await user.click(screen.getByRole('button', { name: 'common.joinRoom' }));

    await vi.waitFor(() => {
      expect(setRoom).toHaveBeenCalledWith(mockRoom);
    });
  });
});
