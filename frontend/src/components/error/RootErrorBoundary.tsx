import { Component, type ReactNode } from 'react';
import { Button, Container, Stack, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PageHead } from '../seo/PageHead';

interface RootErrorBoundaryProps {
  children: ReactNode;
}

interface RootErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundaryClass extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  constructor(props: RootErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <RootErrorBoundaryFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

function RootErrorBoundaryFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const title = t('error.boundary.title');
  const message = t('error.boundary.message');
  const retryLabel = t('error.boundary.retry');
  const reloadLabel = t('error.boundary.reload');

  return (
    <>
      <PageHead title={title} noIndex />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={4} alignItems="center" textAlign="center" py={12}>
          <Box
            component="img"
            src="/NotFound.png"
            alt={title}
            sx={{ maxWidth: 200, width: '100%', height: 'auto', opacity: 0.8 }}
          />
          <Typography variant="h4" component="h1" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={480}>
            {message}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" size="large" onClick={onRetry}>
              {retryLabel}
            </Button>
            <Button variant="outlined" size="large" onClick={() => window.location.reload()}>
              {reloadLabel}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}

export function RootErrorBoundary({ children }: RootErrorBoundaryProps) {
  return <RootErrorBoundaryClass>{children}</RootErrorBoundaryClass>;
}
