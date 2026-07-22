import { Box, Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useKanbanStore } from '../../kanban/store/kanbanStore';
import { usePlanningPokerStore } from '../../planning-poker/store/planningPokerStore';
import { useRetroStore } from '../../retro/store/retroStore';
import { useNavigationStore } from '../store/navigationStore';
import { IconChevronRight } from '@tabler/icons-react';

const routeLabelKeys: Record<string, string> = {
  '/tools': 'menu.title',
  '/tools/planning-poker': 'menu.planningPoker',
  '/tools/retro': 'menu.retro',
  '/tools/kanban': 'menu.kanban',
  '/tools/notes': 'menu.notes',
  '/tools/profile': 'profile.title',
};

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function Breadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const kanbanTitle = useKanbanStore((state) => state.room?.title);
  const kanbanCards = useKanbanStore((state) => state.room?.cards);
  const planningPokerTitle = usePlanningPokerStore((state) => state.room?.title);
  const retroTitle = useRetroStore((state) => state.room?.title);
  const breadcrumbRoomTitle = useNavigationStore((state) => state.breadcrumbRoomTitle);
  const path = location.pathname;

  if (path === '/') {
    return null;
  }

  const segments: Array<{ path: string; label: string }> = [];

  const parts = path.split('/').filter(Boolean);
  let currentPath = '';

  parts.forEach((part, index) => {
    currentPath += `/${part}`;
    let label: string;

    const key = routeLabelKeys[currentPath];
    if (key) {
      label = t(key);
    } else if (guidPattern.test(part)) {
      const prevSegment = parts[index - 1];
      const twoSegmentsBack = parts[index - 2];
      // Card ID when prevSegment is also a GUID (room ID)
      if (prevSegment && guidPattern.test(prevSegment) && twoSegmentsBack === 'kanban') {
        const card = kanbanCards?.find((c) => c.id === part);
        label = card?.title ?? part;
      } else {
        // Room ID
        const roomTitle =
          prevSegment === 'retro'
            ? retroTitle
            : prevSegment === 'planning-poker'
              ? planningPokerTitle
              : prevSegment === 'kanban'
                ? kanbanTitle
                : undefined;
        label = roomTitle ?? breadcrumbRoomTitle ?? part;
      }
    } else if (
      part === 'new' &&
      parts[index - 1] &&
      guidPattern.test(parts[index - 1]!) &&
      parts[index - 2] === 'kanban'
    ) {
      label = t('kanban.addCard');
    } else if (part === 'results') {
      label = t('planningPoker.results');
    } else if (part === 'participants') {
      label = t('roomHeader.participants');
    } else if (
      part === 'comments' &&
      parts[index - 1] &&
      guidPattern.test(parts[index - 1]!) &&
      parts[index - 2] === 'kanban'
    ) {
      label = t('kanban.comments');
    } else {
      label = part.charAt(0).toUpperCase() + part.slice(1);
    }

    segments.push({ path: currentPath, label });
  });

  return (
    <Box
      component="div"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 'auto',
        px: 1.5,
        py: 0.5,
      }}
    >
      <MuiBreadcrumbs
        aria-label="breadcrumb"
        separator={<IconChevronRight stroke={2} size={16} />}
        sx={{
          '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' },
          '& .MuiBreadcrumbs-separator': { mx: 0.5 },
        }}
      >
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const content = segment.label;

          if (isLast) {
            return (
              <Typography key={segment.path} color="text.primary" display="inline" variant="body2">
                {content}
              </Typography>
            );
          }

          return (
            <Link
              key={segment.path}
              component={RouterLink}
              to={segment.path}
              color="inherit"
              underline="hover"
              variant="body2"
            >
              {content}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
}
