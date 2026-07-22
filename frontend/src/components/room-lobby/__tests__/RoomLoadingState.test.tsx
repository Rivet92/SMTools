import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { RoomLoadingState } from '../RoomLoadingState';

describe('RoomLoadingState', () => {
  it('renders loading spinner and connecting text', () => {
    renderWithProviders(
      <RoomLoadingState
        seoTitleKey="seo.kanban.title"
        seoDescriptionKey="seo.kanban.description"
        connectingKey="kanban.connecting"
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('kanban.connecting')).toBeInTheDocument();
  });
});
