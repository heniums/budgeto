import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Home } from './Home';

describe('Home placeholder', () => {
  it('renders the coming soon message', () => {
    render(<Home />);
    expect(
      screen.getByRole('heading', { name: /home/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(
      screen.getByText(/dashboard is being built/i),
    ).toBeInTheDocument();
  });
});
