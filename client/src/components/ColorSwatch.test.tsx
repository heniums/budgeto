import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ColorSwatch } from './ColorSwatch';

describe('ColorSwatch', () => {
  it('renders with the given background color', () => {
    const { container } = render(<ColorSwatch color="#ff0000" />);
    const swatch = container.firstChild as HTMLElement;
    expect(swatch.style.backgroundColor).toBe('rgb(255, 0, 0)');
  });

  it('renders with md size by default', () => {
    const { container } = render(<ColorSwatch color="#000" />);
    const swatch = container.firstChild as HTMLElement;
    expect(swatch.className).toContain('h-6');
    expect(swatch.className).toContain('w-6');
  });

  it('renders with sm size', () => {
    const { container } = render(<ColorSwatch color="#000" size="sm" />);
    const swatch = container.firstChild as HTMLElement;
    expect(swatch.className).toContain('h-4');
    expect(swatch.className).toContain('w-4');
  });

  it('applies additional className', () => {
    const { container } = render(
      <ColorSwatch color="#000" className="my-class" />,
    );
    const swatch = container.firstChild as HTMLElement;
    expect(swatch.className).toContain('my-class');
  });
});
