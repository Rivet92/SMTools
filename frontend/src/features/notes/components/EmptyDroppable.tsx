import { Box } from '@mui/material';
import { useDroppable } from '@dnd-kit/core';

export function EmptyDroppable({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        height: isOver ? 48 : 4,
        mx: 0.5,
        borderRadius: 1,
        bgcolor: isOver ? 'action.selected' : 'transparent',
        transition: 'height 0.15s, background-color 0.15s',
      }}
    />
  );
}
