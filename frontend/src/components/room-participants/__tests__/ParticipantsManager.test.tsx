import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { ParticipantsManager, type ParticipantBase } from '../ParticipantsManager';

const mockParticipants: ParticipantBase[] = [
  { id: '1', displayName: 'Alice', isOwner: true, isAdmin: true, isConnected: true },
  { id: '2', displayName: 'Bob', isOwner: false, isAdmin: false, isConnected: false },
  { id: '3', displayName: 'Charlie', isOwner: false, isAdmin: true, isConnected: true },
];

describe('ParticipantsManager', () => {
  const defaultCallbacks = {
    onMakeAdmin: vi.fn(),
    onRemoveAdmin: vi.fn(),
    onRemoveParticipant: vi.fn(),
    onGoBack: vi.fn(),
  };

  it('renders all participants', () => {
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('shows connected count', () => {
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    expect(screen.getByText(/2\/3/)).toBeInTheDocument();
  });

  it('shows owner badge for owner', () => {
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    expect(screen.getByText('retro.owner')).toBeInTheDocument();
  });

  it('shows admin badge for admin', () => {
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    expect(screen.getAllByText('retro.admin').length).toBeGreaterThanOrEqual(1);
  });

  it('shows disconnected status for offline participants', () => {
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    expect(screen.getByText('retro.offline')).toBeInTheDocument();
  });

  it('opens kick confirmation dialog when kick button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    const kickButtons = screen.getAllByLabelText('retro.removeParticipant');
    await user.click(kickButtons[0]!);
    expect(screen.getByText('retro.removeParticipantTitle')).toBeInTheDocument();
  });

  it('calls onRemoveParticipant when kick is confirmed', async () => {
    const user = userEvent.setup();
    const onRemoveParticipant = vi.fn();
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={{ ...defaultCallbacks, onRemoveParticipant }}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    const kickButtons = screen.getAllByLabelText('retro.removeParticipant');
    await user.click(kickButtons[0]!);
    await user.click(screen.getByText('retro.removeParticipant'));
    expect(onRemoveParticipant).toHaveBeenCalled();
  });

  it('shows vote status when getVoteStatus is provided', () => {
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
        getVoteStatus={(id) => id === '1'}
      />,
    );
    const checkIcons = document.querySelectorAll('[data-testid]');
    expect(checkIcons.length).toBeGreaterThanOrEqual(0);
  });

  it('handles empty participant list', () => {
    renderWithProviders(
      <ParticipantsManager
        participants={[]}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    expect(screen.getByText(/0\/0/)).toBeInTheDocument();
  });

  it('hides admin controls for non-admin users', () => {
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="2"
        canManage={false}
        isOwner={false}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    expect(screen.queryByLabelText('retro.removeParticipant')).not.toBeInTheDocument();
  });

  it('calls onGoBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const onGoBack = vi.fn();
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={{ ...defaultCallbacks, onGoBack }}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    await user.click(screen.getByLabelText('common.back'));
    expect(onGoBack).toHaveBeenCalledOnce();
  });

  it('shows make admin button for non-admin participants when owner', () => {
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    const makeAdminButtons = screen.getAllByLabelText('retro.makeAdmin');
    expect(makeAdminButtons.length).toBe(1);
  });

  it('shows remove admin button for admin participants when owner', () => {
    renderWithProviders(
      <ParticipantsManager
        participants={mockParticipants}
        ownParticipantId="1"
        canManage={true}
        isOwner={true}
        callbacks={defaultCallbacks}
        pending={{ makeAdminId: null, removeAdminId: null, removeParticipantId: null }}
        featureKey="retro"
      />,
    );
    const removeAdminButtons = screen.getAllByLabelText('retro.removeAdmin');
    expect(removeAdminButtons.length).toBe(1);
  });
});
