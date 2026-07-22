import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { getRetroColumnIcon, RetroColumnIcon } from '../retroColumnIcons';

describe('getRetroColumnIcon', () => {
  it('returns a component for a known key', () => {
    const icon = getRetroColumnIcon('MoodHappy');
    expect(icon).not.toBeNull();
  });

  it('returns null for an unknown key', () => {
    const icon = getRetroColumnIcon('NonExistent');
    expect(icon).toBeNull();
  });
});

describe('RetroColumnIcon', () => {
  it('renders an icon for a known name', () => {
    const { container } = render(<RetroColumnIcon name="MoodHappy" size={24} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('renders null for an unknown name', () => {
    const { container } = render(<RetroColumnIcon name="NonExistent" />);
    expect(container.innerHTML).toBe('');
  });
});
