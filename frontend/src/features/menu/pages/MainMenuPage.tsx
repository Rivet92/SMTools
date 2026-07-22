import { Box, Button, Typography } from '@mui/material';
import { IconCards, IconHistory, IconLayoutBoardSplitFilled, IconNote } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHead } from '../../seo/components/PageHead';

export function MainMenuPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const menuItems = [
    { key: 'planningPoker', path: '/tools/planning-poker', icon: <IconCards size={64} /> },
    { key: 'retro', path: '/tools/retro', icon: <IconHistory size={64} /> },
    { key: 'kanban', path: '/tools/kanban', icon: <IconLayoutBoardSplitFilled size={64} /> },
    { key: 'notes', path: '/tools/notes', icon: <IconNote size={64} /> },
  ];

  return (
    <>
      <PageHead title={t('seo.tools.title')} description={t('seo.tools.description')} />
      <Box sx={{ width: '100%', py: 6, px: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, 180px)',
            justifyContent: 'center',
            gap: 3,
            width: '100%',
          }}
        >
          {menuItems.map((item) => (
            <Button
              key={item.key}
              variant="outlined"
              size="large"
              onClick={() => navigate(item.path)}
              sx={{
                width: 180,
                height: 180,
                flexDirection: 'column',
                gap: 2,
                borderRadius: 3,
                textTransform: 'none',
              }}
            >
              {item.icon}
              <Typography variant="h6">{t(`menu.${item.key}`)}</Typography>
            </Button>
          ))}
        </Box>
      </Box>
    </>
  );
}
