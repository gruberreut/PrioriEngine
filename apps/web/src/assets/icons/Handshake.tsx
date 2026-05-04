export function Handshake({ id }: { id: string }) {
  const g = `url(#${id}_g)`;
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="3" y1="12" x2="21" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A5B4FC" />
        </linearGradient>
      </defs>
      <ellipse cx="9.5" cy="12" rx="6.5" ry="4.5" stroke={g} strokeWidth="2" fill="none" />
      <ellipse cx="14.5" cy="12" rx="6.5" ry="4.5" stroke={g} strokeWidth="2" fill="none" />
    </>
  );
}
