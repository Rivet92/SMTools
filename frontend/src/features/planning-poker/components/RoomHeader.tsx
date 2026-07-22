import { IconButton, Tooltip } from '@mui/material';
import {
  IconClipboardText,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { RoomHeader as SharedRoomHeader } from '../../../components/room-header/RoomHeader';

export function RoomHeader({
  roomTitle,
  hasPassword,
  canManage,
  totalParticipants,
  connectedCount,
  onCopyLink,
  onManagePassword,
  onViewResults,
  onOpenParticipants,
  showParticipants,
  onToggleParticipants,
  showVoteItems,
  onToggleVoteItems,
}: {
  roomTitle: string;
  hasPassword: boolean;
  canManage: boolean;
  totalParticipants: number;
  connectedCount?: number;
  onCopyLink: () => void;
  onManagePassword: () => void;
  onViewResults?: () => void;
  onOpenParticipants: () => void;
  showParticipants: boolean;
  onToggleParticipants: () => void;
  showVoteItems: boolean;
  onToggleVoteItems: () => void;
}) {
  const { t } = useTranslation();

  return (
    <SharedRoomHeader
      roomTitle={roomTitle}
      backRoute="/tools/planning-poker"
      hasPassword={hasPassword}
      canManage={canManage}
      totalParticipants={totalParticipants}
      connectedCount={connectedCount}
      onCopyLink={onCopyLink}
      onManagePassword={onManagePassword}
      onOpenParticipants={onOpenParticipants}
      passwordTooltip={t('planningPoker.passwordManage')}
      noPasswordTooltip={t('planningPoker.passwordManage')}
      endActions={
        <>
          <Tooltip title={t('planningPoker.toggleVoteItems')}>
            <IconButton
              size="small"
              onClick={onToggleVoteItems}
              aria-label={t('planningPoker.toggleVoteItems')}
              sx={{ color: 'text.secondary' }}
            >
              {showVoteItems ? (
                <IconLayoutSidebarLeftCollapse size={20} />
              ) : (
                <IconLayoutSidebarLeftExpand size={20} />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('planningPoker.toggleParticipants')}>
            <IconButton
              size="small"
              onClick={onToggleParticipants}
              aria-label={t('planningPoker.toggleParticipants')}
              sx={{ color: 'text.secondary' }}
            >
              {showParticipants ? (
                <IconLayoutSidebarRightCollapse size={20} />
              ) : (
                <IconLayoutSidebarRightExpand size={20} />
              )}
            </IconButton>
          </Tooltip>
          {onViewResults && (
            <Tooltip title={t('planningPoker.results')}>
              <IconButton
                size="small"
                onClick={onViewResults}
                aria-label={t('planningPoker.results')}
                sx={{ color: 'text.secondary' }}
              >
                <IconClipboardText size={20} />
              </IconButton>
            </Tooltip>
          )}
        </>
      }
    />
  );
}
