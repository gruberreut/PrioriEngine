export function House({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path d="M12 2L22 10L2 10Z" fill={`url(#${id}_g)`} />
      <rect x="4" y="10" width="16" height="11" fill={`url(#${id}_g)`} />
      <rect x="9" y="14" width="6" height="7" rx="1" fill="#D97706" />
    </>
  );
}
