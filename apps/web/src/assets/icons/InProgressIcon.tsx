export function InProgressIcon({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>
      {/* 3/4 arc — top clockwise to left */}
      <path
        d="M12 3A9 9 0 1 1 3 12"
        stroke={`url(#${id}_g)`}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* dot at the open end to suggest motion */}
      <circle cx="3" cy="12" r="2" fill={`url(#${id}_g)`} />
    </>
  );
}
