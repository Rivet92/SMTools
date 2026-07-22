import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test/renderWithProviders';

vi.mock('../../../landing/components/LandingHeader', () => ({
  LandingHeader: () => <div data-testid="landing-header" />,
}));

import { NotFoundPage } from '../NotFoundPage';

describe('NotFoundPage', () => {
  it('renders 404 message', () => {
    renderWithProviders(<NotFoundPage />);
    expect(screen.getByText('notFound.message')).toBeInTheDocument();
    expect(screen.getByText('notFound.backHome')).toBeInTheDocument();
  });

  it('renders the 404 image', () => {
    renderWithProviders(<NotFoundPage />);
    const img = screen.getByAltText('404 illustration');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/NotFound.png');
  });
});
