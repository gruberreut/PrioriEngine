export function DeleteTrash({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="5" y1="4" x2="19" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
      <path
        d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
        fill={`url(#${id}_g)`}
      />
    </>
  );
}
