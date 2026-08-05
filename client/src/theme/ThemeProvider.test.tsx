import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import {
  ThemeProvider,
  ThemeContext,
  type ThemeMode,
  type ResolvedTheme,
} from './ThemeProvider';
import { useContext } from 'react';

const STORAGE_KEY = 'budgeto:theme';

interface ThemeContextSnapshot {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (m: ThemeMode) => void;
}

interface TestableMediaQueryList extends MediaQueryList {
  _fire: (dark: boolean) => void;
}

function createMatchMedia(matches: boolean): TestableMediaQueryList {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener(_type: string, handler: (e: MediaQueryListEvent) => void) {
      listeners.add(handler);
    },
    removeEventListener(
      _type: string,
      handler: (e: MediaQueryListEvent) => void,
    ) {
      listeners.delete(handler);
    },
    dispatchEvent: () => false,
    _fire(dark: boolean) {
      const event = {
        matches: dark,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;
      listeners.forEach((fn) => fn(event));
    },
  } as TestableMediaQueryList;
  return mql;
}

let currentMql: TestableMediaQueryList;

function Probe({
  onValue,
}: {
  onValue: (v: ThemeContextSnapshot) => void;
}): JSX.Element {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('Probe must be inside ThemeProvider');
  onValue(ctx);
  return <div data-mode={ctx.mode} data-resolved={ctx.resolved} />;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    currentMql = createMatchMedia(false); // default: light
    vi.stubGlobal('matchMedia', () => currentMql);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('defaults to system mode when localStorage is empty', () => {
    let captured!: ThemeContextSnapshot;
    render(
      <ThemeProvider>
        <Probe onValue={(v) => { captured = v; }} />
      </ThemeProvider>,
    );
    expect(captured.mode).toBe('system');
  });

  it('applies correct class to documentElement based on stored preference', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dark');
    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('applies light class when stored mode is light', () => {
    window.localStorage.setItem(STORAGE_KEY, 'light');
    render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists mode changes to localStorage', () => {
    let setModeFn!: (m: ThemeMode) => void;
    render(
      <ThemeProvider>
        <Probe onValue={(v) => { setModeFn = v.setMode; }} />
      </ThemeProvider>,
    );
    act(() => setModeFn('dark'));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark');
    act(() => setModeFn('light'));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('returns correct mode, resolved, and setMode via context', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dark');
    let captured!: ThemeContextSnapshot;
    render(
      <ThemeProvider>
        <Probe onValue={(v) => { captured = v; }} />
      </ThemeProvider>,
    );
    expect(captured.mode).toBe('dark');
    expect(captured.resolved).toBe('dark');
    expect(typeof captured.setMode).toBe('function');
  });

  it('system mode resolves to dark when matchMedia prefers dark', () => {
    currentMql = createMatchMedia(true); // dark
    vi.stubGlobal('matchMedia', () => currentMql);
    let captured!: { mode: ThemeMode; resolved: ResolvedTheme };
    render(
      <ThemeProvider>
        <Probe onValue={(v) => { captured = v; }} />
      </ThemeProvider>,
    );
    expect(captured.mode).toBe('system');
    expect(captured.resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('system mode resolves to light when matchMedia prefers light', () => {
    currentMql = createMatchMedia(false); // light
    let captured!: { mode: ThemeMode; resolved: ResolvedTheme };
    render(
      <ThemeProvider>
        <Probe onValue={(v) => { captured = v; }} />
      </ThemeProvider>,
    );
    expect(captured.mode).toBe('system');
    expect(captured.resolved).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('updates resolved state when OS theme changes in system mode', () => {
    currentMql = createMatchMedia(false); // start light
    vi.stubGlobal('matchMedia', () => currentMql);

    let captured!: { mode: ThemeMode; resolved: ResolvedTheme };
    render(
      <ThemeProvider>
        <Probe onValue={(v) => { captured = v; }} />
      </ThemeProvider>,
    );
    expect(captured.resolved).toBe('light');

    // Simulate OS switching to dark
    act(() => {
      currentMql._fire(true);
    });

    expect(captured.resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('cleans up media query listener on unmount', () => {
    const removeSpy = vi.fn();
    const mql = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: removeSpy,
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
    vi.stubGlobal('matchMedia', () => mql);

    const { unmount } = render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    unmount();
    expect(removeSpy).toHaveBeenCalled();
  });
});
