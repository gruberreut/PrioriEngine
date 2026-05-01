export function CompleteCheck({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="3" y1="7" x2="21" y2="19" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <path
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
        fill={`url(#${id}_g)`}
      />
    </>
  );
}
