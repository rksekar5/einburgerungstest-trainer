'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    localStorage.setItem('theme', theme);
  } catch {
    /* storage may be unavailable (private mode) — non-fatal */
  }
}

export default function ThemeToggle() {
  // `mounted` stays false on the server and the first client render so the
  // markup matches; the no-FOUC script in <head> has already set the real theme
  // on <html>, and we read it once after mount.
  const [state, setState] = useState<{ theme: Theme; mounted: boolean }>({
    theme: 'light',
    mounted: false,
  });

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync to the theme applied before hydration
    setState({ theme: isDark ? 'dark' : 'light', mounted: true });
  }, []);

  const { theme, mounted } = state;

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setState({ theme: next, mounted: true });
    apply(next);
  }

  const isDark = theme === 'dark';
  const label = isDark
    ? 'Zu hellem Design wechseln / Switch to light theme'
    : 'Zu dunklem Design wechseln / Switch to dark theme';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition hover:border-border-strong hover:bg-card-hover"
    >
      {/* Until mounted, render a neutral icon to avoid a hydration mismatch. */}
      <span aria-hidden="true" suppressHydrationWarning>
        {mounted && isDark ? <SunIcon /> : <MoonIcon />}
      </span>
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}
