import { memo, useState } from 'react';
import {
  Typography,
  Box,
  Stack,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
} from '@mui/material';
import { IconFocus2, IconPlus, IconTrash } from '@tabler/icons-react';
import { GenericDialog } from '../../../components/GenericDialog';
import { useTranslation } from 'react-i18next';
import type { VoteItemState } from '../store/planningPokerStore';
import { RevealedVoteChip } from './RevealedVoteChip';

export const VoteItemsSidebar = memo(function VoteItemsSidebar({
  voteItems,
  selectedId,
  onSelectItem,
  isOwner,
  isAdmin,
  onAddItem,
  onFocusItem,
  onDeleteItem,
  pendingFocusItemId,
  pendingDeleteItemId,
}: {
  voteItems: VoteItemState[];
  selectedId: string | null;
  onSelectItem: (id: string) => void;
  isOwner: boolean;
  isAdmin: boolean;
  onAddItem: () => void;
  onFocusItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  pendingFocusItemId: string | null;
  pendingDeleteItemId: string | null;
}) {
  const { t } = useTranslation();
  const [itemToDelete, setItemToDelete] = useState<VoteItemState | null>(null);

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const canManage = isOwner || isAdmin;

  return (
    <Box
      sx={{
        width: 280,
        borderRight: 1,
        borderColor: 'divider',
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          {t('planningPoker.voteItems')}
        </Typography>
        {canManage && (
          <Tooltip title={t('planningPoker.addItem')}>
            <IconButton size="small" onClick={onAddItem} aria-label={t('planningPoker.addItem')}>
              <IconPlus size={16} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {voteItems.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t('planningPoker.noItems')}
        </Typography>
      ) : (
        <Stack spacing={1} sx={{ minHeight: 0, overflow: 'auto', flex: 1 }}>
          {voteItems.map((item) => {
            const lastIndex = voteItems.length - 1;
            const isSelected =
              selectedId === item.id || (!selectedId && item === voteItems[lastIndex]);
            const isFocusing = pendingFocusItemId === item.id;
            const isDeleting = pendingDeleteItemId === item.id;
            return (
              <Card
                key={item.id}
                variant={isSelected ? 'elevation' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'action.selected' : 'transparent',
                }}
                onClick={() => onSelectItem(item.id)}
              >
                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                  <Stack direction="column" spacing={1} alignItems="flex-start">
                    <Typography variant="body2" fontWeight={500} sx={{ flex: 1, minWidth: 0 }}>
                      {item.title}
                    </Typography>
                    <Stack direction="row" alignItems="flex-start" sx={{ width: '100%' }}>
                      <Box>{item.isRevealed && <RevealedVoteChip votes={item.votes} />}</Box>
                      <Box sx={{ ml: 'auto' }}>
                        {canManage && (
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title={t('planningPoker.focusItem')}>
                              <IconButton
                                size="small"
                                aria-label={t('planningPoker.focusItem')}
                                disabled={isFocusing || isDeleting}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFocusItem(item.id);
                                }}
                              >
                                {isFocusing ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <IconFocus2 size={16} />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('planningPoker.deleteItem')}>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label={t('planningPoker.deleteItem')}
                                disabled={isFocusing || isDeleting}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToDelete(item);
                                }}
                              >
                                {isDeleting ? (
                                  <CircularProgress size={16} color="error" />
                                ) : (
                                  <IconTrash size={16} />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        )}
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <GenericDialog
        open={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        title={t('planningPoker.deleteItemTitle')}
        actions={
          <>
            <Button onClick={() => setItemToDelete(null)}>{t('planningPoker.cancel')}</Button>
            <Button variant="contained" color="error" onClick={handleConfirmDelete}>
              {t('planningPoker.delete')}
            </Button>
          </>
        }
      >
        <Typography variant="body2" color="text.secondary">
          {t('planningPoker.deleteItemConfirm')}
        </Typography>
        {itemToDelete && (
          <Typography variant="body2" fontWeight={500} sx={{ mt: 1 }}>
            {itemToDelete.title}
          </Typography>
        )}
      </GenericDialog>
    </Box>
  );
});
