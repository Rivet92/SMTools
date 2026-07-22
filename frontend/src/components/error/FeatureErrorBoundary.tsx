import { Component, type ReactNode } from 'react';
import { Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName?: string;
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class FeatureErrorBoundaryClass extends Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <FeatureErrorBoundaryFallback
          featureName={this.props.featureName}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

function FeatureErrorBoundaryFallback({
  featureName,
  onRetry,
}: {
  featureName?: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const title = featureName
    ? t('error.boundary.featureTitle', { feature: featureName })
    : t('error.boundary.title');

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={3} alignItems="center" textAlign="center">
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('error.boundary.featureMessage')}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" size="large" onClick={onRetry}>
            {t('error.boundary.featureRetry')}
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/tools')}>
            {t('error.boundary.featureBackToTools')}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}

export function FeatureErrorBoundary({ children, featureName }: FeatureErrorBoundaryProps) {
  return (
    <FeatureErrorBoundaryClass featureName={featureName}>{children}</FeatureErrorBoundaryClass>
  );
}
