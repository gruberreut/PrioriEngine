export function FlameLow({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="12" y1="7" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path
        d="M12 21 C7 20 4 17 6 13 C7 10 9 8 12 7 C15 8 17 10 18 13 C20 17 17 20 12 21Z"
        fill={`url(#${id}_g)`}
      />
    </>
  );
}
