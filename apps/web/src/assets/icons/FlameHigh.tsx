export function FlameHigh({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_outer`} x1="12" y1="1" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id={`${id}_inner`} x1="12" y1="5.5" x2="12" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      <path
        d="M12 21 C6 20 3 15 4 9 C5 6 8 3 12 1 C16 3 19 6 20 9 C21 15 18 20 12 21Z"
        fill={`url(#${id}_outer)`}
      />
      <path
        d="M12 18 C10 16 9 12 11 9 C11.5 7.5 12 6 12 5.5 C12.5 6 13 8 14 10 C15 13 14 16 12 18Z"
        fill={`url(#${id}_inner)`}
      />
    </>
  );
}
