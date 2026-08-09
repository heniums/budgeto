export function MemphisBackground(): JSX.Element {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <svg
        className="absolute -top-4 -left-4 h-16 w-16"
        viewBox="0 0 64 64"
        fill="none"
      >
        <rect
          x="6"
          y="6"
          width="52"
          height="52"
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
      </svg>
      <svg
        className="absolute top-20 right-8 h-12 w-12"
        viewBox="0 0 64 64"
        fill="none"
      >
        <polygon
          points="32,6 58,58 6,58"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <svg
        className="absolute top-1/3 left-6 h-8 w-8"
        viewBox="0 0 64 64"
        fill="none"
      >
        <circle
          cx="32"
          cy="32"
          r="26"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <svg
        className="absolute bottom-24 right-12 h-16 w-16"
        viewBox="0 0 64 64"
        fill="none"
      >
        <path
          d="M14 50 L14 14 L42 14 Z"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          fill="hsl(var(--accent))"
        />
      </svg>
      <svg
        className="absolute bottom-8 left-10 h-12 w-12"
        viewBox="0 0 64 64"
        fill="none"
      >
        <rect
          x="10"
          y="28"
          width="44"
          height="8"
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
        <line
          x1="6"
          y1="32"
          x2="58"
          y2="32"
          stroke="hsl(var(--border))"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
