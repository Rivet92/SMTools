import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import { IconGripVertical, IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { Column } from '../store/kanbanStore';

export function ColumnList({
  columns,
  cardsByColumn,
  selectedColumnId,
  pendingColumnId,
  onSelectColumn,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRequestDelete,
}: {
  columns: Column[];
  cardsByColumn: Map<string, import('../store/kanbanStore').Card[]>;
  selectedColumnId: string | null;
  pendingColumnId: string | null;
  onSelectColumn: (columnId: string) => void;
  onDragStart: (columnId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, overId: string) => void;
  onDragEnd: () => void;
  onRequestDelete: (column: Column) => void;
}) {
  const { t } = useTranslation();

  return (
    <List disablePadding sx={{ flex: 1 }}>
      {columns.map((column) => {
        const cardCount = cardsByColumn.get(column.id)?.length ?? 0;
        const isSelected = selectedColumnId === column.id;

        return (
          <ListItem
            key={column.id}
            disablePadding
            secondaryAction={
              <IconButton
                size="small"
                color="error"
                edge="end"
                aria-label={t('kanban.aria.deleteColumn')}
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDelete(column);
                }}
                disabled={pendingColumnId === column.id}
              >
                <IconTrash size={16} />
              </IconButton>
            }
          >
            <ListItemButton
              selected={isSelected}
              onClick={() => onSelectColumn(column.id)}
              sx={{ borderRadius: 1, mx: 0.5 }}
            >
              <Box
                draggable
                onDragStart={() => onDragStart(column.id)}
                onDragOver={(e) => onDragOver(e, column.id)}
                onDragEnd={onDragEnd}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'move',
                  color: 'text.secondary',
                  mr: 1,
                }}
              >
                <IconGripVertical size={18} />
              </Box>
              <ListItemText
                primary={column.title}
                secondary={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {cardCount} {cardCount === 1 ? t('kanban.card') : t('kanban.cards')}
                    </Typography>
                    {column.description && (
                      <Tooltip title={column.description} arrow>
                        <IconInfoCircle size={14} style={{ opacity: 0.5 }} />
                      </Tooltip>
                    )}
                  </Box>
                }
                primaryTypographyProps={{ noWrap: true }}
                secondaryTypographyProps={{ component: 'div' }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
}
