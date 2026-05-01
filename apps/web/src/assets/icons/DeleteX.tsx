export function DeleteX({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDA4AF" />
          <stop offset="100%" stopColor="#9F1239" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${id}_g)`} />
      <path
        d="M8 8L16 16M16 8L8 16"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  );
}
