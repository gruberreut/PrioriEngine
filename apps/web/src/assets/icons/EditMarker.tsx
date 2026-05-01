export function EditMarker({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="3" y1="6" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
      </defs>
      {/* body */}
      <path d="M3 21L7 17L17 7L20 10L10 20L3 21Z" fill={`url(#${id}_g)`} />
      {/* cap */}
      <path d="M17 7L20.5 3.5L21.5 4.5L18 8L17 7Z" fill={`url(#${id}_g)`} />
    </>
  );
}
