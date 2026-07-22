import { Box, IconButton, Typography } from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  backTo?: string;
  backAriaLabel?: string;
  variant?: 'h5' | 'h6';
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  onBack,
  backTo,
  backAriaLabel,
  variant = 'h5',
  children,
}: PageHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleBack = onBack ?? (backTo ? () => navigate(backTo) : undefined);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 1,
        px: 1,
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {handleBack && (
        <IconButton
          size="small"
          onClick={handleBack}
          aria-label={backAriaLabel ?? t('common.back')}
        >
          <IconArrowLeft size={20} />
        </IconButton>
      )}
      <Typography variant={variant} noWrap sx={{ flex: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
