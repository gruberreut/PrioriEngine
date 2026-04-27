export function FlameMedium({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <path
        d="M12 21 C7 20 4 16 5 11 C6 8 9 5 12 3 C15 5 18 8 19 11 C20 16 17 20 12 21Z"
        fill={`url(#${id}_g)`}
      />
    </>
  );
}
