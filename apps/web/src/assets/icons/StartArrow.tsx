export function StartArrow({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${id}_g)`} />
      <path
        d="M8 12H16M12 8L16 12L12 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}
