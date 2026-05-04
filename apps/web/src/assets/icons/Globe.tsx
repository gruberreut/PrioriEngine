export function Globe({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      {/* Globe body */}
      <circle cx="12" cy="12" r="9" fill={`url(#${id}_g)`} />
      {/* Latitude arcs */}
      <path d="M3 12C5 9 9 7 12 7C15 7 19 9 21 12" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.5" />
      <path d="M3 12C5 15 9 17 12 17C15 17 19 15 21 12" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.5" />
      {/* Longitude arcs */}
      <path d="M12 3C10 5 9 8 9 12C9 16 10 19 12 21" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.5" />
      <path d="M12 3C14 5 15 8 15 12C15 16 14 19 12 21" stroke="white" strokeWidth="1" fill="none" strokeOpacity="0.5" />
    </>
  );
}
