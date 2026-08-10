interface AvatarProps {
  variant?: 'mint' | 'cream';
  size?: number;
}

export function Avatar({
  variant = 'mint',
  size = 40,
}: AvatarProps): JSX.Element {
  const fill = `hsl(var(--${variant === 'mint' ? 'secondary' : 'card'}))`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <circle
        cx="32"
        cy="32"
        r="30"
        fill={fill}
        stroke="hsl(var(--border))"
        strokeWidth="2"
      />
      <circle cx="24" cy="28" r="2.5" fill="hsl(var(--border))" />
      <circle cx="40" cy="28" r="2.5" fill="hsl(var(--border))" />
      <path
        d="M22 40 Q32 48 42 40"
        fill="none"
        stroke="hsl(var(--border))"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
