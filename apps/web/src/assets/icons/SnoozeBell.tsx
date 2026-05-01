export function SnoozeBell({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}_g`} x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E879F9" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>
      <path
        d="M12 3C8.5 3 6 5.5 6 9V14.5L4 17H20L18 14.5V9C18 5.5 15.5 3 12 3Z"
        fill={`url(#${id}_g)`}
      />
      <path
        d="M9.5 17C9.5 18.88 10.62 20 12 20C13.38 20 14.5 18.88 14.5 17H9.5Z"
        fill={`url(#${id}_g)`}
      />
    </>
  );
}
