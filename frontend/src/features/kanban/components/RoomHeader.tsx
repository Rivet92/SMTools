import { IconButton, Tooltip } from '@mui/material';
import { IconSettings } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RoomHeader as SharedRoomHeader } from '../../../components/room-header/RoomHeader';

export function RoomHeader({
  roomTitle,
  roomId,
  hasPassword,
  canManage,
  totalParticipants,
  connectedCount,
  onCopyLink,
  onManagePassword,
}: {
  roomTitle: string;
  roomId: string;
  hasPassword: boolean;
  canManage: boolean;
  totalParticipants: number;
  connectedCount?: number;
  onCopyLink: () => void;
  onManagePassword: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <SharedRoomHeader
      roomTitle={roomTitle}
      backRoute="/tools/kanban"
      hasPassword={hasPassword}
      canManage={canManage}
      totalParticipants={totalParticipants}
      connectedCount={connectedCount}
      onCopyLink={onCopyLink}
      onManagePassword={onManagePassword}
      onOpenParticipants={() => navigate(`/tools/kanban/${roomId}/participants`)}
      passwordTooltip={t('kanban.passwordManage')}
      noPasswordTooltip={t('kanban.passwordOptional')}
      endActions={
        canManage && (
          <Tooltip title={t('kanban.settings')}>
            <IconButton
              size="small"
              onClick={() => navigate(`/tools/kanban/${roomId}/config`)}
              aria-label={t('kanban.aria.settings')}
              sx={{ color: 'text.secondary' }}
            >
              <IconSettings size={20} />
            </IconButton>
          </Tooltip>
        )
      }
    />
  );
}
